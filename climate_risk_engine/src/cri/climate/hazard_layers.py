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
from typing import Optional

from .ssp_scenarios import (
    SSPScenario, SSP_SCENARIOS, NGFS_TO_SSP,
    HEAT_FREQ_PER_DEG_C, PRECIP_CHANGE_PCT_PER_DEG_C,
    WILDFIRE_INDEX_PCT_PER_DEG_C, CYCLONE_INTENSITY_PCT_PER_DEG_C,
    ngfs_to_ssp,
)


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


# ---------------------------------------------------------------------------
# Core hazard computation functions
# ---------------------------------------------------------------------------

def _heat_stress(region: str, ssp: SSPScenario, year: int) -> HazardScore:
    """
    Heat stress: WBGT exceedance, extreme heat days.
    Source: NASA NEX-GDDP-CMIP6 + IPCC AR6 Ch11.
    """
    baseline = WRI_BASELINE.get(region, WRI_BASELINE["global"])["heat_baseline"]
    warming = ssp.regional_warming(year, region)
    # Each °C of warming multiplies frequency of 1-in-50yr heat event
    freq_mult = HEAT_FREQ_PER_DEG_C ** warming
    severity = min(5.0, baseline * (1 + warming * 0.35))
    prob = min(0.95, 0.08 * freq_mult)          # base 8% annual p(damaging heat event)
    loss = min(0.20, max(0.0, (severity - 2.0) * 0.025))  # labour/equipment loss

    # 2030 / 2050 trend
    w30 = ssp.regional_warming(2030, region)
    w50 = ssp.regional_warming(2050, region)

    return HazardScore(
        hazard="heat_stress",
        annual_probability=round(prob, 4),
        severity_index=round(severity, 2),
        production_loss_pct=round(loss, 4),
        trend_2030=round(min(5.0, baseline * (1 + w30 * 0.35)), 2),
        trend_2050=round(min(5.0, baseline * (1 + w50 * 0.35)), 2),
        data_source="NASA NEX-GDDP-CMIP6 + IPCC AR6 Ch11.3",
        notes=f"Regional warming {warming:.2f}°C vs baseline; frequency multiplier {freq_mult:.2f}×",
    )


def _flood_riverine(region: str, ssp: SSPScenario, year: int, lulc: str) -> HazardScore:
    """
    Riverine (fluvial) flood: heavy precip + river system.
    Source: WRI Aqueduct + IPCC AR6 Ch11.4 Clausius-Clapeyron.
    """
    baseline = WRI_BASELINE.get(region, WRI_BASELINE["global"])["riverine_flood"]
    warming = ssp.regional_warming(year, region)
    precip_change = 1 + (PRECIP_CHANGE_PCT_PER_DEG_C * warming / 100)
    runoff_mult = RUNOFF_BY_LULC.get(lulc, 1.0)
    severity = min(5.0, baseline * precip_change * runoff_mult)
    prob = min(0.90, baseline / 5.0 * precip_change * 0.25)
    loss = min(0.25, max(0.0, (severity - 1.5) * 0.035))

    w30 = ssp.regional_warming(2030, region); w50 = ssp.regional_warming(2050, region)
    pc30 = 1 + PRECIP_CHANGE_PCT_PER_DEG_C * w30 / 100
    pc50 = 1 + PRECIP_CHANGE_PCT_PER_DEG_C * w50 / 100

    return HazardScore(
        hazard="flood_riverine",
        annual_probability=round(prob, 4),
        severity_index=round(severity, 2),
        production_loss_pct=round(loss, 4),
        trend_2030=round(min(5.0, baseline * pc30 * runoff_mult), 2),
        trend_2050=round(min(5.0, baseline * pc50 * runoff_mult), 2),
        data_source="WRI Aqueduct 4.0 + IPCC AR6 Clausius-Clapeyron scaling",
        notes=f"Precip intensity +{(precip_change-1)*100:.1f}%; runoff mult {runoff_mult:.1f}× (LULC: {lulc})",
    )


