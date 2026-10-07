-- ============================================================
-- ClimRisk PostGIS Schema Initialisation
-- Runs once on first container start (docker-compose init mount)
-- ============================================================

-- PostGIS extension (requires postgis:16-3.4 image)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Schema namespace ─────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS climrisk;

-- ── Client asset registry ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS climrisk.client_assets (
    asset_id        TEXT PRIMARY KEY,
    client_id       TEXT NOT NULL,
    asset_name      TEXT,
    asset_type      TEXT,
    sector          TEXT,
    commodity       TEXT,
    book_value_usd  DOUBLE PRECISION,
    geom            GEOMETRY(POINT, 4326),
    region_code     TEXT,              -- IPCC AR6 region code e.g. 'EEU'
    elevation_m     DOUBLE PRECISION,
    is_coastal      BOOLEAN DEFAULT FALSE,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_client_id
    ON climrisk.client_assets (client_id);
CREATE INDEX IF NOT EXISTS idx_assets_geom
    ON climrisk.client_assets USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_assets_region
    ON climrisk.client_assets (region_code);

-- ── Hazard layer raster registry ─────────────────────────────────────────────
-- Stores GeoTIFF layer metadata; actual raster data served via rasterio from disk.
-- score_point() in geospatial.py uses ST_Intersects on the polygon geometry.
CREATE TABLE IF NOT EXISTS climrisk.hazard_layers (
    id              SERIAL PRIMARY KEY,
    hazard_type     TEXT NOT NULL,       -- e.g. 'river_flood', 'heat_stress'
    scenario        TEXT NOT NULL,       -- e.g. 'ssp245'
    horizon_year    INTEGER NOT NULL,    -- 2030 | 2040 | 2050
    severity_score  DOUBLE PRECISION,    -- 0-1 normalised score
    geom            GEOMETRY NOT NULL,   -- polygon or point
    source          TEXT,                -- e.g. 'WRI_Aqueduct4', 'CMIP6'
    resolution_km   DOUBLE PRECISION,
    loaded_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hz_geom
    ON climrisk.hazard_layers USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_hz_scenario_year
    ON climrisk.hazard_layers (scenario, horizon_year);
CREATE INDEX IF NOT EXISTS idx_hz_type
    ON climrisk.hazard_layers (hazard_type);

-- ── Scored results cache (optional — avoids re-scoring same point) ────────────
CREATE TABLE IF NOT EXISTS climrisk.hazard_scores_cache (
    cache_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id        TEXT NOT NULL,
    hazard_type     TEXT NOT NULL,
    scenario        TEXT NOT NULL,
    horizon_year    INTEGER NOT NULL,
    severity_score  DOUBLE PRECISION,
    is_material     BOOLEAN,
    scored_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (asset_id, hazard_type, scenario, horizon_year)
);

CREATE INDEX IF NOT EXISTS idx_score_cache_asset
    ON climrisk.hazard_scores_cache (asset_id, scenario, horizon_year);

-- ── Region metadata lookup ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS climrisk.ipcc_regions (
    region_code     TEXT PRIMARY KEY,   -- AR6 code e.g. 'EEU'
    region_name     TEXT,
    centroid_lat    DOUBLE PRECISION,
    centroid_lon    DOUBLE PRECISION,
    geom            GEOMETRY(POLYGON, 4326)
);

-- Seed with AR6 region centroids (used when GPS is unavailable)
INSERT INTO climrisk.ipcc_regions (region_code, region_name, centroid_lat, centroid_lon) VALUES
    ('EEU',  'Eastern Europe',                  57.5,  40.0),
    ('NEU',  'Northern Europe',                 60.0,  15.0),
    ('WCE',  'Western & Central Europe',        50.0,  15.0),
    ('MED',  'Mediterranean',                   38.0,  17.5),
    ('NAF',  'North Africa',                    26.5,  20.0),
    ('WAF',  'West Africa',                      5.0,   2.5),
    ('CAF',  'Central Africa',                   0.0,  22.5),
    ('ESAF', 'Eastern Southern Africa',         -22.5,  37.5),
    ('SAF',  'Southern Africa',                -10.0,  17.5),
    ('ARP',  'Arabian Peninsula',               27.5,  48.0),
    ('WSB',  'West Siberia',                    65.0,  75.0),
    ('ESB',  'East Siberia',                    65.0, 115.0),
    ('RFE',  'Russian Far East',                63.0, 135.0),
    ('WCA',  'Western Central Asia',            42.5,  60.0),
    ('ECA',  'Eastern Central Asia',            45.0,  87.5),
    ('TIB',  'Tibetan Plateau',                 34.0,  90.0),
    ('EAS',  'East Asia',                       35.5, 125.0),
    ('SAS',  'South Asia',                      20.0,  80.0),
    ('SEA',  'Southeast Asia',                   9.0, 122.5),
    ('NAU',  'Northern Australia',             -12.5, 132.5),
    ('CAU',  'Central Australia',              -27.5, 130.0),
    ('EAU',  'Eastern Australia',              -30.0, 150.0),
    ('SAU',  'Southern Australia',             -37.5, 127.5),
    ('NZ',   'New Zealand',                    -40.5, 171.5),
    ('NCA',  'North & Central America',         55.0,-115.0),
    ('CAM',  'Central America',                 20.0, -90.0),
    ('SAM',  'South America',                  -22.0, -58.0),
    ('NSA',  'Northern South America',           3.5, -66.0),
    ('GIC',  'Greenland/Iceland',               72.5,  -7.5),
    ('ARC',  'Arctic',                          80.0,   0.0),
    ('ANT',  'Antarctica',                     -75.0,   0.0)
ON CONFLICT (region_code) DO NOTHING;

-- ── Helper: update updated_at automatically ───────────────────────────────────
CREATE OR REPLACE FUNCTION climrisk.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assets_updated_at
    BEFORE UPDATE ON climrisk.client_assets
    FOR EACH ROW EXECUTE FUNCTION climrisk.set_updated_at();

-- ── Grant access to application role (adjust role name as needed) ─────────────
-- CREATE ROLE climrisk_app WITH LOGIN PASSWORD 'changeme';
-- GRANT USAGE ON SCHEMA climrisk TO climrisk_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA climrisk TO climrisk_app;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA climrisk TO climrisk_app;
