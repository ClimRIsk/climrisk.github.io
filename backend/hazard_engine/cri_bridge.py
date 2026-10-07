"""
ClimRisk — Bridge from backend to the CRI Python engine

Maps (lon, lat) → nearest IPCC AR6 region code → CRI hazard scores.
Used as fallback when no GeoTIFF tile covers the queried coordinates.

This calls the same logic embedded in the JS platform but via Python.
"""

from __future__ import annotations

import math
from typing import Any

# ── IPCC AR6 region centroids (lon, lat) ─────────────────────────────────────
# Subset of the full REGION_CENTROIDS table in the platform.
# Extended with all regions where CRI data exists.
_REGION_CENTROIDS: dict[str, tuple[float, float]] = {
    # India
    "IN-MH": (73.9, 19.0), "IN-RJ": (74.0, 27.0), "IN-GJ": (71.5, 22.5),
    "IN-OD": (85.1, 20.9), "IN-JH": (85.9, 23.6), "IN-AP": (79.7, 15.9),
    "IN-TN": (78.7, 11.1), "IN-KA": (75.7, 14.5), "IN-WB": (87.9, 22.6),
    "IN-MP": (77.4, 23.5), "IN-UP": (81.0, 26.8),
    # Europe
    "NL-NH": (4.9, 52.4), "GB-ENG": (-1.5, 52.5), "GB-WLS": (-3.8, 52.1),
    "GB-SCT": (-4.2, 56.5), "DE-HH": (10.0, 53.5), "DE-BY": (11.5, 48.8),
    "FR-IDF": (2.3, 48.6), "ES-CT": (1.5, 41.8), "ES-MD": (-3.7, 40.4),
    "IT-LOM": (9.3, 45.4), "NO-01": (10.8, 59.9), "SE-AB": (18.0, 59.5),
    "FI-01": (24.9, 60.2), "PL-MA": (19.9, 50.0), "BE": (4.5, 50.5),
    "CH": (8.2, 46.8), "AT": (14.5, 47.5), "DK": (10.0, 56.0),
    "PT": (-8.0, 39.5), "RO": (24.9, 45.9),
    # US
    "US-TX": (-99.0, 31.0), "US-GA": (-84.4, 33.7), "US-FL": (-81.6, 27.7),
    "US-CA": (-119.5, 36.5), "US-NY": (-75.5, 42.9), "US-IL": (-89.2, 40.0),
    "US-MN": (-94.6, 46.4), "US-WY": (-107.6, 43.0), "US-OK": (-97.5, 35.5),
    # Australia
    "AU-WA": (122.0, -26.0), "AU-QLD": (145.0, -20.0), "AU-NSW": (146.0, -32.0),
    "AU-VIC": (144.0, -37.0), "AU-SA": (136.0, -30.0), "AU-NT": (133.0, -20.0),
    # Other
    "ZA": (25.0, -29.0), "BR-PA": (-52.0, -3.0), "CL-02": (-68.5, -24.0),
    "CN-NM": (115.0, 42.0), "CN-BJ": (116.4, 39.9), "CN-GD": (113.3, 23.1),
    "MN-01": (107.0, 47.9), "ID-KI": (115.0, 0.0), "VN": (106.0, 16.0),
    "TH": (101.0, 15.5), "CA-AB": (-115.0, 55.0), "CA-QC": (-72.0, 53.0),
}

# ── Simplified WRI hazard baselines (mirrors JS platform WRI_BASELINE) ────────
_WRI_BASELINE: dict[str, dict[str, float]] = {
    "IN-MH": {"rf":3.2,"cf":2.0,"ht":3.8,"dr":2.5,"ws":3.0},
    "IN-RJ": {"rf":1.5,"cf":0.5,"ht":4.5,"dr":4.2,"ws":4.0},
    "IN-GJ": {"rf":2.0,"cf":2.5,"ht":4.2,"dr":3.5,"ws":3.5},
    "AU-WA": {"rf":1.5,"cf":1.8,"ht":4.0,"dr":3.8,"ws":3.5},
    "AU-QLD":{"rf":2.5,"cf":2.8,"ht":3.5,"dr":2.0,"ws":2.0},
    "NL-NH": {"rf":2.8,"cf":3.2,"ht":1.5,"dr":1.2,"ws":1.0},
    "GB-ENG":{"rf":2.5,"cf":2.0,"ht":1.2,"dr":1.0,"ws":0.8},
    "US-TX": {"rf":2.2,"cf":1.5,"ht":3.5,"dr":3.0,"ws":2.5},
    "US-FL": {"rf":2.0,"cf":3.5,"ht":3.2,"dr":1.5,"ws":1.2},
    "_global":{"rf":2.0,"cf":1.5,"ht":2.5,"dr":2.5,"ws":2.0},
}

