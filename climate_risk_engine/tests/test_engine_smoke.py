"""Smoke tests for the CRI engine.

These are golden-direction tests, not golden-number tests — they lock in
the *shape* of results (NZE harsher than Current Policies, copper revenue
growing, iron ore declining) so we catch regressions while we still tune
the numeric coefficients.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from cri import scenarios
from cri.data.companies_seed import CRI_TEST_CO
from cri.engine.orchestrator import run


def test_engine_runs_all_scenarios():
    for s in [scenarios.NZE_2050, scenarios.DELAYED_TRANSITION, scenarios.CURRENT_POLICIES]:
        r = run(CRI_TEST_CO, s)
        assert r.enterprise_value > 0
        assert len(r.years) == 25
        # Sanity: every year's emissions are non-negative
        for y in r.years:
            assert y.emissions_by_scope["scope_1"] >= 0


def test_climate_stress_reduces_valuation():
    """NZE and Delayed Transition should both produce lower EV than CP."""
    cp = run(CRI_TEST_CO, scenarios.CURRENT_POLICIES)
    nze = run(CRI_TEST_CO, scenarios.NZE_2050, baseline_npv=cp.enterprise_value)
    dly = run(CRI_TEST_CO, scenarios.DELAYED_TRANSITION, baseline_npv=cp.enterprise_value)
    assert nze.enterprise_value < cp.enterprise_value
    assert dly.enterprise_value < cp.enterprise_value
    # Delayed is the worst scenario in this model
    assert dly.enterprise_value < nze.enterprise_value


def test_copper_revenue_grows_under_nze():
    r = run(CRI_TEST_CO, scenarios.NZE_2050)
    first, last = r.years[0], r.years[-1]
    assert last.revenue_by_commodity["copper"] > first.revenue_by_commodity["copper"]


def test_iron_ore_revenue_declines_under_nze():
    r = run(CRI_TEST_CO, scenarios.NZE_2050)
    first, last = r.years[0], r.years[-1]
    assert last.revenue_by_commodity["iron_ore"] < first.revenue_by_commodity["iron_ore"]


def test_carbon_cost_grows_over_time():
    r = run(CRI_TEST_CO, scenarios.NZE_2050)
    first, last = r.years[0], r.years[-1]
    assert last.carbon_cost > first.carbon_cost * 2
