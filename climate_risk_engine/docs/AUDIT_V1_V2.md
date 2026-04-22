# Audit of your V1 and V2 models

This is an honest read of both workbooks so we agree on what we keep, what we fix, and why V2 probably felt stuck.

---

## V1 — `Climate_Risk_Model_v1.xlsx`

### What it actually does

V1 is a **qualitative risk-scoring model**, not a financial-impact model. Six companies (Shell, BHP, Rio Tinto, S&P Global, BlackRock, UltraTech) are scored on:

- **Exposure** — average of 5 physical hazards (flood, heat, drought, cyclone, sea-level), each High/Medium/Low mapped to 30/60/90, then adjusted for single vs. diversified geography.
- **Transition** — Scope-3 share, sector classification, and 2030/2050 risk labels, averaged.
- **Financial** — carbon-cost-to-revenue ratio, revenue-at-risk, stranded-asset label, averaged.
- **Adaptive** — net-zero commitment, scenario analysis, TCFD disclosure.
- **Final Score** — weighted average with sector-specific weights, multiplied by a data-quality multiplier, mapped to A–E rating.

### Strengths (what we keep)

1. **The taxonomy.** Your four-pillar structure — Exposure, Transition, Financial, Adaptive — is good. We carry this forward as a *reporting lens* on top of the quantitative model.
2. **Sector weight table.** The idea that Oil & Gas weighs transition heavier and Cement/Mining weighs exposure heavier is correct. We'll keep this and make it editable.
3. **Data-quality multiplier.** This is a real discipline — we should preserve it. Outputs should be flagged by data confidence.
4. **The six-company seed list.** Good cross-sector spread for testing. We'll use these as our first test companies.

### Gaps (what we fix)

1. **No dollar impact.** Everything is a 30/60/90 score. An investor can't make an allocation decision from a letter grade.
2. **No time dimension.** Climate risk is entirely about trajectory — V1 has none.
3. **Qualitative inputs only.** "High/Medium/Low" flood risk isn't defensible to an investment committee. We need actual probabilities × severities.
4. **No scenario branching.** The same numbers feed every "scenario." You can't compare NZE vs. Delayed Transition.

---

## V2 — `Climate_Risk_Model_V2.xlsx`

### What it does

V2 is the right idea: a **per-segment financial model for Rio Tinto** with scenario inputs. Structure:

- `Inputs_Master` — financials, production (iron ore, copper, aluminium), hazards, WACC, tax.
- `Scenario_Definitions` — Base, Net Zero, Delayed, each with a carbon price, per-commodity demand shift, and risk premium.
- `Core_Model` — three rows, one per commodity, with revenue → EBITDA → carbon cost → FCF → valuation.
- `Risk_Scoring` — folds carbon-cost share and average physical score into a composite.
- `Dashboard_Output` — summary KPIs.

### Strengths (what we keep)

1. **Commodity-level segmentation.** Breaking Rio Tinto into iron ore / copper / aluminium is exactly right — their climate exposures differ dramatically.
2. **Scenario table is a clean abstraction.** Separating scenario drivers from company data is the correct architecture.
3. **Carbon cost as a P&L line.** Making `emissions × carbon_price` an explicit EBITDA hit is the right mental model.
4. **Risk premium adjustment to WACC.** Correct instinct — a Delayed Transition world should discount harder.

### Bugs and gaps (what we fix)

These are why V2 probably felt "off":

| # | Issue | Where | Why it breaks |
|---|---|---|---|
| 1 | **Emissions are triple-counted** | `Core_Model!I2:I4` | Each segment row uses *total company emissions* (S1+S2+S3), so carbon cost is summed 3× at the dashboard. |
| 2 | **Capex triple-counted** | `Core_Model!M2:M4` | Every segment row pulls total company capex. FCF is understated 3×. |
| 3 | **Tax includes Scope 3 cost** | `L2 = K2 × tax_rate` | Carbon cost is treated as deductible, but there's no check of actual tax geography / deductibility. Smaller issue, but worth flagging. |
| 4 | **Demand-shift lookup only handles "Net Zero"** | `D2 = IF(A="Net Zero", NZ_col, Base_col)` | "Delayed" falls through to Base. The scenario picker is broken. |
| 5 | **Only one scenario's rows populated** | `Core_Model` has 3 rows, all "Net Zero" | To actually compare scenarios you need 3 scenarios × 3 segments = 9 rows (or parametrise). |
| 6 | **Valuation is a perpetuity** | `P2 = N2 / O2` | `FCF / discount_rate` is a no-growth perpetuity. It completely flattens the transition trajectory — which is the whole point of the analysis. |
| 7 | **No time dimension at all.** | Entire workbook | A 2026 EBITDA with a 2050 carbon price is nonsense. You need annual paths. |
| 8 | **Physical risk never touches the P&L.** | `Risk_Scoring` | Hazard scores are averaged into a separate "risk score" instead of reducing production volume or adding cost. |
| 9 | **Scope 3 is treated like Scope 1/2** | `I2 = S1 + S2 + S3` | Scope 3 emissions are (mostly) not payable under current carbon pricing. Lumping them in overstates carbon cost by ~10×+ for miners. |
| 10 | **EBITDA = Revenue × fixed margin** | `G2 = E2 × F2` | Margin is assumed constant irrespective of carbon cost and physical disruption. The model can't show margin compression. |
| 11 | **No stranded assets / adaptation capex** | — | Missing levers for the full framework. |

### Bottom line

V2's **architecture** is right — scenarios × company × segments × financial rollup. The **mechanics** need to be rebuilt: add a time dimension, fix the double-counting, separate Scope 3, drive margin *dynamically* from costs, and wire physical risk into production/opex.

That's exactly what the new engine is designed to do.

---

## Migration plan — V2 → CRI Engine

| V2 construct | Becomes | File |
|---|---|---|
| `Inputs_Master` row | `Company` + `Asset[]` + baseline `Financials` | `src/cri/data/schemas.py` |
| `Scenario_Definitions` row | `Scenario` (now a full time-series) | `src/cri/scenarios.py` |
| `Core_Model` (segment × scenario) | `operations.company.simulate()` (loop over assets × years) | `src/cri/operations/company.py` |
| Margin assumption | Cost structure + carbon cost + physical disruption → dynamic margin | `src/cri/financial/metrics.py` |
| Perpetuity valuation | Explicit-horizon DCF + terminal value | `src/cri/financial/dcf.py` |
| Risk score | Reporting layer on top of quantitative outputs | `src/cri/engine/reporting.py` (Phase 2) |

No work is thrown away — it gets promoted from a 2D spreadsheet to a 3D (time × scenario × company) engine with the bugs removed.
