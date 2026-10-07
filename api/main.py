"""
ClimRisk — FastAPI Serving Layer
=================================
Endpoints
─────────
  GET  /health                         — liveness probe
  GET  /risk/{asset_id}                — full risk profile for one asset
  GET  /assets?sector=&bbox=           — portfolio map feed (Deck.gl)
  GET  /scenarios/{asset_id}           — NZE / Delayed / CP comparison
  POST /assess                         — on-demand single-asset assessment
  GET  /alerts?severity=HIGH           — active extreme-weather alerts
  GET  /tiles/{z}/{x}/{y}.png          — proxies TiTiler for flood rasters

Run locally:
  pip install fastapi uvicorn asyncpg httpx
  uvicorn api.main:app --reload --port 8000
"""

import os, json, math
from datetime import datetime
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from api.db import get_pool, close_pool, get_asset_risk, list_assets
from api.impute import impute_asset

# ── Config ───────────────────────────────────────────────────────────────────
TITILER_URL = os.environ.get("TITILER_URL", "http://titiler:8080")
S3_BUCKET   = os.environ.get("S3_BUCKET", "climrisk-data")

app = FastAPI(
    title="ClimRisk API",
    version="1.0.0",
    description="Climate Financial Risk Platform — Physical & Transition Risk Scoring",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten to climrisk.io in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Lifecycle ─────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    await get_pool()   # warm connection pool

@app.on_event("shutdown")
async def shutdown():
    await close_pool()


# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/health", tags=["ops"])
async def health():
    pool = await get_pool()
    await pool.fetchval("SELECT 1")
    return {"status": "ok", "ts": datetime.utcnow().isoformat()}


# ═══════════════════════════════════════════════════════════════════════════════
# RISK — single asset
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/risk/{asset_id}", tags=["risk"])
async def get_risk(asset_id: str = Path(..., description="Asset identifier")):
    """
    Full risk profile for one asset — sub-100ms from PostGIS.
    Returns: baseline climate stats, IPCC-calibrated hazard probabilities,
             EAL + NPV impact, per-hazard damage fraction breakdown,
             live ECMWF forecast alerts.
    """
    pool = await get_pool()
    data = await get_asset_risk(pool, asset_id)
    if not data:
        raise HTTPException(404, f"Asset '{asset_id}' not found")
    return data


# ═══════════════════════════════════════════════════════════════════════════════
# ASSETS — portfolio feed for Deck.gl map
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/assets", tags=["risk"])
async def get_assets(
    sector: Optional[str] = Query(None, description="Filter by sector"),
    bbox: Optional[str]   = Query(None, description="min_lon,min_lat,max_lon,max_lat"),
    limit: int            = Query(500, le=2000),
):
    """
    Portfolio map feed. Returns GeoJSON FeatureCollection for Deck.gl overlay.
    bbox example: ?bbox=-10,36,30,71  (Europe)
    """
    pool = await get_pool()
    parsed_bbox = None
    if bbox:
        try:
            parsed_bbox = tuple(float(x) for x in bbox.split(","))
            assert len(parsed_bbox) == 4
        except Exception:
            raise HTTPException(400, "bbox must be min_lon,min_lat,max_lon,max_lat")

    rows = await list_assets(pool, sector=sector, bbox=parsed_bbox, limit=limit)

    features = [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [r["lon"], r["lat"]]},
            "properties": {
                "asset_id":      r["asset_id"],
                "company":       r["company"],
                "sector":        r["sector"],
                "eal_usd":       r["eal_usd"],
                "npv_pct_ev":    r["npv_pct_ev"],
                "scenario":      r["scenario"],
                "run_ts":        str(r["run_ts"]) if r["run_ts"] else None,
                # Deck.gl colour bucket: 0=low 1=med 2=high
                "risk_tier": (
                    2 if (r["npv_pct_ev"] or 0) > 15 else
                    1 if (r["npv_pct_ev"] or 0) > 5  else 0
                ),
            },
        }
        for r in rows
    ]
    return {"type": "FeatureCollection", "features": features, "count": len(features)}


# ═══════════════════════════════════════════════════════════════════════════════
# SCENARIOS — NZE / Delayed Transition / Current Policy comparison
# ═══════════════════════════════════════════════════════════════════════════════

_SMULT = {"nze": 0.47, "dt": 0.68, "cp": 1.00}
_IPCC_CP = {"flood": 0.28, "heat_stress": 0.38, "water_stress": 0.22, "wildfire": 0.14, "wind": 0.12}

