"""
ClimRisk — Containerised 6-Hour Climate Pipeline
=================================================
Architecture: AWS Fargate (ECS) / EventBridge cron(0 0/6 * * ? *)
Storage     : S3 Zarr store  (s3://<BUCKET>/climrisk/latest.zarr)
              S3 JSON alerts  (s3://<BUCKET>/climrisk/alerts/latest.json)
Compute     : xarray + Dask (single-container, 4 vCPU / 16 GB)

Sources:
  • ERA5-Land daily via Open-Meteo archive API (free, no key)
  • ECMWF IFS 14-day forecast via Open-Meteo forecast API (free, no key)
  • WRI Aqueduct 4.0 water-stress baseline (pre-baked CSV in repo)

Run locally:
  python pipeline.py --lat 52.52 --lon 13.41 --company "Test Co" --sector utilities
  python pipeline.py --asset-file assets.csv        # batch mode
"""

import os, sys, json, logging, argparse, time, asyncio
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import xarray as xr
import dask
import dask.array as da
import requests
import s3fs

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger("climrisk-pipeline")

# ── Environment ─────────────────────────────────────────────────────────────
BUCKET   = os.environ.get("S3_BUCKET", "climrisk-data")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
ALERT_SNS  = os.environ.get("ALERT_SNS_ARN", "")   # optional SNS ARN

# ── IPCC AR6 WG1 Ch.11 calibrated annual exceedance probabilities (Current Policy) ──
IPCC_CP = dict(flood=0.28, heat_stress=0.38, water_stress=0.22, wildfire=0.14, wind=0.12)
SMULT   = dict(nze=0.47, dt=0.68, cp=1.00)

# ── JRC Huizinga 2017 + Swiss Re / Munich Re sector damage fractions ─────────
SECTOR_D = {
    "flood":        {"real_estate":0.25,"utilities":0.15,"food_beverage":0.22,"agriculture":0.18,"default":0.18},
    "heat_stress":  {"agriculture":0.14,"food_beverage":0.08,"utilities":0.05,"default":0.04},
    "water_stress": {"agriculture":0.22,"food_beverage":0.12,"utilities":0.08,"default":0.06},
    "wildfire":     {"real_estate":0.42,"agriculture":0.32,"utilities":0.20,"default":0.14},
    "wind":         {"real_estate":0.18,"utilities":0.12,"default":0.09},
}

ELF = dict(flood=0.028, heat_stress=0.018, water_stress=0.016, wildfire=0.020, wind=0.015)

# ── Open-Meteo endpoints ─────────────────────────────────────────────────────
ERA5_URL    = "https://archive-api.open-meteo.com/v1/archive"
FCST_URL    = "https://api.open-meteo.com/v1/forecast"

# ═══════════════════════════════════════════════════════════════════════════════
# 1. DATA FETCHING
# ═══════════════════════════════════════════════════════════════════════════════

def fetch_era5_baseline(lat: float, lon: float, years: int = 30) -> xr.Dataset:
    """Pull ERA5-Land daily archive via Open-Meteo and return as xarray Dataset."""
    end   = datetime.utcnow().date()
    start = end - timedelta(days=years * 365)
    log.info(f"ERA5 archive {start} → {end}  lat={lat} lon={lon}")
    resp = requests.get(ERA5_URL, params=dict(
        latitude=lat, longitude=lon,
        start_date=str(start), end_date=str(end),
        daily=",".join([
            "temperature_2m_max","temperature_2m_min",
            "precipitation_sum","wind_speed_10m_max",
            "et0_fao_evapotranspiration",
        ]),
        temperature_unit="celsius", wind_speed_unit="ms", timezone="auto",
    ), timeout=120)
    resp.raise_for_status()
    data = resp.json()
    d = data["daily"]
    times = pd.to_datetime(d["time"])
    ds = xr.Dataset(
        {
            "tmax":  ("time", np.array(d["temperature_2m_max"],  dtype=np.float32)),
            "tmin":  ("time", np.array(d["temperature_2m_min"],  dtype=np.float32)),
            "precip":("time", np.array(d["precipitation_sum"],   dtype=np.float32)),
            "wind":  ("time", np.array(d["wind_speed_10m_max"],  dtype=np.float32)),
            "et0":   ("time", np.array(d["et0_fao_evapotranspiration"], dtype=np.float32)),
        },
        coords={"time": times},
        attrs={"lat": lat, "lon": lon, "elevation_m": data.get("elevation", 0)},
    )
    log.info(f"ERA5 loaded: {len(times)} days  elevation={ds.attrs['elevation_m']}m")
    return ds


