# ClimRisk — Climate Risk Intelligence Platform

> GPS-resolved physical hazard · NGFS transition scenarios · TCFD / IFRS S2 / CSRD disclosure — in one engine.

**Live site → [climrisk.github.io](https://climrisk.github.io)**  
**Demo → [climrisk.github.io/CRI_Demo.html](https://climrisk.github.io/CRI_Demo.html)**

---

## What is ClimRisk?

ClimRisk is a climate financial risk modelling platform built for enterprises navigating net-zero transition and regulatory disclosure requirements. The core engine — **CRI (Climate Risk Intelligence) v0.2** — runs entirely in-browser as a single HTML file with zero dependencies.

### Engine capabilities

| Module | What it does |
|--------|-------------|
| **GPS Hazard Engine** | 10 physical hazards computed from lat/lon coordinates using elevation, coastal distance, river proximity, UHI, and slope physics |
| **NGFS DCF Model** | 3 transition scenarios (NZE 2050 / Delayed / Current Policies) × 25-year annual EV, FCF, EBITDA, carbon cost |
| **Disclosure Generator** | TCFD four-pillar + IFRS S2 metrics table + CSRD E1 data points — one-click PDF export with legal sign-off workflow |
| **Physical CaR** | Annual Loss % × Asset Carrying Value → dollar climate-at-risk per asset and portfolio |
| **Supply Chain Risk** | Supplier GPS hazard scoring, tier mapping, risk-adjusted spend |
| **Data Export** | 5-file package (CSV + JSON) for Workiva / SAP / Power BI integration |

### Data sources

- **WRI Aqueduct 4.0** — flood, water stress, drought baselines
- **NGFS Phase 4** — carbon price pathways
- **IPCC AR6 WG2** — warming trajectories and regional multipliers
- **NASA NEX-GDDP** — heat stress calibration

### Regulatory frameworks covered

- TCFD (Task Force on Climate-related Financial Disclosures)
- IFRS S2 (ISSB Climate Standard)
- CSRD E1 / ESRS (EU Corporate Sustainability Reporting)
- SBTi / SBRS (Science-Based Targets)

---

## Repository structure

```
climrisk.github.io/
├── index.html          # ClimRisk marketing website (GitHub Pages root)
├── CRI_Demo.html       # CRI engine — full platform (547KB, zero dependencies)
├── README.md           # This file
├── CNAME               # Custom domain config (climrisk.io)
└── climate_risk_engine/
    ├── engine.py       # Python hazard engine (API backend)
    ├── api.py          # FastAPI REST endpoints
    └── ...
```

---

## Deployment (GitHub Pages)

The site is deployed automatically via GitHub Pages from the `main` branch root.

1. Push to `main`
2. Go to repo **Settings → Pages → Source → Deploy from branch → main / (root)**
3. Site is live at `https://climrisk.github.io` within 1–2 minutes

**Custom domain:** once `climrisk.io` is registered, add it under **Settings → Pages → Custom domain** and the CNAME file handles the rest.

---

## Pricing

| Tier | Price | Target |
|------|-------|--------|
| Free | $0 | Rating-only, no card required |
| Analyst | $299/mo | Full model + API + data export |
| Professional | $1,200/mo | + Disclosure reports + legal workflow |
| Enterprise | $24,000/yr | White-label API + retainer + SLA |

*40–60% below MSCI ESG / Sustainalytics / S&P Trucost — delivering a full financial risk model at a fraction of legacy ESG pricing.*

---

## Lead capture / demo requests

Demo requests from the website land directly at **shrinivashdkannan@gmail.com** via mailto.

**Upgrade path (when ready):**
1. Create a free account at [formspree.io](https://formspree.io)
2. Create a new form → copy the form ID
3. In `index.html`, replace the `mailto` block with the Formspree `fetch` call (commented out inline)

---

## Contact

**Email:** shrinivashdkannan@gmail.com  
**GitHub:** [github.com/ClimRisk](https://github.com/ClimRisk)

---

*CRI Engine v0.2 · IPCC AR6 · WRI Aqueduct 4.0 · NGFS Phase 4 · NASA NEX-GDDP*
