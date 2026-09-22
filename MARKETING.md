# ClimRisk Intelligence — Marketing Brief

> **Purpose:** This document is the starting point for a dedicated marketing conversation.
> Open a new Claude chat, paste this file's contents, and say: "Let's build the marketing strategy for ClimRisk."

---

## What We Sell

**ClimRisk Intelligence** is a B2B SaaS API that gives financial institutions — banks, asset managers, insurers, private equity — quantified climate financial risk assessments for any company in their portfolio or lending book.

The output is a structured JSON payload (and now a 4-page PDF report) containing:

- **CRI Rating** (A–E) — composite Climate Risk Index score
- **Three-scenario EV trajectory** — how company enterprise value moves under NZE 2050, Delayed Transition, and Current Policies through 2050
- **Physical hazard breakdown** — flood, heat stress, water scarcity, wildfire, cyclone (asset-level, P10/P50/P90 EAL)
- **Transition risk** — EBITDA compression from carbon pricing under NGFS Phase 4 scenarios
- **ML disclosure intelligence** — ClimateBERT NLP scans ESG reports; detects greenwashing, commitment specificity, TCFD alignment
- **Implied Temperature Rise (ITR)** — company-level ITR aligned to Paris Agreement pathways
- **PDF client report** — 4-page branded deliverable for investment committees

---

## Technology Stack (key selling points)

- **NGFS Phase 4 (2023)** scenarios — the standard used by central banks and regulators globally
- **IPCC AR6** physical hazard projections
- **WRI Aqueduct 4.0** water/flood baselines
- **NASA FIRMS / GDACS** live satellite event data
- **GradientBoosting ML** trajectory model (sklearn) trained on 150,000 synthetic company-years
- **ClimateBERT** NLP models from ETH Zurich for disclosure intelligence
- **XGBoost** emissions imputation when company-reported figures are unavailable
- **On-premise Docker option** — for clients who cannot send data off-premise (banks, sovereign wealth funds)
- **Live API** at `https://climrisk-github-io.onrender.com` with X-API-Key authentication

---

## Target Customers (ICP)

### Tier 1 — Highest propensity to pay fast

| Segment | Pain point | Our answer |
|---|---|---|
| Private credit / direct lending (30–300 company portfolios) | No standardised climate risk data for unrated companies; TCFD disclosure required | CRI rating + TCFD/ISSB/CSRD reports via API per company |
| ESG / climate risk teams at mid-size asset managers ($5B–$100B AUM) | Rely on MSCI/Sustainalytics at $500K+/yr; can't justify for sub-IG or private assets | Fractional cost, self-serve, private company coverage |
| Climate-risk advisors / consultancies | Manual analysis takes 2–4 weeks per company | 5-second API response + branded PDF to hand to client |

### Tier 2 — Longer sales cycle but larger ACV

| Segment | Pain point |
|---|---|
| Tier 2 banks (ESG loan syndication, green bonds) | SFDR / EU Taxonomy disclosure requirements; need portfolio-level climate data |
| Insurers (commercial property underwriting) | Physical risk quantification for underwriting; EAL estimates at asset level |
| Real estate investment managers | Physical risk to properties under different warming scenarios |

### Tier 3 — Outbound / partnership channel

| Segment | Notes |
|---|---|
| Law firms (climate litigation risk) | ESG disclosure credibility gap detection |
| Accounting / audit (assurance of climate disclosures) | TCFD pillar classification, specificity scoring |
| Credit rating agencies | Supplemental climate risk data feed |

---

## Pricing Model — Enterprise Licensing (NOT monthly SaaS)

ClimRisk licenses the engine to institutions under annual contracts, like Bloomberg Terminal.
Long-term commitment is the goal — not month-to-month churn. Two or three clients at the
right price point = sustainable revenue.

| License Tier | Annual Fee | What's included |
|---|---|---|
| **Analyst License** | £20,000/yr | Up to 100 company assessments/yr, CRI rating + scenario reports, API access, 1 user seat |
| **Professional License** | £60,000/yr | 500 assessments/yr, full ML trajectory + TCFD/ISSB/CSRD/PDF reports, 5 user seats |
| **Enterprise License** | £150,000–£300,000/yr | Unlimited assessments, on-premise Docker deployment, custom NGFS scenarios, portfolio monitoring, dedicated SLA, annual calibration update, 20+ seats |
| **One-time Due Diligence Report** | £500/report | Single company 4-page PDF — for law firms, consultants, credit committees |

**Why licensing, not SaaS:**
- Regulated financial institutions prefer known annual costs and multi-year contracts
- On-premise Docker option is only viable as a licensed product
- Annual commitment = real revenue signal + client lock-in
- 3-year enterprise contracts (£450K+ over term) create meaningful recurring revenue
- Matches how Bloomberg, MSCI, and FactSet sell data to institutions

