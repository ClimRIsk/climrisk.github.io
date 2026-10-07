# ClimRisk Engine — Expert Audit
### From the perspective of a climate risk specialist advising a Tier-1 bank, insurer, or asset manager
*September 2026*

---

## What the engine does well

Before the gaps: the engine is architecturally serious. It has multi-source provenance tagging (EUTL > EDGAR > CDP > estimated), three NGFS scenarios, IFRS9/Basel III credit risk, climate-adjusted DCF with regime-based terminal value, TCFD/CSRD/SFDR/EU Taxonomy regulatory outputs, TNFD LEAP biodiversity, WRI Aqueduct water stress, and five-factor litigation risk. This is well above anything off-the-shelf from the typical data vendor. The gaps below are what would be needed to pass a Tier-1 investment bank climate risk committee or a PRA SS5/25 review.

---

## Part 1 — Missing Quantitative Risk Modules

### 1.1 Paris Temperature Alignment (CRITICAL GAP)

**What's missing:** There is no Implied Temperature Rise (ITR) score — the single headline metric every institutional investor, DFI, and central bank now asks for first. The engine computes EV haircuts but doesn't answer: "What temperature does this company's trajectory imply?"

**Why it matters:** MSCI, FTSE Russell, ISS, and Trucost all publish ITR. Without it, the engine can't benchmark against any peer data provider. ISSB IFRS S2 (mandatory in most G20 jurisdictions from 2025-2026) explicitly requires temperature alignment disclosure.

**What to build:** `paris_alignment.py`
- Map company Scope 1+2+3 trajectory (from `_trajectory.py`) against sector carbon budget from IEA Net Zero by 2050 (2023 edition) and SBTi sectoral decarbonization pathways
- Compute ITR using linear convergence to net-zero by 2050 (SBTi methodology) or budget allocation method (PACTA/2DII)
- Output: ITR (°C), overshoot year, required annual reduction rate vs. actual trajectory, alignment gap in Mt CO2e
- Sources: SBTi Sectoral Decarbonization Approach (SDA) v2.0; IEA NZE 2023; IPCC AR6 remaining carbon budgets

### 1.2 Tipping Point / Non-Linear Risk (HIGH PRIORITY)

**What's missing:** All scenarios use smooth NGFS pathways. No tipping point risk. The IPCC AR6 identifies nine global tipping points (Amazon dieback, AMOC collapse, West Antarctic Ice Sheet, permafrost carbon feedback, etc.) that create **discontinuous, non-linear losses** absent from any smooth scenario.

**Why it matters:** The ECB 2022 climate stress test explicitly notes that smooth scenarios understate tail risk. S&P Global estimates tipping points could cause 4× the losses of smooth pathways by 2100. For long-duration infrastructure and real estate, this is material.

**What to build:** `tipping_point_risk.py`
- Five tipping elements with modeled probability of crossing by 2030/2050 under each NGFS scenario
- Financial loss amplifier (multiplier on physical risk scores) when sector-specific tipping elements are triggered
- Exposure flags: oil/gas in Arctic (permafrost), agriculture in South America (Amazon), coastal assets (WAIS/AMOC)
- Sources: Lenton et al. (2023) Science — tipping cascades; McKay et al. (2022) Science — updated tipping points

### 1.3 Stochastic / Monte Carlo Framework (HIGH PRIORITY)

**What's missing:** Every module produces point estimates. No probability distributions, no confidence intervals, no tail risk quantification on the financial outputs themselves. A bank's climate risk team will not accept a single EV haircut number without uncertainty bounds.

**Why it matters:** PRA SS5/25 requires stress testing with uncertainty analysis. ECB climate stress test methodology §3.2 explicitly asks for scenario uncertainty quantification. Point estimates also mask the asymmetry of climate risk (losses are fat-tailed).