def fetch_ecmwf_forecast(lat: float, lon: float, days: int = 14) -> xr.Dataset:
    """Fetch ECMWF IFS 9km 14-day NWP forecast via Open-Meteo."""
    log.info(f"ECMWF IFS forecast ({days}d)  lat={lat} lon={lon}")
    resp = requests.get(FCST_URL, params=dict(
        latitude=lat, longitude=lon,
        daily=",".join([
            "temperature_2m_max","precipitation_sum",
            "wind_speed_10m_max","precipitation_hours",
        ]),
        forecast_days=days,
        wind_speed_unit="ms", timezone="auto",
    ), timeout=30)
    resp.raise_for_status()
    data = resp.json()
    d = data["daily"]
    times = pd.to_datetime(d["time"])
    ds = xr.Dataset(
        {
            "tmax":   ("time", np.array(d["temperature_2m_max"],   dtype=np.float32)),
            "precip": ("time", np.array(d["precipitation_sum"],    dtype=np.float32)),
            "wind":   ("time", np.array(d["wind_speed_10m_max"],   dtype=np.float32)),
            "prec_h": ("time", np.array(d["precipitation_hours"],  dtype=np.float32)),
        },
        coords={"time": times},
        attrs={"lat": lat, "lon": lon},
    )
    return ds


# ═══════════════════════════════════════════════════════════════════════════════
# 2. HAZARD STATISTICS (xarray + Dask)
# ═══════════════════════════════════════════════════════════════════════════════

def compute_baseline_stats(era5: xr.Dataset) -> dict:
    """
    Compute 30-year hazard exposure statistics using xarray operations.
    Dask chunks the time axis so this scales to multi-asset / multi-location
    arrays without loading everything into RAM.
    """
    # Chunk for Dask parallelism (1-year chunks)
    era5c = era5.chunk({"time": 365})

    heat35  = (era5c.tmax >= 35).sum("time").compute().item()
    heat40  = (era5c.tmax >= 40).sum("time").compute().item()
    rain50  = (era5c.precip >= 50).sum("time").compute().item()
    rain100 = (era5c.precip >= 100).sum("time").compute().item()
    wind20  = (era5c.wind >= 20).sum("time").compute().item()

    drought_days = ((era5c.et0 > era5c.precip * 2) & (era5c.et0 > 0)).sum("time").compute().item()
    drought_pct  = round(100 * drought_days / max(len(era5c.time), 1), 1)

    # Annual mean Tmax — linear trend via least-squares
    annual_tmax = era5c.tmax.resample(time="1YE").mean().compute()
    years = np.arange(len(annual_tmax))
    if len(years) > 2:
        slope = float(np.polyfit(years, annual_tmax.values, 1)[0])
        warming_per_decade = round(slope * 10, 2)
    else:
        warming_per_decade = None

    return dict(
        heat35=int(heat35), heat40=int(heat40),
        rain50=int(rain50), rain100=int(rain100),
        wind20=int(wind20),
        drought_pct=drought_pct,
        warming_per_decade=warming_per_decade,
        elevation_m=era5.attrs.get("elevation_m", 0),
        n_days=int(len(era5.time)),
    )


def detect_forecast_alerts(fcst: xr.Dataset) -> list[dict]:
    """Flag extreme weather events in the 14-day ECMWF forecast."""
    alerts = []
    for i in range(len(fcst.time)):
        date = str(fcst.time[i].values)[:10]
        p = float(fcst.precip[i].values or 0)
        t = float(fcst.tmax[i].values or 0)
        w = float(fcst.wind[i].values or 0)
        if p >= 50:
            alerts.append(dict(date=date, type="Heavy Rain",   value_mm=p,
                               severity="HIGH" if p >= 100 else "MED"))
        if t >= 38:
            alerts.append(dict(date=date, type="Extreme Heat", value_degC=t,
                               severity="HIGH" if t >= 42 else "MED"))
        if w >= 25:
            alerts.append(dict(date=date, type="High Wind",    value_ms=w,
                               severity="HIGH" if w >= 33 else "MED"))
    return alerts


# ═══════════════════════════════════════════════════════════════════════════════
# 3. FINANCIAL RISK LAYER
# ═══════════════════════════════════════════════════════════════════════════════

