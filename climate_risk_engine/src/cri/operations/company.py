"""Translate scenario drivers into company-level operational trajectories.

This is where the shape of the V2 model lives — but corrected: emissions
and capex are allocated per-asset/segment (no triple counting), Scope 3
is tracked separately, and margin is *derived* from revenue and cost
structure rather than assumed constant.
"""

from __future__ import annotations

from dataclasses import dataclass

from ..climate.physical import adaptation_capex, expected_loss_fraction
from ..climate.transition import TransitionDrivers, demand_shift, price_at, resolve
from ..climate.hazard_layers import PhysicalHazardEngine
from ..climate.ssp_scenarios import ngfs_to_ssp
from ..data.schemas import Asset, Company, Scenario, ScenarioFamily, SegmentBaseline
from ..financial.abatement import (
    coverage_after_abatement,
    transition_capex as compute_transition_capex,
)

# Module-level singleton — avoid re-instantiating on every compute_year call
_HAZARD_ENGINE = PhysicalHazardEngine()

# Map ScenarioFamily → SSP id for PhysicalHazardEngine
_FAMILY_TO_SSP: dict[ScenarioFamily, str] = {
    ScenarioFamily.NZE_2050: "ssp126",
    ScenarioFamily.BELOW_2C_ORDERLY: "ssp245",
    ScenarioFamily.DELAYED_TRANSITION: "ssp245",
    ScenarioFamily.CURRENT_POLICIES: "ssp370",
    ScenarioFamily.CUSTOM: "ssp245",
}


@dataclass
class OperationalYear:
    """One year of operational output for a whole company."""

    year: int
    revenue: float
    opex: float
    carbon_cost: float
    physical_loss_cost: float
    emissions_scope1: float
    emissions_scope2: float
    emissions_scope3: float
    adaptation_capex: float
    transition_capex: float
    stranded_writedown: float
    revenue_by_commodity: dict[str, float]
    stranded_assets: list[str]
    # Per-hazard dollar cost breakdown (USD) — populated by PhysicalHazardEngine
    physical_loss_by_hazard: dict[str, float] = None   # type: ignore[assignment]

    def __post_init__(self):
        if self.physical_loss_by_hazard is None:
            self.physical_loss_by_hazard = {}


# ---------------------------------------------------------------------------
# Per-asset computation
# ---------------------------------------------------------------------------


def _volume_for_asset(
    asset: Asset,
    drivers: TransitionDrivers,
    year: int,
    scenario: Scenario,
) -> float:
    """Expected produced volume after demand-side shift and physical loss."""
    shift = demand_shift(drivers, asset.commodity)
    # Fully inelastic default (elasticity=1.0) — volume moves 1-to-1 with demand
    elasticity = drivers.commodity_elasticity.get(asset.commodity, 1.0)
    volume_after_demand = asset.baseline_production * (1.0 + elasticity * shift)

    loss = expected_loss_fraction(scenario, asset, year)
    return max(0.0, volume_after_demand * (1.0 - loss))


def _asset_contribution(
    asset: Asset,
    drivers: TransitionDrivers,
    year: int,
    scenario: Scenario,
) -> dict:
    price = price_at(drivers, asset.commodity) or 0.0
    volume = _volume_for_asset(asset, drivers, year, scenario)
    revenue = price * volume

    # Opex with a simple energy-cost index. Rising carbon price pushes up
    # energy cost; scenario commodity-price path absorbs some of it.
    energy_inflator = 1.0 + 0.5 * (drivers.carbon_price / 100.0)  # placeholder curve
    unit_cost = (
        asset.baseline_unit_cost
        * (1 - asset.energy_cost_share + asset.energy_cost_share * energy_inflator)
    )
    opex = volume * unit_cost

    # Emissions — only Scope 1 + 2 directly priced, Scope 3 tracked but not costed
    s1 = volume * asset.emissions.scope1_intensity
    s2 = volume * asset.emissions.scope2_intensity
    s3 = volume * asset.emissions.scope3_intensity

    priced_emissions = (s1 + s2) * asset.emissions.carbon_price_coverage * (
        1 - asset.emissions.free_allocation
    )
    carbon_cost = priced_emissions * drivers.carbon_price

    # Physical loss cost — computed with per-hazard breakdown via PhysicalHazardEngine
    # This ensures the financial loss is attributed to individual hazards (heat, flood,
    # drought, cyclone, etc.) so disclosure reports show meaningful differentiation.
    undisrupted_volume = (
        asset.baseline_production
        * (1.0 + drivers.commodity_elasticity.get(asset.commodity, 1.0)
           * demand_shift(drivers, asset.commodity))
    )
    margin_per_unit = max(0.0, price - unit_cost)

    ssp_id = _FAMILY_TO_SSP.get(scenario.family, "ssp245")
    try:
        hazard_profile = _HAZARD_ENGINE.assess(
            asset.id, asset.name, asset.region, year,
            ssp=ssp_id, _depth=1,   # _depth=1 skips recursive critical_year/peak sub-calls
        )
        # Per-hazard dollar cost = foregone_volume_from_hazard × margin
        physical_loss_by_hazard: dict[str, float] = {}
        total_survival = 1.0
        for hname, h in hazard_profile.hazards.items():
            if h.applicable and h.production_loss_pct > 0:
                hazard_loss_cost = undisrupted_volume * h.production_loss_pct * margin_per_unit
                physical_loss_by_hazard[hname] = round(hazard_loss_cost, 2)
                total_survival *= (1.0 - h.production_loss_pct)
        total_loss_frac = 1.0 - total_survival
        physical_loss_cost = undisrupted_volume * total_loss_frac * margin_per_unit
    except Exception:
        # Fall back to scenario-based loss if hazard engine unavailable
        loss = expected_loss_fraction(scenario, asset, year)
        physical_loss_cost = undisrupted_volume * loss * margin_per_unit
        physical_loss_by_hazard = {"combined": round(physical_loss_cost, 2)}

    return {
        "commodity": asset.commodity.value,
        "revenue": revenue,
        "opex": opex,
        "carbon_cost": carbon_cost,
        "physical_loss_cost": physical_loss_cost,
        "physical_loss_by_hazard": physical_loss_by_hazard,
        "scope1": s1,
        "scope2": s2,
        "scope3": s3,
        "adaptation_capex": adaptation_capex(scenario, asset, year),
    }


