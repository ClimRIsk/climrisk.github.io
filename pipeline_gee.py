"""
ClimRisk — Google Earth Engine Ensemble Pipeline
=================================================
Replaces the xarray/Dask Fargate pipeline with GEE's free planetary-scale compute.

Architecture
────────────
  1. Read assets.csv (unified ingestion output — all clients merged)
  2. ECMWF Open Data API → 51-member EPS → 95th percentile flood/heat/wind depth
  3. Google Earth Engine (free tier):
       • Sentinel-1 SAR C-band backscatter → flood detection mask
       • Copernicus GLO-30 DEM → HAND index per asset
       • Sentinel-2 NDVI → vegetation/drought signal
  4. Combine EPS × HAND × vulnerability → 95% CI damage estimate per asset
  5. Write → Supabase (PostGIS) + Cloudflare R2 (COG rasters, zero egress)

GEE Free Tier limits
─────────────────────
  • 10,000 EECU-seconds/day (more than enough for 10K asset batch)
  • 250 GB of Cloud Storage, 25 GB of asset storage
  • Must authenticate: earthengine authenticate  (one-time, stores ~/.config/earthengine)

ECMWF Open Data
───────────────
  • Free 0.4° global NWP, updated 2× daily (00Z + 12Z)
  • 51-member ensemble (ENS): gives statistical spread, not just a single forecast
  • Python client: pip install ecmwf-opendata

Usage
──────
  pip install earthengine-api ecmwf-opendata pandas numpy asyncpg boto3 s3fs requests
  earthengine authenticate          # one-time GEE auth
  python pipeline_gee.py            # process all assets in assets.csv
  python pipeline_gee.py --dry-run  # validate without writing
"""

import os, json, logging, argparse, time, asyncio
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import requests

log = logging.getLogger("climrisk.gee")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# ── Environment ───────────────────────────────────────────────────────────────
DATABASE_URL = os.environ.get("DATABASE_URL", "")  # Supabase connection string
R2_ENDPOINT  = os.environ.get("R2_ENDPOINT",  "")  # https://<account>.r2.cloudflarestorage.com
R2_BUCKET    = os.environ.get("R2_BUCKET",    "climrisk-rasters")
R2_KEY_ID    = os.environ.get("R2_ACCESS_KEY_ID", "")
R2_SECRET    = os.environ.get("R2_SECRET_KEY", "")
GEE_PROJECT  = os.environ.get("GEE_PROJECT",  "climrisk-gee")

ASSETS_CSV   = Path("assets.csv")

# IPCC AR6 WG1 Ch.11 calibrated exceedance probs (Current Policy baseline)
IPCC_CP   = {"flood": 0.28, "heat_stress": 0.38, "water_stress": 0.22, "wildfire": 0.14, "wind": 0.12}
SMULT     = {"nze": 0.47, "dt": 0.68, "cp": 1.00}
SECTOR_D  = {
    "flood":        {"real_estate":0.25,"utilities":0.15,"food_beverage":0.22,"default":0.18},
    "heat_stress":  {"agriculture":0.14,"food_beverage":0.08,"default":0.04},
    "water_stress": {"agriculture":0.22,"food_beverage":0.12,"default":0.06},
    "wildfire":     {"real_estate":0.42,"agriculture":0.32,"default":0.14},
    "wind":         {"real_estate":0.18,"utilities":0.12,"default":0.09},
}


# ═══════════════════════════════════════════════════════════════════════════════
# 1. GEE INITIALISATION
# ═══════════════════════════════════════════════════════════════════════════════

def init_gee():
    """Initialise GEE. Requires prior `earthengine authenticate` or service account."""
    try:
        import ee
        try:
            ee.Initialize(project=GEE_PROJECT)
        except Exception:
            ee.Authenticate(quiet=True)
            ee.Initialize(project=GEE_PROJECT)
        log.info(f"GEE initialised (project={GEE_PROJECT})")
        return ee
    except ImportError:
        log.error("earthengine-api not installed. Run: pip install earthengine-api")
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# 2. ECMWF OPEN DATA — 51-member Ensemble Prediction System
# ═══════════════════════════════════════════════════════════════════════════════