def physical_npv_impact(
    baseline: dict,
    scenario: str,          # "nze" | "dt" | "cp"
    revenue_usd: float,
    ev_usd: float,
    wacc: float,
    sector: str,
) -> dict:
    """
    Two-layer physical → financial cascade.
    EAL = Σ_hazards [ P_i(IPCC,scenario) × φ(vulnerability) × D_i,sector × Revenue ]
    NPV_impact = EAL × annuity(wacc, 10yr)
    """
    sm   = SMULT.get(scenario, 1.0)
    phi  = 1.0   # vulnerability modifier — set from site attributes in full model
    sk   = sector.lower().replace(" ", "_").replace("-", "_")
    eal  = 0.0
    haz_breakdown = {}

    annuity = (1 - (1 + wacc) ** -10) / wacc  # 10-year annuity factor

    for hk, cp_prob in IPCC_CP.items():
        p = cp_prob * sm
        D = SECTOR_D.get(hk, {}).get(sk) or SECTOR_D.get(hk, {}).get("default", 0.12)
        contrib = p * phi * D * revenue_usd
        eal += contrib
        haz_breakdown[hk] = dict(prob=round(p * 100, 1), D=D, eal_usd=round(contrib, 0))

    npv = eal * annuity
    return dict(
        scenario=scenario, eal_usd=round(eal, 0), npv_impact_usd=round(npv, 0),
        npv_pct_ev=round(npv / ev_usd * 100, 2) if ev_usd else None,
        annuity_factor=round(annuity, 3),
        hazard_breakdown=haz_breakdown,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# 4. STORAGE — S3 Zarr + PostGIS + JSON alerts
# ═══════════════════════════════════════════════════════════════════════════════

async def _write_to_postgis(asset_meta: dict, baseline: dict,
                             financials: dict, alerts: list) -> None:
    """
    Persist results into PostGIS via the api/db helpers.
    Silently no-ops if DATABASE_URL is unset (local dev without a DB).
    """
    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url:
        log.info("DATABASE_URL not set — skipping PostGIS write")
        return
    try:
        from api.db import get_pool, upsert_asset, insert_run, insert_hazard_scores, insert_alerts
        pool = await get_pool()
        await upsert_asset(pool, asset_meta)
        run_id = await insert_run(
            pool, asset_meta["asset_id"],
            financials["scenario"], financials, baseline,
        )
        await insert_hazard_scores(pool, run_id, financials.get("hazard_breakdown", {}))
        await insert_alerts(pool, asset_meta["asset_id"], alerts)
        log.info(f"PostGIS written — run_id={run_id}")
    except Exception as e:
        log.error(f"PostGIS write failed (non-fatal): {e}")


def save_results(
    asset_id: str,
    asset_meta: dict,
    era5: xr.Dataset,
    baseline: dict,
    alerts: list,
    financials: dict,
):
    """
    Write to all three sinks:
      1. S3 Zarr (heavy raster, TiTiler source)
      2. S3 JSON (lightweight summary cache)
      3. PostGIS via api/db (serves FastAPI /risk and /assets endpoints)
    """
    # ── S3 ────────────────────────────────────────────────────────────────────
    if not BUCKET or BUCKET == "local":
        log.info("BUCKET=local — skipping S3 write")
    else:
        fs = s3fs.S3FileSystem()

        zarr_path = f"{BUCKET}/climrisk/{asset_id}/era5.zarr"
        store = s3fs.S3Map(zarr_path, s3=fs)
        era5.chunk({"time": 365}).to_zarr(store=store, mode="w", consolidated=True)
        log.info(f"Zarr written → s3://{zarr_path}")

        payload = dict(
            asset_id=asset_id,
            run_ts=datetime.utcnow().isoformat() + "Z",
            baseline=baseline,
            forecast_alerts=alerts,
            financials=financials,
        )
        json_path = f"{BUCKET}/climrisk/{asset_id}/latest.json"
        with fs.open(json_path, "w") as f:
            json.dump(payload, f, indent=2)
        log.info(f"JSON written → s3://{json_path}")

        if ALERT_SNS and any(a["severity"] == "HIGH" for a in alerts):
            import boto3
            sns = boto3.client("sns", region_name=AWS_REGION)
            msg = json.dumps([a for a in alerts if a["severity"] == "HIGH"], indent=2)
            sns.publish(TopicArn=ALERT_SNS,
                        Subject=f"ClimRisk HIGH ALERT — {asset_id}", Message=msg)
            log.info(f"SNS alert published for {asset_id}")

    # ── PostGIS ───────────────────────────────────────────────────────────────
    asyncio.run(_write_to_postgis(asset_meta, baseline, financials, alerts))


# ═══════════════════════════════════════════════════════════════════════════════
# 5. MAIN ENTRYPOINT
# ═══════════════════════════════════════════════════════════════════════════════

def run_asset(
    lat: float, lon: float,
    company: str, sector: str,
    revenue_usd: float = 1e9,
    ev_usd: float = 5e9,
    wacc: float = 0.08,
    scenario: str = "cp",
    # optional pre-imputed vulnerability attributes
    elevation_m: float | None = None,
    build_year: int | None = None,
    material: str | None = None,
    ffe_m: float | None = None,
    defenses: str | None = None,
    backup_power: bool = False,
):
    asset_id = f"{company.lower().replace(' ', '_')}_{lat:.3f}_{lon:.3f}"
    log.info(f"═══ Processing asset: {asset_id} ═══")
    t0 = time.time()

    era5     = fetch_era5_baseline(lat, lon)
    fcst     = fetch_ecmwf_forecast(lat, lon)
    baseline = compute_baseline_stats(era5)
    alerts   = detect_forecast_alerts(fcst)
    fin      = physical_npv_impact(baseline, scenario, revenue_usd, ev_usd, wacc, sector)

    log.info(f"Baseline: {baseline}")
    if alerts:
        log.warning(f"FORECAST ALERTS ({len(alerts)}): {alerts}")
    log.info(f"Financial: EAL=${fin['eal_usd']:,.0f}  NPV_impact=${fin['npv_impact_usd']:,.0f}")

    # Build asset metadata dict for PostGIS upsert
    asset_meta = dict(
        asset_id=asset_id, company=company, sector=sector,
        lat=lat, lon=lon,
        revenue_usd=revenue_usd, ev_usd=ev_usd, wacc=wacc,
        elevation_m=elevation_m or baseline.get("elevation_m"),
        build_year=build_year, material=material,
        ffe_m=ffe_m, defenses=defenses, backup_power=backup_power,
    )

    save_results(asset_id, asset_meta, era5, baseline, alerts, fin)
    log.info(f"Done in {time.time()-t0:.1f}s")
    return dict(asset_id=asset_id, baseline=baseline, alerts=alerts, fin=fin)


def run_batch(asset_file: str):
    """Batch mode: read CSV with columns lat,lon,company,sector[,revenue_usd,ev_usd,wacc,scenario]"""
    df = pd.read_csv(asset_file)
    results = []
    for _, row in df.iterrows():
        try:
            r = run_asset(
                lat=float(row["lat"]), lon=float(row["lon"]),
                company=str(row.get("company", "Unknown")),
                sector=str(row.get("sector", "default")),
                revenue_usd=float(row.get("revenue_usd", 1e9)),
                ev_usd=float(row.get("ev_usd", 5e9)),
                wacc=float(row.get("wacc", 0.08)),
                scenario=str(row.get("scenario", "cp")),
            )
            results.append(r)
        except Exception as e:
            log.error(f"Failed {row.get('company')}: {e}")
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ClimRisk 6-hour pipeline")
    parser.add_argument("--lat",         type=float, help="Latitude (single-asset mode)")
    parser.add_argument("--lon",         type=float, help="Longitude (single-asset mode)")
    parser.add_argument("--company",     type=str,   default="Company")
    parser.add_argument("--sector",      type=str,   default="default")
    parser.add_argument("--revenue-usd", type=float, default=1e9)
    parser.add_argument("--ev-usd",      type=float, default=5e9)
    parser.add_argument("--wacc",        type=float, default=0.08)
    parser.add_argument("--scenario",    type=str,   default="cp",
                        choices=["nze", "dt", "cp"])
    parser.add_argument("--asset-file",  type=str,   help="CSV for batch mode")
    args = parser.parse_args()

    if args.asset_file:
        run_batch(args.asset_file)
    elif args.lat is not None and args.lon is not None:
        run_asset(
            lat=args.lat, lon=args.lon,
            company=args.company, sector=args.sector,
            revenue_usd=args.revenue_usd, ev_usd=args.ev_usd,
            wacc=args.wacc, scenario=args.scenario,
        )
    else:
        # Fargate: read from environment (EventBridge passes context as env vars)
        lat = float(os.environ.get("ASSET_LAT", "52.52"))
        lon = float(os.environ.get("ASSET_LON", "13.41"))
        run_asset(
            lat=lat, lon=lon,
            company=os.environ.get("ASSET_COMPANY", "Portfolio"),
            sector=os.environ.get("ASSET_SECTOR",  "default"),
            revenue_usd=float(os.environ.get("REVENUE_USD", 1e9)),
            ev_usd=float(os.environ.get("EV_USD",       5e9)),
            wacc=float(os.environ.get("WACC",           0.08)),
            scenario=os.environ.get("SCENARIO",         "cp"),
        )
