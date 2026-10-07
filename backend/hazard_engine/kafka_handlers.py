"""
ClimRisk — Hazard Engine Kafka Consumer

Listens on climrisk.asset.validated
Publishes to climrisk.hazard.intersected (one event per scenario × year)
"""

from __future__ import annotations

import logging

from ..shared.kafka_client import ClimRiskConsumer
from ..shared.schemas import AssetValidatedEvent, TOPICS

logger = logging.getLogger("climrisk.hazard_engine.kafka")


class HazardKafkaHandler:
    def __init__(self, geo_engine, kafka_bootstrap: str) -> None:
        self._geo = geo_engine
        self._bootstrap = kafka_bootstrap

    async def run(self) -> None:
        consumer = ClimRiskConsumer(
            topics=[TOPICS["asset_validated"]],
            group_id="hazard-engine-group",
            schema=AssetValidatedEvent,
            handler=self._handle_validated_asset,
        )
        await consumer.run()

    async def _handle_validated_asset(self, event: AssetValidatedEvent) -> None:
        """
        For each (scenario × horizon_year) in the event, score the asset
        and publish a HazardIntersectedEvent.
        """
        logger.info(
            "hazard.processing asset_id=%s client_id=%s scenarios=%s years=%s",
            event.asset_data.asset_id,
            event.client_id,
            [s.value for s in event.scenarios],
            event.horizon_years,
        )

        asset = event.asset_data
        # Convert to simple objects that score_batch expects
        class _AssetRef:
            asset_id = asset.asset_id
            lon = asset.geometry.lon
            lat = asset.geometry.lat
            sector = asset.sector

        await self._geo.score_batch(
            client_id=event.client_id,
            assets=[_AssetRef()],
            scenarios=[s.value for s in event.scenarios],
            horizon_years=event.horizon_years,
        )