# ---------------------------------------------------------------------------
# Per-segment fallback (when no asset-level data is available)
# ---------------------------------------------------------------------------


def _segment_contribution(
    segment: SegmentBaseline,
    drivers: TransitionDrivers,
    year: int,
) -> dict:
    shift = demand_shift(drivers, segment.commodity)
    elasticity = drivers.commodity_elasticity.get(segment.commodity, 1.0)
    volume = segment.volume_baseline * (1.0 + elasticity * shift)

    price = price_at(drivers, segment.commodity) or 0.0
    revenue = price * volume

    # Opex derived from baseline EBITDA margin, then inflated by carbon exposure
    baseline_opex = segment.revenue_baseline * (1.0 - segment.ebitda_margin_baseline)
    energy_inflator = 1.0 + 0.3 * (drivers.carbon_price / 100.0)
    opex = baseline_opex * (volume / max(segment.volume_baseline, 1e-9)) * energy_inflator

    s1 = volume * segment.emissions.scope1_intensity
    s2 = volume * segment.emissions.scope2_intensity
    s3 = volume * segment.emissions.scope3_intensity

    priced_emissions = (s1 + s2) * segment.emissions.carbon_price_coverage * (
        1 - segment.emissions.free_allocation
    )
    carbon_cost = priced_emissions * drivers.carbon_price

    return {
        "commodity": segment.commodity.value,
        "revenue": revenue,
        "opex": opex,
        "carbon_cost": carbon_cost,
        "physical_loss_cost": 0.0,     # segment fallback has no geography
        "scope1": s1,
        "scope2": s2,
        "scope3": s3,
        "adaptation_capex": 0.0,
    }


# ---------------------------------------------------------------------------
# Company simulation
# ---------------------------------------------------------------------------


def simulate_year(
    company: Company,
    scenario: Scenario,
    year: int,
) -> OperationalYear:
    """Aggregate operational outputs for one year for one company."""
    drivers = resolve(scenario, year, region=company.hq_region)

    contributions: list[dict] = []

    if company.assets:
        contributions.extend(
            _asset_contribution(a, drivers, year, scenario) for a in company.assets
        )
    # Segments can be used alongside assets (for bits of the business we
    # haven't modelled asset-by-asset yet)
    contributions.extend(
        _segment_contribution(s, drivers, year) for s in company.segments
    )

    agg_revenue = sum(c["revenue"] for c in contributions)
    agg_opex = sum(c["opex"] for c in contributions)
    agg_carbon_cost = sum(c["carbon_cost"] for c in contributions)
    agg_physical = sum(c["physical_loss_cost"] for c in contributions)
    agg_adapt_capex = sum(c["adaptation_capex"] for c in contributions)

    revenue_by_commodity: dict[str, float] = {}
    for c in contributions:
        revenue_by_commodity[c["commodity"]] = (
            revenue_by_commodity.get(c["commodity"], 0.0) + c["revenue"]
        )

    # Aggregate per-hazard loss costs across all assets
    agg_hazard_losses: dict[str, float] = {}
    for c in contributions:
        for hazard, cost in c.get("physical_loss_by_hazard", {}).items():
            agg_hazard_losses[hazard] = agg_hazard_losses.get(hazard, 0.0) + cost

    return OperationalYear(
        year=year,
        revenue=agg_revenue,
        opex=agg_opex,
        carbon_cost=agg_carbon_cost,
        physical_loss_cost=agg_physical,
        physical_loss_by_hazard=agg_hazard_losses,
        emissions_scope1=sum(c["scope1"] for c in contributions),
        emissions_scope2=sum(c["scope2"] for c in contributions),
        emissions_scope3=sum(c["scope3"] for c in contributions),
        adaptation_capex=agg_adapt_capex,
        transition_capex=0.0,   # wired up in Phase 2 via MACC
        stranded_writedown=0.0,  # wired up in Phase 2
        stranded_assets=[],      # wired up in Phase 2
        revenue_by_commodity=revenue_by_commodity,
    )


def simulate(company: Company, scenario: Scenario) -> list[OperationalYear]:
    start, end = scenario.horizon
    return [simulate_year(company, scenario, y) for y in range(start, end + 1)]
