"""Top-level entry points for the CRI engine.

Two functions are exposed:

run(company, scenario, ...)
    The original single-scenario path. Returns a full RunResults with
    valuation. Backward-compatible — existing code unchanged.

run_scoped(company, scope, ...)
    The new modular path. The caller specifies which pillars they need
    via a ReportScope, and the engine runs only the required computation.
    Returns a ScopedResult containing only the requested pillar reports.

    Examples
    --------
    # Morelli: physical risk only
    result = run_scoped(company, ReportScope.PHYSICAL)
    print(result.physical.physical_score)
    print(result.physical.narrative)

    # ING: full financial risk with valuation
    result = run_scoped(company, ReportScope.FINANCIAL)
    print(result.valuation_results["nze"].enterprise_value)

    # Full CRI package (existing behaviour, new interface)
    result = run_scoped(company, ReportScope.FULL_CRI)
    print(result.rating_result.rating)

Scope → computation map
-----------------------
PHYSICAL            : simulate × 3 scenarios → PhysicalRiskReport
TRANSITION          : simulate × 3 scenarios → TransitionRiskReport
PHYSICAL_TRANSITION : simulate × 3 scenarios → both reports
FINANCIAL           : simulate + DCF × 3 scenarios → valuation dict
FULL_CRI            : all of the above + composite CRI rating
"""

from __future__ import annotations

import hashlib
import json
import uuid

from .. import scenarios as _scen
from ..data.schemas import Company, RunResults, Scenario, YearResult
from ..engine.scope import ReportScope, ScopedResult
from ..financial.dcf import value
from ..financial.metrics import climate_adjusted_wacc, compute_year
from ..operations.company import simulate
from ..outcomes.physical_report import build_physical_report
from ..outcomes.transition_report import build_transition_report


def _input_hash(scenario: Scenario, company: Company) -> str:
    payload = json.dumps(
        {
            "scenario": scenario.model_dump(mode="json"),
            "company": company.model_dump(mode="json"),
        },
        sort_keys=True,
        default=str,
    )
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


# ---------------------------------------------------------------------------
# Original single-scenario run — backward-compatible
# ---------------------------------------------------------------------------

def run(
    company: Company,
    scenario: Scenario,
    baseline_npv: float | None = None,
    model_version: str = "0.2.0",
) -> RunResults:
    """Run the full pipeline: scenario → operational → financial → valuation.

    This is the original interface. It remains fully supported.
    For modular scope-based runs, use run_scoped().
    """
    ops = simulate(company, scenario)
    year_results: list[YearResult] = [compute_year(company, o) for o in ops]

    wacc = climate_adjusted_wacc(company, scenario)
    dcf = value(company, year_results, wacc)

    npv_impact_pct = None
    if baseline_npv is not None and baseline_npv != 0:
        npv_impact_pct = dcf.enterprise_value / baseline_npv - 1.0

    def _by_year(y: int) -> YearResult | None:
        for yr in year_results:
            if yr.year == y:
                return yr
        return None

    baseline_ebitda = company.financials.ebitda

    def _compression(year: int) -> float | None:
        yr = _by_year(year)
        if yr is None or baseline_ebitda == 0:
            return None
        return yr.ebitda / baseline_ebitda - 1.0

    return RunResults(
        run_id=str(uuid.uuid4())[:8],
        scenario_id=scenario.id,
        company_id=company.id,
        model_version=model_version,
        years=year_results,
        npv_fcf=dcf.npv_fcf,
        terminal_value=dcf.terminal_value,
        enterprise_value=dcf.enterprise_value,
        equity_value=dcf.equity_value,
        implied_share_price=dcf.implied_share_price,
        wacc_used=dcf.wacc_used,
        baseline_npv=baseline_npv,
        npv_impact_pct=npv_impact_pct,
        ebitda_compression_2030_pct=_compression(2030),
        ebitda_compression_2040_pct=_compression(2040),
        input_hash=_input_hash(scenario, company),
        scenario_version=scenario.version,
    )


