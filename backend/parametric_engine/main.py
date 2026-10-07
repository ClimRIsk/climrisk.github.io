"""
ClimRisk — Parametric Trigger Engine

High-throughput, low-latency stream processor.
  • Ingests climrisk.weather.telemetry.live from Kafka (NOAA / Open-Meteo)
  • Evaluates telemetry against parametric policy thresholds in TimescaleDB
  • Fires climrisk.parametric.trigger.fired with exactly-once guarantees
  • Stores all telemetry and trigger audit trail in TimescaleDB for auditors
"""

from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .stream_processor import ParametricStreamProcessor
from .trigger_evaluator import TriggerEvaluator
from ..shared.schemas import PayoutTier, TOPICS

logger = logging.getLogger("climrisk.parametric")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    evaluator = TriggerEvaluator(
        timescale_url=os.environ["TIMESCALE_URL"],
        kafka_bootstrap=os.getenv("KAFKA_BOOTSTRAP", "kafka:29092"),
    )
    await evaluator.connect()

    processor = ParametricStreamProcessor(evaluator=evaluator)
    task = asyncio.create_task(processor.run())
    app.state.evaluator = evaluator
    app.state.processor_task = task
    logger.info("parametric_engine.started")
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    await evaluator.disconnect()
    logger.info("parametric_engine.shutdown")


app = FastAPI(
    title="ClimRisk Parametric Trigger Engine",
    description="Real-time weather stream processor with exactly-once trigger guarantees",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "parametric_engine"}


# ── Policy management endpoints ───────────────────────────────────────────────

class PolicyCreate(BaseModel):
    policy_id: str
    client_id: str
    asset_id: str
    parameter: str          # "Cumulative Rainfall (48h)", "Wind Speed (10m)", …
    threshold_value: float
    threshold_unit: str
    # Payout tiers: list of (threshold_pct_exceedance, payout_tier)
    payout_tiers: list[dict]   # [{min_exceedance: 0, tier: "Tier 1 (25%)"}, …]
    active: bool = True


@app.post("/policies", status_code=201)
async def create_policy(policy: PolicyCreate):
    """Register a new parametric policy threshold for an asset."""
    evaluator: TriggerEvaluator = app.state.evaluator
    await evaluator.upsert_policy(policy.model_dump())
    return {"policy_id": policy.policy_id, "status": "active"}


@app.get("/policies/{client_id}")
async def list_policies(client_id: str):
    evaluator: TriggerEvaluator = app.state.evaluator
    return await evaluator.get_policies(client_id)


@app.get("/triggers/{client_id}")
async def list_triggers(client_id: str, limit: int = 50):
    """List recent trigger events for audit / dashboard display."""
    evaluator: TriggerEvaluator = app.state.evaluator
    return await evaluator.get_triggers(client_id, limit=limit)


@app.get("/telemetry/{asset_id}")
async def get_telemetry(asset_id: str, hours: int = 48):
    """
    Return recent telemetry for an asset (TimescaleDB hypertable query).
    Used by the platform dashboard for real-time weather display.
    """
    evaluator: TriggerEvaluator = app.state.evaluator
    return await evaluator.get_telemetry(asset_id, hours=hours)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
