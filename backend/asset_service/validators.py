"""
ClimRisk — Asset Coordinate Validator

Validates GPS coordinates and asset metadata before PostGIS insert.
Does NOT make external geocoding calls — uses embedded IPCC AR6 region
centroids + bounding boxes for fast offline validation.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

from ..shared.schemas import AssetType


# IPCC AR6 region bounding boxes [min_lat, max_lat, min_lon, max_lon]
# Source: IPCC AR6 WGI Chapter 1 reference region definitions
_AR6_REGIONS: dict[str, tuple[float, float, float, float]] = {
    "EEU":  ( 45,  70,  20,  60),  "NEU":  ( 48,  72, -10,  40),
    "WCE":  ( 45,  55,   5,  25),  "MED":  ( 30,  46, -10,  45),
    "NAF":  ( 15,  38, -20,  60),  "WAF":  ( -5,  15, -20,  25),
    "CAF":  (-10,  10,  10,  35),  "ESAF": (-35, -10,  25,  50),
    "SAF":  (-35,  15, -20,  55),  "MDG":  (-26, -12,  43,  51),
    "ARP":  ( 15,  40,  36,  60),  "WSB":  ( 55,  75,  60,  90),
    "ESB":  ( 55,  75,  90, 140),  "RFE":  ( 48,  78, 100, 170),
    "WCA":  ( 30,  55,  45,  75),  "ECA":  ( 35,  55,  75, 100),
    "TIB":  ( 28,  40,  75, 105),  "EAS":  ( 18,  53, 100, 150),
    "SAS":  (  5,  35,  60, 100),  "SEA":  (-10,  28,  95, 150),
    "NAU":  (-20,  -5, 115, 150),  "CAU":  (-35, -20, 115, 145),
    "EAU":  (-40, -20, 145, 155),  "SAU":  (-45, -30, 110, 145),
    "NZ":   (-47, -34, 165, 178),  "GIC":  ( 60,  85, -45,  30),
    "NCA":  ( 30,  80,-170, -60),  "CAM":  ( 10,  30,-120, -60),
    "SAM":  (-56,  12, -82, -34),  "NES":  (  5,  12, -82, -50),
    "NSA":  ( -5,  12, -82, -50),  "NWS":  ( -5,  10, -82, -60),
    "SAO":  (-60,  30, -70,  20),  "SIO":  (-60, -10,  30, 100),
    "SPO":  (-60,  30, 100, -70),  "NPO":  ( 30,  65, 100,-120),
    "EIO":  (-10,  10,  60, 100),  "ARC":  ( 70,  90,-180, 180),
    "ANT":  (-90, -60,-180, 180),
}

# Sector accepted values (mirrors _PRED_DMG keys in the platform JS)
VALID_SECTORS = {
    "Oil & Gas", "Steel & Metals", "Mining", "Chemical & Pharmaceutical",
    "Real Estate", "Utilities & Power", "Agriculture & Food", "Transport",
    "Technology", "Automotive", "Textile & Apparel", "Retail & Consumer",
    "Banking & Finance", "Insurance", "Other",
}


@dataclass
class ValidationResult:
    errors: list[str]
    warnings: list[str]
    inferred_region: str | None = None


class AssetValidator:
    """Validates incoming asset metadata before pipeline ingestion."""

    def validate(
        self,
        lat: float,
        lon: float,
        asset_type: AssetType | None = None,
        sector: str | None = None,
        book_value_usd: float | None = None,
    ) -> dict[str, Any]:
        errors: list[str] = []
        warnings: list[str] = []

        # 1. Coordinate bounds
        if not (-90 <= lat <= 90):
            errors.append(f"Latitude {lat} out of range [-90, 90]")
        if not (-180 <= lon <= 180):
            errors.append(f"Longitude {lon} out of range [-180, 180]")

        # 2. Null island check (0,0 is ocean — valid coordinate but a common data error)
        if abs(lat) < 0.5 and abs(lon) < 0.5:
            warnings.append("Coordinates near (0,0) — verify this is correct (Gulf of Guinea)")

        # 3. Sector validation
        if sector and sector not in VALID_SECTORS:
            warnings.append(
                f"Sector '{sector}' not in standard list — "
                f"will not match NGFS damage functions. Use one of: {sorted(VALID_SECTORS)}"
            )

        # 4. Book value sanity
        if book_value_usd is not None:
            if book_value_usd < 0:
                errors.append("book_value_usd cannot be negative")
            elif book_value_usd > 1e13:
                warnings.append("book_value_usd exceeds 10 trillion — verify unit (should be USD not $M)")
            elif book_value_usd < 1000 and book_value_usd > 0:
                warnings.append("book_value_usd very small — ensure value is in USD (not $M or $B)")

        # 5. Infer IPCC region
        region = self._infer_region(lat, lon)

        return {
            "errors": errors,
            "warnings": warnings,
            "inferred_region": region,
        }

    def _infer_region(self, lat: float, lon: float) -> str | None:
        """Find the AR6 region whose bounding box contains the point."""
        for code, (mn_lat, mx_lat, mn_lon, mx_lon) in _AR6_REGIONS.items():
            if mn_lat <= lat <= mx_lat and mn_lon <= lon <= mx_lon:
                return code
        # Fallback: nearest centroid
        return self._nearest_region(lat, lon)

    def _nearest_region(self, lat: float, lon: float) -> str | None:
        best, best_d = None, float("inf")
        for code, (mn_lat, mx_lat, mn_lon, mx_lon) in _AR6_REGIONS.items():
            clat = (mn_lat + mx_lat) / 2
            clon = (mn_lon + mx_lon) / 2
            d = math.hypot(lat - clat, lon - clon)
            if d < best_d:
                best, best_d = code, d
        return best
