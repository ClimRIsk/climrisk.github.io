# CRI Architecture — v0.1 (draft)

## 1. Principles

1. **Engine-first.** The core climate-to-financial simulation is a pure-Python library with no framework dependencies. The API and UI are thin layers over it.
2. **Data-driven, not hard-coded.** Scenarios, companies, assets, and coefficients live in structured files / tables — editable by analysts without a code change.
3. **Deterministic and reproducible.** Every run is seeded; every output ties back to a specific scenario version, company snapshot, and model version.
4. **Transparent.** Every financial number must be traceable to its climate driver and operational driver. The UI surfaces that chain.
5. **Composable.** Portfolio analysis is just aggregation of company analysis. We don't build two engines.

## 2. System components

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           Web dashboard (Next.js)                          │
│  scenario picker · company drill-down · sensitivity · fan charts · export  │
└──────────────────────────────────┬─────────────────────────────────────────┘
                                   │  HTTPS / JSON
┌──────────────────────────────────▼─────────────────────────────────────────┐
│                          REST API (FastAPI)                                │
│            /scenarios · /companies · /runs · /results · /exports           │
└──────────────────────────────────┬─────────────────────────────────────────┘
                                   │  in-process
┌──────────────────────────────────▼─────────────────────────────────────────┐
│                       CRI Engine (pure Python)                             │
│   scenarios → climate drivers → operational impact → financial → valuation │
│                  (pandas / numpy / pydantic — no web deps)                 │
└──────────┬──────────────────────────────────────────────┬──────────────────┘
           │                                              │
           ▼                                              ▼
  ┌─────────────────┐                            ┌──────────────────┐
  │  Data store     │                            │  Scenario store  │
  │  Postgres +     │                            │  Parquet / JSON  │
  │  DuckDB (OLAP)  │                            │  (versioned)     │
  └─────────────────┘                            └──────────────────┘
```

## 3. Proposed tech stack

| Layer | Choice | Why |
|---|---|---|
| Engine | **Python 3.11, pandas, numpy, Pydantic v2** | Scientific stack, strong typing for data contracts |
| Orchestration | **Typer CLI + Prefect** (Phase 2) | Reproducible runs, scheduled data refreshes |
| API | **FastAPI + uvicorn** | Async, auto OpenAPI docs, Pydantic-native |
| Data: transactional | **PostgreSQL** | Companies, runs, users |
| Data: analytical | **DuckDB** over Parquet | Fast scenario × company cross-joins |
| Frontend | **Next.js 14 + TypeScript + Tailwind + Recharts/Plotly** | Fast, typed, great charting ecosystem |
| Auth | **Clerk** or **Auth.js** | Minimal lift, enterprise-ready later |
| Deployment | **Docker** + **Railway** (API) + **Vercel** (frontend) | Low-ops for an MVP |
| CI | **GitHub Actions** | Test + lint on every PR |
| Packaging | **uv** or **poetry** | Reproducible Python envs |

Alternatives open for discussion:
- Frontend: **Streamlit** for a faster Phase 1 at the cost of styling flexibility.
- Engine: **Rust/Polars** if performance becomes a bottleneck on portfolio runs.

## 4. Data contracts (key)

All contracts are Pydantic models in `src/cri/data/schemas.py`, doubling as the API's request/response models. The canonical nouns:

- **Scenario** — named, versioned, full time-series of drivers.
- **Company** — baseline financials, segment breakdown, asset list.
- **Asset** — geolocated production unit with emissions intensity and hazard exposure.
- **Commodity** — demand/price curve linkage and elasticity parameters.
- **Run** — an invocation of the engine: (scenario_id, company_id, model_version, overrides) → Results.
- **Results** — per-year per-company output: revenue, EBITDA, FCF, NPV, breakdowns.

## 5. Data flow for a single run

1. API receives `POST /runs` with `{scenario_id, company_id, overrides?}`.
2. Loader hydrates `Scenario`, `Company`, and its `Asset[]` from stores.
3. `engine.orchestrator.run(scenario, company)`:
   a. `climate.transition.apply()` — derives carbon price path, demand index per commodity.
   b. `climate.physical.apply()` — per-asset hazard → disruption probability × severity.
   c. `operations.company.simulate()` — produces volume/price/cost trajectories.
   d. `financial.metrics.compute()` — EBITDA, FCF, WACC adjustment.
   e. `financial.dcf.value()` — NPV, equity bridge, implied share price.
4. Persist `Results` with full lineage (scenario v, model v, input hashes).
5. Return summary + links to detailed breakdowns.

## 6. Roadmap-aligned build order

- **Phase 0–1:** Engine + schemas + scenario store as Parquet/JSON. No DB yet — SQLite if needed.
- **Phase 2:** REST API wrapper. Postgres when multi-user.
- **Phase 3:** Next.js dashboard, first visualisations (fan charts, scenario compare).
- **Phase 4:** Data ingestion pipelines (CDP, Aqueduct, IEA), scheduled refresh.
- **Phase 5:** Multi-tenant SaaS, portfolio engine, mobile app.
