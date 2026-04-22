"""Built-in canonical scenarios.

These are coarse, illustrative paths used for the MVP. They *will* be
replaced by NGFS / IEA WEO data ingestion in Phase 4. Treat them as
placeholders that make the engine runnable end-to-end, not as
investment-grade inputs.

Every number here has a comment explaining where it came from and
how it will be refined.
"""

from __future__ import annotations

from .data.schemas import (
    CarbonPricePath,
    Commodity,
    CommodityCurve,
    HazardPath,
    HazardType,
    Scenario,
    ScenarioFamily,
)


# Horizon used for all built-in scenarios
START = 2026
END = 2050
YEARS = list(range(START, END + 1))


def _linear(y0: float, yN: float) -> dict[int, float]:
    """Linear path between two endpoints over [START, END]."""
    if END == START:
        return {START: y0}
    step = (yN - y0) / (END - START)
    return {y: y0 + step * (y - START) for y in YEARS}


def _piecewise(points: dict[int, float]) -> dict[int, float]:
    """Piecewise-linear interpolation over YEARS, anchored at `points`."""
    anchors = sorted(points.items())
    out: dict[int, float] = {}
    for y in YEARS:
        # find surrounding anchors
        prev = anchors[0]
        nxt = anchors[-1]
        for i in range(len(anchors) - 1):
            if anchors[i][0] <= y <= anchors[i + 1][0]:
                prev, nxt = anchors[i], anchors[i + 1]
                break
        if nxt[0] == prev[0]:
            out[y] = prev[1]
        else:
            w = (y - prev[0]) / (nxt[0] - prev[0])
            out[y] = prev[1] + w * (nxt[1] - prev[1])
    return out


# ---------------------------------------------------------------------------
# Carbon price paths  (USD / tCO2e, nominal)
# ---------------------------------------------------------------------------
# NZE: steep, front-loaded (IEA NZE direction; approx $130 by 2030, $250 by 2050)
# Delayed: flat until 2030, then sharp repricing
# Current Policies: slow rise, plateau

NZE_CARBON = _piecewise({2026: 50, 2030: 130, 2040: 200, 2050: 250})
DELAYED_CARBON = _piecewise({2026: 30, 2030: 40, 2031: 150, 2040: 210, 2050: 240})
CP_CARBON = _piecewise({2026: 25, 2030: 40, 2040: 60, 2050: 75})


# ---------------------------------------------------------------------------
# Commodity demand indices (2026 = 100)
# ---------------------------------------------------------------------------
# Directional only; placeholder numbers.
# Transition-positive commodities: copper, aluminium (electrification).
# Transition-negative: coal (thermal), crude oil under NZE.

NZE_DEMAND = {
    Commodity.IRON_ORE: _piecewise({2026: 100, 2030: 100, 2040: 95, 2050: 90}),
    Commodity.COPPER: _piecewise({2026: 100, 2030: 135, 2040: 180, 2050: 220}),
    Commodity.ALUMINIUM: _piecewise({2026: 100, 2030: 115, 2040: 140, 2050: 160}),
    Commodity.COAL_THERMAL: _piecewise({2026: 100, 2030: 75, 2040: 35, 2050: 10}),
    Commodity.COAL_METALLURGICAL: _piecewise({2026: 100, 2030: 95, 2040: 70, 2050: 45}),
    Commodity.CRUDE_OIL: _piecewise({2026: 100, 2030: 90, 2040: 60, 2050: 35}),
    Commodity.NATURAL_GAS: _piecewise({2026: 100, 2030: 100, 2040: 75, 2050: 45}),
}

DELAYED_DEMAND = {
    Commodity.IRON_ORE: _piecewise({2026: 100, 2030: 105, 2040: 95, 2050: 85}),
    Commodity.COPPER: _piecewise({2026: 100, 2030: 115, 2040: 160, 2050: 200}),
    Commodity.ALUMINIUM: _piecewise({2026: 100, 2030: 108, 2040: 130, 2050: 150}),
    Commodity.COAL_THERMAL: _piecewise({2026: 100, 2030: 95, 2040: 45, 2050: 15}),
    Commodity.COAL_METALLURGICAL: _piecewise({2026: 100, 2030: 100, 2040: 75, 2050: 50}),
    Commodity.CRUDE_OIL: _piecewise({2026: 100, 2030: 100, 2040: 70, 2050: 40}),
    Commodity.NATURAL_GAS: _piecewise({2026: 100, 2030: 105, 2040: 85, 2050: 55}),
}