def _flood_coastal(region: str, ssp: SSPScenario, year: int, is_coastal: bool) -> HazardScore:
    """
    Coastal flood: storm surge + sea level rise compound event.
    Source: WRI Aqueduct (coastal) + IPCC AR6 Ch9.
    """
    if not is_coastal:
        return HazardScore(
            hazard="flood_coastal", annual_probability=0.0, severity_index=0.0,
            production_loss_pct=0.0, trend_2030=0.0, trend_2050=0.0,
            data_source="N/A", applicable=False,
            notes="Asset not in coastal region — coastal flood not applicable",
        )
    baseline = WRI_BASELINE.get(region, WRI_BASELINE["global"])["coastal_flood"]
    slr = ssp.slr(year, region)
    # SLR amplifies coastal flood frequency (IPCC AR6 Ch9 Fig 9.28)
    slr_amplifier = 1 + slr * 3.5     # +3.5× risk per metre of SLR
    severity = min(5.0, baseline * slr_amplifier)
    prob = min(0.80, baseline / 5.0 * slr_amplifier * 0.20)
    loss = min(0.30, max(0.0, (severity - 1.0) * 0.045))

    slr30 = ssp.slr(2030, region); slr50 = ssp.slr(2050, region)

    return HazardScore(
        hazard="flood_coastal",
        annual_probability=round(prob, 4),
        severity_index=round(severity, 2),
        production_loss_pct=round(loss, 4),
        trend_2030=round(min(5.0, baseline * (1 + slr30 * 3.5)), 2),
        trend_2050=round(min(5.0, baseline * (1 + slr50 * 3.5)), 2),
        data_source="WRI Aqueduct 4.0 (coastal) + IPCC AR6 Ch9 SLR projections",
        notes=f"SLR {slr:.3f}m by {year} (region {region}); compound storm-surge amplification",
    )


def _sea_level_rise(region: str, ssp: SSPScenario, year: int,
                    is_coastal: bool, elevation_m: float) -> HazardScore:
    """
    Chronic SLR inundation risk for low-lying coastal assets.
    Source: IPCC AR6 Ch9 + NOAA SLR viewer proxy.
    """
    if not is_coastal or elevation_m > 20:
        return HazardScore(
            hazard="sea_level_rise", annual_probability=0.0, severity_index=0.0,
            production_loss_pct=0.0, trend_2030=0.0, trend_2050=0.0,
            data_source="N/A", applicable=False,
            notes=f"{'Inland asset' if not is_coastal else f'Elevation {elevation_m:.0f}m > 20m threshold'} — SLR not material",
        )
    slr = ssp.slr(year, region)
    # Low-elevation assets (<5m) face higher chronic inundation risk
    elev_factor = max(0.1, 1 - elevation_m / 20.0)   # 0.75 at 5m, 0.25 at 15m
    severity = min(5.0, slr * 5 * elev_factor * 2.0)
    prob = min(0.70, severity / 5.0 * 0.30)
    loss = min(0.40, severity * 0.04 * elev_factor)

    slr30 = ssp.slr(2030, region); slr50 = ssp.slr(2050, region)

    return HazardScore(
        hazard="sea_level_rise",
        annual_probability=round(prob, 4),
        severity_index=round(severity, 2),
        production_loss_pct=round(loss, 4),
        trend_2030=round(min(5.0, slr30 * 5 * elev_factor * 2.0), 2),
        trend_2050=round(min(5.0, slr50 * 5 * elev_factor * 2.0), 2),
        data_source="IPCC AR6 Ch9 + NOAA SLR Viewer proxy; Copernicus DEM elevation",
        notes=f"SLR {slr:.3f}m by {year}; asset elevation ~{elevation_m:.0f}m; elev factor {elev_factor:.2f}",
    )


