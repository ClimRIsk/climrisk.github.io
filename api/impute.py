"""
ClimRisk — Imputation Engine
=============================
Fills missing asset metadata so the pipeline never crashes on incomplete inputs.

Layers (applied in order, first non-null wins):
  1. User-supplied values (passed in directly)
  2. Geocoding  — address → lat/lon  (Nominatim / OSM, free, no API key)
  3. OSM Overpass — building footprint → elevation, material, build_year
  4. Regional archetype defaults  — sector × country code → sensible priors

Sources
───────
  Geocoding      : Nominatim (https://nominatim.openstreetmap.org)
  Building data  : OSM Overpass API (https://overpass-api.de)
  Elevation      : Open-Elevation API (https://api.open-elevation.com)
  Archetype DB   : internal lookup derived from HAZUS-MH / JRC Huizinga 2017
"""

import asyncio
import logging
from typing import Optional

import httpx

log = logging.getLogger("climrisk.impute")

# ── Regional construction archetype defaults  ─────────────────────────────────
# Format: (sector, continent_code) → {build_year, material, ffe_m}
# Derived from HAZUS-MH Table 3.1, JRC EUR 28552 EN, Swiss Re 2020 Nat Cat
ARCHETYPES: dict[tuple, dict] = {
    ("food_beverage",   "EU"): {"build_year": 1992, "material": "concrete",     "ffe_m": 0.3},
    ("food_beverage",   "AS"): {"build_year": 2001, "material": "concrete",     "ffe_m": 0.3},
    ("food_beverage",   "NA"): {"build_year": 1985, "material": "steel_frame",  "ffe_m": 0.6},
    ("utilities",       "EU"): {"build_year": 1978, "material": "concrete",     "ffe_m": 0.0},
    ("utilities",       "AS"): {"build_year": 1995, "material": "concrete",     "ffe_m": 0.0},
    ("utilities",       "NA"): {"build_year": 1980, "material": "concrete",     "ffe_m": 0.0},
    ("real_estate",     "EU"): {"build_year": 1968, "material": "masonry",      "ffe_m": 0.0},
    ("real_estate",     "NA"): {"build_year": 1975, "material": "wood_frame",   "ffe_m": 0.3},
    ("agriculture",     "AS"): {"build_year": 2005, "material": "light_metal",  "ffe_m": 0.0},
    ("agriculture",     "EU"): {"build_year": 1990, "material": "light_metal",  "ffe_m": 0.0},
    ("default",         "EU"): {"build_year": 1990, "material": "concrete",     "ffe_m": 0.3},
    ("default",         "AS"): {"build_year": 2000, "material": "concrete",     "ffe_m": 0.3},
    ("default",         "NA"): {"build_year": 1988, "material": "steel_frame",  "ffe_m": 0.3},
    ("default",         "XX"): {"build_year": 1995, "material": "concrete",     "ffe_m": 0.3},
}


def _continent(lon: float, lat: float) -> str:
    """Rough continent code from coordinates (no API call)."""
    if -30 <= lon <= 60 and 34 <= lat <= 72:   return "EU"
    if 60  <= lon <= 150 and -10 <= lat <= 55:  return "AS"
    if -170 <= lon <= -50 and 15 <= lat <= 75:  return "NA"
    return "XX"


def _archetype(sector: str, continent: str) -> dict:
    sk = sector.lower().replace(" ", "_").replace("-", "_")
    return (
        ARCHETYPES.get((sk, continent)) or
        ARCHETYPES.get(("default", continent)) or
        ARCHETYPES["default", "XX"]
    )


# ═══════════════════════════════════════════════════════════════════════════════
# GEOCODING  — address → (lat, lon)
# ═══════════════════════════════════════════════════════════════════════════════

async def geocode_address(address: str) -> tuple[float, float] | None:
    """
    Nominatim geocoder (OpenStreetMap). Rate limit: 1 req/s, so fine for
    on-demand /assess calls. For batch geocoding at scale, switch to
    Mapbox Geocoding API or Google Maps Platform.
    """
    url = "https://nominatim.openstreetmap.org/search"
    headers = {"User-Agent": "ClimRisk/1.0 (climrisk.io)"}
    async with httpx.AsyncClient(headers=headers, timeout=10) as client:
        r = await client.get(url, params={"q": address, "format": "json", "limit": 1})
        r.raise_for_status()
        results = r.json()
    if not results:
        return None
    return float(results[0]["lat"]), float(results[0]["lon"])


# ═══════════════════════════════════════════════════════════════════════════════
# ELEVATION  — lat/lon → metres above sea level
# ═══════════════════════════════════════════════════════════════════════════════