CP_DEMAND = {
    Commodity.IRON_ORE: _piecewise({2026: 100, 2030: 108, 2040: 115, 2050: 120}),
    Commodity.COPPER: _piecewise({2026: 100, 2030: 115, 2040: 135, 2050: 150}),
    Commodity.ALUMINIUM: _piecewise({2026: 100, 2030: 110, 2040: 125, 2050: 135}),
    Commodity.COAL_THERMAL: _piecewise({2026: 100, 2030: 102, 2040: 100, 2050: 95}),
    Commodity.COAL_METALLURGICAL: _piecewise({2026: 100, 2030: 105, 2040: 110, 2050: 110}),
    Commodity.CRUDE_OIL: _piecewise({2026: 100, 2030: 105, 2040: 105, 2050: 100}),
    Commodity.NATURAL_GAS: _piecewise({2026: 100, 2030: 110, 2040: 115, 2050: 115}),
}


# ---------------------------------------------------------------------------
# Commodity prices (USD per physical unit, nominal)
# ---------------------------------------------------------------------------
# Baseline prices ~2026 and directional path; replace with forward curves later.

PRICE_PATHS_NZE = {
    Commodity.IRON_ORE: _piecewise({2026: 110, 2030: 100, 2040: 90, 2050: 85}),
    Commodity.COPPER: _piecewise({2026: 9000, 2030: 11000, 2040: 13500, 2050: 15000}),
    Commodity.ALUMINIUM: _piecewise({2026: 2400, 2030: 2700, 2040: 3100, 2050: 3400}),
    Commodity.COAL_THERMAL: _piecewise({2026: 130, 2030: 95, 2040: 55, 2050: 25}),
    Commodity.COAL_METALLURGICAL: _piecewise({2026: 240, 2030: 210, 2040: 160, 2050: 110}),
    Commodity.CRUDE_OIL: _piecewise({2026: 75, 2030: 70, 2040: 60, 2050: 45}),
    Commodity.NATURAL_GAS: _piecewise({2026: 4.0, 2030: 3.5, 2040: 2.8, 2050: 2.2}),
}

PRICE_PATHS_DELAYED = {
    Commodity.IRON_ORE: _piecewise({2026: 115, 2030: 110, 2040: 100, 2050: 90}),
    Commodity.COPPER: _piecewise({2026: 9000, 2030: 10500, 2040: 12500, 2050: 14000}),
    Commodity.ALUMINIUM: _piecewise({2026: 2400, 2030: 2600, 2040: 2900, 2050: 3200}),
    Commodity.COAL_THERMAL: _piecewise({2026: 130, 2030: 115, 2040: 75, 2050: 35}),
    Commodity.COAL_METALLURGICAL: _piecewise({2026: 240, 2030: 230, 2040: 180, 2050: 130}),
    Commodity.CRUDE_OIL: _piecewise({2026: 78, 2030: 78, 2040: 70, 2050: 55}),
    Commodity.NATURAL_GAS: _piecewise({2026: 4.2, 2030: 4.0, 2040: 3.4, 2050: 2.7}),
}

PRICE_PATHS_CP = {
    Commodity.IRON_ORE: _piecewise({2026: 115, 2030: 120, 2040: 125, 2050: 125}),
    Commodity.COPPER: _piecewise({2026: 9000, 2030: 9800, 2040: 11000, 2050: 11500}),
    Commodity.ALUMINIUM: _piecewise({2026: 2400, 2030: 2500, 2040: 2650, 2050: 2750}),
    Commodity.COAL_THERMAL: _piecewise({2026: 130, 2030: 135, 2040: 130, 2050: 120}),
    Commodity.COAL_METALLURGICAL: _piecewise({2026: 240, 2030: 245, 2040: 250, 2050: 250}),
    Commodity.CRUDE_OIL: _piecewise({2026: 78, 2030: 82, 2040: 85, 2050: 85}),
    Commodity.NATURAL_GAS: _piecewise({2026: 4.2, 2030: 4.5, 2040: 4.8, 2050: 4.7}),
}


