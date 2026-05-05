"""Tests for the scoped (modular) engine interface.

These tests verify that:
  - Each ReportScope computes exactly the fields it should and leaves
    unrelated fields as None.
  - Physical-only scope returns a valid PhysicalRiskReport with correct
    structure (Morelli use case).
  - Transition-only scope returns a valid TransitionRiskReport.
  - FULL_CRI scope produces all three pillars + a rating result.
  - The original run() function still works after the refactor.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from cri.data.companies_seed import CRI_TEST_CO
from cri.engine.orchestrator import run, run_scoped
from cri.engine.scope import ReportScope
from cri import scenarios


# ---------------------------------------------------------------------------
# Physical-only scope (Morelli use case)
# ---------------------------------------------------------------------------

def test_physical_scope_populates_physical_only():
    result = run_scoped(CRI_TEST_CO, ReportScope.PHYSICAL)
    assert result.physical is not None, "Physical report should be populated"
    assert result.transition is None,   "Transition should be None for PHYSICAL scope"
    assert result.valuation_results is None, "Valuation should be None for PHYSICAL scope"


def test_physical_report_structure():
    result = run_scoped(CRI_TEST_CO, ReportScope.PHYSICAL)
    pr = result.physical

    assert pr.company_id == CRI_TEST_CO.id
    assert pr.company_name == CRI_TEST_CO.name
    assert len(pr.years_nze) == 25
    assert len(pr.years_delayed) == 25
    assert len(pr.years_cp) == 25

    # Score is valid
    assert 0.0 <= pr.physical_score <= 100.0
    assert pr.physical_label in ("Low", "Moderate", "Elevated", "High", "Critical")

    # Peak loss is in a real year
    assert 2026 <= pr.peak_loss_year <= 2050
    assert pr.peak_loss_usd >= 0.0

    # Adaptation capex is non-negative
    assert pr.total_adaptation_capex_nze >= 0.0
    assert pr.total_adaptation_capex_cp >= 0.0

    # CP >= NZE for adaptation capex (worse physical scenario = more hardening needed)
    assert pr.total_adaptation_capex_cp >= pr.total_adaptation_capex_nze

    # Narrative is non-empty
    assert len(pr.narrative) > 50

    # Per-year: all losses are non-negative
    for y in pr.years_cp:
        assert y.physical_loss_cost >= 0.0
        assert y.adaptation_capex >= 0.0
        assert 0.0 <= y.total_loss_fraction <= 1.0


def test_physical_cp_worse_than_nze():
    """Under Current Policies, cumulative physical loss should exceed NZE."""
    result = run_scoped(CRI_TEST_CO, ReportScope.PHYSICAL)
    pr = result.physical

    total_loss_cp  = sum(y.physical_loss_cost for y in pr.years_cp)
    total_loss_nze = sum(y.physical_loss_cost for y in pr.years_nze)
    assert total_loss_cp > total_loss_nze, (
        f"CP total physical loss ({total_loss_cp:.0f}) should exceed "
        f"NZE ({total_loss_nze:.0f})"
    )


# ---------------------------------------------------------------------------
# Transition-only scope
# ---------------------------------------------------------------------------

def test_transition_scope_populates_transition_only():
    result = run_scoped(CRI_TEST_CO, ReportScope.TRANSITION)
    assert result.transition is not None, "Transition report should be populated"
    assert result.physical is None,       "Physical should be None for TRANSITION scope"
    assert result.valuation_results is None


def test_transition_report_structure():
    result = run_scoped(CRI_TEST_CO, ReportScope.TRANSITION)
    tr = result.transition

    assert tr.company_id == CRI_TEST_CO.id
    assert len(tr.years_nze) == 25
    assert 0.0 <= tr.transition_score <= 100.0
    assert tr.transition_label in ("Low", "Moderate", "Elevated", "High", "Critical")
    assert len(tr.narrative) > 50

    # Carbon costs are non-negative across all scenarios and years
    for y in tr.years_nze + tr.years_delayed + tr.years_cp:
        assert y.carbon_cost >= 0.0


def test_carbon_cost_higher_under_nze_than_cp_by_2040():
    """NZE carbon price is much higher than CP by 2040 — this should show up."""
    result = run_scoped(CRI_TEST_CO, ReportScope.TRANSITION)
    tr = result.transition

    # Find 2040 in each scenario
    nze_2040 = next(y for y in tr.years_nze     if y.year == 2040)
    cp_2040  = next(y for y in tr.years_cp      if y.year == 2040)
    assert nze_2040.carbon_cost > cp_2040.carbon_cost, (
        f"NZE carbon cost in 2040 ({nze_2040.carbon_cost:.0f}) should exceed "
        f"CP ({cp_2040.carbon_cost:.0f})"
    )


# ---------------------------------------------------------------------------
# Physical + Transition combined scope
# ---------------------------------------------------------------------------

def test_physical_transition_scope():
    result = run_scoped(CRI_TEST_CO, ReportScope.PHYSICAL_TRANSITION)
    assert result.physical is not None
    assert result.transition is not None
    assert result.valuation_results is None


# ---------------------------------------------------------------------------
# Full CRI scope
# ---------------------------------------------------------------------------

def test_full_cri_scope_populates_all_pillars():
    result = run_scoped(CRI_TEST_CO, ReportScope.FULL_CRI)
    assert result.physical is not None
    assert result.transition is not None
    assert result.valuation_results is not None
    assert "nze" in result.valuation_results
    assert "delayed" in result.valuation_results
    assert "cp" in result.valuation_results


def test_full_cri_scope_label():
    result = run_scoped(CRI_TEST_CO, ReportScope.FULL_CRI)
    assert result.scope_label == "Full CRI Climate Rating"


# ---------------------------------------------------------------------------
# Original run() interface still works
# ---------------------------------------------------------------------------

def test_original_run_still_works():
    """run() must remain backward-compatible after the scoped refactor."""
    r = run(CRI_TEST_CO, scenarios.NZE_2050)
    assert r.enterprise_value > 0
    assert len(r.years) == 25
