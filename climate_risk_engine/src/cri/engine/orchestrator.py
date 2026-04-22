"""Top-level entry point: run(scenario, company) -> RunResults."""

from __future__ import annotations

import hashlib
import json
import uuid

from ..data.schemas import Company, RunResults, Scenario, YearResult
from ..financial.dcf import value
from ..financial.metrics import climate_adjusted_wacc, compute_year
from ..operations.company import simulate


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


def run(
    company: Company,
    scenario: Scenario,
    baseline_npv: float | None = None,
    model_version: str = "0.1.0",
) -> RunResults:
    """Run the full pipeline: scenario → operational → financial → valuation."""
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