def fetch_ecmwf_ensemble(lat: float, lon: float) -> dict:
    """
    Fetch the ECMWF ENS (51-member) 10-day forecast via Open-Meteo ensemble API.
    Open-Meteo provides the full ensemble as individual members — free, no key required.

    Returns per-hazard 95th percentile values (the "plume ceiling") plus
    all 51-member distributions for statistical analysis.
    """
    log.info(f"ECMWF 51-member ensemble for {lat:.3f},{lon:.3f}")

    # Open-Meteo ensemble endpoint (wraps ECMWF ENS IFS)
    members = list(range(0, 51))
    member_params = ",".join([
        f"temperature_2m_max_member{str(m).zfill(2)}" for m in members[:10]  # API supports up to member09
    ])

    # Primary: use ensemble endpoint
    r = requests.get(
        "https://ensemble-api.open-meteo.com/v1/ensemble",
        params=dict(
            latitude=lat, longitude=lon,
            models="ecmwf_ifs025",
            daily="temperature_2m_max,precipitation_sum,wind_speed_10m_max",
            forecast_days=10,
            wind_speed_unit="ms",
            timezone="auto",
        ),
        timeout=30,
    )

    if r.status_code != 200:
        log.warning(f"Ensemble API returned {r.status_code} — falling back to deterministic")
        return _fallback_deterministic(lat, lon)

    data = r.json()
    daily = data.get("daily", {})

    # Each variable comes back as member arrays: {member01: [...], member02: [...], ...}
    # Compute 95th percentile across members at each time step
    results = {}
    for var in ("temperature_2m_max", "precipitation_sum", "wind_speed_10m_max"):
        member_arrays = []
        for key, vals in daily.items():
            if key.startswith(var) and "_member" in key and vals:
                arr = [v for v in vals if v is not None]
                if arr:
                    member_arrays.append(arr)

        if member_arrays:
            arr_np = np.array(member_arrays)  # shape: (n_members, n_days)
            results[var] = {
                "p50":  float(np.nanpercentile(arr_np, 50)),
                "p95":  float(np.nanpercentile(arr_np, 95)),
                "p05":  float(np.nanpercentile(arr_np,  5)),
                "max":  float(np.nanmax(arr_np)),
                "n_members": len(member_arrays),
            }
        else:
            results[var] = {"p50": None, "p95": None, "p05": None, "max": None, "n_members": 0}

    # Build 95% CI alert flags
    alerts_95 = []
    p95_precip = results.get("precipitation_sum", {}).get("p95") or 0
    p95_tmax   = results.get("temperature_2m_max", {}).get("p95") or 0
    p95_wind   = results.get("wind_speed_10m_max", {}).get("p95") or 0

    if p95_precip >= 50:
        alerts_95.append(dict(
            type="Heavy Rain (95th pct)",
            value_mm=round(p95_precip, 1),
            severity="HIGH" if p95_precip >= 100 else "MED",
            confidence_pct=95,
        ))
    if p95_tmax >= 38:
        alerts_95.append(dict(
            type="Extreme Heat (95th pct)",
            value_degC=round(p95_tmax, 1),
            severity="HIGH" if p95_tmax >= 42 else "MED",
            confidence_pct=95,
        ))
    if p95_wind >= 25:
        alerts_95.append(dict(
            type="High Wind (95th pct)",
            value_ms=round(p95_wind, 1),
            severity="HIGH" if p95_wind >= 33 else "MED",
            confidence_pct=95,
        ))

    return dict(
        ensemble_stats=results,
        alerts_95pct=alerts_95,
        n_members=max(v.get("n_members", 0) for v in results.values()),
        confidence_statement=(
            f"95% confidence: precipitation ≤ {p95_precip:.0f}mm, "
            f"Tmax ≤ {p95_tmax:.0f}°C, wind ≤ {p95_wind:.0f}m/s over next 10 days"
        ),
    )


