# Upwork Proposal: EU ETS Expert – Data Model Validation & CBAM Integration
**Job URL:** https://www.upwork.com/jobs/ETS-Expert-Data-Model-Validation-CBAM-Integration_~022098316588972060312/
**Apply URL:** https://www.upwork.com/nx/proposals/job/~022098316588972060312/apply/
**Client:** Belgium | Payment verified | $10–$105/hr | Expert | Less than 1 month | 5–10 proposals
**Bid rate:** $75/hr

---

## COVER LETTER

I am applying for the EU ETS data model validation engagement. My background sits at the intersection this role requires: applied knowledge of EU ETS and CBAM regulatory frameworks, hands-on ISO 14064/67 MRV methodology, and production experience translating complex climate regulations into data architectures.

**Regulatory depth:** At Ramco Cements, I quantified 450,000 tCO2e annually across 4 manufacturing facilities under ISO 14064 and GHG Protocol — the monitoring, reporting, and verification structure that is architecturally equivalent to EU ETS MRV. Zero third-party verification findings. I hold an active ISO 14067 Accredited Auditor certification. At INHAF Chennai, I worked across CSRD/ESRS E1-9, which mandates disclosure of EU ETS participation, traded allowances, and scope 1 emissions subject to ETS obligations. I understand the EU ETS compliance cycle: installation-level GHG monitoring plans, annual emissions reports, third-party verification, allowance allocation (free allocation versus auction), and surrender obligations.

**Data model capability:** I built ClimRisk (climrisk.io), a production Python/FastAPI platform that translates 25+ physical climate hazard regulatory frameworks (NGFS Phase 4, TCFD, CSRD/ESRS E1-9, EBA Pillar 3, SFDR) into data entities, attributes, relationships, business rules, and API endpoints. I work with PostGIS, SQL schema design, and FastAPI daily — so I can review your data model at the schema level, not just the conceptual level. The specific question of "does this entity model capture the correct temporal dimensions for EU ETS compliance cycles?" is exactly the kind of validation I do in production.

**CBAM integration:** I have analysed CBAM as a regulatory framework and its interaction with EU ETS — the carbon price equivalence mechanism, declarant obligations, the embedded emissions calculation methodology under Implementing Regulation 2023/1773, and the sectors in scope. The design tension between EU ETS and CBAM is well-known: CBAM sets a price equivalent to EU ETS allowances, but the data flows (installation-level emissions, verification, allowance registry, CBAM declaration) are adjacent but structurally separate. I can map where the two models should share entities (installation, operator, country of origin, embedded emissions verification) versus where they must stay separate (allowance lifecycle, compliance cycle timing, MRV methodology per scheme).

I am available immediately and based in Rotterdam (CET), with direct time-zone overlap with your Belgian team. I am comfortable facilitating structured workshops and translating between regulatory language and technical requirements for cross-functional teams.

---

## SCREENING QUESTIONS (from JD — answer all 7)

### Q1: What is your experience with EU ETS (ETS1 and/or ETS2)?

I have worked with EU ETS from two applied angles.

First, as a GHG accounting practitioner: I quantified 450,000 tCO2e annually under ISO 14064 for Ramco Cements across 4 facilities. The monitoring plan, emissions calculation methodology, activity data collection, third-party verification, and audit trail disciplines I used are structurally equivalent to EU ETS MRV. Zero verification findings across the engagement.

Second, as a climate regulatory framework analyst: I implement CSRD/ESRS E1-5 for corporate clients, which requires disclosure of EU ETS participation status, traded allowances, and scope 1 emissions subject to ETS obligations. This means I have reviewed how EU ETS concepts (installation, operator, allowance, compliance cycle, allocation method) must appear in corporate sustainability disclosure data.

On ETS2: I have reviewed ETS2 as part of CSRD horizon scanning — the extension to buildings, road transport, and maritime is material for ESRS E1-9 transition risk assessments I prepare. I understand the key structural differences from ETS1 (no free allocation, deferred start, cost-of-living adjustment mechanism, Social Climate Fund link).

My ETS knowledge is applied rather than from having operated an installation registry account directly.

---

### Q2: Have you worked with CBAM?

Yes. I have analysed CBAM as a regulatory framework and its implications for embedded emissions accounting across supply chains.

Specifically: I understand CBAM's interaction with EU ETS (the carbon price equivalence deduction mechanism), the declarant obligations for EU importers, the embedded emissions calculation methodology under Implementing Regulation 2023/1773, and the sectors in scope (steel, cement, aluminium, electricity, fertilisers, hydrogen). For clients with cross-border supply chains I have assessed CBAM obligations as part of Scope 3 Category 1 (purchased goods from covered sectors) inventory work.

I have not operated a CBAM declarant account directly, but I understand the data structure: precursor embedded emissions, direct vs. indirect emissions scope, country of origin carbon pricing deduction, CBAM certificate purchase, and the quarterly declarant reporting cycle.

---

### Q3: Have you worked with EU ETS/CBAM data, registries, or related systems?

I have worked with EU ETS and CBAM at the regulatory data concept level, including understanding the EUTL registry structure (installation ID, operator, country, verified emissions, allocated allowances, surrendered allowances, transaction log). I have not directly queried the EUTL API.