# ---------------------------------------------------------------------------
# New scoped run — modular, pillar-selective
# ---------------------------------------------------------------------------

def run_scoped(
    company: Company,
    scope: ReportScope = ReportScope.FULL_CRI,
    model_version: str = "0.2.0",
) -> ScopedResult:
    """Run only the engine pillars required by the requested scope.

    The three NGFS scenarios (NZE 2050, Delayed Transition, Current Policies)
    are always simulated together so results are cross-scenario comparable.
    What changes is *which outputs* are computed and returned.

    Parameters
    ----------
    company : Company profile (assets, financials, emissions).
    scope   : Which pillar(s) to compute. Defaults to FULL_CRI.
              See ReportScope docstring for options.

    Returns
    -------
    ScopedResult with .physical / .transition / .valuation_results populated
    according to the scope. Unpopulated fields are None.
    """
    run_id = str(uuid.uuid4())[:8]

    nze_scenario = _scen.NZE_2050
    dly_scenario = _scen.DELAYED_TRANSITION
    cp_scenario  = _scen.CURRENT_POLICIES

    shared_hash = _input_hash(nze_scenario, company)
    scenario_version = nze_scenario.version

    # -------------------------------------------------------------------
    # Step 1: Operational simulation (always needed — feeds all pillars)
    # -------------------------------------------------------------------
    ops_nze = simulate(company, nze_scenario)
    ops_dly = simulate(company, dly_scenario)
    ops_cp  = simulate(company, cp_scenario)

    result = ScopedResult(scope=scope, run_id=run_id)

    # -------------------------------------------------------------------
    # Step 2: Physical Risk pillar
    # -------------------------------------------------------------------
    if scope.needs_physical:
        result.physical = build_physical_report(
            company=company,
            ops_nze=ops_nze,
            ops_delayed=ops_dly,
            ops_cp=ops_cp,
            run_id=run_id,
            model_version=model_version,
            input_hash=shared_hash,
            scenario_version=scenario_version,
        )

    # -------------------------------------------------------------------
    # Step 3: Transition Risk pillar
    # -------------------------------------------------------------------
    if scope.needs_transition:
        result.transition = build_transition_report(
            company=company,
            ops_nze=ops_nze,
            ops_delayed=ops_dly,
            ops_cp=ops_cp,
            run_id=run_id,
            model_version=model_version,
            input_hash=shared_hash,
            scenario_version=scenario_version,
        )

    # -------------------------------------------------------------------
    # Step 4: Financial valuation (DCF across all scenarios)
    # -------------------------------------------------------------------
    if scope.needs_valuation:
        valuation = {}
        for label, scenario, ops in [
            ("nze",     nze_scenario, ops_nze),
            ("delayed", dly_scenario, ops_dly),
            ("cp",      cp_scenario,  ops_cp),
        ]:
            year_results: list[YearResult] = [compute_year(company, o) for o in ops]
            wacc = climate_adjusted_wacc(company, scenario)
            dcf = value(company, year_results, wacc)
            valuation[label] = run(company, scenario, model_version=model_version)
        result.valuation_results = valuation

    # -------------------------------------------------------------------
    # Step 5: Composite CRI rating (FULL_CRI only)
    # -------------------------------------------------------------------
    if scope.needs_composite_rating and result.valuation_results:
        try:
            from ..outcomes.ratings import rate
            nze_r = result.valuation_results["nze"]
            dly_r = result.valuation_results["delayed"]
            cp_r  = result.valuation_results["cp"]
            # baseline_npv = CP enterprise value (no-action baseline)
            baseline = cp_r.enterprise_value
            nze_r2 = run(company, nze_scenario, baseline_npv=baseline)
            dly_r2 = run(company, dly_scenario, baseline_npv=baseline)
            result.rating_result = rate(nze_r2, dly_r2, cp_r)
        except Exception:
            pass   # rating is additive — a failure here doesn't break the run

    return result
