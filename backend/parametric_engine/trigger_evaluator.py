"""
ClimRisk — Trigger Evaluator

Encapsulates TimescaleDB operations and the threshold comparison logic.
Exactly-once guarantee is achieved by:
  1. Inserting a trigger record with a unique idempotency_key in TimescaleDB
     (UNIQUE constraint prevents duplicates even if Kafka delivers twice)
  2. Publishing via a transactional Kafka producer only after DB insert succeeds
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

import asyncpg

from ..shared.kafka_client import ClimRiskProducer
from ..shared.schemas import (
    PayoutTier,
    ParametricTriggerFiredEvent,
    TriggerCondition,
    WeatherObservation,
    WeatherTelemetryEvent,
    TOPICS,
)

logger = logging.getLogger("climrisk.parametric.evaluator")


class TriggerEvaluator:
    def __init__(self, timescale_url: str, kafka_bootstrap: str) -> None:
        self._db_url = timescale_url.replace("postgresql+asyncpg://", "")
        self._kafka_bootstrap = kafka_bootstrap
        self._pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        self._pool = await asyncpg.create_pool(
            dsn=f"postgresql://{self._db_url}",
            min_size=2, max_size=10, command_timeout=15,
        )
        await self._ensure_schema()
        logger.info("trigger_evaluator.db.connected")

    async def disconnect(self) -> None:
        if self._pool:
            await self._pool.close()

    async def _ensure_schema(self) -> None:
        async with self._pool.acquire() as conn:
            await conn.execute("""
                -- Hypertable for raw weather telemetry (high-volume)
                CREATE TABLE IF NOT EXISTS weather_telemetry (
                    time         TIMESTAMPTZ NOT NULL,
                    asset_id     TEXT NOT NULL,
                    station_id   TEXT NOT NULL,
                    parameter    TEXT NOT NULL,
                    value        DOUBLE PRECISION NOT NULL,
                    unit         TEXT NOT NULL,
                    quality_flag TEXT DEFAULT 'OK',
                    oracle_source TEXT
                );
                SELECT create_hypertable(
                    'weather_telemetry', 'time',
                    if_not_exists => TRUE,
                    migrate_data => TRUE
                );
                CREATE INDEX IF NOT EXISTS idx_telemetry_asset_time
                    ON weather_telemetry (asset_id, time DESC);

                -- Parametric policies
                CREATE TABLE IF NOT EXISTS parametric_policies (
                    policy_id      TEXT PRIMARY KEY,
                    client_id      TEXT NOT NULL,
                    asset_id       TEXT NOT NULL,
                    parameter      TEXT NOT NULL,
                    threshold_value DOUBLE PRECISION NOT NULL,
                    threshold_unit TEXT NOT NULL,
                    payout_tiers   JSONB NOT NULL DEFAULT '[]',
                    active         BOOLEAN DEFAULT TRUE,
                    created_at     TIMESTAMPTZ DEFAULT now()
                );
                CREATE INDEX IF NOT EXISTS idx_policies_asset
                    ON parametric_policies (asset_id) WHERE active = TRUE;

                -- Trigger audit trail (exactly-once: unique idempotency_key)
                CREATE TABLE IF NOT EXISTS trigger_events (
                    id              BIGSERIAL PRIMARY KEY,
                    idempotency_key TEXT UNIQUE NOT NULL,
                    policy_id       TEXT NOT NULL,
                    client_id       TEXT NOT NULL,
                    asset_id        TEXT NOT NULL,
                    fired_at        TIMESTAMPTZ DEFAULT now(),
                    parameter       TEXT NOT NULL,
                    threshold_value DOUBLE PRECISION NOT NULL,
                    actual_value    DOUBLE PRECISION NOT NULL,
                    payout_tier     TEXT NOT NULL,
                    status          TEXT NOT NULL,
                    oracle_source   TEXT
                );
            """)

    async def ingest_telemetry(self, event: WeatherTelemetryEvent) -> None:
        if not self._pool:
            return
        rows = [
            (
                event.timestamp, event.asset_id, obs.station_id,
                obs.parameter, obs.value, obs.unit,
                obs.quality_flag, event.oracle_source,
            )
            for obs in event.observations
        ]
        async with self._pool.acquire() as conn:
            await conn.executemany(
                """INSERT INTO weather_telemetry
                   (time, asset_id, station_id, parameter, value, unit, quality_flag, oracle_source)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                   ON CONFLICT DO NOTHING""",
                rows,
            )

    async def upsert_policy(self, policy: dict) -> None:
        async with self._pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO parametric_policies
                   (policy_id, client_id, asset_id, parameter, threshold_value,
                    threshold_unit, payout_tiers, active)
                   VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)
                   ON CONFLICT (policy_id) DO UPDATE SET
                     threshold_value = EXCLUDED.threshold_value,
                     payout_tiers    = EXCLUDED.payout_tiers,
                     active          = EXCLUDED.active""",
                policy["policy_id"], policy["client_id"], policy["asset_id"],
                policy["parameter"], policy["threshold_value"],
                policy["threshold_unit"],
                __import__("json").dumps(policy.get("payout_tiers", [])),
                policy.get("active", True),
            )

    async def get_policies_for_asset(self, asset_id: str) -> list[dict]:
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM parametric_policies WHERE asset_id=$1 AND active=TRUE",
                asset_id,
            )
        return [dict(r) for r in rows]

    async def get_policies(self, client_id: str) -> list[dict]:
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM parametric_policies WHERE client_id=$1 ORDER BY created_at DESC",
                client_id,
            )
        return [dict(r) for r in rows]

    async def get_triggers(self, client_id: str, limit: int = 50) -> list[dict]:
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                """SELECT * FROM trigger_events
                   WHERE client_id=$1
                   ORDER BY fired_at DESC LIMIT $2""",
                client_id, limit,
            )
        return [dict(r) for r in rows]

    async def get_telemetry(self, asset_id: str, hours: int = 48) -> list[dict]:
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                """SELECT time, station_id, parameter, value, unit, oracle_source
                   FROM weather_telemetry
                   WHERE asset_id=$1
                     AND time > now() - ($2 * interval '1 hour')
                   ORDER BY time DESC LIMIT 500""",
                asset_id, hours,
            )
        return [dict(r) for r in rows]

    async def evaluate(
        self,
        policy: dict,
        observation: WeatherObservation,
        event: WeatherTelemetryEvent,
    ) -> None:
        """
        Compare observation against policy threshold.
        On breach: insert trigger record (idempotency) → publish Kafka event.
        """
        threshold = policy["threshold_value"]
        actual = observation.value

        if actual <= threshold:
            return  # No breach

        exceedance_pct = (actual - threshold) / threshold * 100
        payout_tier = self._resolve_tier(policy.get("payout_tiers", []), exceedance_pct)
        idempotency_key = self._idempotency_key(policy["policy_id"], event.timestamp)

        # Exactly-once: insert with unique constraint; skip if duplicate
        inserted = await self._record_trigger(
            idempotency_key=idempotency_key,
            policy=policy,
            actual=actual,
            exceedance_pct=exceedance_pct,
            payout_tier=payout_tier,
            oracle_source=event.oracle_source,
        )
        if not inserted:
            logger.info("trigger.duplicate.skipped idempotency_key=%s", idempotency_key)
            return

        # Publish to Kafka (transactional producer)
        trigger_event = ParametricTriggerFiredEvent(
            policy_id=policy["policy_id"],
            client_id=policy["client_id"],
            asset_id=event.asset_id,
            trigger_condition=TriggerCondition(
                parameter=observation.parameter,
                threshold_value=threshold,
                threshold_unit=observation.unit,
                actual_value=actual,
                oracle_source=event.oracle_source,
                exceedance_pct=round(exceedance_pct, 2),
            ),
            payout_tier=PayoutTier(payout_tier),
            status="EXECUTE_PAYOUT",
            idempotency_key=idempotency_key,
        )
        async with ClimRiskProducer(
            transactional=True,
            transactional_id=f"param-trigger-{policy['policy_id']}",
        ) as prod:
            await prod.send(
                TOPICS["parametric_trigger"],
                trigger_event,
                key=policy["policy_id"],
            )

        logger.info(
            "trigger.fired policy_id=%s asset_id=%s actual=%.1f threshold=%.1f tier=%s",
            policy["policy_id"], event.asset_id, actual, threshold, payout_tier,
        )

    async def _record_trigger(
        self, idempotency_key: str, policy: dict,
        actual: float, exceedance_pct: float, payout_tier: str, oracle_source: str,
    ) -> bool:
        """Insert trigger record. Returns False if duplicate (idempotency key exists)."""
        try:
            async with self._pool.acquire() as conn:
                await conn.execute(
                    """INSERT INTO trigger_events
                       (idempotency_key, policy_id, client_id, asset_id, parameter,
                        threshold_value, actual_value, payout_tier, status, oracle_source)
                       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)""",
                    idempotency_key, policy["policy_id"], policy["client_id"],
                    policy["asset_id"], policy["parameter"],
                    policy["threshold_value"], actual, payout_tier,
                    "EXECUTE_PAYOUT", oracle_source,
                )
            return True
        except asyncpg.UniqueViolationError:
            return False

    @staticmethod
    def _resolve_tier(tiers: list[dict], exceedance_pct: float) -> str:
        """Resolve payout tier based on exceedance percentage."""
        best_tier = "Tier 1 (25%)"
        for t in sorted(tiers, key=lambda x: x.get("min_exceedance", 0), reverse=True):
            if exceedance_pct >= t.get("min_exceedance", 0):
                best_tier = t.get("tier", best_tier)
                break
        return best_tier

    @staticmethod
    def _idempotency_key(policy_id: str, timestamp) -> str:
        """
        Idempotency key = policy_id + truncated-to-hour timestamp.
        Prevents double-firing for the same policy within the same hour window.
        """
        hour = timestamp.strftime("%Y%m%d%H")
        return f"{policy_id}:{hour}"
