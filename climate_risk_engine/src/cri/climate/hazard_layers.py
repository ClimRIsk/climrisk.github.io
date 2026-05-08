"""
CRI Multi-Hazard Physical Risk Engine.

Derives 9 physical climate hazard scores for an asset location using:
  1. NASA NEX-GDDP-CMIP6 (heat stress, precipitation)
  2. WRI Aqueduct 4.0 (water stress, riverine/coastal flood, drought)
  3. IPCC AR6 / NOAA (sea level rise, coastal flood)
  4. SRTM/Copernicus DEM proxies (elevation → landslide, SLR exposure)
  5. IBTRACS + IPCC AR6 Ch11 (tropical cyclone)
  6. NASA FIRMS + IPCC AR6 (wildfire weather index)
  7. IPCC AR6 + FAO AQUASTAT (saltwater intrusion)
  8. LULC context from NASA MODIS/HLS proxy (land cover type)

All nine hazards
----------------
  1. HEAT_STRESS        — extreme heat days, WBGT index, livestock/labour impact
  2. FLOOD_RIVERINE     — fluvial flooding (heavy precip + river systems)
  3. FLOOD_COASTAL      — storm surge + sea level rise + cyclone compound events
  4. SEA_LEVEL_RISE     — chronic inundation risk for coastal/low-elevation assets
  5. SALTWATER_INTRUSION— saline water table / aquifer intrusion (coastal + SLR)
  6. LANDSLIDE          — slope instability from extreme precip + terrain
  7. WILDFIRE           — fire weather index, vegetation fuel load
  8. CYCLONE            — tropical cyclone wind + surge (latitude-gated)
  9. DROUGHT            — meteorological + hydrological drought intensity
 10. WATER_STRESS       — chronic freshwater scarcity for operations

Output per hazard per year
--------------------------
  - annual_probability  (0–1): chance of a damaging event in that year
  - severity_index      (0–5): WRI-aligned severity scale
  - production_loss_pct (0–1): expected % of production lost due to this hazard
  - data_source         (str): which dataset drove this estimate

SSP scenarios
-------------
  SSP1-2.6 → NZE 2050
  SSP2-4.5 → Delayed Transition
  SSP3-7.0 → Current Policies
  SSP5-8.5 → Hot House (stress test)
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional, Tuple

from .ssp_scenarios import (
    SSPScenario, SSP_SCENARIOS, NGFS_TO_SSP,
    HEAT_FREQ_PER_DEG_C, PRECIP_CHANGE_PCT_PER_DEG_C,
    WILDFIRE_INDEX_PCT_PER_DEG_C, CYCLONE_INTENSITY_PCT_PER_DEG_C,
    ngfs_to_ssp,
)
from .met_data import (
    get_met_baseline,
    heat_stress_baseline_multiplier,
    precip_variability_index,
    observed_cyclone_prob,
    observed_drought_return,
)

# Lazy imports for live API connectors — only loaded when coordinates provided
def _get_nasa_power():
    try:
        from ..connectors.nasa_power import get_baseline
        return get_baseline
    except Exception:
        return None

def _get_open_meteo():
    try:
        from ..connectors.open_meteo_climate import get_projection, compute_warming_delta
        return get_projection, compute_warming_delta
    except Exception:
        return None, None


# ---------------------------------------------------------------------------
# WRI Aqueduct 4.0 baseline scores by region (0–5 scale)
# Source: WRI Aqueduct 4.0 (2023) — aggregated to CRI region codes
# 0 = Low / 5 = Extremely High
# ---------------------------------------------------------------------------

WRI_BASELINE: dict[str, dict[str, float]] = {
    "AU-WA":  {"water_stress": 2.2, "riverine_flood": 1.6, "coastal_flood": 1.4,
               "drought": 3.3, "heat_baseline": 2.8},
    "AU-QLD": {"water_stress": 1.8, "riverine_flood": 2.4, "coastal_flood": 2.1,
               "drought": 2.1, "heat_baseline": 3.2},
    "AU-SA":  {"water_stress": 3.5, "riverine_flood": 0.8, "coastal_flood": 0.7,
               "drought": 4.1, "heat_baseline": 3.5},
    "AU-NSW": {"water_stress": 2.0, "riverine_flood": 2.1, "coastal_flood": 1.8,
               "drought": 2.5, "heat_baseline": 2.5},
    "AU-VIC": {"water_stress": 1.5, "riverine_flood": 1.4, "coastal_flood": 1.2,
               "drought": 1.8, "heat_baseline": 2.0},
    "AU-NT":  {"water_stress": 1.2, "riverine_flood": 2.8, "coastal_flood": 1.5,
               "drought": 1.5, "heat_baseline": 4.0},
    "US-TX":  {"water_stress": 3.2, "riverine_flood": 2.8, "coastal_flood": 2.5,
               "drought": 2.9, "heat_baseline": 2.6},
    "US-WY":  {"water_stress": 2.8, "riverine_flood": 1.2, "coastal_flood": 0.0,
               "drought": 3.5, "heat_baseline": 2.0},
    "US-OK":  {"water_stress": 3.0, "riverine_flood": 2.6, "coastal_flood": 0.5,
               "drought": 3.2, "heat_baseline": 2.5},
    "CA-AB":  {"water_stress": 1.2, "riverine_flood": 1.0, "coastal_flood": 0.0,
               "drought": 1.5, "heat_baseline": 1.5},
    "CA-QC":  {"water_stress": 0.5, "riverine_flood": 1.2, "coastal_flood": 0.8,
               "drought": 0.8, "heat_baseline": 1.0},
    "GB-ENG": {"water_stress": 1.0, "riverine_flood": 2.0, "coastal_flood": 1.8,
               "drought": 1.2, "heat_baseline": 1.2},
    "NL-NH":  {"water_stress": 0.8, "riverine_flood": 2.5, "coastal_flood": 3.5,
               "drought": 0.9, "heat_baseline": 1.0},
    "ZA":     {"water_stress": 3.8, "riverine_flood": 1.4, "coastal_flood": 1.0,
               "drought": 4.2, "heat_baseline": 3.0},
    "CL-02":  {"water_stress": 4.2, "riverine_flood": 0.6, "coastal_flood": 0.8,
               "drought": 4.5, "heat_baseline": 2.2},
    "PE-01":  {"water_stress": 3.5, "riverine_flood": 1.8, "coastal_flood": 1.5,
               "drought": 3.0, "heat_baseline": 2.0},
    "BR-PA":  {"water_stress": 0.8, "riverine_flood": 3.5, "coastal_flood": 1.5,
               "drought": 1.5, "heat_baseline": 3.2},
    "ID-KI":  {"water_stress": 1.5, "riverine_flood": 3.2, "coastal_flood": 3.0,
               "drought": 1.2, "heat_baseline": 3.5},
    "CN-NM":  {"water_stress": 3.8, "riverine_flood": 1.0, "coastal_flood": 0.0,
               "drought": 3.5, "heat_baseline": 2.8},
    "IN-MH":  {"water_stress": 3.5, "riverine_flood": 2.8, "coastal_flood": 2.5,
               "drought": 3.0, "heat_baseline": 3.8},
    "MN-01":  {"water_stress": 3.5, "riverine_flood": 0.8, "coastal_flood": 0.0,
               "drought": 4.0, "heat_baseline": 2.8},
    "global": {"water_stress": 2.0, "riverine_flood": 1.5, "coastal_flood": 1.0,
               "drought": 2.0, "heat_baseline": 2.0},
}


# ---------------------------------------------------------------------------
# Coastal proximity lookup (regions with significant coastal assets)
# True = coastal; drives SLR, saltwater intrusion, cyclone exposure
# ---------------------------------------------------------------------------

COASTAL_REGIONS: set[str] = {
    "AU-WA", "AU-QLD", "AU-NSW", "AU-VIC", "AU-NT",
    "GB-ENG", "NL-NH", "US-TX", "US-OK",
    "IN-MH", "ID-KI", "BR-PA", "PE-01", "ZA",
    "CL-02",    # Atacama coast
}

# Cyclone-susceptible latitude bands (approx 5°–25° N/S)
CYCLONE_REGIONS: set[str] = {
    "AU-QLD", "AU-WA", "AU-NT",
    "IN-MH", "ID-KI", "BR-PA",
    "US-TX",   # Gulf hurricanes
    "ZA",      # Southern Indian Ocean
}

# Landslide-prone regions (steep terrain, high precip)
LANDSLIDE_REGIONS: set[str] = {
    "CL-02",   # Andes
    "PE-01",   # Andes
    "ID-KI",   # Kalimantan — tropical slopes
    "BR-PA",   # Amazon escarpment
    "IN-MH",   # Western Ghats
    "AU-NSW",  # Blue Mountains escarpment
    "MN-01",   # Mongolian highlands
}

# Wildfire-high-risk (IPCC AR6 — fire weather index, elevated significantly by 2050)
WILDFIRE_REGIONS: set[str] = {
    "AU-WA", "AU-SA", "AU-QLD", "AU-NSW", "AU-VIC",
    "US-TX", "US-WY", "US-OK",
    "ZA", "CL-02",
    "CN-NM",   # Inner Mongolia grassland fires
    "MN-01",   # Mongolian steppe fires
}


# ---------------------------------------------------------------------------
# Elevation proxy (metres above sea level — used when no DEM available)
# Source: SRTM/Copernicus region-average elevation
# ---------------------------------------------------------------------------

REGION_ELEVATION_M: dict[str, float] = {
    "AU-WA": 400, "AU-QLD": 200, "AU-SA": 180, "AU-NSW": 350,
    "AU-VIC": 240, "AU-NT": 200,
    "US-TX": 150, "US-WY": 2000, "US-OK": 380,
    "CA-AB": 700, "CA-QC": 300,
    "GB-ENG": 90, "NL-NH": 2,    # Below sea level in parts!
    "ZA": 1200, "CL-02": 2500,
    "PE-01": 3000, "BR-PA": 50,
    "ID-KI": 80, "CN-NM": 1000, "IN-MH": 600,
    "MN-01": 1500,
    "global": 300,
}


# ---------------------------------------------------------------------------
# LULC land cover context (NASA MODIS/HLS proxy by region)
# Drives wildfire fuel load, flood runoff, heat island effect
# ---------------------------------------------------------------------------

class LULCType:
    FOREST        = "forest"
    GRASSLAND     = "grassland"
    SHRUBLAND     = "shrubland"
    CROPLAND      = "cropland"
    WETLAND       = "wetland"
    URBAN         = "urban"
    BARE_ROCK     = "bare_rock"
    WATER         = "water"
    SNOW_ICE      = "snow_ice"


REGION_LULC: dict[str, str] = {
    "AU-WA": LULCType.SHRUBLAND,
    "AU-QLD": LULCType.GRASSLAND,
    "AU-SA": LULCType.BARE_ROCK,
    "AU-NSW": LULCType.FOREST,
    "AU-VIC": LULCType.FOREST,
    "AU-NT": LULCType.GRASSLAND,
    "US-TX": LULCType.GRASSLAND,
    "US-WY": LULCType.FOREST,
    "US-OK": LULCType.CROPLAND,
    "CA-AB": LULCType.FOREST,
    "CA-QC": LULCType.FOREST,
    "GB-ENG": LULCType.CROPLAND,
    "NL-NH": LULCType.WETLAND,
    "ZA": LULCType.SHRUBLAND,
    "CL-02": LULCType.BARE_ROCK,
    "PE-01": LULCType.FOREST,
    "BR-PA": LULCType.FOREST,
    "ID-KI": LULCType.FOREST,
    "CN-NM": LULCType.GRASSLAND,
    "IN-MH": LULCType.CROPLAND,
    "MN-01": LULCType.GRASSLAND,
    "global": LULCType.GRASSLAND,
}

# Wildfire fuel load multiplier by LULC
WILDFIRE_FUEL_BY_LULC: dict[str, float] = {
    LULCType.FOREST:    1.8,
    LULCType.GRASSLAND: 1.2,
    LULCType.SHRUBLAND: 1.5,
    LULCType.CROPLAND:  0.9,
    LULCType.WETLAND:   0.4,
    LULCType.URBAN:     0.6,
    LULCType.BARE_ROCK: 0.1,
    LULCType.WATER:     0.0,
    LULCType.SNOW_ICE:  0.0,
}

# Surface runoff multiplier (affects flood risk)
RUNOFF_BY_LULC: dict[str, float] = {
    LULCType.BARE_ROCK: 2.0,
    LULCType.URBAN:     1.8,
    LULCType.CROPLAND:  1.3,
    LULCType.GRASSLAND: 1.0,
    LULCType.SHRUBLAND: 0.9,
    LULCType.FOREST:    0.7,
    LULCType.WETLAND:   0.5,
    LULCType.WATER:     0.0,
    LULCType.SNOW_ICE:  1.5,
}


# ---------------------------------------------------------------------------
# Downscaling: spatial context resolution from lat/lon
# ---------------------------------------------------------------------------

# Reference coastal points: (lat, lon) for major coastlines worldwide.
# Used to compute distance-to-coast for continuous coastal exposure scoring.
# Source: Natural Earth coastline centroids (simplified, ~200km spacing).
_COASTAL_REFERENCE_POINTS: list[Tuple[float, float]] = [
    # North Sea / Atlantic Europe
    (51.9, 4.5), (53.5, 8.0), (55.7, 12.5), (58.0, 7.5),
    # British Isles
    (51.5, 1.0), (53.0, -4.5), (57.5, -2.5),
    # Bay of Biscay / Iberia
    (43.5, -2.0), (38.5, -9.0), (36.5, -6.0),
    # Mediterranean
    (43.3, 5.3), (41.0, 14.0), (37.9, 23.7), (35.5, 33.0),
    # West Africa
    (5.3, -4.0), (14.7, -17.5), (-8.8, 13.2),
    # Southern Africa
    (-33.9, 18.4), (-29.9, 31.0),
    # East Africa / Indian Ocean
    (-4.0, 39.7), (11.6, 43.1),
    # Arabian Peninsula / Persian Gulf
    (24.5, 56.4), (22.6, 59.5), (21.5, 39.2),
    # South Asia
    (8.5, 77.0), (13.1, 80.3), (18.9, 72.8), (22.6, 88.4), (23.7, 90.4),
    # Southeast Asia
    (1.3, 103.8), (3.1, 101.7), (-6.2, 106.8), (13.7, 100.5),
    # East Asia
    (22.5, 114.2), (30.7, 121.5), (35.7, 139.7), (34.7, 135.2),
    # Australia
    (-31.9, 115.9), (-27.5, 153.0), (-37.8, 144.9), (-33.9, 151.2),
    (-12.5, 130.8), (-34.9, 138.6),
    # North America East
    (25.8, -80.2), (29.9, -90.1), (37.8, -75.5), (42.4, -70.9),
    (44.6, -63.6), (46.8, -71.2),
    # North America West
    (34.0, -118.5), (37.8, -122.4), (47.6, -122.3), (58.3, -134.4),
    # Gulf of Mexico / Caribbean
    (23.1, -82.3), (17.9, -76.8), (10.5, -61.4), (19.4, -99.1),
    # South America
    (-23.0, -43.2), (-34.6, -58.4), (-33.0, -71.6), (-8.1, -34.9),
    (-3.7, -38.5), (10.5, -66.9),
    # Arctic / Nordic coasts
    (70.0, 25.0), (69.0, 18.0), (64.1, -21.9), (59.9, 10.7),
]


def _fetch_live_climate(
    lat: float,
    lon: float,
    year: int,
    ssp_id: str,
) -> dict:
    """
    Fetch real climate data from NASA POWER (baseline) and Open-Meteo (projection).

    Delta-downscaling approach — three data points, two APIs:
      1. NASA POWER MERRA-2 (2001-2020): observed climatological baseline at coordinates
         (T2M_MAX, precip) — what the asset experiences today
      2. Open-Meteo CMIP6 historical (year 2010): same model, historical run
         — establishes the model's own baseline (removes GCM systematic bias)
      3. Open-Meteo CMIP6 future (target year): same model, SSP5-8.5 run
         — future projection

    Warming delta = CMIP6_future_T2M_MAX − CMIP6_historical_T2M_MAX (model-consistent)
    This delta is then added to the NASA POWER observed baseline for the asset-level
    projected temperature. SSP scaling applied via IPCC AR6 WG1 Table 4.5.

    Returns a dict with:
      - warming_c: CMIP6 model-consistent warming delta, SSP-scaled (°C)
      - precip_delta_pct: CMIP6 model-consistent precipitation change, SSP-scaled (%)
      - baseline_t2m_max_c: observed T2M_MAX from NASA POWER (2001-2020)
      - baseline_precip_mm_day: observed precipitation from NASA POWER
      - data_source: audit trail description
      - live: True if full pipeline succeeded, False if fallback used

    Falls back gracefully — calling code uses lookup-table path on any failure.
    """
    result = {
        "warming_c": None,
        "precip_delta_pct": None,
        "baseline_t2m_max_c": None,
        "baseline_precip_mm_day": None,
        "data_source": "fallback (API unavailable)",
        "live": False,
    }

    # ── Step 1: NASA POWER observed baseline ─────────────────────────────────
    get_baseline = _get_nasa_power()
    if get_baseline is None:
        return result
    baseline = get_baseline(lat, lon)
    if baseline is None:
        return result

    result["baseline_t2m_max_c"] = baseline.t2m_max_c
    result["baseline_precip_mm_day"] = baseline.precip_mm_day

    # ── Step 2 + 3: Open-Meteo CMIP6 historical + future ─────────────────────
    get_projection, compute_warming_delta_fn = _get_open_meteo()
    if get_projection is None:
        result["data_source"] = "NASA POWER baseline only (Open-Meteo unavailable)"
        return result

    # Historical reference year: centre of 2001-2020 NASA POWER baseline period.
    # Using year 2010 gives the best-available CMIP6 historical run overlap.
    _CMIP6_HIST_YEAR = 2010
    cmip6_hist = get_projection(lat, lon, _CMIP6_HIST_YEAR)
    if cmip6_hist is None:
        result["data_source"] = f"NASA POWER baseline only (CMIP6 historical run unavailable for {_CMIP6_HIST_YEAR})"
        return result

    cmip6_future = get_projection(lat, lon, year)
    if cmip6_future is None:
        result["data_source"] = f"NASA POWER baseline only (CMIP6 future projection unavailable for {year})"
        return result

    # ── Step 4: Model-consistent delta + SSP scaling ──────────────────────────
    delta = compute_warming_delta_fn(
        cmip6_hist,
        cmip6_future,
        ssp_id,
        year,
        observed_precip_mm_day=baseline.precip_mm_day,
    )
    result["warming_c"] = delta["warming_c"]
    result["precip_delta_pct"] = delta.get("precip_delta_pct")
    result["data_source"] = delta["source"]
    result["live"] = True

    return result


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two lat/lon points in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def _subgrid_elevation_correction(asset_elev_m: float, region_mean_elev_m: float) -> dict:
    """
    Sub-grid correction factors derived from asset elevation relative to the
    regional (25km grid cell) mean elevation.

    The WRI Aqueduct 4.0 and NASA NEX-GDDP-CMIP6 baselines represent 0.25°
    (~25km) grid cell averages. Within a cell, hazard exposure varies sharply
    with terrain. This function computes multiplicative correction factors that
    bring the grid-cell average down (or up) to the specific asset elevation.

    Corrections applied:

    FLOOD (riverine):
      The 25km grid value integrates floodplain and hillslope. Assets above the
      regional mean sit on higher terrain and have lower flood exposure.
      Source: LISFLOOD sub-grid DEM analysis; WRI Aqueduct 4.0 validation report.
        elev_delta < -50m  (below regional mean — floodplain): 1.25×
        elev_delta 0–100m : 1.00× (at or near regional mean)
        elev_delta 100–300m: linear decay 1.00 → 0.65
        elev_delta 300–600m: linear decay 0.65 → 0.35
        elev_delta > 600m  : 0.20× (highland — negligible riverine flood)

    HEAT (surface temperature):
      Environmental lapse rate: ~0.65°C per 100m elevation gain reduces the
      effective surface temperature and heat stress experienced at the asset.
      Source: IPCC AR6 WG1 Ch2; WMO standard atmosphere lapse rate.
        Correction = exp(-0.0025 × elev_delta) where elev_delta = asset - regional mean
        Equivalent to −0.25% heat severity per 10m above regional mean.

    WATER STRESS:
      High-elevation assets are often above river catchment stress zones and
      may have access to fresher highland water. Reduction of 15% per 500m above
      regional mean (capped at 40% reduction).
      Source: FAO AQUASTAT; WRI Aqueduct 4.0 sub-basin analysis.

    Returns:
        dict with keys: flood_factor, heat_factor, water_stress_factor
    """
    elev_delta = asset_elev_m - region_mean_elev_m

    # ── Flood correction ──────────────────────────────────────────────────────
    if elev_delta < -50:
        flood_f = 1.25   # below regional mean — in floodplain
    elif elev_delta < 100:
        flood_f = 1.00
    elif elev_delta < 300:
        flood_f = 1.00 - 0.35 * (elev_delta - 100) / 200   # 1.00 → 0.65
    elif elev_delta < 600:
        flood_f = 0.65 - 0.30 * (elev_delta - 300) / 300   # 0.65 → 0.35
    else:
        flood_f = 0.20

    # ── Heat correction (lapse rate) ──────────────────────────────────────────
    # Every 100m above regional mean ≈ −0.65°C → reduces heat stress
    heat_f = math.exp(-0.0025 * max(0, elev_delta))   # no uplift for below-mean

    # ── Water stress correction ───────────────────────────────────────────────
    ws_reduction = min(0.40, max(0.0, elev_delta / 500 * 0.15))
    water_stress_f = 1.0 - ws_reduction

    return {
        "flood_factor":        round(max(0.05, flood_f), 4),
        "heat_factor":         round(max(0.30, heat_f), 4),
        "water_stress_factor": round(water_stress_f, 4),
        "elev_delta_m":        round(elev_delta, 1),
    }


def _coastal_proximity_factor(lat: float, lon: float) -> float:
    """
    Continuous coastal proximity factor (0–1) based on distance to nearest
    reference coastal point.

    Decay function:
      < 10 km  → 1.00  (directly coastal)
      10–50 km → linear decay 1.0 → 0.85
      50–150km → linear decay 0.85 → 0.40
      150–300km→ linear decay 0.40 → 0.10
      > 300 km → 0.05  (minimal coastal influence)

    Source: Analogous to CLIMADA coastal exposure decay; consistent with
    WRI Aqueduct coastal flood exposure gradient methodology.
    """
    if lat is None or lon is None:
        return 0.5   # unknown — use moderate default

    min_dist = min(
        _haversine_km(lat, lon, cp[0], cp[1])
        for cp in _COASTAL_REFERENCE_POINTS
    )

    if min_dist < 10:
        return 1.00
    elif min_dist < 50:
        return 1.00 - 0.15 * (min_dist - 10) / 40
    elif min_dist < 150:
        return 0.85 - 0.45 * (min_dist - 50) / 100
    elif min_dist < 300:
        return 0.40 - 0.30 * (min_dist - 150) / 150
    else:
        return 0.05


def _resolve_spatial_context(
    lat: Optional[float],
    lon: Optional[float],
    region: str,
    elevation_override: Optional[float],
) -> dict:
    """
    Derive asset-level spatial context from coordinates.

    Returns a dict with:
      - elevation_m: refined elevation estimate
      - is_coastal: boolean (True if coastal_factor >= 0.40)
      - coastal_factor: continuous 0–1 proximity score
      - lat_effective: lat used (falls back to region centroid if None)
      - lon_effective: lon used
      - spatial_resolution: human-readable resolution string for audit trail
      - downscaling_method: methodology description
    """
    # Region centroids for fallback when no coordinates given
    _REGION_CENTROIDS: dict[str, Tuple[float, float]] = {
        "AU-WA": (-25.0, 122.0), "AU-QLD": (-22.0, 144.0), "AU-SA": (-30.0, 135.0),
        "AU-NSW": (-33.0, 146.0), "AU-VIC": (-37.0, 144.0), "AU-NT": (-19.0, 133.0),
        "US-TX": (31.0, -99.0), "US-WY": (43.0, -107.0), "US-OK": (35.5, -97.5),
        "CA-AB": (54.0, -115.0), "CA-QC": (52.0, -72.0),
        "GB-ENG": (52.5, -1.5), "NL-NH": (52.4, 4.9),
        "ZA": (-29.0, 25.0), "CL-02": (-23.0, -68.0),
        "PE-01": (-12.0, -77.0), "BR-PA": (-5.0, -55.0),
        "ID-KI": (-1.0, 114.0), "CN-NM": (44.0, 113.0),
        "IN-MH": (19.0, 75.0), "MN-01": (47.0, 103.0),
        "global": (20.0, 0.0),
    }

    centroid = _REGION_CENTROIDS.get(region, (20.0, 0.0))
    lat_eff = lat if lat is not None else centroid[0]
    lon_eff = lon if lon is not None else centroid[1]

    # Coastal factor
    cf = _coastal_proximity_factor(lat_eff, lon_eff)
    is_coastal = cf >= 0.40

    # Elevation: use override, else region default
    # Coastal refinement: if asset is directly coastal (factor > 0.85) but the
    # region average elevation is > 50m, cap at 12m. Ports and coastal industrial
    # facilities are by definition near sea level; a region average like Maharashtra
    # (600m, Western Ghats influence) would otherwise incorrectly suppress coastal
    # hazards for Mumbai Port. Source: SRTM DEM coastal zone analysis.
    region_elev = REGION_ELEVATION_M.get(region, 300)
    if elevation_override is not None:
        elev = elevation_override
    elif cf >= 0.85 and region_elev > 50:
        elev = 12.0   # coastal asset assumed near sea level if no override given
    else:
        elev = region_elev

    # Sub-grid elevation corrections relative to regional (25km cell) mean
    subgrid = _subgrid_elevation_correction(elev, region_elev)

    # Resolution description for audit trail — describes exactly what the engine does,
    # not what the upstream data sources are capable of.
    if lat is not None and lon is not None:
        spatial_res = (
            f"Asset coordinates ({lat:.4f}°N, {lon:.4f}°E); "
            f"regional baseline (WRI Aqueduct 4.0, state/province level) refined by "
            f"sub-grid elevation correction (asset {elev:.0f}m vs regional mean {region_elev:.0f}m, "
            f"delta {subgrid['elev_delta_m']:+.0f}m)"
        )
        method = (
            "Step 1 — Baseline: WRI Aqueduct 4.0 state/province-level hazard scores "
            "(water stress, riverine flood, coastal flood, drought) anchored to observed "
            "1991-2020 climatology. NASA NEX-GDDP-CMIP6 and IPCC AR6 Ch11 used for "
            "extreme-event frequency calibration at regional level. "
            "Step 2 — Climate delta: IPCC AR6 WG1 Ch4 GMST trajectories (SSP1-2.6 through "
            "SSP5-8.5) with latitude-band warming amplification (0.80x equatorial to 2.20x Arctic, "
            "IPCC AR6 WG1 Fig 4.19). "
            "Step 3 — Sub-grid elevation correction: asset elevation relative to regional mean "
            "applies terrain-based adjustments: flood factor {:.2f}x (LISFLOOD DEM methodology), "
            "heat factor {:.2f}x (WMO lapse rate 0.65 deg C per 100m), "
            "water stress factor {:.2f}x (FAO AQUASTAT upstream catchment). "
            "Step 4 — Coastal proximity: Haversine distance-decay to Natural Earth coastline "
            "reference points replaces binary coastal classification; factor {:.2f} at this asset."
        ).format(
            subgrid["flood_factor"], subgrid["heat_factor"],
            subgrid["water_stress_factor"], round(cf, 2)
        )
    else:
        spatial_res = (
            f"Region centroid ({lat_eff:.2f}°N, {lon_eff:.2f}°E); "
            f"WRI Aqueduct 4.0 regional baseline applied without sub-grid correction. "
            f"Provide asset coordinates for terrain-based downscaling."
        )
        method = (
            "Step 1 — Baseline: WRI Aqueduct 4.0 state/province-level hazard scores. "
            "Step 2 — Climate delta: IPCC AR6 WG1 Ch4 GMST trajectories with regional "
            "warming amplification factors (IPCC AR6 Atlas). "
            "Sub-grid correction not applied — no asset coordinates provided. "
            "Results represent the regional average exposure for this hazard profile. "
            "Accuracy improves when asset-level latitude, longitude, and elevation are supplied."
        )

    return {
        "elevation_m": elev,
        "region_mean_elev_m": region_elev,
        "is_coastal": is_coastal,
        "coastal_factor": round(cf, 3),
        "lat_effective": lat_eff,
        "lon_effective": lon_eff,
        "subgrid": subgrid,
        "spatial_resolution": spatial_res,
        "downscaling_method": method,
    }


# ---------------------------------------------------------------------------
# Hazard result dataclasses
# ---------------------------------------------------------------------------

@dataclass
class HazardScore:
    hazard: str
    annual_probability: float       # 0–1: chance of a damaging event this year
    severity_index: float           # 0–5: WRI-aligned severity
    production_loss_pct: float      # 0–1: expected fraction of production disrupted
    trend_2030: float               # severity index in 2030
    trend_2050: float               # severity index in 2050
    data_source: str
    applicable: bool = True         # False if hazard not relevant (e.g., SLR inland)
    notes: str = ""


@dataclass
class AssetHazardProfile:
    """Full 9-hazard profile for one asset under one SSP scenario."""

    asset_id: str
    asset_name: str
    region: str
    lat: Optional[float]
    lon: Optional[float]
    elevation_m: float
    is_coastal: bool
    coastal_factor: float   # continuous 0–1 proximity score (replaces binary is_coastal)
    lulc_type: str
    ssp: str

    hazards: dict[str, HazardScore] = field(default_factory=dict)

    # Composite scores
    physical_risk_score: float = 0.0      # 0–100
    annual_loss_pct: float = 0.0          # expected annual production loss %
    peak_loss_2050_pct: float = 0.0

    # Key findings for narrative
    top_hazards: list[str] = field(default_factory=list)
    critical_year: Optional[int] = None  # year when loss exceeds 5%

    # Spatial resolution metadata — required for audit trail
    spatial_resolution: str = ""
    downscaling_method: str = ""

    # Live API data fetched at assessment time (None if API unavailable)
    live_baseline: Optional[dict] = None      # NASA POWER observed baseline
    live_projection: Optional[dict] = None    # Open-Meteo CMIP6 projection delta


# ---------------------------------------------------------------------------
# Core hazard computation functions
# ---------------------------------------------------------------------------

def _heat_stress(region: str, ssp: SSPScenario, year: int,
                 heat_factor: float = 1.0,
                 live_warming_c: Optional[float] = None,
                 live_baseline_t2m_max_c: Optional[float] = None) -> HazardScore:
    """
    Heat stress: WBGT exceedance, extreme heat days.

    Downscaling path (when coordinates provided):
      - live_baseline_t2m_max_c: actual observed T2M_MAX from NASA POWER (2001-2020)
      - live_warming_c: actual CMIP6 warming delta from Open-Meteo at SSP/year
      These replace the WRI regional heat_baseline and IPCC GMST lookup.

    Fallback path (no coordinates / API unavailable):
      - WRI_BASELINE regional heat_baseline
      - IPCC AR6 Ch11 GMST warming trajectory
      - Sub-grid heat_factor (lapse rate correction)

    Source: NASA POWER MERRA-2 baseline; Open-Meteo MRI-AGCM3.2-S CMIP6;
            IPCC AR6 Ch11.3; WMO standard atmosphere lapse rate.
    """
    # Choose warming and baseline from live data if available
    if live_warming_c is not None and live_baseline_t2m_max_c is not None:
        # Map actual T2M_MAX to a 0-5 severity scale anchored at 25°C
        # >35°C baseline → severity 4-5; 25°C → severity 2; <20°C → severity 1
        live_severity_base = max(0.5, min(5.0, (live_baseline_t2m_max_c - 20.0) / 5.0))
        warming = live_warming_c
        baseline_src = f"NASA POWER T2M_MAX {live_baseline_t2m_max_c:.1f}°C"
        data_src = "NASA POWER 2001-2020 baseline + Open-Meteo CMIP6 warming delta"
    else:
        live_severity_base = WRI_BASELINE.get(region, WRI_BASELINE["global"])["heat_baseline"]
        warming = ssp.regional_warming(year, region)
        baseline_src = f"WRI regional heat_baseline {live_severity_base:.2f}"
        data_src = "WRI Aqueduct 4.0 regional baseline + IPCC AR6 Ch11.3"

    freq_mult = HEAT_FREQ_PER_DEG_C ** warming
    met_mult = heat_stress_baseline_multiplier(region)
    base_prob = min(0.60, 0.06 * met_mult)
    adjusted_baseline = live_severity_base * heat_factor
    severity = min(5.0, adjusted_baseline * met_mult * (1 + warming * 0.35))
    prob = min(0.95, base_prob * freq_mult * heat_factor)
    loss = min(0.010, max(0.0, (severity - 2.0) * 0.0008))  # recal v0.3: ÷10 vs v0.2

    w30 = ssp.regional_warming(2030, region)
    w50 = ssp.regional_warming(2050, region)
    met_b = get_met_baseline(region)

    return HazardScore(
        hazard="heat_stress",
        annual_probability=round(prob, 4),
        severity_index=round(severity, 2),
        production_loss_pct=round(loss, 4),
        trend_2030=round(min(5.0, adjusted_baseline * met_mult * (1 + w30 * 0.35)), 2),
        trend_2050=round(min(5.0, adjusted_baseline * met_mult * (1 + w50 * 0.35)), 2),
        data_source=data_src + "; WMO lapse-rate sub-grid correction",
        notes=(
            f"{baseline_src}; lapse correction {heat_factor:.3f}; "
            f"warming {warming:.2f}°C; freq mult {freq_mult:.2f}×; "
            f"obs hot days {met_b.hot_days_above_35c:.0f}/yr; met calib {met_mult:.2f}×"
        ),
    )


def _flood_riverine(region: str, ssp: SSPScenario, year: int, lulc: str,
                    flood_factor: float = 1.0,
                    live_precip_delta_pct: Optional[float] = None) -> HazardScore:
    """
    Riverine (fluvial) flood: heavy precip + river system.
    Sources: WRI Aqueduct + IPCC AR6 Ch11.4 Clausius-Clapeyron + WMO precipitation normals.

    Downscaling: flood_factor is the sub-grid elevation correction derived from
    _subgrid_elevation_correction(). An asset 400m above the regional mean gets
    flood_factor ~0.50 — the 25km grid cell average is halved to reflect the
    asset sitting above the regional floodplain. Assets below the regional mean
    (in floodplain position) get flood_factor 1.25.
    Source: LISFLOOD sub-grid DEM analysis; WRI Aqueduct 4.0 validation.

    Live downscaling path (when coordinates provided):
      live_precip_delta_pct: actual projected precipitation change (%) from Open-Meteo
      CMIP6 at asset coordinates, SSP-scaled. Replaces IPCC GMST × Clausius-Clapeyron
      global average with a coordinate-level CMIP6 precipitation signal.
    """
    baseline = WRI_BASELINE.get(region, WRI_BASELINE["global"])["riverine_flood"]
    # Apply sub-grid elevation correction to the baseline before any SSP scaling
    adjusted_baseline = baseline * flood_factor
    warming = ssp.regional_warming(year, region)

    # Precipitation change factor: prefer live CMIP6 value, fall back to IPCC CC
    if live_precip_delta_pct is not None:
        precip_change = 1 + (live_precip_delta_pct / 100)
        precip_src = f"Open-Meteo CMIP6 {live_precip_delta_pct:+.1f}%"
    else:
        precip_change = 1 + (PRECIP_CHANGE_PCT_PER_DEG_C * warming / 100)
        precip_src = f"IPCC CC +{(precip_change - 1) * 100:.1f}%"

    # Guard against negative precip_change (unusual dry signal reducing precip below 0)
    precip_change = max(0.10, precip_change)

    runoff_mult = RUNOFF_BY_LULC.get(lulc, 1.0)
    pv_idx = precip_variability_index(region)
    severity = min(5.0, adjusted_baseline * precip_change * runoff_mult * (0.7 + 0.3 * pv_idx))
    prob = min(0.90, adjusted_baseline / 5.0 * precip_change * 0.25)
    loss = min(0.015, max(0.0, (severity - 1.5) * 0.0015))  # recal v0.3

    # Trend lines always use IPCC trajectory (live data is single-year point estimate)
    w30 = ssp.regional_warming(2030, region); w50 = ssp.regional_warming(2050, region)
    pc30 = 1 + PRECIP_CHANGE_PCT_PER_DEG_C * w30 / 100
    pc50 = 1 + PRECIP_CHANGE_PCT_PER_DEG_C * w50 / 100

    data_src = (
        "Open-Meteo CMIP6 precipitation delta + WRI Aqueduct 4.0 baseline + sub-grid elevation correction"
        if live_precip_delta_pct is not None
        else "WRI Aqueduct 4.0 (0.25° grid) + IPCC AR6 Clausius-Clapeyron + sub-grid elevation correction"
    )

    return HazardScore(
        hazard="flood_riverine",
        annual_probability=round(prob, 4),
        severity_index=round(severity, 2),
        production_loss_pct=round(loss, 4),
        trend_2030=round(min(5.0, adjusted_baseline * pc30 * runoff_mult * (0.7 + 0.3 * pv_idx)), 2),
        trend_2050=round(min(5.0, adjusted_baseline * pc50 * runoff_mult * (0.7 + 0.3 * pv_idx)), 2),
        data_source=data_src,
        notes=(
            f"Grid baseline {baseline:.2f} × sub-grid correction {flood_factor:.2f} = adjusted {adjusted_baseline:.2f}; "
            f"precip change {precip_src}; runoff {runoff_mult:.1f}× (LULC: {lulc}); variability {pv_idx:.2f}"
        ),
    )


def _flood_coastal(region: str, ssp: SSPScenario, year: int,
                   is_coastal: bool, elevation_m: float,
                   coastal_factor: float = 1.0) -> HazardScore:
    """
    Coastal flood: storm surge + sea level rise compound event.
    Source: WRI Aqueduct (coastal) + IPCC AR6 Ch9.

    Downscaling improvement: coastal_factor (0–1) replaces the binary is_coastal
    flag. A factory 5km from the coast gets full exposure; one 200km inland gets
    near-zero even if nominally in a 'coastal' region. Consistent with CLIMADA
    coastal exposure decay and WRI Aqueduct 4.0 coastal gradient methodology.

    Elevation gate: assets above 80m are not materially exposed to storm surge.
    """
    if elevation_m > 80 or coastal_factor < 0.10:
        reason = (
            f"Asset elevation {elevation_m:.0f}m > 80m — storm surge not material"
            if elevation_m > 80
            else f"Asset coastal proximity {coastal_factor:.2f} < 0.10 — coastal flood not material"
        )
        return HazardScore(
            hazard="flood_coastal", annual_probability=0.0, severity_index=0.0,
            production_loss_pct=0.0, trend_2030=0.0, trend_2050=0.0,
            data_source="N/A", applicable=False,
            notes=reason,
        )
    baseline = WRI_BASELINE.get(region, WRI_BASELINE["global"])["coastal_flood"]
    slr = ssp.slr(year, region)
    # SLR amplifies coastal flood frequency (IPCC AR6 Ch9 Fig 9.28)
    slr_amplifier = 1 + slr * 3.5     # +3.5× risk per metre of SLR
    # Apply coastal proximity as a continuous exposure weight
    severity = min(5.0, baseline * slr_amplifier * coastal_factor)
    prob = min(0.80, baseline / 5.0 * slr_amplifier * coastal_factor * 0.20)
    loss = min(0.020, max(0.0, (severity - 1.0) * 0.0020))  # recal v0.3

    slr30 = ssp.slr(2030, region); slr50 = ssp.slr(2050, region)

    return HazardScore(
        hazard="flood_coastal",
        annual_probability=round(prob, 4),
        severity_index=round(severity, 2),
        production_loss_pct=round(loss, 4),
        trend_2030=round(min(5.0, baseline * (1 + slr30 * 3.5) * coastal_factor), 2),
        trend_2050=round(min(5.0, baseline * (1 + slr50 * 3.5) * coastal_factor), 2),
        data_source="WRI Aqueduct 4.0 (coastal) + IPCC AR6 Ch9 SLR; Haversine coastal proximity downscaling",
        notes=f"SLR {slr:.3f}m by {year}; coastal proximity factor {coastal_factor:.2f}; compound storm-surge amplification",
    )


def _sea_level_rise(region: str, ssp: SSPScenario, year: int,
                    is_coastal: bool, elevation_m: float,
                    coastal_factor: float = 1.0) -> HazardScore:
    """
    Chronic SLR inundation risk for low-lying coastal assets.
    Source: IPCC AR6 Ch9 + NOAA SLR viewer proxy.

    Downscaling: coastal_factor applied to SLR severity — an asset 250km inland
    has negligible SLR exposure even if the region is broadly 'coastal'.
    """
    if elevation_m > 20 or coastal_factor < 0.10:
        return HazardScore(
            hazard="sea_level_rise", annual_probability=0.0, severity_index=0.0,
            production_loss_pct=0.0, trend_2030=0.0, trend_2050=0.0,
            data_source="N/A", applicable=False,
            notes=f"{'Elevation ' + str(int(elevation_m)) + 'm > 20m threshold' if elevation_m > 20 else f'Coastal proximity {coastal_factor:.2f} < 0.10'} — SLR not material",
        )
    slr = ssp.slr(year, region)
    # Low-elevation assets (<5m) face higher chronic inundation risk
    elev_factor = max(0.1, 1 - elevation_m / 20.0)   # 0.75 at 5m, 0.25 at 15m
    severity = min(5.0, slr * 5 * elev_factor * 2.0 * coastal_factor)
    prob = min(0.70, severity / 5.0 * 0.30)
    loss = min(0.015, severity * 0.0018 * elev_factor)  # recal v0.3

    slr30 = ssp.slr(2030, region); slr50 = ssp.slr(2050, region)

    return HazardScore(
        hazard="sea_level_rise",
        annual_probability=round(prob, 4),
        severity_index=round(severity, 2),
        production_loss_pct=round(loss, 4),
        trend_2030=round(min(5.0, slr30 * 5 * elev_factor * 2.0 * coastal_factor), 2),
        trend_2050=round(min(5.0, slr50 * 5 * elev_factor * 2.0 * coastal_factor), 2),
        data_source="IPCC AR6 Ch9 + NOAA SLR Viewer proxy; Copernicus DEM elevation; coastal proximity downscaling",
        notes=f"SLR {slr:.3f}m by {year}; elevation ~{elevation_m:.0f}m; elev factor {elev_factor:.2f}; coastal proximity {coastal_factor:.2f}",
    )


def _saltwater_intrusion(region: str, ssp: SSPScenario, year: int,
                         is_coastal: bool, elevation_m: float,
                         coastal_factor: float = 1.0) -> HazardScore:
    """
    Saline water table / aquifer intrusion.
    Relevant for coastal assets relying on groundwater (mining dewatering,
    irrigation, drinking water for workforce).
    Source: IPCC AR6 WG2 Ch4 (freshwater security); regional SLR.

    Downscaling: coastal_factor gates applicability continuously.
    """
    if coastal_factor < 0.15:
        return HazardScore(
            hazard="saltwater_intrusion", annual_probability=0.0, severity_index=0.0,
            production_loss_pct=0.0, trend_2030=0.0, trend_2050=0.0,
            data_source="N/A", applicable=False,
            notes=f"Asset coastal proximity {coastal_factor:.2f} < 0.15 — saltwater intrusion not applicable",
        )
    slr = ssp.slr(year, region)
    water_stress = WRI_BASELINE.get(region, WRI_BASELINE["global"])["water_stress"]
    # Intrusion depends on SLR + groundwater draw-down + elevation + coastal proximity
    elev_factor = max(0.0, 1 - elevation_m / 15.0)
    severity = min(5.0, (slr * 4 + water_stress * 0.5) * elev_factor * coastal_factor)
    prob = min(0.60, severity / 5.0 * 0.20)
    loss = min(0.008, severity * 0.0008)  # recal v0.3

    slr30 = ssp.slr(2030, region); slr50 = ssp.slr(2050, region)

    return HazardScore(
        hazard="saltwater_intrusion",
        annual_probability=round(prob, 4),
        severity_index=round(severity, 2),
        production_loss_pct=round(loss, 4),
        trend_2030=round(min(5.0, (slr30 * 4 + water_stress * 0.5) * elev_factor * coastal_factor), 2),
        trend_2050=round(min(5.0, (slr50 * 4 + water_stress * 0.5) * elev_factor * coastal_factor), 2),
        data_source="IPCC AR6 WG2 Ch4 + WRI Aqueduct water stress; SLR-driven intrusion; coastal proximity",
        notes=f"SLR {slr:.3f}m; elevation {elevation_m:.0f}m; water stress {water_stress:.1f}/5; coastal factor {coastal_factor:.2f}",
    )


def _landslide(region: str, ssp: SSPScenario, year: int,
               elevation_m: float, lulc: str) -> HazardScore:
    """
    Rainfall-triggered landslide and slope instability.
    Source: IPCC AR6 WG2 Ch5 (food/land); slope proxy from elevation; LULC cover.
    """
    is_prone = region in LANDSLIDE_REGIONS
    base_severity = 2.5 if is_prone else 0.8
    warming = ssp.regional_warming(year, region)
    precip_change = 1 + PRECIP_CHANGE_PCT_PER_DEG_C * warming / 100
    # Forest cover reduces landslide (root cohesion); bare rock increases
    cover_factor = {"forest": 0.7, "grassland": 0.9, "shrubland": 0.85,
                    "cropland": 1.1, "bare_rock": 1.5, "urban": 1.3,
                    "wetland": 0.8, "snow_ice": 1.2}.get(lulc, 1.0)
    # High elevation = steeper slopes
    elev_factor = min(2.0, 1 + elevation_m / 3000)
    severity = min(5.0, base_severity * precip_change * cover_factor * elev_factor * 0.85)
    prob = min(0.40, severity / 5.0 * 0.15)
    loss = min(0.010, max(0.0, (severity - 1.5) * 0.0010))  # recal v0.3

    w30 = ssp.regional_warming(2030, region); w50 = ssp.regional_warming(2050, region)
    pc30 = 1 + PRECIP_CHANGE_PCT_PER_DEG_C * w30 / 100
    pc50 = 1 + PRECIP_CHANGE_PCT_PER_DEG_C * w50 / 100

    return HazardScore(
        hazard="landslide",
        annual_probability=round(prob, 4),
        severity_index=round(severity, 2),
        production_loss_pct=round(loss, 4),
        trend_2030=round(min(5.0, base_severity * pc30 * cover_factor * elev_factor * 0.85), 2),
        trend_2050=round(min(5.0, base_severity * pc50 * cover_factor * elev_factor * 0.85), 2),
        data_source="IPCC AR6 WG2 Ch5; SRTM/Copernicus DEM elevation proxy; LULC cover",
        notes=f"Elevation {elevation_m:.0f}m; LULC {lulc}; landslide-prone region: {is_prone}",
    )


def _wildfire(region: str, ssp: SSPScenario, year: int, lulc: str) -> HazardScore:
    """
    Wildfire weather index (FWI) and fire season length.
    Source: NASA FIRMS historical + IPCC AR6 WG2 Ch12.3; Abatzoglou et al. 2019.
    """
    is_prone = region in WILDFIRE_REGIONS
    base_severity = 2.8 if is_prone else 1.0
    warming = ssp.regional_warming(year, region)
    fwi_change = 1 + WILDFIRE_INDEX_PCT_PER_DEG_C * warming / 100
    fuel_load = WILDFIRE_FUEL_BY_LULC.get(lulc, 1.0)
    severity = min(5.0, base_severity * fwi_change * fuel_load)
    prob = min(0.85, severity / 5.0 * (0.35 if is_prone else 0.10))
    # Calibrated: NASA FIRMS + IPCC AR6 WG2 Ch12 — wildfire disrupts industrial
    # operations 1–3% annually in fire-prone regions (hardened infra, firebreaks).
    # Coefficient 0.010; cap 10% (severe multi-week event in worst-case).
    loss = min(0.010, max(0.0, (severity - 2.0) * 0.0008))  # recal v0.3

    w30 = ssp.regional_warming(2030, region); w50 = ssp.regional_warming(2050, region)
    fwi30 = 1 + WILDFIRE_INDEX_PCT_PER_DEG_C * w30 / 100
    fwi50 = 1 + WILDFIRE_INDEX_PCT_PER_DEG_C * w50 / 100

    return HazardScore(
        hazard="wildfire",
        annual_probability=round(prob, 4),
        severity_index=round(severity, 2),
        production_loss_pct=round(loss, 4),
        trend_2030=round(min(5.0, base_severity * fwi30 * fuel_load), 2),
        trend_2050=round(min(5.0, base_severity * fwi50 * fuel_load), 2),
        data_source="NASA FIRMS (historical fire hotspots) + IPCC AR6 WG2 Ch12.3; FWI scaling",
        notes=f"FWI change +{(fwi_change-1)*100:.1f}%; fuel load {fuel_load:.1f}× (LULC: {lulc})",
    )


def _cyclone(region: str, ssp: SSPScenario, year: int, is_coastal: bool) -> HazardScore:
    """
    Tropical cyclone / hurricane intensity and track frequency.
    Source: IBTRACS historical + IPCC AR6 Ch11.7; Knutson et al. 2020.
    """
    if not (region in CYCLONE_REGIONS and is_coastal):
        return HazardScore(
            hazard="cyclone", annual_probability=0.0, severity_index=0.0,
            production_loss_pct=0.0, trend_2030=0.0, trend_2050=0.0,
            data_source="N/A", applicable=False,
            notes="Asset outside tropical cyclone belt or inland — not applicable",
        )
    # Base cyclone frequency: blend IBTrACS historical lookup with observed met baseline
    _ibtracs_base = {
        "AU-QLD": 0.12, "AU-WA": 0.08, "AU-NT": 0.10,
        "IN-MH": 0.06, "ID-KI": 0.04, "BR-PA": 0.03,
        "US-TX": 0.10, "ZA": 0.04,
    }.get(region, 0.05)
    # Met baseline provides additional IBTRACS-derived probability for cross-check
    met_cyclone_p = observed_cyclone_prob(region)
    # Blend: 60% IBTrACS table + 40% met baseline (convergence as met data quality improves)
    base_prob = 0.6 * _ibtracs_base + 0.4 * (met_cyclone_p if met_cyclone_p > 0 else _ibtracs_base)
    warming = ssp.regional_warming(year, region)
    intensity_change = 1 + CYCLONE_INTENSITY_PCT_PER_DEG_C * warming / 100
    # Fewer but more intense (IPCC AR6 Ch11.7 — frequency -5% to -10% per °C,
    # intensity +5% per °C for Category 4–5 events).
    prob = min(0.40, base_prob * (1 - 0.03 * warming))
    severity = min(5.0, 3.0 * intensity_change)
    # Expected annual production loss = hit probability × fraction lost per event.
    # Fraction lost per hit scales with intensity: ~30–35% of annual output
    # during a severe cyclone shutdown (1–4 weeks).  Knutson et al. 2020.
    loss = min(0.08, prob * intensity_change * 0.10)  # recal v0.3: hit×loss per event

    w30 = ssp.regional_warming(2030, region); w50 = ssp.regional_warming(2050, region)
    ic30 = 1 + CYCLONE_INTENSITY_PCT_PER_DEG_C * w30 / 100
    ic50 = 1 + CYCLONE_INTENSITY_PCT_PER_DEG_C * w50 / 100

    return HazardScore(
        hazard="cyclone",
        annual_probability=round(prob, 4),
        severity_index=round(severity, 2),
        production_loss_pct=round(loss, 4),
        trend_2030=round(min(5.0, 3.0 * ic30), 2),
        trend_2050=round(min(5.0, 3.0 * ic50), 2),
        data_source="IBTrACS v4 + WMO 1991-2020 observed landfall p + IPCC AR6 Ch11.7; Knutson et al. 2020",
        notes=(
            f"Blended base prob {base_prob:.3f} (IBTrACS {_ibtracs_base:.2f} + met obs {met_cyclone_p:.2f}); "
            f"intensity +{(intensity_change-1)*100:.1f}% vs baseline"
        ),
    )


def _drought(region: str, ssp: SSPScenario, year: int) -> HazardScore:
    """
    Meteorological + hydrological drought intensity and duration.
    Sources: WRI Aqueduct (baseline) + IPCC AR6 Ch11.6 (PDSI) + WMO observed return periods.

    Calibration: the annual drought probability is anchored to the observed
    drought return period from met baselines (e.g. CL-02 returns every 3yr
    vs CA-QC every 12yr), giving meaningfully different event probabilities.
    """
    baseline = WRI_BASELINE.get(region, WRI_BASELINE["global"])["drought"]
    warming = ssp.regional_warming(year, region)
    # Drought intensifies non-linearly with warming (IPCC AR6 — PDSI scaling)
    drought_mult = 1 + warming * 0.22 + warming ** 2 * 0.04
    severity = min(5.0, baseline * drought_mult)
    # Met-calibrated probability: inverse of observed return period
    obs_return = observed_drought_return(region)                # years between events
    base_drought_prob = min(0.40, 1.0 / max(obs_return, 1.0))  # e.g. 1/3 = 0.33 for CL-02
    prob = min(0.80, base_drought_prob * drought_mult)
    # Calibrated: WRI Aqueduct 4.0 + IPCC AR6 Ch11.6 — drought reduces water-
    # dependent industrial output 1–4% annually in high-stress regions.
    loss = min(0.015, max(0.0, (severity - 2.0) * 0.0012))  # recal v0.3

    w30 = ssp.regional_warming(2030, region); w50 = ssp.regional_warming(2050, region)
    dm30 = 1 + w30 * 0.22 + w30**2 * 0.04
    dm50 = 1 + w50 * 0.22 + w50**2 * 0.04

    return HazardScore(
        hazard="drought",
        annual_probability=round(prob, 4),
        severity_index=round(severity, 2),
        production_loss_pct=round(loss, 4),
        trend_2030=round(min(5.0, baseline * dm30), 2),
        trend_2050=round(min(5.0, baseline * dm50), 2),
        data_source="WRI Aqueduct 4.0 + IPCC AR6 Ch11.6 PDSI + WMO observed return periods",
        notes=(
            f"Drought mult {drought_mult:.2f}× at {warming:.2f}°C; "
            f"observed return period {obs_return:.0f}yr; base annual prob {base_drought_prob:.3f}"
        ),
    )


def _water_stress(region: str, ssp: SSPScenario, year: int,
                  water_stress_factor: float = 1.0) -> HazardScore:
    """
    Chronic freshwater scarcity — water withdrawal vs availability.
    Source: WRI Aqueduct 4.0 (primary); FAO AQUASTAT; IPCC AR6 WG2 Ch4.

    Downscaling: water_stress_factor reduces the grid-cell average for assets
    at higher elevation, which are typically upstream of water stress zones and
    have access to fresher highland catchments. −15% per 500m above regional mean,
    capped at 40% reduction. Source: FAO AQUASTAT; WRI Aqueduct 4.0 sub-basin.
    """
    baseline = WRI_BASELINE.get(region, WRI_BASELINE["global"])["water_stress"]
    adjusted_baseline = baseline * water_stress_factor
    warming = ssp.regional_warming(year, region)
    stress_mult = 1 + warming * 0.15
    severity = min(5.0, adjusted_baseline * stress_mult)
    prob = min(0.95, severity / 5.0 * 0.55)
    loss = min(0.012, max(0.0, (severity - 2.5) * 0.0012))  # recal v0.3

    w30 = ssp.regional_warming(2030, region); w50 = ssp.regional_warming(2050, region)

    return HazardScore(
        hazard="water_stress",
        annual_probability=round(prob, 4),
        severity_index=round(severity, 2),
        production_loss_pct=round(loss, 4),
        trend_2030=round(min(5.0, adjusted_baseline * (1 + w30 * 0.15)), 2),
        trend_2050=round(min(5.0, adjusted_baseline * (1 + w50 * 0.15)), 2),
        data_source="WRI Aqueduct 4.0 (0.25° grid) + IPCC AR6 WG2 Ch4; sub-grid elevation correction",
        notes=(
            f"Grid baseline {baseline:.2f} × elevation factor {water_stress_factor:.2f} = {adjusted_baseline:.2f}; "
            f"stress mult {stress_mult:.2f}×"
        ),
    )


# ---------------------------------------------------------------------------
# Main assessment engine
# ---------------------------------------------------------------------------

class PhysicalHazardEngine:
    """
    Compute full 9-hazard physical risk profile for an asset.

    Usage:
        engine = PhysicalHazardEngine()
        profile = engine.assess(
            asset_id="pilbara_001",
            asset_name="Pilbara Iron Ore",
            region="AU-WA",
            lat=-22.5, lon=118.8,
            ssp="ssp370",    # or use ngfs_family="current_policies"
            year=2030,
        )
    """

    def assess(
        self,
        asset_id: str,
        asset_name: str,
        region: str,
        year: int,
        ssp: str | None = None,
        ngfs_family: str | None = None,
        lat: float | None = None,
        lon: float | None = None,
        elevation_override: float | None = None,
        _depth: int = 0,   # internal recursion guard — do NOT pass externally
    ) -> AssetHazardProfile:
        """
        Assess all hazards for one asset at one point in time.

        Args:
            asset_id: Unique identifier for the asset.
            asset_name: Human-readable name.
            region: CRI region code (e.g., "AU-WA").
            year: Assessment year (2026–2050).
            ssp: SSP scenario id (e.g., "ssp370"). Overrides ngfs_family.
            ngfs_family: NGFS scenario family — translated to SSP if ssp not given.
            lat, lon: Asset coordinates (decimal degrees). Used for coastal detection.
            elevation_override: Override the region default elevation (metres).
        """
        # Resolve SSP
        if ssp:
            scenario = SSP_SCENARIOS.get(ssp, SSP_SCENARIOS["ssp245"])
        elif ngfs_family:
            scenario = ngfs_to_ssp(ngfs_family)
        else:
            scenario = SSP_SCENARIOS["ssp245"]

        # Resolve spatial context — uses lat/lon for asset-level downscaling
        spatial = _resolve_spatial_context(lat, lon, region, elevation_override)
        elevation = spatial["elevation_m"]
        is_coastal = spatial["is_coastal"]
        coastal_factor = spatial["coastal_factor"]
        lulc = REGION_LULC.get(region, LULCType.GRASSLAND)

        # Use lat/lon-aware warming if coordinates available, else fall back to region
        if lat is not None and lon is not None:
            # Patch scenario with lat/lon-derived warming for this assessment
            # We do this by creating a thin wrapper that overrides regional_warming
            import types
            _orig_rw = scenario.regional_warming
            def _latlon_warming(yr, reg, _lat=lat, _lon=lon, _scen=scenario):
                return _scen.warming_at_latlon(yr, _lat, _lon, reg)
            scenario.regional_warming = _latlon_warming   # type: ignore[method-assign]

        # Sub-grid correction factors (elevation relative to 25km cell mean)
        sg = spatial["subgrid"]

        # ── Live coordinate-level climate data (NASA POWER + Open-Meteo CMIP6) ──────
        # Only fetched at depth=0 (user-requested year) to avoid duplicate API calls
        # in recursive trend/critical-year sub-assessments.  Gracefully degrades to
        # lookup-table path if either API is unavailable.
        live_data: Optional[dict] = None
        live_warming_c: Optional[float] = None
        live_baseline_t2m_max_c: Optional[float] = None
        live_precip_delta_pct: Optional[float] = None
        if lat is not None and lon is not None and _depth == 0:
            live_data = _fetch_live_climate(lat, lon, year, scenario.id)
            if live_data["live"]:
                live_warming_c = live_data["warming_c"]
                live_baseline_t2m_max_c = live_data["baseline_t2m_max_c"]
                live_precip_delta_pct = live_data.get("precip_delta_pct")

        # ── Assemble live baseline / projection metadata for audit trail ─────────────
        live_baseline_meta: Optional[dict] = None
        live_projection_meta: Optional[dict] = None
        if live_data is not None:
            if live_data.get("baseline_t2m_max_c") is not None:
                live_baseline_meta = {
                    "t2m_max_c": live_data["baseline_t2m_max_c"],
                    "precip_mm_day": live_data["baseline_precip_mm_day"],
                    "source": "NASA POWER MERRA-2 2001-2020 climatological normal",
                }
            live_projection_meta = {
                "warming_c": live_data["warming_c"],
                "precip_delta_pct": live_data.get("precip_delta_pct"),
                "data_source": live_data["data_source"],
                "live": live_data["live"],
            }

        # ── Extend downscaling_method description when live API succeeded ────────────
        downscaling_str = spatial["downscaling_method"]
        if live_data is not None and live_data["live"]:
            downscaling_str += (
                " Step 5 — Live coordinate-level API downscaling: "
                f"NASA POWER MERRA-2 (2001-2020) observed T2M_MAX "
                f"{live_data['baseline_t2m_max_c']:.1f} deg C and precipitation "
                f"{live_data['baseline_precip_mm_day']:.3f} mm/day fetched at asset "
                f"coordinates ({lat:.4f} N, {lon:.4f} E). "
                f"Open-Meteo CMIP6 ({live_data['data_source'].split(' ')[2] if ' ' in live_data['data_source'] else 'MRI-AGCM3.2-S'}) "
                f"future projection scaled to {scenario.id} using IPCC AR6 WG1 Table 4.5 GMST ratios; "
                f"warming delta {live_data['warming_c']:.2f} deg C above observed baseline. "
                "Heat stress anchored to coordinate-level observed climatology; "
                "riverine flood driven by CMIP6 precipitation signal at asset grid cell."
            )
        elif live_data is not None and not live_data["live"]:
            downscaling_str += (
                f" Step 5 — Live API attempted but unavailable ({live_data['data_source']}); "
                "steps 1-4 applied using lookup-table baseline."
            )

        # Compute all 10 hazards with sub-grid downscaling applied
        hazards: dict[str, HazardScore] = {
            "heat_stress":          _heat_stress(region, scenario, year,
                                        heat_factor=sg["heat_factor"],
                                        live_warming_c=live_warming_c,
                                        live_baseline_t2m_max_c=live_baseline_t2m_max_c),
            "flood_riverine":       _flood_riverine(region, scenario, year, lulc,
                                        flood_factor=sg["flood_factor"],
                                        live_precip_delta_pct=live_precip_delta_pct),
            "flood_coastal":        _flood_coastal(region, scenario, year, is_coastal, elevation, coastal_factor),
            "sea_level_rise":       _sea_level_rise(region, scenario, year, is_coastal, elevation, coastal_factor),
            "saltwater_intrusion":  _saltwater_intrusion(region, scenario, year, is_coastal, elevation, coastal_factor),
            "landslide":            _landslide(region, scenario, year, elevation, lulc),
            "wildfire":             _wildfire(region, scenario, year, lulc),
            "cyclone":              _cyclone(region, scenario, year, is_coastal),
            "drought":              _drought(region, scenario, year),
            "water_stress":         _water_stress(region, scenario, year,
                                        water_stress_factor=sg["water_stress_factor"]),
        }

        # Restore original warming method (avoid polluting shared scenario object)
        if lat is not None and lon is not None:
            scenario.regional_warming = _orig_rw   # type: ignore[method-assign]

        # Joint annual production loss (independent events approximation)
        # P(loss) = 1 - ∏(1 - p_i) per hazard
        survival = 1.0
        for h in hazards.values():
            if h.applicable:
                survival *= (1.0 - h.production_loss_pct)
        total_loss = 1.0 - survival

        # Physical risk composite score 0–100
        applicable = [h for h in hazards.values() if h.applicable]
        if applicable:
            avg_severity = sum(h.severity_index for h in applicable) / len(applicable)
            score = min(100.0, avg_severity * 20)
        else:
            score = 0.0

        # Top hazards by severity (always computed)
        top = sorted(
            [(k, v.severity_index) for k, v in hazards.items() if v.applicable and v.severity_index > 1.0],
            key=lambda x: x[1], reverse=True
        )[:3]
        top_names = [t[0].replace("_", " ").title() for t in top]

        # Peak 2050 loss — only computed at top-level call to avoid recursion
        if _depth == 0 and year != 2050:
            peak_profile = self.assess(
                asset_id, asset_name, region, 2050,
                ssp=scenario.id, lat=lat, lon=lon,
                elevation_override=elevation_override,
                _depth=_depth + 1,
            )
            peak_loss = peak_profile.annual_loss_pct
        else:
            peak_loss = total_loss

        # Critical year (when cumulative loss first exceeds 5%)
        # Only computed at top-level to prevent recursive self-calls
        critical_year = None
        if _depth == 0:
            for yr in range(year, 2051, 5):
                p = self.assess(
                    asset_id, asset_name, region, yr,
                    ssp=scenario.id, lat=lat, lon=lon,
                    elevation_override=elevation_override,
                    _depth=_depth + 1,
                )
                if p.annual_loss_pct >= 0.05:
                    critical_year = yr
                    break

        return AssetHazardProfile(
            asset_id=asset_id,
            asset_name=asset_name,
            region=region,
            lat=lat,
            lon=lon,
            elevation_m=elevation,
            is_coastal=is_coastal,
            coastal_factor=coastal_factor,
            lulc_type=lulc,
            ssp=scenario.id,
            hazards=hazards,
            physical_risk_score=round(score, 1),
            annual_loss_pct=round(total_loss, 4),
            peak_loss_2050_pct=round(peak_loss, 4),
            top_hazards=top_names,
            critical_year=critical_year,
            spatial_resolution=spatial["spatial_resolution"],
            downscaling_method=downscaling_str,
            live_baseline=live_baseline_meta,
            live_projection=live_projection_meta,
        )

    def assess_trajectory(
        self,
        asset_id: str,
        asset_name: str,
        region: str,
        ssp: str,
        years: list[int],
        lat: float | None = None,
        lon: float | None = None,
        compute_critical_year: bool = False,
    ) -> dict[int, AssetHazardProfile]:
        """
        Assess hazard profiles across a list of years.

        Args:
            compute_critical_year: If True, compute critical_year for each year
                (expensive — triggers extra sub-calls per year). Usually False
                for trajectory use; call assess() directly for a single-year
                result with full critical_year computation.
        """
        depth = 0 if compute_critical_year else 1
        return {
            yr: self.assess(
                asset_id, asset_name, region, yr,
                ssp=ssp, lat=lat, lon=lon,
                _depth=depth,
            )
            for yr in years
        }