For ClimRisk, I designed data schemas that model regulatory obligations as time-dependent attributes — directly analogous to how ETS compliance data works: vintage year, allocation period, compliance cycle, monitoring plan version, reporting year, verification status. The challenge of "how do you model a regulatory state that changes each year while maintaining historical auditability" is one I have solved in production.

---

### Q4: Have you previously reviewed or designed data models based on regulatory requirements?

Yes, directly relevant. ClimRisk (climrisk.io) is a production platform I built that translates physical climate regulatory frameworks into a data architecture:

Regulations mapped: NGFS Phase 4 scenarios, TCFD financial disclosures, CSRD/ESRS E1-9 (articles on climate risk, transition plans, GHG emissions, EU ETS participation), EBA Pillar 3 ESG disclosure, SFDR PAI indicators.

What I designed: data entities (asset, portfolio, hazard type, scenario pathway, exposure metric), attributes (RCP 4.5/8.5 pathway, return period, confidence interval, baseline 1991–2020, projection horizon 2026–2050), relationships (asset belongs to portfolio, hazard type applies to asset class, scenario applied to portfolio), business rules (threshold triggers, aggregation hierarchy, disclosure materiality cutoffs), and temporal dimensions (baseline period, future scenario windows, vintage alignment).

Validation approach: 776 automated tests across the platform. Validated against 3 disclosure use cases: SFDR PAI, EBA Pillar 3 climate risk, and CSRD ESRS E1-9.

This is structurally identical to what you need: mapping regulatory concepts (EU ETS compliance cycle, allowance type, monitoring period) to entities, attributes, relationships, and business rules — then validating whether the model covers real-world compliance use cases.

---

### Q5: Have you worked with UK ETS or another ETS?

I have analysed the UK ETS as a regulatory framework — the post-Brexit divergence from EU ETS, free allocation methodology differences, cap trajectory, and registry design. I have not had a client with UK ETS compliance obligations.

I have worked extensively with VCS (Verra), Gold Standard, and ICVCM Core Carbon Principles frameworks for voluntary carbon markets, which involves similar data concepts: project ID, vintage year, verified emission reduction, retirement, buffer pool, additionality methodology.

---

### Q6: What types of workshops or cross-functional projects have you facilitated?

At Rotterdam C40 ICAR (Municipality of Rotterdam, Nov 2023 to Jul 2024): I coordinated across 3 municipal departments — engineering, urban planning, and climate policy — to deliver shared GIS exposure data as input to the city's C40 adaptation framework. Structured review sessions with cross-functional stakeholders, documented shared data assumptions, version-controlled datasets, and reproducible methodology notes so any team member could independently verify results.

At INHAF Chennai (Oct 2025 to Sep 2026): I managed multi-stakeholder data governance across 8 partner organisations in 5 sectors, establishing data collection protocols, quality checks, and audit trails to produce policy-grade evidence for 3 municipal advisory engagements.

In regulatory-to-data workshops: I am comfortable explaining regulatory concepts to engineers ("here is what 'vintage year' means in the context of allowance surrender and why it matters for your temporal model") and explaining data model constraints to regulatory specialists ("here is why we cannot store allowance allocation as a single attribute — it needs to be a relationship to an allocation table to support time-based queries").

---

### Q7: Short example of a similar project

**Project:** ClimRisk regulatory data model (Apr 2026 to present)

**Problem:** Translate NGFS Phase 4 climate scenarios, TCFD disclosure requirements, and CSRD/ESRS E1-9 obligations into a single production data architecture that supports compliance calculations, impact assessments, and multi-framework reporting without duplication.

**Approach:**
1. Mapped each regulation to required data entities: asset, scenario pathway, hazard metric, financial exposure, disclosure template
2. Identified shared concepts across frameworks — "asset" appears in TCFD, CSRD, and EBA Pillar 3 with overlapping but distinct attribute requirements — and designed a single normalised entity with framework-specific attribute extensions
3. Modelled time-dependent attributes: scenario vintage, projection horizon, reporting period, baseline methodology version
4. Validated against 3 real-world use cases: a portfolio manager running SFDR PAI calculations, a bank running EBA Pillar 3 climate risk disclosures, and a corporate running CSRD ESRS E1-9

**Result:** Single data model supporting 3 regulatory frameworks without schema duplication. Identified 4 cases where a naive regulatory reading would have created redundant entities, and 2 cases where time-dependent attributes had been conflated in a way that would have broken historical auditability. Platform runs in production at climrisk.io.

This is structurally identical to what you need: EU ETS entities (installation, operator, monitoring plan, allowance, compliance cycle) integrated with CBAM entities (declarant, embedded emissions, CBAM certificate, quarterly declaration), with the correct cardinality and temporal logic, future-proofed for regulatory evolution.

---

## BID GUIDANCE

- Bid: **$75/hr** — justified for expert EU ETS regulatory + data model validation
- The job is less than 1 month / less than 30 hrs/week — likely 15–30 hours total = $1,125–$2,250 gross
- This is a good fit: regulatory + technical bridge role. Most candidates will be either EU ETS specialists without data model skills, or data architects without ETS depth. Shri covers both.
- Client has no prior Upwork spend — new buyer, likely price-sensitive. $75/hr is the appropriate floor for expert-level technical regulatory work. Do not go below $65/hr.