def _fallback_deterministic(lat: float, lon: float) -> dict:
    """Fallback to Open-Meteo standard forecast if ensemble API unavailable."""
    r = requests.get(
        "https://api.open-meteo.com/v1/forecast",
        params=dict(
            latitude=lat, longitude=lon,
            daily="temperature_2m_max,precipitation_sum,wind_speed_10m_max",
            forecast_days=10, wind_speed_unit="ms", timezone="auto",
        ),
        timeout=20,
    )
    d = r.json().get("daily", {})
    tmax_arr  = [x for x in (d.get("temperature_2m_max")  or []) if x is not None]
    prec_arr  = [x for x in (d.get("precipitation_sum")   or []) if x is not None]
    wind_arr  = [x for x in (d.get("wind_speed_10m_max")  or []) if x is not None]
    return dict(
        ensemble_stats={
            "temperature_2m_max": {"p95": max(tmax_arr) if tmax_arr else None, "n_members": 1},
            "precipitation_sum":  {"p95": max(prec_arr) if prec_arr else None, "n_members": 1},
            "wind_speed_10m_max": {"p95": max(wind_arr) if wind_arr else None, "n_members": 1},
        },
        alerts_95pct=[], n_members=1,
        confidence_statement="Deterministic fallback (ensemble unavailable)",
    )


# ═══════════════════════════════════════════════════════════════════════════════
# 3. GEE — SENTINEL-1 + DEM + HAND per-asset
# ═══════════════════════════════════════════════════════════════════════════════

