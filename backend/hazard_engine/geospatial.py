"""
ClimRisk — Geospatial Engine Core

Handles:
  1. PostGIS ST_Intersects queries against pre-processed hazard raster layers
     (stored as polygonised GeoTIFF tiles in the climrisk.hazard_layers table)
  2. Direct Xarray / Rasterio sampling when PostGIS is unavailable
  3. CRI Python engine fallback for regions without GeoTIFF coverage

Query pattern (heavily indexed via GIST):
    SELECT hazard_type, severity_score, scenario, horizon_year
    FROM climrisk.hazard_layers
    WHERE ST_Intersects(geom, ST_SetSRID(ST_MakePoint($lon, $lat), 4326))
      AND scenario = $scenario
      AND horizon_year = $year;
"""

from __future__ import annotations

import asyncio
import logging
import os
from pathlib import Path
from typing import Any

import asyncpg

logger = logging.getLogger("climrisk.geospatial")

# Damage function weights by sector (mirrors JS platform, kept in sync)
_SECTOR_WEIGHT: dict[str, dict[str, float]] = {
    "Steel & Metals":   {"rf": 1.4, "heat": 0.7, "dr": 0.4, "cyc": 0.6, "fire": 0.3, "ws": 0.6},
    "Oil & Gas":        {"rf": 1.6, "heat": 0.5, "dr": 0.3, "cyc": 0.9, "fire": 0.4, "ws": 0.5},
    "Mining":           {"rf": 2.0, "heat": 0.8, "dr": 1.4, "cyc": 0.5, "fire": 0.5, "ws": 1.2},
    "Agriculture":      {"rf": 2.8, "heat": 2.5, "dr": 4.0, "cyc": 2.0, "fire": 1.5, "ws": 3.0},
    "Cement":           {"rf": 1.0, "heat": 0.7, "dr": 0.5, "cyc": 0.7, "fire": 0.3, "ws": 0.5},
    "Utilities":        {"rf": 1.5, "heat": 1.2, "dr": 1.8, "cyc": 1.0, "fire": 0.8, "ws": 1.5},
    "Transport":        {"rf": 2.5, "heat": 0.8, "dr": 0.2, "cyc": 1.5, "fire": 0.5, "ws": 0.3},
    "Real Estate":      {"rf": 3.0, "heat": 1.0, "dr": 0.3, "cyc": 2.0, "fire": 1.2, "ws": 0.4},
    "_default":         {"rf": 1.5, "heat": 0.8, "dr": 0.6, "cyc": 0.8, "fire": 0.5, "ws": 0.6},
}

_HZ_CATEGORY: dict[str, str] = {
    "Coastal Inundation": "rf",  "Riverine Flood": "rf",   "Flash Flood": "rf",
    "Sea Level Rise": "rf",      "Saltwater Intrusion": "rf",
    "Extreme Heat": "heat",      "Cold Stress": "heat",
    "Drought": "dr",             "Water Stress": "ws",
    "Tropical Cyclone": "cyc",   "Extreme Wind": "cyc",
    "Wildfire": "fire",
}