# IPCC AR6 SSP global mean surface temperature by year (above 1850-1900)
_SSP_GMST: dict[str, list[tuple[int, float]]] = {
    "SSP1-2.6": [(2025,1.20),(2030,1.30),(2035,1.38),(2040,1.44),(2045,1.48),(2050,1.50)],
    "SSP2-4.5": [(2025,1.22),(2030,1.38),(2035,1.54),(2040,1.70),(2045,1.84),(2050,1.96)],
    "SSP3-7.0": [(2025,1.25),(2030,1.45),(2035,1.67),(2040,1.90),(2045,2.14),(2050,2.38)],
    "SSP5-8.5": [(2025,1.30),(2030,1.60),(2035,1.93),(2040,2.28),(2045,2.64),(2050,3.00)],
}

_REG_AMP: dict[str, float] = {
    "IN-RJ":1.6,"AU-WA":1.5,"ES-CT":1.5,"ZA":1.5,"US-TX":1.4,
    "NO-01":2.2,"SE-AB":2.0,"FI-01":2.1,"CA-AB":1.8,
    "IN-MH":1.1,"ID-KI":1.1,"TH":1.0,"VN":1.0,
}


def _gmst(scenario: str, year: int) -> float:
    anchors = _SSP_GMST.get(scenario, _SSP_GMST["SSP2-4.5"])
    for i, (yr, t) in enumerate(anchors[:-1]):
        if yr <= year <= anchors[i+1][0]:
            frac = (year - yr) / (anchors[i+1][0] - yr)
            return t + frac * (anchors[i+1][1] - t)
    return anchors[-1][1]


def _regW(scenario: str, year: int, region: str) -> float:
    return _gmst(scenario, year) * _REG_AMP.get(region, 1.25)


def _nearest_region(lon: float, lat: float) -> str:
    best_r, best_d = "_global", float("inf")
    for r, (rlon, rlat) in _REGION_CENTROIDS.items():
        d = math.sqrt((lon - rlon)**2 + (lat - rlat)**2)
        if d < best_d:
            best_d, best_r = d, r
    return best_r


def score_point_cri(
    lon: float, lat: float, scenario: str, horizon_year: int, sector: str
) -> dict[str, Any]:
    """
    Synchronous CRI scoring using embedded IPCC AR6 hazard logic.
    Called via run_in_executor so it doesn't block the event loop.
    """
    region = _nearest_region(lon, lat)
    bl = _WRI_BASELINE.get(region, _WRI_BASELINE["_global"])
    w = _regW(scenario, horizon_year, region)

    # Hazard computations (simplified mirrors of JS _hz_* functions)
    precip_factor = 1 + 0.07 * w        # Clausius-Clapeyron +7%/°C
    drought_mult = 1 + w * 0.22 + w * w * 0.04

    scores = [
        ("Riverine Flood",  min(1.0, bl["rf"] * precip_factor / 5)),
        ("Extreme Heat",    min(1.0, bl["ht"] * (1 + w * 0.35) / 5)),
        ("Drought",         min(1.0, bl["dr"] * drought_mult / 5)),
        ("Water Stress",    min(1.0, bl["ws"] * (1 + w * 0.15) / 5)),
        ("Wildfire",        min(1.0, bl["ht"] * (1 + 0.12 * w) * 0.6 / 5)),
    ]
    if abs(lat) < 40:   # tropical / subtropical → cyclone possible
        scores.append(("Tropical Cyclone", min(1.0, 0.8 * (1 + w * 0.18) / 5)))

    exposures = [
        {
            "hazard_type": hz,
            "severity_score": round(sv, 4),
            "raw_score": round(sv * 100, 1),
            "data_source": f"CRI-engine:region={region}",
        }
        for hz, sv in scores if sv > 0.05
    ]

    return {
        "exposures": exposures,
        "is_material_risk": any(e["severity_score"] > 0.5 for e in exposures),
        "data_sources": [f"CRI-engine:region={region}"],
    }