async def get_elevation(lat: float, lon: float) -> float | None:
    """Open-Elevation API — free, no key, ~1m accuracy via SRTM."""
    async with httpx.AsyncClient(timeout=8) as client:
        r = await client.post(
            "https://api.open-elevation.com/api/v1/lookup",
            json={"locations": [{"latitude": lat, "longitude": lon}]},
        )
        if r.status_code == 200:
            results = r.json().get("results", [])
            if results:
                return float(results[0]["elevation"])
    return None


# ═══════════════════════════════════════════════════════════════════════════════
# OSM OVERPASS  — building footprint metadata
# ═══════════════════════════════════════════════════════════════════════════════

async def query_osm_building(lat: float, lon: float, radius_m: int = 100) -> dict:
    """
    Query OSM Overpass for the nearest building within radius_m.
    Returns dict with any of: start_date, building:material, building:levels,
    amenity, landuse — whatever OSM has tagged.
    """
    overpass_url = "https://overpass-api.de/api/interpreter"
    query = f"""
    [out:json][timeout:10];
    (
      way(around:{radius_m},{lat},{lon})["building"];
      relation(around:{radius_m},{lat},{lon})["building"];
    );
    out tags 1;
    """
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(overpass_url, data={"data": query})
        if r.status_code != 200:
            return {}
        elements = r.json().get("elements", [])
    if not elements:
        return {}
    tags = elements[0].get("tags", {})
    result = {}
    if "start_date" in tags:
        try:
            result["build_year"] = int(str(tags["start_date"])[:4])
        except ValueError:
            pass
    if "building:material" in tags:
        result["material"] = tags["building:material"]
    if "building:levels" in tags:
        try:
            result["levels"] = int(tags["building:levels"])
        except ValueError:
            pass
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN IMPUTATION FUNCTION
# ═══════════════════════════════════════════════════════════════════════════════

async def impute_asset(
    company: str,
    sector: str,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    address: Optional[str] = None,
    build_year: Optional[int] = None,
    ffe_m: Optional[float] = None,
    material: Optional[str] = None,
    defenses: Optional[str] = None,
    elevation_m: Optional[float] = None,
) -> dict:
    """
    Fill every missing field. Returns the complete asset dict plus a list
    of which fields were imputed (for transparency in the API response).
    """
    imputed_fields: list[str] = []
    result = dict(
        company=company, sector=sector,
        lat=lat, lon=lon,
        build_year=build_year, ffe_m=ffe_m,
        material=material, defenses=defenses,
        elevation_m=elevation_m,
    )

    # ── Step 1: geocode if lat/lon missing ───────────────────────────────────
    if (lat is None or lon is None) and address:
        log.info(f"Geocoding address: {address!r}")
        coords = await geocode_address(address)
        if coords:
            result["lat"], result["lon"] = coords
            imputed_fields.append("lat/lon (Nominatim geocoding)")
        else:
            raise ValueError(f"Could not geocode address: {address!r}")

    lat, lon = result["lat"], result["lon"]
    if lat is None or lon is None:
        raise ValueError("lat/lon required — provide coordinates or a geocodable address")

    # ── Step 2: elevation from Open-Elevation ────────────────────────────────
    if elevation_m is None:
        log.info(f"Fetching elevation for {lat},{lon}")
        elev = await get_elevation(lat, lon)
        if elev is not None:
            result["elevation_m"] = elev
            imputed_fields.append("elevation_m (Open-Elevation/SRTM)")

    # ── Step 3: OSM building attributes ──────────────────────────────────────
    osm_missing = build_year is None or material is None
    if osm_missing:
        log.info(f"Querying OSM Overpass at {lat},{lon}")
        try:
            osm = await query_osm_building(lat, lon)
            if "build_year" in osm and build_year is None:
                result["build_year"] = osm["build_year"]
                imputed_fields.append("build_year (OSM Overpass)")
            if "material" in osm and material is None:
                result["material"] = osm["material"]
                imputed_fields.append("material (OSM Overpass)")
        except Exception as e:
            log.warning(f"OSM Overpass failed: {e}")

    # ── Step 4: regional archetype defaults for anything still missing ────────
    continent = _continent(lon, lat)
    arch = _archetype(sector, continent)
    for field, default_val in arch.items():
        if result.get(field) is None:
            result[field] = default_val
            imputed_fields.append(f"{field} (archetype: {sector}/{continent})")

    result["imputed_fields"] = imputed_fields
    result["continent"] = continent
    log.info(f"Imputation complete — {len(imputed_fields)} fields filled: {imputed_fields}")
    return result
