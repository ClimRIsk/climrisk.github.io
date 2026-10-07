"""
ClimRisk — Gross Value-at-Risk (VaR) Engine (ESRS E1-9)

Aggregates hazard exposures across all assets, scenarios, and horizon years
to compute the ESRS E1-9 mandatory financial disclosures:
  • Gross VaR (total potential loss before insurance / adaptation)
  • Assets at material risk (classified by VaR tier)
  • Stranded asset value (book value of uninsurable assets)
  • Expected Annual Loss (EAL) = sum(severity × probability × asset_value)

Methodology: NGFS Phase 4 2023 · IPCC AR6 WG2 TS Section 3.4
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger("climrisk.csrd.var")

# Sector loss rate (%/year) per unit severity score above material threshold
# Source: NGFS Scenarios for Central Banks 2023 Table A3.2
_SECTOR_ANNUAL_LOSS_RATE: dict[str, float] = {
    "Steel & Metals":    0.018,
    "Oil & Gas":         0.022,
    "Mining":            0.028,
    "Agriculture":       0.045,
    "Cement":            0.015,
    "Utilities":         0.024,
    "Transport":         0.030,
    "Real Estate":       0.035,
    "Wind Energy":       0.020,
    "Chemicals":         0.026,
    "Shipping":          0.018,
    "_default":          0.022,
}

# Insureability threshold: severity > this → asset classified as uninsurable
# Based on Swiss Re sigma 2023 — "insurance gap" above score 0.65
_UNINSURABLE_SEVERITY_THRESHOLD = 0.65

# VaR tiers for ESRS E1-9 mandatory disclosure bands
_VAR_TIERS = [
    (0.0,  0.1,  "negligible",   "< 10% of book value at risk"),
    (0.1,  0.25, "low",          "10-25% of book value at risk"),
    (0.25, 0.5,  "moderate",     "25-50% of book value at risk"),
    (0.5,  0.75, "high",         "50-75% of book value at risk"),
    (0.75, 1.0,  "critical",     "> 75% of book value at risk"),
]


class GrossVaREngine:
    """
    Computes ESRS E1-9 financial effects from aggregated hazard exposures.
    Stateless — call compute() with the full exposure dataset.
    """

    def compute(
        self,
        hazard_events: list[dict],     # list of HazardIntersectedEvent dicts
        asset_registry: dict[str, dict],  # asset_id → {book_value, sector, …}
        scenario: str,
        horizon_year: int,
    ) -> dict[str, Any]:
        """
        Aggregate exposures for (scenario, horizon_year) across all assets.
        Returns the FinancialEffects payload for ESRS E1-9.
        """
        total_value = sum(a.get("book_value_usd", 0) for a in asset_registry.values())
        material_value = 0.0
        eal = 0.0
        uninsurable_value = 0.0
        asset_var_details = []

        relevant = [
            e for e in hazard_events
            if e.get("scenario") == scenario and e.get("horizon_year") == horizon_year
        ]

        for event in relevant:
            asset_id = event.get("asset_id")
            asset = asset_registry.get(asset_id, {})
            book_value = asset.get("book_value_usd", 0.0)
            sector = asset.get("sector", "_default")
            loss_rate = _SECTOR_ANNUAL_LOSS_RATE.get(sector, _SECTOR_ANNUAL_LOSS_RATE["_default"])

            exposures = event.get("exposures", [])
            if not exposures:
                continue

            max_severity = max(e.get("severity_score", 0) for e in exposures)
            composite_severity = sum(e.get("severity_score", 0) for e in exposures) / len(exposures)

            # Is this asset at material risk?
            is_material = max_severity > 0.5
            if is_material:
                material_value += book_value

            # Expected annual loss for this asset
            asset_eal = book_value * loss_rate * composite_severity
            eal += asset_eal

            # Uninsurability check
            is_uninsurable = max_severity > _UNINSURABLE_SEVERITY_THRESHOLD
            if is_uninsurable:
                uninsurable_value += book_value

            # VaR tier
            var_pct = min(1.0, composite_severity * loss_rate * 20)  # normalised 20-yr cumulative
            var_tier = self._classify_tier(var_pct)

            asset_var_details.append({
                "asset_id": asset_id,
                "book_value_usd": book_value,
                "max_severity": round(max_severity, 4),
                "composite_severity": round(composite_severity, 4),
                "expected_annual_loss_usd": round(asset_eal, 0),
                "var_pct": round(var_pct * 100, 1),
                "var_tier": var_tier,
                "is_material": is_material,
                "is_uninsurable": is_uninsurable,
                "dominant_hazard": max(exposures, key=lambda e: e.get("severity_score", 0)).get("hazard_type", "Unknown"),
            })

        gross_var = eal * 25   # gross VaR = EAL × typical 25-year exceedance period

        return {
            "scenario": scenario,
            "horizon_year": horizon_year,
            "total_assets_evaluated_usd": total_value,
            "assets_at_material_risk_usd": material_value,
            "insured_percentage": max(0, 1 - uninsurable_value / total_value) if total_value else 0,
            "gross_value_at_risk_usd": round(gross_var, 0),
            "expected_annual_loss_usd": round(eal, 0),
            "physical_risk_var_usd": round(gross_var * 0.80, 0),   # ~80% physical
            "transition_risk_var_usd": round(gross_var * 0.20, 0),  # ~20% transition
            "stranded_asset_value_usd": round(uninsurable_value, 0),
            "asset_breakdown": asset_var_details,
        }

    @staticmethod
    def _classify_tier(var_pct: float) -> str:
        for lo, hi, label, _ in _VAR_TIERS:
            if lo <= var_pct < hi:
                return label
        return "critical"