---

## Competitive Landscape

| Competitor | Weakness | Our advantage |
|---|---|---|
| MSCI ESG | $300K–$1M/yr; public companies only; no private credit coverage | 100x cheaper; private company estimation; developer API |
| Sustainalytics | Coverage gap for EM and small-cap; no scenario trajectory | Scenario-native (NGFS); ML trajectory 2025–2050 |
| S&P Trucost | Data lag (annual refresh); expensive; no physical cascade engine | Live satellite data; compound event modeling; real-time |
| Bloomberg BNEF | Macro-level only; not company-specific | Asset-level physical risk; company-level CRI score |
| In-house models | 6–18 month build time; ongoing maintenance; no NGFS update cycle | Deployed in hours; always on latest NGFS Phase |

**Key differentiators:**
1. Physical cascade engine — compound event modeling (Thailand floods + drought simultaneously), not just hazard scores
2. Greenwashing detection — ClimateBERT NLP tells you if "commitment" language is backed by specifics
3. On-premise option — the only climate risk API with a Docker image for regulated clients
4. Price — 100x cheaper than incumbent ESG data vendors for the same output quality

---

## Sales Narrative (elevator pitch variants)

**For a private credit fund:**
"Your TCFD report is due in Q2 and you have 80 companies in your portfolio with no CDP data. We give you a CRI rating and TCFD-aligned PDF for every company in 5 seconds each, at $2,000/month. Your alternatives are MSCI at $300K or a consultant at $15,000 per company."

**For an ESG consultant:**
"You spend 3 weeks per company doing manual climate due diligence. We do it in 5 seconds and give you a branded PDF to hand to your client. You increase margin, we charge you $500/month."

**For a climate-focused LP:**
"Your GPs don't have standardised climate risk reporting. We give you a portal where you can run every portfolio company through our NGFS scenario engine and compare their CRI ratings — the same framework central banks use."

---

## Go-to-Market Priorities

### Now (months 1–2)
1. **Content marketing** — publish one technical article per week on LinkedIn: "What is a CRI rating?", "NGFS scenarios explained in 5 minutes", "How to detect greenwashing in 30 seconds"
2. **Demo-first outreach** — cold email to 50 ESG analysts at mid-size asset managers with a live demo link; show a real company assessment in 30 seconds
3. **Consultancy channel** — partner with 3 climate advisory firms who bill their own clients; white-label the PDF report; revenue share

### Next (months 3–6)
4. **One-time report page** — a $299 self-serve "order a report" flow on the website (no sales call needed)
5. **Integration marketplace** — Salesforce / HubSpot CRM plugin so credit analysts can run CRI assessments inside their existing workflow
6. **EU regulatory tailwind** — SFDR, CSRD, EU Taxonomy are forcing every European financial institution to collect this data by 2026; target compliance teams at European banks

### Later (months 7–12)
7. **Data feed to Bloomberg Terminal** — sell a structured data feed subscription
8. **Portfolio monitoring SaaS** — move from per-assessment to "monitor 500 companies, alert me when CRI changes"
9. **Regulatory reporting module** — auto-generate TCFD report in the exact format required by FCA / ECB / SEC

---

## Key Metrics to Track

- MRR (Monthly Recurring Revenue)
- API calls per customer per month (usage signal)
- Assessment-to-PDF conversion rate (are customers hitting /reports/client?)
- Churn rate per tier
- Time to first assessment (activation metric)
- Lead source (LinkedIn article → sign-up, cold email, partner referral)

---

## Open Questions for Marketing Strategy Session

1. Should we launch with a freemium model (5 free assessments/month) to reduce friction, or go paid-only from day one?
2. Which geography first — UK (FCA TCFD mandate already live), EU (CSRD coming), or US (SEC climate rule delayed)?
3. Should the brand be "ClimRisk" (technical, B2B) or something warmer that works for consultants and mid-market?
4. Conference strategy — attend UNPRI, COP30 side events, or focus budget entirely on digital?
5. Should we build a referral program for the consultant channel before or after first 10 paying customers?

---

## Assets We Have

- Live API with authentication
- 4-page branded PDF report generator
- Interactive dashboard at `/platform/dashboard`
- Full methodology documentation (NGFS, IPCC AR6, CLIMADA)
- 3 TCFD/ISSB/CSRD report endpoints
- On-premise Docker deployment option
- Domain: climrisk.io (assumed)

## Assets We Still Need

- Website landing page with pricing table and live demo
- One-click "order a report" checkout ($299 self-serve)
- Case study: one named client or a detailed worked example
- LinkedIn content calendar (8 weeks of posts)
- Email sequence for cold outreach (5-touch)
- Partner deck (2 pages) for consultancy channel conversations
