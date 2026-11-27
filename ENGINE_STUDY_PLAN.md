# ClimRisk engine study plan

Format: one unit at a time, multiple-choice questions you pick from, concepts first (code only to show where a thing lives). A wrong answer gets the reason straight away, and the question comes back in a later session. Order: follow one site report from a latitude and longitude to the finished page.

Engine size for orientation: about 130,000 lines in 27 packages under `climate_risk_engine/src/cri/`.

## The route

| Unit | What we follow | Where it lives | Main idea to leave with |
|---|---|---|---|
| 0 | What the engine is and the glass-box rules | `README.md`, `docs/VALIDATION_LEDGER.md` | Every number has a source, an assumption and a status. Null means not assessed, never zero |
| 1 | A request arrives | `api/main.py` (`/asset/assess`), `geo_io.py`, `intake/` | Coordinate checks, no silent fallback, what the API hands on |
| 2 | The site profile conductor | `siteprofile.py` | Registry of hazards in three tiers (fast, site, deep), run in parallel, a failure becomes a null with a reason |
| 3 | Climate inputs | `climate/`, `connectors/`, `data/` | ERA5, NASA POWER, CMIP6 via the World Bank, what each is good and bad at |
| 4 | Hazards, one by one | `siteprofile.py` handlers, `analysis/`, `cryosphere.py`, `convective.py`, `marine.py`, `wind_extreme.py` | Cyclone, river, coastal, heat, cold, water stress, air, fire, landslide, hail, tornado, marine heatwave |
| 5 | Surface water in depth | `analysis/`, `hydraulics.py`, `finance/rain_design.py`, `terrain/` | Gauge-anchored design rain, rain-on-grid solver, drain bounds, why depth is a ponding flag |
| 6 | Observed evidence | `analysis/india_flood_atlas.py`, `analysis/india_landslide_exposure.py`, `uncertainty.py` | Peril concordance: agree, disagree, single source, unrated |
| 7 | The uncertainty ledger | `uncertainty.py`, `docs/UNCERTAINTY_LEDGER.md` | Five kinds of uncertainty, quantified vs assumed range vs not assessed |
| 8 | The asset | `asset_twin.py`, `analysis/asset_intelligence.py`, `terrain/` | Twin, building footprints, what is a survey and what is illustrative |
| 9 | From hazard to money | `insurance.py`, `data/jrc_flood_curves.json`, `creditbridge.py`, `climate/structural_credit.py` | Depth-damage curves, transfer spread, premium, Merton credit model |
| 10 | Scenarios and downscaling | `climate_scenario.py`, `scenarios.py`, `scenario_suite.py`, `docs/DOWNSCALING.md` | Delta-change, SSPs, what we do not downscale ourselves |
| 11 | The report | `physical_report.py`, `story*.py`, `docs/BRSR_P6_MAP.md` | How evidence becomes one page, BRSR mapping, AHP weights (`ahp.py`) |
| 12 | Carbon, transition, shipping | `carbon/`, `carbon_markets.py`, `transition_plan.py`, `lca/`, `maritime/` | Factors, registry screens, legacy CER rules, voyage emissions |
| 13 | Validation and benchmarks | `modellab/`, `docs/PLUVIAL_BENCHMARK.md`, `docs/VALIDATION_LEDGER.md`, `docs/COMPETITOR_METHODS.md` | ROC AUC, bootstrap CI, baselines, what a benchmark can and cannot claim |
| 14 | The agent and the plumbing | `resident/`, `agent/`, `llmtrain/`, `data_acquisition/`, `provenance.py`, `licence.py`, `pyproject.toml` | Intent routing, local model, provenance, licences, packaging |

## Session rhythm

1. Two or three questions from the last session first (anything you got wrong comes back here).
2. One new idea per question set: a short explanation, then a multiple-choice question.
3. A one-line summary of the unit and what you could now say out loud.

## Progress log

Fill in as we go: unit, date, questions asked, ones to repeat.

| Unit | Date | Done | To repeat |
|---|---|---|---|
| 0 | | | |
