"""
ClimRisk — Parametric Stream Processor

Consumes climrisk.weather.telemetry.live from Kafka.
For each incoming observation batch, evaluates all active policies
whose asset_id matches and checks for threshold breaches.
Publishes climrisk.parametric.trigger.fired with exactly-once semantics.
"""

from __future__ import annotations

import logging

from ..shared.kafka_client import ClimRiskConsumer
from ..shared.schemas import WeatherTelemetryEvent, TOPICS
from .trigger_evaluator import TriggerEvaluator

logger = logging.getLogger("climrisk.parametric.stream")


class ParametricStreamProcessor:
    def __init__(self, evaluator: TriggerEvaluator) -> None:
        self._evaluator = evaluator

    async def run(self) -> None:
        consumer = ClimRiskConsumer(
            topics=[TOPICS["weather_telemetry"]],
            group_id=__import__("os").getenv("KAFKA_GROUP_ID", "parametric-engine-group"),
            schema=WeatherTelemetryEvent,
            handler=self._handle_telemetry,
        )
        await consumer.run()

    async def _handle_telemetry(self, event: WeatherTelemetryEvent) -> None:
        """
        Process a single weather telemetry event:
          1. Persist observations to TimescaleDB hypertable
          2. Fetch all active policies for this asset
          3. Evaluate each observation against matching policy parameters
          4. Fire trigger if threshold breached
        """
        # 1. Persist raw telemetry
        await self._evaluator.ingest_telemetry(event)

        # 2-4. Evaluate policies
        policies = await self._evaluator.get_policies_for_asset(event.asset_id)
        for policy in policies:
            for obs in event.observations:
                if obs.parameter == policy["parameter"] and obs.quality_flag == "OK":
                    await self._evaluator.evaluate(
                        policy=policy,
                        observation=obs,
                        event=event,
                    )