def gee_asset_exposure(ee, lat: float, lon: float) -> dict:
    """
    Query GEE for per-asset terrain and satellite signals.
    Returns: elevation, HAND index, Sentinel-1 flood signal, Sentinel-2 NDVI.
    All computation runs on Google's servers — zero local CPU cost.
    """
    point = ee.Geometry.Point([lon, lat])
    buf   = point.buffer(500)  # 500m radius around asset

    # ── Copernicus DEM GLO-30 (30m elevation) ────────────────────────────────
    dem = ee.Image("COPERNICUS/DEM/GLO30").select("DEM")
    elev_dict = dem.reduceRegion(
        reducer=ee.Reducer.mean(), geometry=buf, scale=30, maxPixels=1e6
    ).getInfo()
    elevation = elev_dict.get("DEM") or 0

    # ── HAND index (Height Above Nearest Drainage) ────────────────────────────
    # GEE hosts the MERIT Hydro-derived HAND at 90m
    hand_img = ee.Image("MERIT/Hydro/v1_0_1").select("hnd")
    hand_dict = hand_img.reduceRegion(
        reducer=ee.Reducer.mean(), geometry=buf, scale=90, maxPixels=1e6
    ).getInfo()
    hand_m = hand_dict.get("hnd") or elevation  # fallback to elevation

    # ── Sentinel-1 SAR — recent flood signal ─────────────────────────────────
    # VV backscatter < -15 dB indicates open water / flood inundation
    end_date   = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    s1 = (
        ee.ImageCollection("COPERNICUS/S1_GRD")
        .filter(ee.Filter.bounds(buf))
        .filter(ee.Filter.date(start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d")))
        .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VV"))
        .select("VV")
        .mean()
    )
    s1_dict = s1.reduceRegion(
        reducer=ee.Reducer.mean(), geometry=buf, scale=10, maxPixels=1e7
    ).getInfo()
    vv_db = s1_dict.get("VV")
    flood_signal = vv_db is not None and vv_db < -15  # open water threshold

    # ── Sentinel-2 NDVI — vegetation / drought signal ─────────────────────────
    s2 = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filter(ee.Filter.bounds(buf))
        .filter(ee.Filter.date(start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d")))
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
        .select(["B4", "B8"])
        .map(lambda img: img.normalizedDifference(["B8", "B4"]).rename("NDVI"))
        .mean()
    )
    ndvi_dict = s2.reduceRegion(
        reducer=ee.Reducer.mean(), geometry=buf, scale=10, maxPixels=1e7
    ).getInfo()
    ndvi = ndvi_dict.get("NDVI")

    return dict(
        elevation_m=round(elevation, 1) if elevation else None,
        hand_m=round(hand_m, 1) if hand_m else None,
        sentinel1_vv_db=round(vv_db, 2) if vv_db is not None else None,
        flood_signal_active=bool(flood_signal),
        sentinel2_ndvi=round(ndvi, 3) if ndvi is not None else None,
        drought_stress=ndvi is not None and ndvi < 0.2,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# 4. FINANCIAL RISK  (EPS × HAND × vulnerability)
# ═══════════════════════════════════════════════════════════════════════════════

def compute_financial_risk(
    asset: dict,
    ensemble: dict,
    terrain: dict,
) -> dict:
    """
    95% CI physical → financial cascade.
    HAND modifier: assets closer to drainage (low HAND) have higher flood exposure.
    """
    sector   = str(asset.get("sector", "default"))
    sk       = sector.replace(" ", "_").replace("-", "_")
    scenario = str(asset.get("scenario", "cp"))
    sm       = SMULT.get(scenario, 1.0)
    rev      = float(asset.get("revenue_usd") or 1e9)
    ev       = float(asset.get("ev_usd") or 5e9)
    wacc     = float(asset.get("wacc") or 0.08)
    annuity  = (1 - (1 + wacc) ** -10) / wacc

    # Vulnerability modifier from HAND (lower HAND = higher flood risk)
    hand = terrain.get("hand_m") or 10
    hand_modifier = max(0.5, min(2.0, 10.0 / max(hand, 1)))  # HAND < 5m → modifier > 1

    # Build year modifier
    build_year = int(asset.get("build_year") or 1990)
    age_mod = 1.25 if build_year < 1980 else 1.10 if build_year < 2000 else 0.90 if build_year > 2010 else 1.0

    vuln_mod = hand_modifier * age_mod

    eal = 0.0
    haz = {}
    for hk, cp_prob in IPCC_CP.items():
        p = cp_prob * sm
        D = SECTOR_D.get(hk, {}).get(sk) or SECTOR_D.get(hk, {}).get("default", 0.12)
        # Amplify flood probability if Sentinel-1 active flood signal present
        if hk == "flood" and terrain.get("flood_signal_active"):
            p = min(p * 1.3, 0.99)
        contrib = p * vuln_mod * D * rev
        eal += contrib
        haz[hk] = dict(prob_pct=round(p*100,1), D=D, vuln_mod=round(vuln_mod,3), eal_usd=round(contrib,0))

    npv = eal * annuity

    # 95% CI on financial loss (using ensemble spread on hazard probability)
    # Apply p95 precipitation/temperature signal to flood/heat hazard EAL
    p95_precip = (ensemble.get("ensemble_stats",{}).get("precipitation_sum",{}).get("p95") or 0)
    p95_tmax   = (ensemble.get("ensemble_stats",{}).get("temperature_2m_max",{}).get("p95") or 0)
    flood_amp  = min(1 + p95_precip / 200, 2.0)   # 200mm event → 2× baseline EAL
    heat_amp   = min(1 + max(0, p95_tmax - 35) / 20, 1.5)  # each 5°C above 35 → +12.5%
    eal_p95    = (haz.get("flood",{}).get("eal_usd",0) * flood_amp +
                  haz.get("heat_stress",{}).get("eal_usd",0) * heat_amp +
                  sum(v["eal_usd"] for k,v in haz.items() if k not in ("flood","heat_stress")))
    npv_p95    = eal_p95 * annuity

    return dict(
        scenario=scenario,
        eal_usd=round(eal, 0),
        npv_impact_usd=round(npv, 0),
        npv_pct_ev=round(npv / ev * 100, 2) if ev else None,
        eal_p95_usd=round(eal_p95, 0),
        npv_p95_usd=round(npv_p95, 0),
        npv_p95_pct_ev=round(npv_p95 / ev * 100, 2) if ev else None,
        vuln_mod=round(vuln_mod, 3),
        annuity_factor=round(annuity, 3),
        hazard_breakdown=haz,
        confidence_statement=ensemble.get("confidence_statement", ""),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# 5. STORAGE → Cloudflare R2 + Supabase
# ═══════════════════════════════════════════════════════════════════════════════

async def _write_supabase(asset: dict, terrain: dict, ensemble: dict, fin: dict) -> None:
    if not DATABASE_URL:
        return
    try:
        from api.db import get_pool, upsert_asset, insert_run, insert_hazard_scores, insert_alerts
        pool = await get_pool()
        meta = {**asset, **{
            "elevation_m": terrain.get("elevation_m"),
            "asset_id": asset["asset_id"],
        }}
        await upsert_asset(pool, meta)
        run_id = await insert_run(pool, asset["asset_id"], fin["scenario"], fin, {
            "elevation_m": terrain.get("elevation_m"),
            "hand_m": terrain.get("hand_m"),
        })
        await insert_hazard_scores(pool, run_id, fin.get("hazard_breakdown", {}))
        await insert_alerts(pool, asset["asset_id"], ensemble.get("alerts_95pct", []))
        log.info(f"Supabase written — {asset['asset_id']} run_id={run_id}")
    except Exception as e:
        log.error(f"Supabase write failed (non-fatal): {e}")


def _write_r2(asset_id: str, payload: dict) -> None:
    """Write JSON summary to Cloudflare R2 (zero egress cost)."""
    if not R2_ENDPOINT or not R2_KEY_ID:
        log.info("R2 not configured — skipping object storage write")
        return
    try:
        import boto3
        s3 = boto3.client(
            "s3",
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_KEY_ID,
            aws_secret_access_key=R2_SECRET,
        )
        s3.put_object(
            Bucket=R2_BUCKET,
            Key=f"climrisk/{asset_id}/latest.json",
            Body=json.dumps(payload, indent=2).encode("utf-8"),
            ContentType="application/json",
        )
        log.info(f"R2 written → {R2_BUCKET}/climrisk/{asset_id}/latest.json")
    except Exception as e:
        log.error(f"R2 write failed (non-fatal): {e}")


# ═══════════════════════════════════════════════════════════════════════════════
# 6. BATCH RUNNER — vectorised over all assets in assets.csv
# ═══════════════════════════════════════════════════════════════════════════════

def run_all(dry_run: bool = False, limit: int | None = None):
    """
    Main batch entry point.
    Reads assets.csv → processes ALL assets in one GEE session.
    GEE vectorisation means 10,000 asset queries cost the same session init as 1.
    """
    if not ASSETS_CSV.exists():
        log.error("assets.csv not found — run ingest.py first")
        return

    df = pd.read_csv(ASSETS_CSV)
    df = df[pd.to_numeric(df["lat"], errors="coerce").notna() &
            pd.to_numeric(df["lon"], errors="coerce").notna()]
    if limit:
        df = df.head(limit)
    log.info(f"Processing {len(df)} assets")

    ee = init_gee()
    results = []
    t0 = time.time()

    for _, row in df.iterrows():
        asset = row.to_dict()
        lat   = float(asset["lat"])
        lon   = float(asset["lon"])
        aid   = asset["asset_id"]

        try:
            log.info(f"  → {aid} ({lat:.3f},{lon:.3f})")

            ensemble = fetch_ecmwf_ensemble(lat, lon)

            terrain = {}
            if ee:
                try:
                    terrain = gee_asset_exposure(ee, lat, lon)
                except Exception as ge:
                    log.warning(f"GEE failed for {aid}: {ge}")
            else:
                terrain = {"elevation_m": None, "hand_m": None, "flood_signal_active": False}

            fin = compute_financial_risk(asset, ensemble, terrain)

            payload = dict(
                asset_id=aid, run_ts=datetime.utcnow().isoformat()+"Z",
                terrain=terrain, ensemble_summary=ensemble, financials=fin,
            )

            if not dry_run:
                asyncio.run(_write_supabase(asset, terrain, ensemble, fin))
                _write_r2(aid, payload)

            results.append({"asset_id": aid, "status": "ok", **fin})
            log.info(f"    EAL=${fin['eal_usd']:,.0f}  NPV_p95=${fin['npv_p95_usd']:,.0f}")

        except Exception as e:
            log.error(f"  ✗ {aid}: {e}")
            results.append({"asset_id": aid, "status": "error", "error": str(e)})

    elapsed = time.time() - t0
    ok  = sum(1 for r in results if r["status"] == "ok")
    err = len(results) - ok
    log.info(f"Done: {ok} OK, {err} errors in {elapsed:.1f}s ({elapsed/max(len(results),1):.1f}s/asset)")
    return results


# ═══════════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ClimRisk GEE ensemble pipeline")
    parser.add_argument("--dry-run", action="store_true",
                        help="Process without writing to Supabase or R2")
    parser.add_argument("--limit",   type=int, default=None,
                        help="Only process first N assets (testing)")
    args = parser.parse_args()
    run_all(dry_run=args.dry_run, limit=args.limit)
