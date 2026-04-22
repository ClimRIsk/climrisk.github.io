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
from ..data.schemas import Asset, Company, Scenario, SegmentBaseline
from ..financial.abatement import (
    coverage_after_abatement,
    transition_capex as compute_transition_capex,
)


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

    # Physical loss cost: value of the foregone production at gross margin
    # (revenue - variable opex). A proxy for lost contribution.
    loss = expected_loss_fraction(scenario, asset, year)
    undisrupted_volume = asset.baseline_production * (1.0 + drivers.commodity_elasticity.get(asset.commodity, 1.0) * demand_shift(drivers, asset.commodity))
    foregone_volume = undisrupted_volume * loss
    physical_loss_cost = foregone_volume * max(0.0, price - unit_cost)

    return {
        "commodity": asset.commodity.value,
        "revenue": revenue,
        "opex": opex,
        "carbon_cost": carbon_cost,
        "physical_loss_cost": physical_loss_cost,
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

    return OperationalYear(
        year=year,
        revenue=agg_revenue,
        opex=agg_opex,
        carbon_cost=agg_carbon_cost,
        physical_loss_cost=agg_physical,
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
