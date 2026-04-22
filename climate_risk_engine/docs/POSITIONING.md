# Positioning — CRI vs. the physical-risk data providers

## The landscape we're entering

Physical climate risk is already a crowded tier of vendors:

| Vendor | What they sell | Where they stop |
|---|---|---|
| **Continuuiti** | REST API: coords → 12-hazard scores (0–10), SSP2-4.5 & SSP5-8.5, horizons to 2060. Batch up to 5,000 locations. Primary ICP: insurance underwriters. | No transition risk. No company financials. No valuation. |
| **Climate X (Spectra)** | Asset-level physical hazard data, high-resolution climate projections. | Same — hazard intelligence without a financial engine. |
| **EarthScan / Mitiga** | Climate risk analytics & intelligence. | Same. |
| **Correntics** | Climate data API + sustainability. | Same. |
| **Munich Re (Location Risk)** | Location-level hazard intelligence w/ insurance overlay. | Insurance claims, not investor DCF. |
| **S&P Physical Risk** | Company-level physical risk exposure scores + some financial impact. | Gets closer, but bundled inside a huge ESG product. |
| **MSCI Climate VaR** | Portfolio-level CVaR including transition. | Black-box methodology; expensive; not investor-transparent. |

## The gap we fill

Everyone on the left side of the chart is selling **inputs**. Nobody is selling an **investor-grade, transparent engine** that:

1. Accepts hazard data *from any provider* (ours, Continuuiti, Climate X, WRI Aqueduct) — not a lock-in;
2. Adds a full **transition-risk** layer (carbon pricing, commodity demand, MACC curves, policy shocks) tied to NGFS and IEA scenarios;
3. Translates both layers into **company-level financials** — revenue by commodity, opex decomposition, dynamic margins, FCF;
4. Produces a **climate-adjusted DCF** with equity-bridge to implied share price;
5. Does all this with **transparent, auditable methodology** that an IC can defend — not a black box.

This is exactly the architecture we've already started building.

## Concrete implication for our architecture

The `climate.physical` module becomes a **provider abstraction**, not a hardcoded implementation. We can ship CRI with:

- A default provider that reads our internal hazard Parquet (WRI Aqueduct + NASA NEX-GDDP).
- A `ContinuuitiPhysicalRiskProvider` that wraps their REST API (when the client brings an API key).
- A `ClimateXProvider`, `MunichReProvider`, etc.

This makes CRI the **integration layer**, not a competitor to the data vendors. Three business benefits:

1. **Faster time-to-pilot.** Clients who already pay Continuuiti / Climate X can plug that spend into our engine without re-licensing hazard data.
2. **Defensibility.** Data providers compete on coverage & resolution. Transparency, transition overlay, and DCF are harder moats — that's where we sit.
3. **Partnership optionality.** If Continuuiti (or any provider) wants a financial overlay, we're the obvious white-label partner rather than competitor.

## Pitch positioning (one line each)

- **To investors/corporates:** "Physical and transition climate risks, translated into climate-adjusted EBITDA and valuation — with every number traceable."
- **To physical-risk vendors:** "Your hazard data, our financial engine — plug us in, offer your clients a full climate-to-finance story."
- **To analysts:** "Stop ESG letter grades. Dollar impact, by scenario, auditable assumption-by-assumption."

## What this means for the roadmap

Phase 2 gets a new line item: build the `PhysicalRiskProvider` interface and ship two implementations (internal + one external). That's what we do next.