@app.get("/scenarios/{asset_id}", tags=["risk"])
async def get_scenarios(asset_id: str):
    """
    Compare EAL + NPV impact across all three IPCC AR6 scenarios.
    Useful for the three-column scenario table in the dashboard.
    """
    pool = await get_pool()
    base = await get_asset_risk(pool, asset_id)
    if not base:
        raise HTTPException(404, f"Asset '{asset_id}' not found")

    wacc = 0.08
    annuity = (1 - (1 + wacc) ** -10) / wacc
    rev = base.get("revenue_usd") or 1e9

    results = {}
    for scen, sm in _SMULT.items():
        eal = sum(
            _IPCC_CP[h] * sm * v.get("damage_frac", 0.12) * rev
            for h, v in (base.get("hazard_breakdown") or {}).items()
        )
        results[scen] = {
            "eal_usd": round(eal, 0),
            "npv_impact_usd": round(eal * annuity, 0),
            "npv_pct_ev": round(eal * annuity / (base.get("ev_usd") or 1) * 100, 2),
        }
    return {"asset_id": asset_id, "scenarios": results}


# ═══════════════════════════════════════════════════════════════════════════════
# ON-DEMAND ASSESS — trigger pipeline for a new asset without waiting for cron
# ═══════════════════════════════════════════════════════════════════════════════

class AssessRequest(BaseModel):
    company: str
    sector: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    address: Optional[str] = None   # imputation path
    revenue_usd: float = 1e9
    ev_usd: float      = 5e9
    wacc: float        = 0.08
    scenario: str      = "cp"
    # vulnerability attributes (optional — improve accuracy)
    build_year: Optional[int]   = None
    ffe_m: Optional[float]      = None
    material: Optional[str]     = None
    defenses: Optional[str]     = None
    backup_power: bool          = False

@app.post("/assess", tags=["risk"])
async def assess_asset(req: AssessRequest):
    """
    On-demand assessment. If lat/lon missing, geocodes the address.
    If building metadata missing, queries OSM Overpass for defaults.
    Returns full risk profile synchronously (typically 3-8 seconds).
    """
    # Imputation — fill missing lat/lon and building attributes
    imputed = await impute_asset(
        company=req.company, sector=req.sector,
        lat=req.lat, lon=req.lon, address=req.address,
        build_year=req.build_year, ffe_m=req.ffe_m,
        material=req.material, defenses=req.defenses,
    )

    # Run pipeline inline (import here to avoid circular import at module level)
    from pipeline import run_asset
    result = run_asset(
        lat=imputed["lat"], lon=imputed["lon"],
        company=req.company, sector=req.sector,
        revenue_usd=req.revenue_usd, ev_usd=req.ev_usd,
        wacc=req.wacc, scenario=req.scenario,
    )
    result["imputation"] = imputed.get("imputed_fields", [])
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# ALERTS — active extreme-weather events across portfolio
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/alerts", tags=["risk"])
async def get_alerts(
    severity: Optional[str] = Query(None, description="HIGH or MED"),
    limit: int = Query(100, le=500),
):
    pool = await get_pool()
    where = "WHERE fa.event_date >= CURRENT_DATE"
    params: list = []
    if severity:
        params.append(severity.upper())
        where += f" AND fa.severity=$1"
    params.append(limit)
    rows = await pool.fetch(f"""
        SELECT fa.asset_id, a.company, a.sector,
               ST_Y(a.geom) AS lat, ST_X(a.geom) AS lon,
               fa.event_date, fa.alert_type, fa.value_raw, fa.unit, fa.severity
        FROM forecast_alerts fa
        JOIN assets a ON a.asset_id=fa.asset_id
        {where}
        ORDER BY fa.event_date, fa.severity DESC
        LIMIT ${len(params)}
    """, *params)
    return {"alerts": [dict(r) for r in rows], "count": len(rows)}


# ═══════════════════════════════════════════════════════════════════════════════
# TILES — proxy TiTiler for Deck.gl BitmapLayer / TileLayer
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/tiles/{z}/{x}/{y}.png", tags=["tiles"])
async def get_tile(z: int, x: int, y: int,
                   layer: str = Query("flood", description="flood | heat | wind")):
    """
    Proxy request to TiTiler which serves dynamic COG tiles from S3.
    Frontend uses this as the tile URL in Deck.gl TileLayer.
    """
    cog_url = f"s3://{S3_BUCKET}/climrisk/rasters/{layer}_rp100.tif"
    tile_url = (
        f"{TITILER_URL}/cog/tiles/{z}/{x}/{y}.png"
        f"?url={cog_url}&resampling=bilinear&rescale=0,1&colormap_name=reds"
    )
    async with httpx.AsyncClient() as client:
        r = await client.get(tile_url, timeout=10)
    return JSONResponse(
        content={"tile_url": tile_url, "status": r.status_code},
        headers={"Cache-Control": "public, max-age=3600"},
    )
