# Climate Risk Intelligence (CRI)

> Translating physical and transition climate risks into quantifiable financial outcomes at the company and portfolio level.

## What this is

Most climate-risk platforms stop at hazard exposure or emissions disclosure. Most financial models treat climate as a side note. CRI is built to close that gap — a scenario-driven modelling engine that connects climate pathways directly to company financials and valuation.

The system is organised in three tightly-coupled layers:

- **Climate layer** — scenario-driven drivers: carbon prices, demand shifts, heat/water stress, extreme-weather disruption frequency, technology cost curves.
- **Operational layer** — translates those drivers into asset- and segment-level impacts: production volumes, cost structure (energy, carbon, water), commodity-specific demand, stranded-asset risk.
- **Financial layer** — converts operational shifts into revenue, EBITDA, FCF, capex requirements, climate-adjusted WACC, and ultimately a climate-adjusted DCF valuation.

## Deliverables (long-term)

1. **Python engine** — open, scriptable, reproducible climate-financial simulations.
2. **REST API** — programmatic access for integration into existing investment workflows.
3. **Web dashboard** — interactive scenario comparison, company drill-down, sensitivity analysis.
4. **Mobile app** — decision-grade summaries for executives and PMs on the go.

## Repository layout

```
climate_risk_engine/
├── docs/
│   ├── METHODOLOGY.md        # The climate → operational → financial translation logic
│   ├── ARCHITECTURE.md       # System design, tech stack, data flow
│   └── ROADMAP.md            # Phased build plan
├── src/cri/
│   ├── scenarios.py          # Scenario definitions (NZE, Delayed Transition, CP)
│   ├── climate/
│   │   ├── transition.py     # Carbon price, demand shifts, tech curves
│   │   └── physical.py       # Heat, water, flood, extreme weather
│   ├── operations/
│   │   ├── commodities.py    # Commodity demand, price, elasticity
│   │   └── company.py        # Company/asset production, costs
│   ├── financial/
│   │   ├── dcf.py            # Climate-adjusted DCF
│   │   └── metrics.py        # EBITDA, FCF, WACC adjustments
│   ├── data/
│   │   └── schemas.py        # Pydantic models for inputs/outputs
│   └── engine/
│       └── orchestrator.py   # Runs the full climate→financial pipeline
├── tests/                    # Unit + golden-file tests
├── notebooks/                # Exploratory & illustrative analyses
├── frontend/                 # Next.js dashboard (added in Phase 3)
└── data/
    ├── raw/                  # Untouched source data (scenarios, hazard maps, financials)
    └── processed/            # Cleaned, model-ready tables
```

## Current status

**Phase 0 — Foundation.** Methodology and architecture are being drafted. No quantitative code is trusted yet. See `docs/ROADMAP.md` for the phased plan.