**What to build:** `monte_carlo.py`
- Wrap key inputs (carbon price, temperature trajectory, hazard frequency, transition cost) in truncated normal / lognormal distributions
- Run N=10,000 trials on the DCF + physical risk pipeline
- Output: P5/P50/P95 distribution on EV haircut, ECL, total NPV drag
- Plot: loss exceedance probability curve (return period vs. loss), fan chart of EV trajectories

### 1.4 Adaptation Investment ROI (MEDIUM PRIORITY)

**What's missing:** The engine quantifies risk losses (water NPV drag, flood damage curves, etc.) but has no module to evaluate the **return on adaptation investment**. A CFO's first question after seeing the risk is: "What does it cost to fix it, and is the capex justified?"

**What to build:** `adaptation_roi.py`
- Catalogue of adaptation measures per hazard type (flood barriers → $X/m, HVAC upgrades → $Y/MW, water recycling → $Z/m³)
- Net-benefit calculation: reduction in expected loss NPV vs. adaptation capex + opex
- Benefit-cost ratio (BCR) per measure, with EU Taxonomy adaptation criteria alignment
- Output: ranked adaptation priority list with BCR and payback period
- Sources: EIB Climate Economic Analysis 2020; Munich Re NatCat adaptation cost curves; IPCC AR6 WGII Table 17.4

### 1.5 Supply Chain / Counterparty Climate Risk (MEDIUM PRIORITY)

**What's missing:** `eemrio.py` estimates Scope 3 via EEIO. But there is no **facility-level supplier climate vulnerability**. For banks with trade finance exposure, or manufacturers with concentrated sourcing, a key supplier going offline from a flood or drought is an immediate credit event.

**What to build:** `supply_chain_risk.py`
- Map primary commodity inputs to sourcing geographies (sector-level default matrices from GTAP/OECD TiVA)
- Apply physical risk scores to sourcing regions
- Output: supply disruption probability by commodity, revenue-at-risk from supply chain disruption, concentration index
- Data: NOAA FIRMS (wildfire), GDACS (flood/cyclone) already connected — route through supplier geographies

### 1.6 Carbon Price Forward Curve (MEDIUM PRIORITY)

**What's missing:** The transition module applies carbon cost shocks but doesn't produce a **carbon price forward curve** per scenario. This is required for: (a) hedging cost estimation, (b) EU ETS allowance liability forecasting, (c) CBAM cost projection (which the CBAM module does use, but implicitly).

**What to build:** `carbon_price_forward.py`
- Per-scenario carbon price path 2025-2050 (NZE: $130→$250/tCO2e; Delayed: $50→$300; CP: $10→$50 — NGFS Phase 5 values)
- Interpolate per year, output as JSON curve + DataFrame
- EU ETS vs. global carbon price divergence handling (EU ETS currently ~€60-90; NZE converges to ~$130 by 2030)
- Used by: CBAM module, stranded assets, DCF carbon cost line, transition risk scoring

---

## Part 2 — Data Source Gaps

### 2.1 Facility-Level Asset Data

**Gap:** When `geocoder_client.py` fails to resolve coordinates (common for private companies, subsidiaries), the engine falls back to sector-average Aqueduct scores. A steel mill in Chennai and a steel mill in Stuttgart face completely different physical risk profiles — sector averages hide this.

