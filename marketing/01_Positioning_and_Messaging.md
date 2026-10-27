# ClimRisk positioning and messaging (23 Oct 2026)

Every number here is checked against `climate_risk_engine/docs` (see `06_Claims_Check.md`). Items marked [CONFIRM] need your input. Nothing here claims customers, revenue or traction.

## Who it is for (start narrow)

1. **Primary:** risk, credit or sustainability leads at mid-size lenders and specialist insurers who must defend a site-level physical risk number to a model-risk team, an auditor or an investment committee.
2. **Second:** property owners, valuers and asset managers doing diligence on specific buildings and sites.
3. **Third:** climate and ESG consultancies that need a site-level engine behind their own reports.

Do not lead with "banks and insurers and corporates and governments". One buyer first.

## The alternatives they use today

Big platforms (Prometeia, Jupiter Intelligence, Climate X, Moody's and MSCI products), insurer catastrophe models, free layers (FEMA National Risk Index, WRI Aqueduct), open code (OS-Climate physrisk, CLIMADA), consultants working by hand, and a spreadsheet. Most buyers use two or three of these at once.

## What is different

Every number comes with the test it passed or failed, a grade from A to D, and a plain statement of what it does not do. Hazards without a test are not shown. Missing data is shown as missing, never as zero. There is no single composite score.

## Positioning statement

For risk and sustainability teams who have to defend site-level physical climate numbers, ClimRisk is a physical risk engine that shows the test behind every number. Unlike platforms that return a score you have to take on trust, ClimRisk publishes how each model performed against observations, including where it failed.

## One-liners (pick by channel)

- **Website and YC:** "Site-level physical climate risk where every number shows its test."
- **Short:** "The physical risk report that shows its work."
- **Expert audience:** "Open-data physical risk models, graded A to D, with the validation ledger public."

## Message house

**Roof:** The physical risk report that shows its work.

| Tested | Honest about limits | Site-level |
|---|---|---|
| Each model is graded A to D against observations in a public ledger | Untested hazards are left out; missing data is null, not zero; no composite score | LiDAR flood ranking, wildfire, cold-region, hail, tornado and marine heatwave screens on open data |
| Flood damage checked against 279,517 NFIP claims | Failures are published (river flood depth maps graded D, avalanche terrain AUC 0.59) | Reports for a named site, not a country average |

## Proof points you can use today

| Claim | Evidence | Where |
|---|---|---|
| Flood ranking beats the old rule | AUC 0.76 and 0.81 against 72 satellite-mapped events and 216 recorded-outline windows (old rule 0.55 and 0.57) | VALIDATION_LEDGER |
| Open LiDAR sharply improves flood ranking in England | HAND AUC median 0.96 vs 0.76 on global tiles across 12 flooded towns; England only; thresholds were not set independently | VALIDATION_LEDGER |
| Named-event hindcast | Carlisle, Storm Desmond 2015: AUC 0.90 on LiDAR vs 0.58 on global tiles; the top 10% of buildings contained 59% of those that flooded | HINDCAST_STUDY |
| Flood damage curve vs claims | Engine runs 1.5 to 2.4 times observed residential damage above 0.5 m (279,517 claims); no industrial data exists | VALIDATION_LEDGER |
| Hail and tornado | 600 US points: earlier reports predict later reports, rank correlation 0.93 (hail), 0.77 to 0.83 (tornado) | CONVECTIVE_MARINE_BENCHMARK |
| Marine heatwave | Matches the published reference code on 892 of 895 events; finds 7 of 9 documented events | CONVECTIVE_MARINE_BENCHMARK |

## Say and do not say

| Say | Do not say |
|---|---|
| "Screening-grade, with the test published" | "Audit-ready", "bank-grade", "certified" |
| "Maps to TCFD, IFRS S2 and ESRS E1 and shows what is missing" | "Compliant", "CSRD ready", "assured" |
| "Eight tested perils, plus screens graded C" (check the ledger count before use) | "25 or 26 hazards modelled" |
| "Credit module exists but is not yet validated" | "PD and LGD" as a product claim |
| "Larger vendors cover more, we show more evidence" | "We beat Prometeia or Jupiter" |
| "Open data" | "Proprietary scoring engine" |

## Objections and honest answers

- **"Why not just use Jupiter or Moody's?"** They cover more and have clients. If you need a defensible number for a specific site and want to see how it was tested, that is what we do. Use both if you want.
- **"Grade C or D sounds bad."** It tells you where not to rely on the number. Competitors have the same limits and do not publish them.
- **"Can a bank use your PD and LGD?"** Not yet. The module is unvalidated; a pilot with default data is how it gets validated.
- **"Where is your customer evidence?"** [CONFIRM] State the true number of pilots. If zero, say you are running the first ones now.
