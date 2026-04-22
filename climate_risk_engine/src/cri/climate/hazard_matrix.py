"""HazardMatrix: Comprehensive physical risk assessment for assets.

Combines real open-source hazard data (WRI Aqueduct, NASA GDDP, OWID) with
scenario-embedded paths to produce a structured multi-hazard risk profile.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from ..data.schemas import Asset, Scenario, HazardType, ScenarioFamily
from .providers import (
    HazardQuery,
    HazardResult,
    PhysicalRiskProvider,
    ScenarioHazardProvider,
)
from . import nasa_heat
from ..connectors.wri_aqueduct import WRIAqueductConnector


@dataclass
class AssetHazardProfile:
    """Structured hazard assessment for one asset across multiple years."""

    asset_id: str
    asset_name: str
    region: str
    lat: Optional[float] = None
    lon: Optional[float] = None

    # Per-hazard annual probability at key years
    # {HazardType.value: {year: probability}}
    hazard_probs: dict[str, dict[int, float]] = field(default_factory=dict)

    # Aggregate expected production loss per year
    # year → expected_loss_fraction (∈ [0, 1])
    annual_loss: dict[int, float] = field(default_factory=dict)

    # Source attribution: which data source was used for each hazard
    # hazard_type → "wri_aqueduct" | "nasa_heat" | "scenario" | "owid" etc.
    sources: dict[str, str] = field(default_factory=dict)

    # Risk scores (0-5 scale, matching WRI Aqueduct convention)
    # hazard_type → risk_score
    risk_scores: dict[str, float] = field(default_factory=dict)


class HazardMatrix:
    """
    Assesses physical climate hazard for an asset using real data sources.

    Priority order:
        1. Try WRI Aqueduct API/region lookup (water, flood, drought)
        2. Use NASA NEX-GDDP proxy via IPCC AR6 (temperature → heat stress)
        3. Fall back to scenario-embedded hazard paths
    """

    def __init__(self, use_live_data: bool = False):
        """
        Initialize HazardMatrix.

        Args:
            use_live_data: If True, attempt to call WRI Aqueduct live API.
                          If False, use embedded region lookup tables.
        """
        self.use_live_data = use_live_data
        self.wri_connector = WRIAqueductConnector()

    def assess(
        self,
        asset: Asset,
        scenario_family: str,
        horizon_years: list[int],
        scenario: Optional[Scenario] = None,
    ) -> AssetHazardProfile:
        """
        Full hazard assessment for one asset.

        Args:
            asset: Asset to assess
            scenario_family: Scenario family name (e.g., 'nze_2050')
            horizon_years: List of years to evaluate (e.g., [2030, 2040, 2050])
            scenario: Optional Scenario object for fallback hazard paths.
                     If provided, scenario-embedded hazards are included.

        Returns:
            AssetHazardProfile with comprehensive hazard data across years.
        """
        profile = AssetHazardProfile(
            asset_id=asset.id,
            asset_name=asset.name,
            region=asset.region,
            lat=None,  # Not available in Asset schema yet
            lon=None,
        )

        # Get WRI Aqueduct water risk scores for the region
        water_risks = self.wri_connector.get_region_risk(asset.region, year=2030)
        profile.risk_scores["water_stress"] = water_risks.get("water_stress", 2.5)
        profile.risk_scores["flood"] = water_risks.get("flood_risk", 2.0)
        profile.risk_scores["drought"] = water_risks.get("drought_risk", 2.3)
        profile.sources["water_stress"] = "wri_aqueduct"
        profile.sources["flood"] = "wri_aqueduct"
        profile.sources["drought"] = "wri_aqueduct"

        # Get heat stress from NASA GDDP proxy via IPCC AR6
        for year in horizon_years:
            delta_c = nasa_heat.warming_delta(
                asset.region, year, scenario_family
            )
            # Convert warming delta to heat stress probability
            # Use ~1.5% baseline (higher risk regions have higher baseline)
            baseline_heat_prob = 0.015 * (profile.risk_scores.get("water_stress", 2.5) / 2.5)
            heat_prob = nasa_heat.heat_stress_probability(delta_c, baseline_heat_prob)

            if "heat_stress" not in profile.hazard_probs:
                profile.hazard_probs["heat_stress"] = {}
            profile.hazard_probs["heat_stress"][year] = min(1.0, heat_prob)

        profile.sources["heat_stress"] = "nasa_gddp_ipcc_ar6"

        # Heat stress risk score (0-5 scale)
        # Map max probability across years to 0-5
        max_heat_prob = max(profile.hazard_probs.get("heat_stress", {}).values() or [0.0])
        profile.risk_scores["heat_stress"] = min(5.0, max_heat_prob * 10.0)

        # Include scenario-embedded hazards if scenario provided
        if scenario:
            self._enrich_with_scenario(
                profile, asset, scenario, scenario_family, horizon_years
            )

        # Calculate aggregate annual loss across hazards
        self._aggregate_annual_losses(profile, horizon_years)

        return profile

    def _enrich_with_scenario(
        self,
        profile: AssetHazardProfile,
        asset: Asset,
        scenario: Scenario,
        scenario_family: str,
        horizon_years: list[int],
    ) -> None:
        """Augment profile with scenario-embedded hazard paths."""
        scenario_provider = ScenarioHazardProvider(scenario)

        for year in horizon_years:
            query = HazardQuery(
                asset=asset, year=year, scenario_family=ScenarioFamily(scenario_family)
            )
            result = scenario_provider.resolve(query)

            # Merge scenario hazards into profile
            for hazard_name, severity in result.hazards.items():
                if hazard_name not in profile.hazard_probs:
                    profile.hazard_probs[hazard_name] = {}
                # Scenario provides severity; treat as proxy for probability
                profile.hazard_probs[hazard_name][year] = min(
                    1.0, severity + profile.hazard_probs[hazard_name].get(year, 0.0)
                )
                if hazard_name not in profile.sources:
                    profile.sources[hazard_name] = "scenario_internal"

    def _aggregate_annual_losses(
        self, profile: AssetHazardProfile, horizon_years: list[int]
    ) -> None:
        """
        Aggregate hazard probabilities into expected annual production loss.

        Uses the joint no-disruption rule: if hazards are independent with
        probabilities p_1, p_2, ..., then expected loss = 1 - Π(1 - p_i).
        """
        for year in horizon_years:
            survival = 1.0
            for hazard_name, year_probs in profile.hazard_probs.items():
                prob = year_probs.get(year, 0.0)
                survival *= (1.0 - min(1.0, prob))
            expected_loss = 1.0 - survival
            profile.annual_loss[year] = min(1.0, expected_loss)
