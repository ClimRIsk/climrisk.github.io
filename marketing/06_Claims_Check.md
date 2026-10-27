# Claims check (23 Oct 2026)

Every figure used in the website edits and the files in this folder, with the source in the repo. Paths are under `climrisk-engine-space/climate_risk_engine/docs/`.

| Claim | Source | Status |
|---|---|---|
| Models graded A to D, public ledger | VALIDATION_LEDGER.md header | Verified |
| 279,517 NFIP claims; engine 1.5 to 2.4 times observed residential damage above 0.5 m | VALIDATION_LEDGER.md (flood depth-damage row) | Verified |
| Flood ranking AUC 0.76 and 0.81; old rule 0.55 and 0.57; 72 EMS events, 216 EA windows | VALIDATION_LEDGER.md | Verified |
| HAND AUC median 0.96 vs 0.76 across 12 towns; England only; not independent of threshold setting | VALIDATION_LEDGER.md | Verified |
| Carlisle 2015: 571 of 11,614 flooded; AUC 0.90 vs 0.58; top 10% finds 59% | HINDCAST_STUDY.md | Verified |
| York Feb 2020 AUC 0.63 | HINDCAST_STUDY.md | Verified (only 48 buildings flooded) |
| Cyclone wind: 148 station-storm pairs, r 0.53 | VALIDATION_LEDGER.md | Verified |
| FEMA NRI comparison: wind 1.2 to 3.6 times, inland flood 0 to 0.6 times, coastal 0; 3 counties; grade C/D | VALIDATION_LEDGER.md | Verified |
| Avalanche AUC 0.59 (0.52 to 0.66), 300 accidents | CRYOSPHERE_BENCHMARK.md, ledger | Verified |
| River flood depth maps (third party) grade D | VALIDATION_LEDGER.md | Verified |
| Hail rank correlation 0.93, median error 0.28 days a year; tornado 0.77 to 0.83; 600 US points | CONVECTIVE_MARINE_BENCHMARK.md, convective_holdout.json | Verified |
| Marine heatwave: 892 of 895 events match reference code; 7 of 9 documented events; 24% chance rate | CONVECTIVE_MARINE_BENCHMARK.md, marine_crosscheck.json | Verified |
| ESRS E1 gap check, 41 items | VALIDATION_LEDGER.md (ESRS section) | Verified |
| Credit module (PD, LGD, ECL, RWA) is not validated | VALIDATION_LEDGER.md, GAP_REGISTER.md B4 | Verified |
| Open-Meteo free tier is non-commercial | Not in repo | [CONFIRM] check provider terms |
| Competitor facts (Prometeia, Jupiter, Climate X, Cervest) | COMPETITIVE_LANDSCAPE.md | Sourced to vendor pages and press; rows marked "general knowledge" unverified |
| Pilot prices, partner appetite, regulator scope | Not in repo | Hypotheses only |

## Removed from the website because they could not be supported

"26 hazards", "210+ countries", "180+ countries", "34 climate models integrated", "2,400,000 assets analysed", "92% model agreement rate", "500+ global port facilities", "audit-ready", "peer benchmarking and confidence intervals", "SEC climate disclosure out of the box", "proprietary scoring engine", and the "live" cyclone, wildfire, flood, heat and loss counters (fixed numbers with random jitter, now hidden).

## Not yet reviewed (still on the site)

- Industry cards (index.html around line 1950) describe what the product can do for mining, energy, banking, insurance and others. Read each against the ledger before publishing.
- Architecture pipeline tooltips (around lines 940 to 1000) list data-source resolutions and datasets.
- The sample report mock-up (around line 1930) shows hard-coded example ratings and is not a real result. Label it illustrative or replace it with a real sample.
- The 3D globe and "financial impact" sections use illustrative numbers.
- The app (ClimRisk_Platform.html, CRI_Demo.html, dashboard.html) still has a legal sign-off modal; the README now calls it a review step, not assurance.

## Rule for anything new

No number goes into marketing without a row in this table.
