"""End-to-end demo: run the CRI engine on CRI TestCo across three scenarios.

Usage:
    python demo.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

from cri import scenarios  # noqa: E402
from cri.data.companies_seed import CRI_TEST_CO  # noqa: E402
from cri.engine.orchestrator import run  # noqa: E402


def _fmt_usd(x: float) -> str:
    if abs(x) >= 1_000_000:
        return f"${x/1_000_000:,.1f}T"
    if abs(x) >= 1_000:
        return f"${x/1_000:,.1f}B"
    return f"${x:,.1f}M"


def _fmt_pct(x: float | None) -> str:
    return "   n/a " if x is None else f"{x*100:+7.1f}%"


def main() -> None:
    scen_list = [
        scenarios.NZE_2050,
        scenarios.DELAYED_TRANSITION,
        scenarios.CURRENT_POLICIES,
    ]

    # First, a "no climate stress" baseline: CP scenario with premiums zeroed
    # would be a nicer baseline; for now we just report levels.
    runs = [run(CRI_TEST_CO, s) for s in scen_list]

    # Use Current Policies enterprise value as the reference for % impact.
    baseline_ev = next(r.enterprise_value for r in runs if r.scenario_id.startswith("current_policies"))
    runs = [
        run(CRI_TEST_CO, s, baseline_npv=baseline_ev) for s in scen_list
    ]

    # Header
    print("=" * 88)
    print(f"  CRI ENGINE v0.1 — {CRI_TEST_CO.name}")
    print(f"  Horizon: {scenarios.START}–{scenarios.END}")
    print("=" * 88)
    print(f"{'Scenario':<24}{'EV':>14}{'Equity':>14}{'Impl.Px':>12}{'WACC':>8}{'vs.CP':>12}")
    print("-" * 88)
    for r in runs:
        label = next(s.name for s in scen_list if s.id == r.scenario_id)
        print(
            f"{label:<24}"
            f"{_fmt_usd(r.enterprise_value):>14}"
            f"{_fmt_usd(r.equity_value):>14}"
            f"{'$' + format(r.implied_share_price, ',.1f'):>12}"
            f"{r.wacc_used*100:>7.2f}%"
            f"{_fmt_pct(r.npv_impact_pct):>12}"
        )

    # Year-by-year for NZE
    nze = next(r for r in runs if r.scenario_id.startswith("nze"))
    print("\n" + "=" * 88)
    print(f"  NZE per-year trajectory (selected years)")
    print("=" * 88)
    print(f"{'Year':<8}{'Revenue':>12}{'Opex':>12}{'Carbon$':>12}{'EBITDA':>12}{'FCF':>12}{'Emis S1+2':>12}")
    print("-" * 88)
    for y in nze.years:
        if y.year in (2026, 2030, 2035, 2040, 2045, 2050):
            s12 = y.emissions_by_scope.get("scope_1", 0) + y.emissions_by_scope.get("scope_2", 0)
            print(
                f"{y.year:<8}"
                f"{_fmt_usd(y.revenue):>12}"
                f"{_fmt_usd(y.opex):>12}"
                f"{_fmt_usd(y.carbon_cost):>12}"
                f"{_fmt_usd(y.ebitda):>12}"
                f"{_fmt_usd(y.fcf):>12}"
                f"{s12:>11,.1f}"
            )

    # Revenue mix evolution for NZE
    print("\n" + "=" * 88)
    print(f"  NZE revenue mix by commodity (USD M)")
    print("=" * 88)
    milestones = [y for y in nze.years if y.year in (2026, 2030, 2040, 2050)]
    commodities = sorted({k for y in milestones for k in y.revenue_by_commodity})
    header = f"{'Year':<8}" + "".join(f"{c:>14}" for c in commodities)
    print(header)
    print("-" * len(header))
    for y in milestones:
        row = f"{y.year:<8}" + "".join(
            f"{_fmt_usd(y.revenue_by_commodity.get(c, 0)):>14}" for c in commodities
        )
        print(row)

    print("\nDone. See docs/METHODOLOGY.md for how every number is produced.")


if __name__ == "__main__":
    main()
