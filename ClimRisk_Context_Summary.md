# ClimRisk — Project Context Summary

**Paste this at the top of any new chat to get Claude fully up to speed.**

---

## What ClimRisk Is

ClimRisk is an early-stage climate financial risk analytics company. The core product is the **Climate Risk Intelligence (CRI) Engine** — a Python-based quantitative model that translates physical and transition climate scenarios into company-level financial impacts: EV haircut, WACC uplift, FCF trajectory, and a composite CRI score (0–100, rated A–E).

---

## The CRI Engine (v0.4)

Runs on **NGFS Phase 4 scenarios** — Net Zero 2050, Delayed Transition, Current Policies. For any company it computes:

- **Physical risk**: Asset-level hazard assessment (25+ hazards: heat stress, flooding, cyclone, drought, sea level rise, etc.) using lat/lon GIS resolution → production loss % → dollar loss
- **Transition risk**: Carbon cost trajectory (Scope 1+2, with EU ETS free allocation), commodity demand shifts, abatement capex (MACC curve)
- **Financial output**: Full DCF with Gordon Growth terminal value (2026–2050 horizon), WACC uplift (base + scenario premium + exposure premium), EV haircut vs baseline
- **Disclosure reports**: TCFD, IFRS S2, CSRD — generated from engine outputs

### Key Fixes Done (June 2026 session)
- Abatement double-charging bug fixed (companies were paying both full carbon tax AND transition capex simultaneously)
- Unit cost recalibration for all 4 demo companies
- GIS equipment sensitivity added for industrial assets
- Custom scenario API fully wired end-to-end

---

## Demo Companies (calibrated to public filings)

| Company | Sector | CP EV | NZE EV | CRI |
|---|---|---|---|---|
| Tata Steel | Steel (India/UK) | $25.6B | -$13.2B | 40/C |
| Delta Air Lines | Aviation (US) | $57.0B | -$66.1B | 36/B |
| Carnival Corporation | Cruise (US) | $39.4B | +$4.6B | 36/B |
| UltraTech Cement | Cement (India) | $8.9B | -$11.8B | 48/C |

Portfolio weighted CRI: 40/100 [C]. VaR 95% (Delayed Transition): $62.9B. VaR 99%: $89.0B.

---

## Sectors Supported

18 commodities: iron ore, copper, aluminium, coal (thermal + met), crude oil, natural gas, refined products, cement, electricity, beverages, food, chemicals, manufacturing, retail, financial services, real estate, agriculture.

---

## Custom Scenario Support (just built)

`POST /runs` accepts full custom scenarios inline:

```json
{
  "company_id": "tata_steel",
  "scenario_id": "custom",
  "custom_scenario": {
    "name": "EU Accelerated Policy",
    "carbon_price_path": {"2026": 30, "2030": 75, "2040": 160, "2050": 250},
    "risk_premium_bps": 130,
    "abatement_targets": {"2030": 0.30, "2040": 0.65, "2050": 0.90}
  }
}
```

Also `POST /scenarios` to persist and reuse named custom scenarios.

---

## REST API (FastAPI)

- `POST /runs` — full engine run
- `POST /runs/scoped` — modular run (physical / transition / financial only)
- `POST /runs/upload` — upload CSV/Excel with company data
- `POST /scenarios` — save custom scenario
- `DELETE /scenarios/{id}` — remove saved scenario
- `POST /ratings` — CRI score with custom weight profiles
- `POST /reports/tcfd | issb | csrd` — disclosure reports
- `POST /reports/physical` — per-hazard physical risk report
- `GET /scenarios`, `GET /companies`, `GET /connectors/status`

---

## Key Files

| File | Purpose |
|---|---|
| `climate_risk_engine/src/cri/` | Core engine |
| `src/cri/data/companies_climrisk.py` | Demo company definitions |
| `src/cri/scenarios.py` | NGFS + custom scenario definitions |
| `src/cri/api/main.py` | FastAPI endpoints |
| `src/cri/abatement.py` | MACC abatement model |
| `src/cri/gis/resolver.py` | Asset-level GIS hazard resolver |
| `src/cri/company.py` | Core company risk model |

## Output Charts (workspace root)

- `CarbonStressTest_TataSteel.jpg`
- `Portfolio_Risk_Dashboard_ClimRisk.jpg`
- `Global_Sector_Risk_Landscape.jpg` — 21-industry sector risk landscape

---

## GitHub

Repo: `ClimRIsk/climrisk.github.io` (main branch, GitHub Pages deployment)

---

## Founder

Shrinivash D Kannan

---

## Standing Rules

- **No assumptions on data**: Only use publicly confirmed data. No domain-guessing, no inferred emails, no fabricated figures. Cite source for every number.
- **No engine changes without explicit instruction**: Any analysis work should be standalone scripts — do not modify core engine files unless specifically asked.
- Engine is production-intent. Treat it accordingly.
