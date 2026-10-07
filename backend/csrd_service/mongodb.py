"""
ClimRisk — MongoDB Repository (CSRD Report State)

MongoDB is used for report state because CSRD reports are naturally
document-oriented (variable schema per scenario × framework combination)
and benefit from flexible indexing on client_id + report_id.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger("climrisk.csrd.mongodb")


class ReportRepository:
    def __init__(self, mongo_url: str) -> None:
        self._url = mongo_url
        self._client: AsyncIOMotorClient | None = None
        self._db = None

    async def connect(self) -> None:
        self._client = AsyncIOMotorClient(self._url)
        self._db = self._client.climrisk_reports
        # Indexes
        await self._db.reports.create_index([("client_id", 1), ("report_id", 1)], unique=True)
        await self._db.reports.create_index([("client_id", 1), ("created_at", -1)])
        await self._db.hazard_events.create_index([("client_id", 1), ("asset_id", 1)])
        await self._db.hazard_events.create_index([("scenario", 1), ("horizon_year", 1)])
        logger.info("mongodb.connected")

    async def disconnect(self) -> None:
        if self._client:
            self._client.close()

    # ── Report lifecycle ──────────────────────────────────────────────────────

    async def create_report_job(self, params: dict) -> str:
        report_id = f"rpt_{uuid.uuid4().hex[:10]}"
        import datetime
        doc = {
            "report_id": report_id,
            "client_id": params["client_id"],
            "status": "pending",
            "params": params,
            "created_at": datetime.datetime.utcnow(),
        }
        await self._db.reports.insert_one(doc)
        return report_id

    async def get_reports(self, client_id: str) -> list[dict]:
        cursor = self._db.reports.find(
            {"client_id": client_id},
            {"_id": 0},
            sort=[("created_at", -1)],
            limit=20,
        )
        return [doc async for doc in cursor]

    async def get_report(self, client_id: str, report_id: str) -> dict | None:
        return await self._db.reports.find_one(
            {"client_id": client_id, "report_id": report_id},
            {"_id": 0},
        )

    async def update_report(self, client_id: str, report_id: str, updates: dict) -> None:
        await self._db.reports.update_one(
            {"client_id": client_id, "report_id": report_id},
            {"$set": updates},
        )

    async def get_latest_var(self, client_id: str) -> dict | None:
        doc = await self._db.reports.find_one(
            {"client_id": client_id, "status": "GENERATED"},
            {"_id": 0, "var_summary": 1, "report_id": 1, "created_at": 1},
            sort=[("created_at", -1)],
        )
        return doc

    # ── Hazard event accumulation ─────────────────────────────────────────────

    async def store_hazard_event(self, event: dict) -> None:
        """Persist a HazardIntersectedEvent for later VaR aggregation."""
        import datetime
        event["stored_at"] = datetime.datetime.utcnow()
        await self._db.hazard_events.replace_one(
            {
                "asset_id": event["asset_id"],
                "client_id": event["client_id"],
                "scenario": event["scenario"],
                "horizon_year": event["horizon_year"],
            },
            event,
            upsert=True,
        )

    async def get_hazard_events(
        self, client_id: str, scenario: str, horizon_year: int
    ) -> list[dict]:
        cursor = self._db.hazard_events.find(
            {"client_id": client_id, "scenario": scenario, "horizon_year": horizon_year},
            {"_id": 0},
        )
        return [doc async for doc in cursor]

    async def get_asset_registry(self, client_id: str) -> dict[str, dict]:
        """Return {asset_id: asset_info} for all assets belonging to client."""
        cursor = self._db.assets.find({"client_id": client_id}, {"_id": 0})
        return {doc["asset_id"]: doc async for doc in cursor}

    async def upsert_asset(self, asset: dict) -> None:
        await self._db.assets.replace_one(
            {"asset_id": asset["asset_id"]},
            asset,
            upsert=True,
        )