def _saltwater_intrusion(region: str, ssp: SSPScenario, year: int,
                         is_coastal: bool, elevation_m: float) -> HazardScore:
    """
    Saline water table / aquifer intrusion.
    Relevant for coastal assets relying on groundwater (mining dewatering,
    irrigation, drinking water for workforce).
    Source: IPCC AR6 WG2 Ch4 (freshwater security); regional SLR.
    """
    if not is_coastal:
        return HazardScore(
            hazard="saltwater_intrusion", annual_probability=0.0, severity_index=0.0,
            production_loss_pct=0.0, trend_2030=0.0, trend_2050=0.0,
            data_source="N/A", applicable=False,
            notes="Inland asset — saltwater intrusion not applicable",
        )
    slr = ssp.slr(year, region)
    water_stress = WRI_BASELINE.get(region, WRI_BASELINE["global"])["water_stress"]
    # Intrusion depends on SLR + groundwater draw-down + elevation
    elev_factor = max(0.0, 1 - elevation_m / 15.0)
    severity = min(5.0, (slr * 4 + water_stress * 0.5) * elev_factor)
    prob = min(0.60, severity / 5.0 * 0.20)
    loss = min(0.15, severity * 0.018)

    slr30 = ssp.slr(2030, region); slr50 = ssp.slr(2050, region)

    return HazardScore(
        hazard="saltwater_intrusion",
        annual_probability=round(prob, 4),
        severity_index=round(severity, 2),
        production_loss_pct=round(loss, 4),
        trend_2030=round(min(5.0, (slr30 * 4 + water_stress * 0.5) * elev_factor), 2),
        trend_2050=round(min(5.0, (slr50 * 4 + water_stress * 0.5) * elev_factor), 2),
        data_source="IPCC AR6 WG2 Ch4 + WRI Aqueduct water stress; SLR-driven intrusion model",
        notes=f"SLR {slr:.3f}m; coastal elevation {elevation_m:.0f}m; water stress base {water_stress:.1f}/5",
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
    loss = min(0.20, max(0.0, (severity - 1.5) * 0.025))

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
    loss = min(0.35, max(0.0, (severity - 2.0) * 0.04))

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
    # Base cyclone frequency by region (annual p of Category 3+ landfall near asset)
    base_prob = {
        "AU-QLD": 0.12, "AU-WA": 0.08, "AU-NT": 0.10,
        "IN-MH": 0.06, "ID-KI": 0.04, "BR-PA": 0.03,
        "US-TX": 0.10, "ZA": 0.04,
    }.get(region, 0.05)
    warming = ssp.regional_warming(year, region)
    intensity_change = 1 + CYCLONE_INTENSITY_PCT_PER_DEG_C * warming / 100
    # Fewer but more intense (net: frequency decreases slightly but damage up)
    prob = min(0.40, base_prob * (1 - 0.03 * warming))
    severity = min(5.0, 3.0 * intensity_change)
    loss = min(0.50, severity * 0.06 * base_prob * 10)

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
        data_source="IBTRACS v4 (historical tracks) + IPCC AR6 Ch11.7; Knutson et al. 2020",
        notes=f"Cat3+ annual p {base_prob:.2f}; intensity +{(intensity_change-1)*100:.1f}% vs baseline",
    )


def _drought(region: str, ssp: SSPScenario, year: int) -> HazardScore:
    """
    Meteorological + hydrological drought intensity and duration.
    Source: WRI Aqueduct (baseline) + IPCC AR6 Ch11.6 (PDSI projections).
    """
    baseline = WRI_BASELINE.get(region, WRI_BASELINE["global"])["drought"]
    warming = ssp.regional_warming(year, region)
    # Drought intensifies non-linearly with warming (IPCC AR6 — PDSI scaling)
    drought_mult = 1 + warming * 0.22 + warming ** 2 * 0.04
    severity = min(5.0, baseline * drought_mult)
    prob = min(0.80, severity / 5.0 * 0.30)
    loss = min(0.25, max(0.0, (severity - 2.0) * 0.030))

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
        data_source="WRI Aqueduct 4.0 + IPCC AR6 Ch11.6 PDSI scaling",
        notes=f"Drought multiplier {drought_mult:.2f}× at {warming:.2f}°C regional warming",
    )


