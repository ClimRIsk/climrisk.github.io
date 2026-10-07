"""
ClimRisk — Geospatial Hazard Engine
FastAPI service that:
  1. Consumes climrisk.asset.validated events from Kafka
  2. Crosses asset coordinates against PostGIS hazard layers (ST_Intersects)
  3. Falls back to the CRI Python engine for regions without GeoTIFF data
  4. Publishes climrisk.hazard.intersected events
  5. Supports direct REST scoring (for low-latency single-asset queries)
"""

from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .geospatial import GeospatialEngine
from .kafka_handlers import HazardKafkaHandler
from ..shared.schemas import (
    AssetValidatedEvent,
    GeoPoint,
    HazardIntersectedEvent,
    SSPScenario,
    TOPICS,
)

logger = logging.getLogger("climrisk.hazard_engine")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))


# ── Application lifespan ─────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start Kafka consumer and PostGIS connection pool on startup."""
    app.state.geo_engine = GeospatialEngine(
        database_url=os.environ["DATABASE_URL"],
        hazard_layers_path=os.getenv("HAZARD_LAYERS_PATH", "/data/hazard_layers"),
    )
    await app.state.geo_engine.connect()

    app.state.kafka_handler = HazardKafkaHandler(
        geo_engine=app.state.geo_engine,
        kafka_bootstrap=os.getenv("KAFKA_BOOTSTRAP", "kafka:29092"),
    )
    # Start Kafka consumer in background
    consumer_task = asyncio.create_task(app.state.kafka_handler.run())
    app.state.consumer_task = consumer_task
    logger.info("hazard_engine.started")
    yield
    # Graceful shutdown
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass
    await app.state.geo_engine.disconnect()
    logger.info("hazard_engine.shutdown")


app = FastAPI(
    title="ClimRisk Geospatial Hazard Engine",
    description="Cross asset coordinates against IPCC AR6 hazard scenario maps",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in production via gateway
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ── REST endpoints ────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "hazard_engine"}


class ScoreRequest(BaseModel):
    """Direct REST scoring — synchronous, for UI queries."""
    asset_id: str
    lat: float
    lon: float
    asset_type: str = "Heavy Manufacturing"
    sector: str = "Steel & Metals"
    is_coastal: bool = False
    elevation_m: float = 10.0
    scenario: SSPScenario = SSPScenario.SSP245
    horizon_year: int = 2035


class ScoreResponse(BaseModel):
    asset_id: str
    scenario: SSPScenario
    horizon_year: int
    exposures: list[dict]
    is_material_risk: bool
    data_sources: list[str]


@app.post("/score", response_model=ScoreResponse)
async def score_asset(req: ScoreRequest):
    """
    Synchronous scoring endpoint for a single asset.
    Used by the platform UI for real-time queries.
    Tries PostGIS first; falls back to CRI Python engine.
    """
    geo: GeospatialEngine = app.state.geo_engine
    try:
        result = await geo.score_point(
            lon=req.lon,
            lat=req.lat,
            scenario=req.scenario,
            horizon_year=req.horizon_year,
            asset_type=req.asset_type,
            sector=req.sector,
            is_coastal=req.is_coastal,
            elevation_m=req.elevation_m,
        )
        return ScoreResponse(
            asset_id=req.asset_id,
            scenario=req.scenario,
            horizon_year=req.horizon_year,
            exposures=result["exposures"],
            is_material_risk=result["is_material_risk"],
            data_sources=result["data_sources"],
        )
    except Exception as exc:
        logger.error("score_asset.error asset_id=%s err=%s", req.asset_id, exc)
        raise HTTPException(status_code=500, detail=str(exc))


class BatchScoreRequest(BaseModel):
    """Batch scoring — submits a portfolio for async processing via Kafka."""
    client_id: str
    assets: list[ScoreRequest]
    scenarios: list[SSPScenario] = [
        SSPScenario.SSP126, SSPScenario.SSP245,
        SSPScenario.SSP370, SSPScenario.SSP585
    ]
    horizon_years: list[int] = [2030, 2035, 2040, 2045, 2050]


@app.post("/score/batch", status_code=202)
async def score_batch(req: BatchScoreRequest, background_tasks: BackgroundTasks):
    """
    Submits a portfolio for async batch scoring.
    Returns immediately; results arrive via climrisk.hazard.intersected topic.
    """
    geo: GeospatialEngine = app.state.geo_engine
    background_tasks.add_task(
        geo.score_batch,
        client_id=req.client_id,
        assets=req.assets,
        scenarios=req.scenarios,
        horizon_years=req.horizon_years,
    )
    return {
        "status": "accepted",
        "client_id": req.client_id,
        "asset_count": len(req.assets),
        "message": "Results will be published to climrisk.hazard.intersected",
    }


@app.get("/layers")
async def list_hazard_layers():
    """List available GeoTIFF hazard layers."""
    geo: GeospatialEngine = app.state.geo_engine
    return {"layers": await geo.list_layers()}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
