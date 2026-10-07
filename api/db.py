"""
ClimRisk — PostGIS schema + async query helpers
================================================
Database: PostgreSQL 15 + PostGIS 3.4
ORM: raw asyncpg (no SQLAlchemy overhead — keeps P99 < 20ms)

Schema overview
───────────────
  assets          — asset master (company, sector, lat/lon geometry, metadata)
  risk_runs       — one row per pipeline execution per asset
  hazard_scores   — per-hazard probabilities + damage fractions for each run
  forecast_alerts — ECMWF extreme-event alerts for next 14 days

ENV vars required:
  DATABASE_URL    e.g. postgresql://climrisk:password@localhost:5432/climrisk
"""

import os
import asyncpg

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://climrisk:climrisk@localhost:5432/climrisk",
)

# ── Pool (initialised once at app startup) ────────────────────────────────────
_pool: asyncpg.Pool | None = None

async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    return _pool

async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


# ═══════════════════════════════════════════════════════════════════════════════
# SCHEMA  (run once via: python -c "import asyncio; from api.db import init_schema; asyncio.run(init_schema())")
# ═══════════════════════════════════════════════════════════════════════════════

DDL = """
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS assets (
    id              SERIAL PRIMARY KEY,
    asset_id        TEXT UNIQUE NOT NULL,
    company         TEXT NOT NULL,
    sector          TEXT NOT NULL,
    revenue_usd     DOUBLE PRECISION,
    ev_usd          DOUBLE PRECISION,
    wacc            DOUBLE PRECISION DEFAULT 0.08,
    geom            GEOMETRY(Point, 4326),
    elevation_m     DOUBLE PRECISION,
    build_year      INT,
    material        TEXT,
    ffe_m           DOUBLE PRECISION,   -- freeboard-to-floor elevation
    defenses        TEXT,
    backup_power    BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS assets_geom_idx ON assets USING GIST(geom);
CREATE INDEX IF NOT EXISTS assets_sector_idx ON assets(sector);

CREATE TABLE IF NOT EXISTS risk_runs (
    id              SERIAL PRIMARY KEY,
    asset_id        TEXT NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
    run_ts          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scenario        TEXT NOT NULL,              -- nze | dt | cp
    eal_usd         DOUBLE PRECISION,
    npv_impact_usd  DOUBLE PRECISION,
    npv_pct_ev      DOUBLE PRECISION,
    vuln_mod        DOUBLE PRECISION DEFAULT 1.0,
    warming_per_decade DOUBLE PRECISION,
    heat35_30yr     INT,
    rain50_30yr     INT,
    drought_pct     DOUBLE PRECISION
);
CREATE INDEX IF NOT EXISTS risk_runs_asset_ts ON risk_runs(asset_id, run_ts DESC);

CREATE TABLE IF NOT EXISTS hazard_scores (
    id          SERIAL PRIMARY KEY,
    run_id      INT NOT NULL REFERENCES risk_runs(id) ON DELETE CASCADE,
    hazard      TEXT NOT NULL,   -- flood | heat_stress | water_stress | wildfire | wind
    prob_pct    DOUBLE PRECISION,
    damage_frac DOUBLE PRECISION,
    eal_usd     DOUBLE PRECISION
);
CREATE INDEX IF NOT EXISTS hazard_run_idx ON hazard_scores(run_id);

CREATE TABLE IF NOT EXISTS forecast_alerts (
    id          SERIAL PRIMARY KEY,
    asset_id    TEXT NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
    fetched_at  TIMESTAMPTZ DEFAULT NOW(),
    event_date  DATE,
    alert_type  TEXT,     -- Heavy Rain | Extreme Heat | High Wind
    value_raw   DOUBLE PRECISION,
    unit        TEXT,
    severity    TEXT      -- MED | HIGH
);
CREATE INDEX IF NOT EXISTS alerts_asset_date ON forecast_alerts(asset_id, event_date DESC);
"""

async def init_schema():
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(DDL)
    print("Schema initialised ✓")


# ═══════════════════════════════════════════════════════════════════════════════
# WRITE HELPERS  (called from pipeline.py after each run)
# ═══════════════════════════════════════════════════════════════════════════════

async def upsert_asset(pool, asset: dict) -> None:
    """Insert or update an asset record."""
    await pool.execute("""
        INSERT INTO assets (asset_id, company, sector, revenue_usd, ev_usd, wacc,
                            geom, elevation_m, build_year, material, ffe_m, defenses, backup_power)
        VALUES ($1,$2,$3,$4,$5,$6,
                ST_SetSRID(ST_MakePoint($7,$8),4326),
                $9,$10,$11,$12,$13,$14)
        ON CONFLICT (asset_id) DO UPDATE SET
            company=EXCLUDED.company, sector=EXCLUDED.sector,
            revenue_usd=EXCLUDED.revenue_usd, ev_usd=EXCLUDED.ev_usd,
            geom=EXCLUDED.geom, elevation_m=EXCLUDED.elevation_m,
            updated_at=NOW()
    """,
        asset["asset_id"], asset["company"], asset["sector"],
        asset.get("revenue_usd"), asset.get("ev_usd"), asset.get("wacc", 0.08),
        asset["lon"], asset["lat"],
        asset.get("elevation_m"), asset.get("build_year"),
        asset.get("material"), asset.get("ffe_m"), asset.get("defenses"),
        asset.get("backup_power", False),
    )


