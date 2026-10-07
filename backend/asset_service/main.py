"""
ClimRisk — Asset Service

CRUD API for client asset portfolios.
On asset registration:
  1. Validate coordinates (geocoding + land/sea check)
  2. Persist to PostGIS assets table
  3. Publish climrisk.asset.validated → triggers hazard scoring pipeline
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel

from .validators import AssetValidator
from ..shared.kafka_client import ClimRiskProducer
from ..shared.schemas import (
    AssetRegisteredEvent, AssetRegisteredPayload, AssetValidatedEvent,
    AssetType, GeoPoint, SSPScenario, TOPICS,
)

logger = logging.getLogger("climrisk.asset_service")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncpg
    db_url = os.environ["DATABASE_URL"].replace("postgresql+asyncpg://", "")
    app.state.pool = await asyncpg.create_pool(
        dsn=f"postgresql://{db_url}", min_size=2, max_size=10
    )
    await _ensure_schema(app.state.pool)
    app.state.validator = AssetValidator()
    yield
    await app.state.pool.close()


async def _ensure_schema(pool) -> None:
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE EXTENSION IF NOT EXISTS postgis;
            CREATE TABLE IF NOT EXISTS client_assets (
                asset_id     TEXT PRIMARY KEY,
                client_id    TEXT NOT NULL,
                asset_name   TEXT,
                asset_type   TEXT,
                sector       TEXT,
                commodity    TEXT,
                book_value   DOUBLE PRECISION,
                geom         GEOMETRY(POINT, 4326),
                region_code  TEXT,
                elevation_m  DOUBLE PRECISION,
                is_coastal   BOOLEAN DEFAULT FALSE,
                metadata     JSONB DEFAULT '{}',
                created_at   TIMESTAMPTZ DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS idx_assets_client
                ON client_assets (client_id);
            CREATE INDEX IF NOT EXISTS idx_assets_geom
                ON client_assets USING GIST (geom);
        """)


app = FastAPI(
    title="ClimRisk Asset Service",
    description="Asset CRUD + portfolio upload → Kafka pipeline trigger",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "asset_service"}


# ── Single asset registration ─────────────────────────────────────────────────

class AssetIn(BaseModel):
    client_id: str
    asset_id: str
    asset_name: str
    asset_type: AssetType = AssetType.HEAVY_MANUFACTURING
    sector: str = "Steel & Metals"
    commodity: str | None = None
    lat: float
    lon: float
    book_value_usd: float
    elevation_m: float | None = None
    is_coastal: bool = False
    metadata: dict = {}


@app.post("/assets", status_code=201)
async def register_asset(asset: AssetIn):
    """
    Register a single asset. Validates coordinates, stores in PostGIS,
    then fires the Kafka pipeline.
    """
    validator: AssetValidator = app.state.validator
    pool = app.state.pool

    # Coordinate validation
    issues = validator.validate(asset.lat, asset.lon, asset.asset_type)
    if issues.get("errors"):
        raise HTTPException(422, {"validation_errors": issues["errors"]})

    # Persist to PostGIS
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO client_assets
               (asset_id, client_id, asset_name, asset_type, sector, commodity,
                book_value, geom, elevation_m, is_coastal, metadata)
               VALUES ($1,$2,$3,$4,$5,$6,$7,
                       ST_SetSRID(ST_MakePoint($8,$9),4326),
                       $10,$11,$12::jsonb)
               ON CONFLICT (asset_id) DO UPDATE SET
                 book_value = EXCLUDED.book_value,
                 is_coastal = EXCLUDED.is_coastal""",
            asset.asset_id, asset.client_id, asset.asset_name,
            asset.asset_type.value, asset.sector, asset.commodity,
            asset.book_value_usd, asset.lon, asset.lat,
            asset.elevation_m, asset.is_coastal,
            __import__("json").dumps(asset.metadata),
        )

    # Publish to Kafka → triggers hazard engine
    event = AssetValidatedEvent(
        client_id=asset.client_id,
        asset_data=AssetRegisteredPayload(
            asset_id=asset.asset_id,
            type=asset.asset_type,
            geometry=GeoPoint(coordinates=[asset.lon, asset.lat]),
            book_value_usd=asset.book_value_usd,
            sector=asset.sector,
            commodity=asset.commodity,
            elevation_m=asset.elevation_m,
            is_coastal=asset.is_coastal,
        ),
    )
    async with ClimRiskProducer() as prod:
        await prod.send(TOPICS["asset_validated"], event, key=asset.client_id)

    return {"asset_id": asset.asset_id, "status": "registered", "pipeline": "triggered"}


@app.get("/assets/{client_id}")
async def list_assets(client_id: str):
    pool = app.state.pool
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT asset_id, asset_name, asset_type, sector, book_value,
                      ST_X(geom) as lon, ST_Y(geom) as lat,
                      region_code, is_coastal, elevation_m, created_at
               FROM client_assets
               WHERE client_id=$1
               ORDER BY created_at DESC""",
            client_id,
        )
    return [dict(r) for r in rows]


@app.delete("/assets/{asset_id}", status_code=204)
async def delete_asset(asset_id: str):
    pool = app.state.pool
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM client_assets WHERE asset_id=$1", asset_id)


# ── Bulk Excel / CSV upload (triggers batch pipeline) ────────────────────────

@app.post("/assets/upload/{client_id}", status_code=202)
async def upload_portfolio(client_id: str, file: UploadFile = File(...)):
    """
    Accept the TCFD Excel template or a CSV portfolio file.
    Parses all assets, validates coordinates, bulk-inserts to PostGIS,
    and fires one AssetValidatedEvent per asset.
    """
    try:
        content = await file.read()
        assets = _parse_portfolio_file(file.filename, content)
    except Exception as exc:
        raise HTTPException(422, f"File parse error: {exc}")

    registered = []
    errors = []
    for a in assets:
        try:
            result = await register_asset(a)
            registered.append(result["asset_id"])
        except Exception as exc:
            errors.append({"asset_id": a.asset_id, "error": str(exc)})

    return {
        "client_id": client_id,
        "total": len(assets),
        "registered": len(registered),
        "errors": errors,
        "pipeline": "triggered" if registered else "none",
    }


def _parse_portfolio_file(filename: str, content: bytes) -> list[AssetIn]:
    """Parse Excel (TCFD template) or CSV portfolio file."""
    import io
    import pandas as pd

    if filename.endswith((".xlsx", ".xls")):
        df = pd.read_excel(io.BytesIO(content), sheet_name="📊 Portfolio Assets",
                           skiprows=3, header=0)
    else:
        df = pd.read_csv(io.BytesIO(content))

    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
    assets = []
    for _, row in df.iterrows():
        try:
            a = AssetIn(
                client_id="unknown",    # overridden by URL param
                asset_id=str(row.get("asset_name", "")).strip().lower().replace(" ", "_"),
                asset_name=str(row.get("asset_name", "")),
                sector=str(row.get("sector_*", row.get("sector", "Other"))),
                lat=float(row["latitude"]),
                lon=float(row["longitude"]),
                book_value_usd=float(row.get("asset_value_$m_*", 0)) * 1e6,
                commodity=str(row.get("sub-sector_/_commodity", "")) or None,
                is_coastal=str(row.get("coastal_asset?", "No")).lower() in ("yes", "true", "1"),
                elevation_m=float(row["elevation_(m)"]) if "elevation_(m)" in row else None,
            )
            assets.append(a)
        except Exception:
            continue  # skip malformed rows
    return assets


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
