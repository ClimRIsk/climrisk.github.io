# CRI Roadmap

Phased build plan. Each phase has a clear *done* criterion. We don't start the next phase until the previous one is demonstrably working.

---

## Phase 0 — Foundation *(today)*

**Goal.** Lock the methodology and architecture so every subsequent phase has firm ground.

- [x] `METHODOLOGY.md` — climate → operational → financial translation logic.
- [x] `ARCHITECTURE.md` — components, tech stack, data flow.
- [x] `AUDIT_V1_V2.md` — what we keep from your models, what we fix.
- [x] `ROADMAP.md` — this file.

**Done when:** Shri has reviewed and signed off on methodology and tech stack.

---

## Phase 1 — Engine MVP *(target: ~2 weeks)*

**Goal.** A runnable, end-to-end Python engine: one company, three scenarios, 25-year horizon, producing a climate-adjusted DCF.

- [ ] Pydantic schemas: `Scenario`, `Company`, `Asset`, `Commodity`, `Run`, `Results`.
- [ ] Scenario authoring: define NZE, Delayed Transition, Current Policies as data (Parquet + YAML).
- [ ] `climate.transition` — carbon price path, commodity-demand curves, tech cost curves.
- [ ] `climate.physical` — per-asset hazard → disruption probability × severity.
- [ ] `operations.commodities` — demand/price/elasticity resolution.
- [ ] `operations.company.simulate()` — the per-year operational path.
- [ ] `financial.metrics` — EBITDA, FCF, climate-adjusted WACC.
- [ ] `financial.dcf` — explicit horizon + terminal value.
- [ ] `engine.orchestrator.run()` — glues it together.
- [ ] Toy test company ("CRI_TestCo" — a fictional miner) ships with the repo.
- [ ] CLI: `cri run --scenario NZE --company CRI_TestCo`.
- [ ] Golden-file tests that pin output numbers.

**Done when:** `cri run` on TestCo across all 3 scenarios returns sensible, reproducible NPVs and a per-year breakdown. A second pair of eyes can understand every number's provenance.

---

## Phase 2 — Real data + three sectors *(target: ~3–4 weeks)*

**Goal.** Move from toy company to real companies, with real data, across at least three sectors.

- [ ] Company loader from CSV/Parquet (start with your six: Shell, BHP, Rio Tinto, UltraTech, S&P, BlackRock — dropping the pure-financial two for now).
- [ ] Asset-level data for at least two miners (BHP, Rio Tinto) and one integrated oil major (Shell).
- [ ] Hazard data ingestion (WRI Aqueduct for water, NASA NEX-GDDP for heat, etc.) — just the reference pulls; automated refresh is Phase 4.
- [ ] Marginal abatement cost curve (MACC) stub per sector.
- [ ] Portfolio engine — aggregate across N companies with weights.
- [ ] REST API (FastAPI) wrapping the engine.
- [ ] Postgres-backed run history.
- [ ] Auth skeleton (Clerk/Auth.js).

**Done when:** API endpoint `POST /runs` returns valuation for any of the six companies under any scenario in <3 s. Results are persisted and re-queryable.

---

## Phase 3 — Dashboard *(target: ~3–4 weeks)*

**Goal.** The web app — a dashboard an analyst would actually use.

- [ ] Next.js + Tailwind + Recharts/Plotly scaffold.
- [ ] Scenario picker + company picker.
- [ ] Fan-chart view (NPV across scenarios).
- [ ] Company drill-down: per-year EBITDA bridge, carbon-cost share, FCF trajectory, asset map.
- [ ] Sensitivity panel — slide carbon price, see NPV move.
- [ ] PDF/Excel export.
- [ ] Clean design pass + accessibility sweep.

**Done when:** A user, with no briefing, can compare Shell under NZE vs. Current Policies and articulate the implied share-price impact in <2 minutes.

---

## Phase 4 — Data pipelines & automation *(target: ~4–6 weeks)*

**Goal.** Move from hand-curated data to scheduled, traceable ingestion.

- [ ] Connectors: CDP, WRI Aqueduct, IEA WEO, NGFS scenario database, company 10-K/annual reports (parsed).
- [ ] Prefect flows for nightly refresh.
- [ ] Data lineage tracking — every input row knows its source and fetch date.
- [ ] Quality monitors + alerting on schema drift.
- [ ] Versioned scenarios — users can pin analyses to a scenario version.

**Done when:** Adding a new company is < 1 hour of analyst time. Underlying data refreshes nightly with clear diffs.

---

## Phase 5 — Productisation *(target: ~6–8 weeks)*

**Goal.** Turn this into a product people pay for.

- [ ] Multi-tenant auth, billing (Stripe), workspace model.
- [ ] Shared scenarios vs. user scenarios (clients can author overlays).
- [ ] Mobile app (React Native or PWA first).
- [ ] Client workflow: upload portfolio → batch run → exportable report.
- [ ] Compliance: SOC 2 roadmap, data-processing addendum template.
- [ ] Sales collateral: one-pager, demo video, case study.

**Done when:** Three paid pilots and a signed LOI with a fourth.

---

## Working rhythm

- **One phase at a time.** We resist skipping ahead.
- **Every phase ships a demo.** Even Phase 1's CLI output should be shareable with a prospective user to gather feedback.
- **Methodology is a living document.** Any engine change that affects numbers must update `METHODOLOGY.md` in the same commit.
- **Tests are the contract.** Golden-file tests for valuation numbers. CI fails on any unexplained NPV move > 1%.