async def insert_run(pool, asset_id: str, scenario: str,
                     financials: dict, baseline: dict) -> int:
    """Write a risk_run row and return its id."""
    row = await pool.fetchrow("""
        INSERT INTO risk_runs
            (asset_id, scenario, eal_usd, npv_impact_usd, npv_pct_ev,
             warming_per_decade, heat35_30yr, rain50_30yr, drought_pct)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING id
    """,
        asset_id, scenario,
        financials.get("eal_usd"), financials.get("npv_impact_usd"), financials.get("npv_pct_ev"),
        baseline.get("warming_per_decade"), baseline.get("heat35"),
        baseline.get("rain50"), baseline.get("drought_pct"),
    )
    return row["id"]


async def insert_hazard_scores(pool, run_id: int, hazard_breakdown: dict) -> None:
    await pool.executemany("""
        INSERT INTO hazard_scores (run_id, hazard, prob_pct, damage_frac, eal_usd)
        VALUES ($1,$2,$3,$4,$5)
    """, [
        (run_id, hk, v.get("prob"), v.get("D"), v.get("eal_usd"))
        for hk, v in hazard_breakdown.items()
    ])


async def insert_alerts(pool, asset_id: str, alerts: list[dict]) -> None:
    if not alerts:
        return
    # Clear stale alerts for this asset
    await pool.execute("DELETE FROM forecast_alerts WHERE asset_id=$1", asset_id)
    await pool.executemany("""
        INSERT INTO forecast_alerts (asset_id, event_date, alert_type, value_raw, unit, severity)
        VALUES ($1,$2,$3,$4,$5,$6)
    """, [
        (asset_id, a.get("date"), a.get("type"),
         a.get("value_mm") or a.get("value_degC") or a.get("value_ms"),
         "mm" if "value_mm" in a else "°C" if "value_degC" in a else "m/s",
         a.get("severity"))
        for a in alerts
    ])


# ═══════════════════════════════════════════════════════════════════════════════
# READ HELPERS  (called from api/main.py)
# ═══════════════════════════════════════════════════════════════════════════════

async def get_asset_risk(pool, asset_id: str) -> dict | None:
    row = await pool.fetchrow("""
        SELECT a.asset_id, a.company, a.sector,
               ST_Y(a.geom) AS lat, ST_X(a.geom) AS lon,
               a.elevation_m, a.revenue_usd, a.ev_usd,
               r.scenario, r.eal_usd, r.npv_impact_usd, r.npv_pct_ev,
               r.warming_per_decade, r.heat35_30yr, r.rain50_30yr, r.drought_pct,
               r.run_ts
        FROM assets a
        JOIN risk_runs r ON r.asset_id = a.asset_id
        WHERE a.asset_id = $1
        ORDER BY r.run_ts DESC LIMIT 1
    """, asset_id)
    if not row:
        return None
    d = dict(row)
    # Attach hazard breakdown
    hazards = await pool.fetch(
        "SELECT hazard, prob_pct, damage_frac, eal_usd FROM hazard_scores "
        "WHERE run_id = (SELECT id FROM risk_runs WHERE asset_id=$1 ORDER BY run_ts DESC LIMIT 1)",
        asset_id)
    d["hazard_breakdown"] = {h["hazard"]: dict(h) for h in hazards}
    # Attach live alerts
    alerts = await pool.fetch(
        "SELECT event_date, alert_type, value_raw, unit, severity "
        "FROM forecast_alerts WHERE asset_id=$1 ORDER BY event_date", asset_id)
    d["forecast_alerts"] = [dict(a) for a in alerts]
    return d


async def list_assets(pool, sector: str | None = None,
                      bbox: tuple | None = None, limit: int = 200) -> list[dict]:
    """Return latest risk summary for all assets, with optional spatial filter."""
    where = "WHERE 1=1"
    params: list = []
    if sector:
        params.append(sector)
        where += f" AND a.sector=${ len(params) }"
    if bbox:  # (min_lon, min_lat, max_lon, max_lat)
        params.extend(bbox)
        n = len(params)
        where += (f" AND ST_Within(a.geom,"
                  f" ST_MakeEnvelope(${n-3},${n-2},${n-1},${n},4326))")
    params.append(limit)
    rows = await pool.fetch(f"""
        SELECT DISTINCT ON (a.asset_id)
               a.asset_id, a.company, a.sector,
               ST_Y(a.geom) AS lat, ST_X(a.geom) AS lon,
               r.scenario, r.eal_usd, r.npv_impact_usd, r.npv_pct_ev, r.run_ts
        FROM assets a
        LEFT JOIN risk_runs r ON r.asset_id=a.asset_id
        {where}
        ORDER BY a.asset_id, r.run_ts DESC
        LIMIT ${len(params)}
    """, *params)
    return [dict(r) for r in rows]