def _water_stress(region: str, ssp: SSPScenario, year: int) -> HazardScore:
    """
    Chronic freshwater scarcity — water withdrawal vs availability.
    Source: WRI Aqueduct 4.0 (primary); FAO AQUASTAT; IPCC AR6 WG2 Ch4.
    """
    baseline = WRI_BASELINE.get(region, WRI_BASELINE["global"])["water_stress"]
    warming = ssp.regional_warming(year, region)
    # Water stress: demand grows with population/industry; supply shrinks with warming
    stress_mult = 1 + warming * 0.15   # ~15% increase in stress per °C
    severity = min(5.0, baseline * stress_mult)
    prob = min(0.95, severity / 5.0 * 0.55)   # water stress is chronic, not event
    loss = min(0.20, max(0.0, (severity - 2.5) * 0.025))

    w30 = ssp.regional_warming(2030, region); w50 = ssp.regional_warming(2050, region)

    return HazardScore(
        hazard="water_stress",
        annual_probability=round(prob, 4),
        severity_index=round(severity, 2),
        production_loss_pct=round(loss, 4),
        trend_2030=round(min(5.0, baseline * (1 + w30 * 0.15)), 2),
        trend_2050=round(min(5.0, baseline * (1 + w50 * 0.15)), 2),
        data_source="WRI Aqueduct 4.0 + IPCC AR6 WG2 Ch4; FAO AQUASTAT",
        notes=f"Baseline water stress {baseline:.1f}/5; stress multiplier {stress_mult:.2f}×",
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

        # Resolve geographic context
        elevation = elevation_override if elevation_override is not None else \
            REGION_ELEVATION_M.get(region, 300)
        is_coastal = region in COASTAL_REGIONS
        lulc = REGION_LULC.get(region, LULCType.GRASSLAND)

        # Compute all 9 hazards
        hazards: dict[str, HazardScore] = {
            "heat_stress":          _heat_stress(region, scenario, year),
            "flood_riverine":       _flood_riverine(region, scenario, year, lulc),
            "flood_coastal":        _flood_coastal(region, scenario, year, is_coastal),
            "sea_level_rise":       _sea_level_rise(region, scenario, year, is_coastal, elevation),
            "saltwater_intrusion":  _saltwater_intrusion(region, scenario, year, is_coastal, elevation),
            "landslide":            _landslide(region, scenario, year, elevation, lulc),
            "wildfire":             _wildfire(region, scenario, year, lulc),
            "cyclone":              _cyclone(region, scenario, year, is_coastal),
            "drought":              _drought(region, scenario, year),
            "water_stress":         _water_stress(region, scenario, year),
        }

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

        # Peak 2050 loss
        peak_profile = self.assess(
            asset_id, asset_name, region, 2050,
            ssp=scenario.id, lat=lat, lon=lon,
            elevation_override=elevation_override,
        ) if year != 2050 else None
        peak_loss = peak_profile.annual_loss_pct if peak_profile else total_loss

        # Top hazards by severity
        top = sorted(
            [(k, v.severity_index) for k, v in hazards.items() if v.applicable and v.severity_index > 1.0],
            key=lambda x: x[1], reverse=True
        )[:3]
        top_names = [t[0].replace("_", " ").title() for t in top]

        # Critical year (when cumulative loss exceeds 5%)
        critical_year = None
        for yr in range(year, 2051, 5):
            p = self.assess(asset_id, asset_name, region, yr, ssp=scenario.id,
                            lat=lat, lon=lon, elevation_override=elevation_override)
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
            lulc_type=lulc,
            ssp=scenario.id,
            hazards=hazards,
            physical_risk_score=round(score, 1),
            annual_loss_pct=round(total_loss, 4),
            peak_loss_2050_pct=round(peak_loss, 4),
            top_hazards=top_names,
            critical_year=critical_year,
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
    ) -> dict[int, AssetHazardProfile]:
        """Assess hazard profiles across a list of years."""
        return {
            yr: self.assess(asset_id, asset_name, region, yr, ssp=ssp, lat=lat, lon=lon)
            for yr in years
        }