# ---------------------------------------------------------------------------
# Physical hazard paths (severity / annual production loss fraction)
# ---------------------------------------------------------------------------
# Same region tags will eventually come from WRI Aqueduct / IPCC by basin.
# Each value ∈ [0, 1] = expected annual production loss from this hazard.

HAZARDS_NZE = [
    HazardPath(hazard=HazardType.HEAT_STRESS, region="AU-WA",
               path=_piecewise({2026: 0.01, 2050: 0.025})),
    HazardPath(hazard=HazardType.WATER_STRESS, region="CL-02",
               path=_piecewise({2026: 0.02, 2050: 0.05})),
    HazardPath(hazard=HazardType.CYCLONE, region="AU-WA",
               path=_piecewise({2026: 0.01, 2050: 0.02})),
]

HAZARDS_DELAYED = [
    HazardPath(hazard=HazardType.HEAT_STRESS, region="AU-WA",
               path=_piecewise({2026: 0.01, 2050: 0.045})),
    HazardPath(hazard=HazardType.WATER_STRESS, region="CL-02",
               path=_piecewise({2026: 0.02, 2050: 0.09})),
    HazardPath(hazard=HazardType.CYCLONE, region="AU-WA",
               path=_piecewise({2026: 0.01, 2050: 0.035})),
]

HAZARDS_CP = [
    HazardPath(hazard=HazardType.HEAT_STRESS, region="AU-WA",
               path=_piecewise({2026: 0.01, 2050: 0.08})),
    HazardPath(hazard=HazardType.WATER_STRESS, region="CL-02",
               path=_piecewise({2026: 0.02, 2050: 0.15})),
    HazardPath(hazard=HazardType.CYCLONE, region="AU-WA",
               path=_piecewise({2026: 0.01, 2050: 0.06})),
]


# ---------------------------------------------------------------------------
# Scenario objects
# ---------------------------------------------------------------------------


def _build_commodity_curves(demand: dict, prices: dict) -> list[CommodityCurve]:
    return [
        CommodityCurve(
            commodity=c,
            demand_index=demand[c],
            price_path=prices[c],
        )
        for c in demand
        if c in prices
    ]


NZE_2050 = Scenario(
    id="nze_2050_v0_1",
    name="Net Zero by 2050",
    family=ScenarioFamily.NZE_2050,
    horizon=(START, END),
    description="Front-loaded transition. Carbon price rises rapidly; "
                "green commodities gain; fossil demand drops sharply.",
    version="0.1.0",
    carbon_prices=[CarbonPricePath(region="global", path=NZE_CARBON)],
    commodity_curves=_build_commodity_curves(NZE_DEMAND, PRICE_PATHS_NZE),
    hazards=HAZARDS_NZE,
    risk_premium_bps=50,
)

DELAYED_TRANSITION = Scenario(
    id="delayed_transition_v0_1",
    name="Delayed Transition",
    family=ScenarioFamily.DELAYED_TRANSITION,
    horizon=(START, END),
    description="Policy lag until ~2030, then abrupt repricing. Higher "
                "physical risk accumulates; higher risk premium.",
    version="0.1.0",
    carbon_prices=[CarbonPricePath(region="global", path=DELAYED_CARBON)],
    commodity_curves=_build_commodity_curves(DELAYED_DEMAND, PRICE_PATHS_DELAYED),
    hazards=HAZARDS_DELAYED,
    risk_premium_bps=150,
)

CURRENT_POLICIES = Scenario(
    id="current_policies_v0_1",
    name="Current Policies",
    family=ScenarioFamily.CURRENT_POLICIES,
    horizon=(START, END),
    description="Baseline 'hothouse' trajectory. Carbon price drifts up "
                "slowly; physical risks dominate.",
    version="0.1.0",
    carbon_prices=[CarbonPricePath(region="global", path=CP_CARBON)],
    commodity_curves=_build_commodity_curves(CP_DEMAND, PRICE_PATHS_CP),
    hazards=HAZARDS_CP,
    risk_premium_bps=100,
)


def all_builtin() -> dict[str, Scenario]:
    return {s.id: s for s in [NZE_2050, DELAYED_TRANSITION, CURRENT_POLICIES]}


def get(scenario_id: str) -> Scenario:
    builtins = all_builtin()
    if scenario_id not in builtins:
        raise KeyError(f"Unknown scenario {scenario_id!r}. "
                       f"Available: {list(builtins)}")
    return builtins[scenario_id]