class GeospatialEngine:
    """
    Async PostGIS-backed geospatial hazard scoring engine.
    Falls back to rasterio direct sampling if DB is unavailable.
    """

    def __init__(self, database_url: str, hazard_layers_path: str) -> None:
        self._db_url = database_url.replace("postgresql+asyncpg://", "")
        self._layers_path = Path(hazard_layers_path)
        self._pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        try:
            self._pool = await asyncpg.create_pool(
                dsn=f"postgresql://{self._db_url}",
                min_size=2,
                max_size=20,
                command_timeout=30,
            )
            await self._ensure_schema()
            logger.info("geospatial.db.connected")
        except Exception as exc:
            logger.warning("geospatial.db.unavailable err=%s — will use rasterio fallback", exc)

    async def disconnect(self) -> None:
        if self._pool:
            await self._pool.close()

    async def _ensure_schema(self) -> None:
        """Create PostGIS tables if they don't exist yet."""
        async with self._pool.acquire() as conn:
            await conn.execute("""
                CREATE EXTENSION IF NOT EXISTS postgis;

                CREATE TABLE IF NOT EXISTS climrisk.hazard_layers (
                    id           BIGSERIAL PRIMARY KEY,
                    hazard_type  TEXT NOT NULL,
                    scenario     TEXT NOT NULL,
                    horizon_year INT  NOT NULL,
                    severity_score FLOAT NOT NULL CHECK (severity_score BETWEEN 0 AND 1),
                    data_source  TEXT,
                    geom         GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
                    created_at   TIMESTAMPTZ DEFAULT now()
                );

                -- GIST spatial index for ST_Intersects performance
                CREATE INDEX IF NOT EXISTS idx_hazard_layers_geom
                    ON climrisk.hazard_layers USING GIST (geom);

                -- Compound index for scenario filtering
                CREATE INDEX IF NOT EXISTS idx_hazard_layers_scenario_year
                    ON climrisk.hazard_layers (scenario, horizon_year, hazard_type);
            """)

    async def score_point(
        self,
        lon: float,
        lat: float,
        scenario: str,
        horizon_year: int,
        asset_type: str = "Heavy Manufacturing",
        sector: str = "Steel & Metals",
        is_coastal: bool = False,
        elevation_m: float = 10.0,
    ) -> dict[str, Any]:
        """
        Core spatial query: cross a (lon, lat) point against all hazard layers
        for the given scenario and horizon year.

        Returns dict with 'exposures', 'is_material_risk', 'data_sources'.
        """
        if self._pool:
            return await self._score_postgis(lon, lat, scenario, horizon_year, sector)
        return await self._score_rasterio(lon, lat, scenario, horizon_year, sector)

    async def _score_postgis(
        self, lon: float, lat: float, scenario: str, horizon_year: int, sector: str
    ) -> dict[str, Any]:
        """
        ST_Intersects query against pre-loaded hazard polygon layers.
        This is the primary path for production — O(log n) via GIST index.
        """
        sql = """
            SELECT
                hazard_type,
                severity_score,
                data_source
            FROM climrisk.hazard_layers
            WHERE ST_Intersects(
                geom,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)
            )
            AND scenario = $3
            AND horizon_year = $4
            ORDER BY severity_score DESC;
        """
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(sql, lon, lat, scenario, horizon_year)

        exposures = []
        data_sources = set()
        for row in rows:
            exposures.append({
                "hazard_type": row["hazard_type"],
                "severity_score": row["severity_score"],
                "raw_score": round(row["severity_score"] * 100, 1),
                "data_source": row["data_source"],
            })
            if row["data_source"]:
                data_sources.add(row["data_source"])

        if not exposures:
            # No GeoTIFF coverage — fall back to CRI engine
            return await self._score_cri_engine(lon, lat, scenario, horizon_year, sector)

        is_material = any(e["severity_score"] > 0.5 for e in exposures)
        return {
            "exposures": exposures,
            "is_material_risk": is_material,
            "data_sources": list(data_sources),
        }

    async def _score_rasterio(
        self, lon: float, lat: float, scenario: str, horizon_year: int, sector: str
    ) -> dict[str, Any]:
        """
        Direct GeoTIFF sampling via rasterio when DB is offline.
        Files expected at: {layers_path}/{scenario}/{hazard_type}/{horizon_year}.tif
        """
        try:
            import rasterio
            from rasterio.crs import CRS
        except ImportError:
            logger.warning("rasterio not installed — using CRI engine fallback")
            return await self._score_cri_engine(lon, lat, scenario, horizon_year, sector)

        scenario_slug = scenario.replace("-", "").lower()  # e.g. ssp245
        exposures = []
        data_sources = []

        hazard_dirs = list(self._layers_path.glob(f"{scenario_slug}/*/"))
        for hz_dir in hazard_dirs:
            tif_path = hz_dir / f"{horizon_year}.tif"
            if not tif_path.exists():
                continue
            try:
                with rasterio.open(tif_path) as src:
                    py, px = src.index(lon, lat)
                    window = rasterio.windows.Window(px, py, 1, 1)
                    data = src.read(1, window=window)
                    raw_val = float(data[0, 0])
                    if raw_val == src.nodata or raw_val < 0:
                        continue
                    severity = min(1.0, raw_val / 100.0)
                    exposures.append({
                        "hazard_type": hz_dir.name,
                        "severity_score": round(severity, 4),
                        "raw_score": round(raw_val, 1),
                        "data_source": f"GeoTIFF:{tif_path.name}",
                    })
                    data_sources.append(str(tif_path))
            except Exception as exc:
                logger.warning("rasterio.read.failed path=%s err=%s", tif_path, exc)

        if not exposures:
            return await self._score_cri_engine(lon, lat, scenario, horizon_year, sector)

        is_material = any(e["severity_score"] > 0.5 for e in exposures)
        return {"exposures": exposures, "is_material_risk": is_material, "data_sources": data_sources}

    async def _score_cri_engine(
        self, lon: float, lat: float, scenario: str, horizon_year: int, sector: str
    ) -> dict[str, Any]:
        """
        CRI Python engine fallback — uses embedded IPCC AR6 hazard logic
        when no GeoTIFF tile covers the requested coordinates.

        Maps (lat, lon) → nearest IPCC AR6 region code, then runs the
        same hazard functions as the JS platform.
        """
        try:
            from .cri_bridge import score_point_cri
            return await asyncio.get_event_loop().run_in_executor(
                None, score_point_cri, lon, lat, scenario, horizon_year, sector
            )
        except Exception as exc:
            logger.error("cri_engine.fallback.failed err=%s", exc)
            # Last resort — return zero-score result (never silently skip)
            return {
                "exposures": [],
                "is_material_risk": False,
                "data_sources": ["CRI-fallback-failed"],
            }

    async def score_batch(
        self,
        client_id: str,
        assets: list,
        scenarios: list[str],
        horizon_years: list[int],
    ) -> None:
        """
        Batch scoring for a full portfolio.
        Publishes HazardIntersectedEvent per (asset × scenario × year).
        """
        from ..shared.kafka_client import ClimRiskProducer
        from ..shared.schemas import (
            HazardExposure, HazardIntersectedEvent, HazardType, TOPICS
        )
        import time

        concurrency = int(os.getenv("BATCH_CONCURRENCY", "4"))
        sem = asyncio.Semaphore(concurrency)

        async def _process_one(asset, scenario, year):
            async with sem:
                t0 = time.monotonic()
                result = await self.score_point(
                    lon=asset.lon, lat=asset.lat,
                    scenario=scenario, horizon_year=year,
                    sector=getattr(asset, "sector", "Steel & Metals"),
                )
                ms = int((time.monotonic() - t0) * 1000)

                exposures = []
                for e in result["exposures"]:
                    try:
                        hz = HazardExposure(
                            hazard_type=HazardType(e["hazard_type"]),
                            severity_score=e["severity_score"],
                            raw_score=e.get("raw_score"),
                            data_source=e.get("data_source"),
                        )
                        exposures.append(hz)
                    except Exception:
                        pass

                event = HazardIntersectedEvent(
                    asset_id=asset.asset_id,
                    client_id=client_id,
                    scenario=scenario,
                    horizon_year=year,
                    exposures=exposures,
                    computation_ms=ms,
                )
                async with ClimRiskProducer() as prod:
                    await prod.send(
                        TOPICS["hazard_intersected"],
                        event,
                        key=asset.asset_id,
                    )

        tasks = [
            _process_one(a, sc, yr)
            for a in assets
            for sc in scenarios
            for yr in horizon_years
        ]
        await asyncio.gather(*tasks, return_exceptions=True)

    async def list_layers(self) -> list[dict]:
        """List available hazard layers in PostGIS (for admin / debugging)."""
        if not self._pool:
            return []
        async with self._pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT hazard_type, scenario, horizon_year, COUNT(*) as polygons
                FROM climrisk.hazard_layers
                GROUP BY hazard_type, scenario, horizon_year
                ORDER BY scenario, horizon_year, hazard_type;
            """)
        return [dict(r) for r in rows]
