"""
ClimRisk — CSRD Service Kafka Consumer

Consumes: climrisk.hazard.intersected
When all expected (scenario × year) events for a client are received,
triggers VaR computation and publishes climrisk.report.csrd_e1_ready.
"""

from __future__ import annotations

import logging

from ..shared.kafka_client import ClimRiskConsumer, ClimRiskProducer
from ..shared.schemas import (
    CSRDReportReadyEvent, FinancialEffects,
    HazardIntersectedEvent, SSPScenario, TOPICS,
)

logger = logging.getLogger("climrisk.csrd.kafka")


class CSRDKafkaHandler:
    def __init__(self, repo, var_engine, xbrl, pdf, kafka_bootstrap: str) -> None:
        self._repo = repo
        self._var = var_engine
        self._xbrl = xbrl
        self._pdf = pdf
        self._bootstrap = kafka_bootstrap

    async def run(self) -> None:
        consumer = ClimRiskConsumer(
            topics=[TOPICS["hazard_intersected"]],
            group_id=__import__("os").getenv("KAFKA_GROUP_ID", "csrd-service-group"),
            schema=HazardIntersectedEvent,
            handler=self._handle_hazard_event,
        )
        await consumer.run()

    async def _handle_hazard_event(self, event: HazardIntersectedEvent) -> None:
        # 1. Persist the hazard event to MongoDB
        await self._repo.store_hazard_event(event.model_dump())
        logger.debug(
            "csrd.hazard_event.stored asset_id=%s scenario=%s year=%s",
            event.asset_id, event.scenario, event.horizon_year,
        )

        # 2. Check if we have enough data to produce a full CSRD report
        await self._try_generate_report(event.client_id)

    async def _try_generate_report(self, client_id: str) -> None:
        """
        If all expected hazard events for all (scenario × year) combos have
        arrived for this client, generate the ESRS E1-9 report.
        In production: use a pending-jobs counter in Redis or MongoDB.
        Here simplified: generate whenever we have ≥ 1 event per scenario.
        """
        scenarios = [SSPScenario.SSP126, SSPScenario.SSP245,
                     SSPScenario.SSP370, SSPScenario.SSP585]
        horizon_years = [2030, 2035, 2040, 2045, 2050]

        var_results = []
        asset_registry = await self._repo.get_asset_registry(client_id)

        for sc in scenarios:
            for yr in horizon_years:
                events = await self._repo.get_hazard_events(client_id, sc.value, yr)
                if not events:
                    continue
                var_result = self._var.compute(
                    hazard_events=events,
                    asset_registry=asset_registry,
                    scenario=sc.value,
                    horizon_year=yr,
                )
                var_results.append(var_result)

        if not var_results:
            return

        # Format XBRL
        xbrl_payload = self._xbrl.format(
            client_id=client_id,
            report_id=f"rpt_{client_id}",
            var_results=var_results,
        )

        worst = max(var_results, key=lambda r: r.get("gross_value_at_risk_usd", 0))

        # Publish completion event
        report_event = CSRDReportReadyEvent(
            client_id=client_id,
            assessment_scenarios=[s for s in scenarios],
            horizon_year=worst["horizon_year"],
            financial_effects=FinancialEffects(
                total_assets_evaluated_usd=worst["total_assets_evaluated_usd"],
                assets_at_material_risk_usd=worst["assets_at_material_risk_usd"],
                insured_percentage=worst["insured_percentage"],
                gross_value_at_risk_usd=worst["gross_value_at_risk_usd"],
                expected_annual_loss_usd=worst.get("expected_annual_loss_usd"),
                physical_risk_var_usd=worst.get("physical_risk_var_usd"),
                transition_risk_var_usd=worst.get("transition_risk_var_usd"),
                stranded_asset_value_usd=worst.get("stranded_asset_value_usd"),
            ),
            report_status="GENERATED",
        )

        async with ClimRiskProducer() as prod:
            await prod.send(TOPICS["csrd_e1_ready"], report_event, key=client_id)

        # Update MongoDB report state
        await self._repo.update_report(
            client_id=client_id,
            report_id=report_event.report_id,
            updates={
                "status": "GENERATED",
                "var_summary": worst,
                "xbrl_payload": xbrl_payload,
            },
        )
        logger.info("csrd.report.generated client_id=%s report_id=%s var=$%.0f",
                    client_id, report_event.report_id, worst["gross_value_at_risk_usd"])