**Fix:** Integrate OpenStreetMap Overpass API (industrial=yes, power=plant, landuse=industrial) or the Global Power Plant Database (WRI) for energy companies. For a true production deployment, S&P Global Physical Risk or Four Twenty Seven (Moody's) facility-level data is the standard.

### 2.2 Real Estate / Mortgage Portfolio Data

**Gap:** No First Street Foundation flood factor, RMS RiskLink, or property-level climate risk integration. For banks, mortgage books are the largest single climate-exposed asset class. The PRA 2022 climate biennial exploratory scenario found that UK banks' mortgage books were the most significant channel of physical risk.

### 2.3 CMIP6 Full Ensemble

**Gap:** `spatial_downscaling.py` exists but it's unclear whether it's drawing from a single CMIP6 model or the full multi-model ensemble. Uncertainty in climate projections spans 1.5-4.5°C for ECS — using a single model understates uncertainty by ~40%.

**Fix:** Use the CMIP6 weighted ensemble mean (Brunner et al. 2020 constrained ensemble) for central estimates; 10th/90th percentile models for uncertainty bounds.

### 2.4 Deforestation / Land Use Change

**Gap:** `biodiversity.py` scores land-use intensity but there is no real-time deforestation data integration. For food/agriculture/forestry companies, this is both a material risk and a rapidly-evolving regulatory requirement (EU Deforestation Regulation, EUDR, effective December 2024).

**Fix:** Global Forest Watch API (already has REST endpoints); PRODES data for Amazon deforestation.

### 2.5 Sovereign Climate Risk

**Gap:** For companies with significant EM exposure, sovereign climate vulnerability (e.g., Bangladesh flood risk affecting manufacturing, South Africa water scarcity affecting mining) should feed into credit risk and supply chain risk. ND-GAIN Country Index and INFORM Risk Index are the standard references.

---

## Part 3 — Methodology Weaknesses

### 3.1 Physical-Transition Risk Interaction (Cross-Risk Correlation)

**Gap:** Physical and transition risks are computed independently and then summed. In reality, under the **Delayed Transition scenario** (low action now → abrupt later), companies face **both** elevated physical risk AND a sudden transition shock simultaneously. Treating them as independent understates the worst-case scenario by ignoring the correlation.

**Fix:** Add a cross-risk correlation matrix in `scenario_engine.py`: under Delayed, apply a positive correlation multiplier (ρ ≈ 0.3-0.5) to combined physical+transition EV haircut. Under NZE (orderly), the correlation is lower (ρ ≈ 0.1) because transition investment reduces physical exposure over time.

### 3.2 Warm Glow / Green Premium Bias

**Gap:** The DCF currently treats all clean energy/green product revenue neutrally (same WACC as dirty revenue). In practice, green bonds, sustainability-linked loans, and ESG-indexed equity command a **green premium** — lower cost of capital for credible transition leaders. This cuts the other way for laggards (greenium-adjusted WACC spread).

**Fix:** Add a `green_premium_adjustment` parameter to `climate_adjusted_wacc()`: ±25-50bp WACC adjustment depending on CRI rating. HSBC / ING green bond pricing research gives empirical basis.

### 3.3 Scope 3 Category 15 (Financed Emissions) for Financial Companies

**Gap:** `pcaf.py` covers financed emissions attribution, but when a *financial company* is being assessed (bank, insurer, asset manager), the engine uses sector-default Scope 3 assumptions from EEIO. A bank's own Scope 1+2 is tiny; its real climate impact and risk is entirely through its loan book and investment portfolio. The engine doesn't flip into "financial company mode" where Scope 3 Category 15 IS the primary risk metric.

**Fix:** In `company_profiler.py`, detect `sector == "financials"` or `"banking"` and route to PCAF-based Scope 3 estimation from portfolio composition.

### 3.4 Missing Hazard: Wildfire (Despite Having NASA FIRMS)

**Gap:** NASA FIRMS connector exists and returns fire data. But there is no **wildfire financial loss module** in the climate/ directory. Wildfire is the fastest-growing physical risk (California, Australia, Southern Europe, Canada) and is absent from the physical risk scoring.

**Fix:** Build `wildfire_risk.py` using NASA FIRMS historical fire density + CMIP6 Fire Weather Index projections. The 25-hazard list mentions fire but there's no standalone financial translation. Use insurance industry fire damage curves (Swiss Re, Munich Re WildfireRisk model structure).

### 3.5 Heat-Stress Labour Productivity

**Gap:** `nasa_heat.py` captures heat data and chronic risk captures heat hazard, but there is no **labour productivity loss model**. For labour-intensive sectors (agriculture, construction, outdoor manufacturing), WBGT (Wet Bulb Globe Temperature) exceedance directly reduces productive hours and increases health costs. Parsons et al. (2021) estimates 10-17% productivity loss per degree above WBGT threshold.

**Fix:** Add to `physical_risk_financial.py` a labour productivity damage function: WBGT × sector labour-intensity × affected workforce fraction → revenue haircut and healthcare cost uplift.

---

## Part 4 — Regulatory Coverage Gaps

### 4.1 ISSB IFRS S2 (Most Urgent)

IFRS S2 "Climate-related Disclosures" became mandatory in Australia (FY2025), UK (FY2026), Canada (FY2026), Japan (large caps FY2025), Singapore, New Zealand, and is adopted by reference in many other jurisdictions. It supersedes TCFD and adds:

- **Quantitative climate resilience assessment** (scenario analysis with specific transition + physical scenarios, both qualitative AND quantitative)
- **Cross-industry climate metrics** (Scopes 1/2/3, WACC sensitivity to carbon price, amount of assets/revenue exposed to transition risk areas)
- **Industry-specific metrics** via SASB

**Gap:** The engine produces TCFD-aligned outputs. There is no IFRS S2 disclosure mapping layer. An `ifrs_s2.py` module should map existing engine outputs to the IFRS S2 disclosure requirements table.

### 4.2 PRA SS5/25 Stress Test Format

Bank of England Prudential Regulation Authority Supervisory Statement SS5/25 requires UK banks to submit climate stress test results in a specific format. The engine's credit risk and portfolio modules reference PRA methodology but produce no PRA-formatted output.

**Fix:** An `outcomes/pra_stress_report.py` that wraps portfolio-level ECL, RWA, and EV impacts in the PRA's prescribed table structure.

### 4.3 TNFD Required Disclosure Tables

`biodiversity.py` scores nature risk but doesn't output the **four TNFD recommended disclosure tables** (Governance, Strategy, Risk & Impact Management, Metrics & Targets). The TNFD v1.0 Framework Appendix specifies exact column requirements. Many large companies are now voluntarily disclosing to TNFD ahead of mandatory deadlines.

### 4.4 SBTi Corporate Net-Zero Standard Alignment Check

The engine *consumes* SBTi data (validated / committed / none) but doesn't *assess* whether a company's forward trajectory meets the SBTi Corporate Net-Zero Standard criteria:
- Near-term: 50% absolute Scope 1+2 reduction by 2030 from 2020 base
- Long-term: 90%+ absolute reduction by 2050, residual offset with permanent CDR

**Fix:** `sbti_alignment_checker.py` — compare trajectory outputs from `_trajectory.py` against the SBTi criteria per sector. Output: alignment status, gap to near-term target, gap to long-term target.

### 4.5 APRA CPG229 and HKMA Climate Risk

Not all users are EU/UK. APRA CPG229 (Australia) and HKMA climate risk guidance (Hong Kong) have distinct requirements (physical risk scenario analysis mandated, specific stress test horizons 2030/2050/2080). For any Asia-Pacific bank using this engine, a gap exists.

---

## Part 5 — Visualization Gaps (Most Impactful for User Experience)

The web platform (`climrisk-web` Next.js) currently has: capabilities, cases, company, components, contact, engine, frameworks, globals.css, layout.tsx, page.tsx, platform, research, solutions, validation. The PDF report (`pdf_report.py`) produces static pages. There is no **interactive visualization layer**. This is the biggest gap for a commercial product — the numbers are there, but the charts are not.

### 5.1 Scenario Fan Chart (CRITICAL — #1 ask from financial users)

A time-series chart (2025-2050) showing EV or FCF trajectory under all three scenarios:
- Three lines (NZE, Delayed, CP) with shaded uncertainty bands (±1 std dev from Monte Carlo)
- Vertical marker at "tipping point year" if triggered
- Benchmark line showing sector average
- **Format:** Recharts line chart in Next.js; also available as matplotlib PNG in PDF report

### 5.2 Physical Risk Facility Map

An interactive geographic map showing:
- Company facilities as markers, coloured by physical risk tier (green/amber/red)
- Hazard overlays: flood zones (FEMA / JRC), wildfire risk, heat stress bands
- Sidebar: click a facility → see hazard breakdown and financial impact
- **Format:** Mapbox GL JS or Leaflet in Next.js; static PNG from folium in PDF report

Currently absent entirely. `geocoder_client.py` resolves coordinates but nothing visualizes them.

### 5.3 EV Waterfall / Bridge Chart

Walking from the base-case Enterprise Value down to climate-adjusted value:
```
Base EV → Physical Risk Drag → Stranded Asset Impairment → CBAM Cost
         → Water NPV Drag → Litigation Reserve → Climate-Adjusted EV
```
This is the standard output format for investment banking climate analysis (JPMorgan, HSBC climate transition team reports all use this format).
- **Format:** Bar waterfall chart (Recharts or D3) in Next.js; table in PDF

### 5.4 Carbon Pathway Chart

For every company assessed:
- Historical Scope 1+2 (3 years back)
- Projected trajectory from `_trajectory.py`
- **Required reduction path** to 1.5°C (SDA sector pathway)
- Required reduction path to 2°C
- Shaded "overshoot zone" where company exceeds its remaining carbon budget
- **Format:** Area line chart in Next.js; matplotlib in PDF

This chart is the single most-requested output by ESG analysts, sustainability consultants, and climate-conscious investors.

### 5.5 CRI Pillar Radar Chart

The composite CRI rating has four pillar scores (exposure, transition, financial, adaptive). A radar/spider chart showing all four pillars at once is the standard communication format:
- Company radar overlaid on sector median radar
- Each pillar score (0-100) on its own axis
- Colour: green for better than sector median, red for worse
- **Format:** Recharts `RadarChart` in Next.js; matplotlib polar plot in PDF

Currently the PDF report shows the composite score but not the decomposition visually.

### 5.6 Portfolio Climate Dashboard

For portfolio-level analysis (`analysis/portfolio.py` outputs exist but aren't visualized):
- Bubble chart: X = transition risk score, Y = physical risk score, bubble size = portfolio weight, colour = sector
- Correlation matrix heatmap (cross-holdings climate correlation)
- Stacked bar: portfolio EV at risk by scenario
- Pie chart: sector allocation with climate-weighted exposure overlay
- **Format:** Interactive HTML dashboard (Recharts); PDF summary page

### 5.7 Hazard Contribution Stacked Bar

For physical risk, the engine scores 25 hazards but the report only shows a total physical score. Investors need to understand which hazards are driving risk:
- Stacked bar per scenario: flood, heat, drought, wildfire, sea level rise, tropical cyclone, etc.
- Allows "what if" thinking (e.g., "if we harden against flood, which other hazards remain?")
- **Format:** Recharts `BarChart` stacked; matplotlib in PDF

### 5.8 Confidence / Data Quality Heatmap

The engine's ConfidenceTier system (VERIFIED > REPORTED > ESTIMATED > MISSING) is its key differentiator vs. competitors. But it's invisible to the user in current outputs. A heatmap showing:
- Rows: each key metric (Scope 1, Scope 2, Scope 3, facility locations, water risk score, etc.)
- Columns: data source used, confidence tier, year of data, provenance URL
- Colour: green=VERIFIED, amber=REPORTED, orange=ESTIMATED, red=MISSING
This directly addresses regulators' biggest concern about AI-generated climate assessments.

### 5.9 Litigation Timeline Chart

`litigation_risk.py` scores litigation exposure but doesn't visualize the case landscape:
- Timeline chart of global climate litigation cases (2010-2025) with sector overlay
- Marker for company's own risk tier on a distribution of all assessed companies
- Precedent case citations as tooltip overlays
- **Format:** Recharts `LineChart` with annotations

### 5.10 Implied Temperature Rise Gauge

Once `paris_alignment.py` is built:
- A gauge/thermometer visual showing ITR vs. 1.5°C / 2°C / 3°C benchmarks
- Color: green (<1.5°C), amber (1.5-2°C), red (2-3°C), dark red (>3°C)
- The single most shareable visual for board reporting and investor presentations

### 5.11 SFDR PAI Disclosure Table

`sfdr_pai.py` computes the 18 mandatory + additional PAI indicators but there's no formatted PAI table output. European SFDR Article 8/9 funds must publish PAI statements in a standardized format. An HTML/PDF table output matching the RTS Annex I template would make the engine directly usable by EU fund managers without post-processing.

### 5.12 Sankey Diagram for Scope 3 Value Chain

The Scope 3 estimation from `eemrio.py` spans 15 categories. A Sankey diagram showing:
- Company → upstream Scope 3 categories (procurement, capital goods, fuel)
- Company → downstream Scope 3 categories (use of sold products, end-of-life)
- Width proportional to Mt CO2e
- Colour by abatement difficulty

This is the standard visual for supply chain emissions analysis (used by CDP and Science Based Targets reports).

---

## Part 6 — Priority Action Matrix

| Priority | Module / Feature | Effort | Impact |
|----------|-----------------|--------|--------|
| P0 | Paris Temperature Alignment (ITR) | 3 days | Highest — mandatory for ISSB/investor use |
| P0 | Scenario Fan Chart (Next.js component) | 2 days | Highest — #1 user request |
| P0 | EV Waterfall Bridge Chart | 2 days | High — standard banking output |
| P1 | Carbon Pathway Chart | 1 day | High — ESG analyst essential |
| P1 | CRI Radar Chart | 1 day | High — executive communication |
| P1 | Physical Risk Facility Map | 3 days | High — facility-level risk |
| P1 | Confidence Heatmap | 1 day | High — regulatory credibility |
| P1 | Monte Carlo / Stochastic Framework | 5 days | High — stress test requirement |
| P1 | Tipping Point Risk Module | 3 days | High — ECB/PRA alignment |
| P2 | IFRS S2 Disclosure Mapping | 2 days | Medium — regulatory compliance |
| P2 | Adaptation ROI Module | 3 days | Medium — CFO use case |
| P2 | Wildfire Financial Loss Module | 2 days | Medium — NASA FIRMS unused |
| P2 | Heat Stress Labour Productivity | 2 days | Medium — agriculture/construction |
| P2 | Portfolio Climate Dashboard | 3 days | Medium — asset manager use case |
| P3 | Supply Chain Risk Module | 4 days | Medium — trade finance use case |
| P3 | Carbon Price Forward Curve | 1 day | Medium — hedging use case |
| P3 | SFDR PAI Formatted Table Output | 1 day | Medium — EU fund managers |
| P3 | Scope 3 Sankey Diagram | 2 days | Medium — CSRD/CDP reporting |
| P3 | SBTi Alignment Checker | 2 days | Medium — investment stewardship |

---

## Summary

The engine is **technically complete for its core use case** (single-company NGFS scenario risk assessment with TCFD/CSRD/EU Taxonomy outputs). The three gaps that would most limit commercial adoption are:

1. **No Paris temperature alignment / ITR scoring** — this is the headline metric every potential client will ask for first. It's a P0 build.
2. **No interactive visualizations** — the numbers are computed but not presented. A Next.js chart library integration (Recharts is already in scope) could turn the API outputs into a class-leading dashboard with 2-3 weeks of front-end work.
3. **No stochastic uncertainty bounds** — point estimates are not sufficient for bank stress testing. Monte Carlo wrapping the existing DCF pipeline is architecturally straightforward given the modular design.

Everything else is incremental hardening: regulatory format outputs for newer standards (IFRS S2), additional risk modules (wildfire, tipping points, adaptation ROI), and data source upgrades for facility-level precision.
