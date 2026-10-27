# LinkedIn series: eight posts from the benchmarks, and a 4-week calendar

All numbers are from `climate_risk_engine/docs` (see `06_Claims_Check.md`). Post from your own profile in your own words; edit anything that does not sound like you. Add the demo video or a chart from the linked doc where noted. No hashtags beyond three.

Rules for every post: state the grade, state one limit, link the doc, never imply customers.

---

**Post 1: Why we publish the grade (week 1, Monday)**

Most climate risk tools give you a score. Few tell you how well the score held up when tested.

I built a physical risk engine where every model has a grade from A to D and a public test. River flood depth maps from a third party: grade D. Avalanche terrain: grade C. Flood ranking: grade B.

It is uncomfortable to publish. But a number you cannot check is a number you cannot defend in front of an auditor or a credit committee.

The validation ledger is open: one row per model, what it was tested against, what happened.

[link to VALIDATION_LEDGER] #ClimateRisk #ModelRisk

---

**Post 2: Carlisle (week 1, Wednesday)** (attach the Carlisle chart from HINDCAST_STUDY)

Would a flood model have pointed at the buildings that flooded in Storm Desmond?

We tested it on Carlisle, December 2015: 571 of 11,614 buildings flooded. Using 1 m LiDAR terrain only, scoring each building before looking at the flood outline, the top 10% of buildings contained 59% of the flooded ones. Area under the curve 0.90. The same method on global 10 to 30 m terrain: 0.58, barely better than chance.

The caveat: it is one terrain-based ranking, not a depth or a probability, and it only works where open LiDAR exists (England, the Netherlands so far). In York in 2020 it did much worse (0.63).

Data source choice mattered more than the model. [link to HINDCAST_STUDY]

---

**Post 3: What we got wrong versus FEMA (week 1, Friday)**

We compared our insurer simulation with FEMA's National Risk Index on three US counties. Wind came out 1.2 to 3.6 times the NRI figure. Inland flood came out 0 to 0.6 times. Coastal flood, zero.

That is a grade C/D result and it is in our ledger. It tells you where not to trust our loss numbers yet.

I would rather you hear it from me than discover it in a diligence review.

[link to VALIDATION_LEDGER and FEMA_NRI_BENCHMARK]

---

**Post 4: Weak result published (week 2, Monday)**

We tried to predict avalanche release terrain from slope alone, tested against 300 Swiss avalanche accidents. The result: AUC 0.59 (95% range 0.52 to 0.66). Barely better than a coin flip once you compare with terrain at the same elevation.

We shipped it anyway, labelled grade C and "weak test", as a pointer to look at, not a rating. Terrain only: no snowpack, no runout.

If your climate risk vendor has never shown you a weak result, ask why. [link to CRYOSPHERE_BENCHMARK]

---

**Post 5: Hail and tornado hold-out (week 2, Wednesday)**

Can past storm reports tell you about future ones at a site? We tested it: 600 random US points, 1996 to 2009 reports predicting 2010 to 2024 reports.

Hail (1 inch or more): rank correlation 0.93, median error 0.28 days a year. Tornado: 0.77 to 0.83. Good for common events, weaker for rare ones.

What it does not do: measure the hazard (reports come from people, so thinly populated land is under-counted), predict damage, or say anything about future climates. US only. Outside the US the report says "not covered", not "low".

[link to CONVECTIVE_MARINE_BENCHMARK]

---

**Post 6: Marine heatwaves, 7 out of 9 (week 2, Friday)**

We built a marine heatwave model on NOAA sea-surface temperature and checked two things.

One: does our code match the published reference implementation? Yes, 892 of 895 events identical.

Two: does it find documented events? We found 7 of 9, including the 2011 Ningaloo and 2019 Northeast Pacific heatwaves. We missed the 2016 Great Barrier Reef event (21 days) and the 2017 Peru El Nino (18 days) because our pre-set rule needed 30 days. We did not change the rule after seeing the result.

The same rule matches by chance in about 24% of other years, so 7 of 9 is evidence, not proof. [link to CONVECTIVE_MARINE_BENCHMARK]

---

**Post 7: Null is not zero (week 3, Monday)**

A hazard model that returns "0" for a place it cannot see is lying.

In our reports, a hazard outside a model's coverage, or without a test, does not appear. Hail outside the US: not covered. Marine heatwave away from the coast: not covered. Missing data stays null all the way to the output.

It makes reports shorter and less impressive. It also means every line in a report is something we can defend.

---

**Post 8: What we do not do yet (week 3, Wednesday)**

Bigger vendors do things we do not: carry hazard damage all the way into probability of default and loss given default for a loan book, package regulatory climate stress tests, project company financials, cover far more hazards and countries.

We have a credit module. It is not validated, and our ledger says so.

What we do: site-level physical risk with the test shown, on open data, in hours. If you need the whole platform, buy it. If you need to know whether a number holds up, talk to me.

---

## Four-week calendar

| Week | Mon | Wed | Fri | Other |
|---|---|---|---|---|
| 1 (27 Oct) | Post 1 | Post 2 | Post 3 | Send first 10 outreach emails; YC form by 2 Nov |
| 2 (3 Nov) | Post 4 | Post 5 | Post 6 | Next 10 emails; 3 customer calls |
| 3 (10 Nov) | Post 7 | Post 8 | Free: reply to every comment | Last 10 emails; send touch 2 to week 1 |
| 4 (17 Nov) | Results post: "what 30 outreach emails taught me" with true numbers | Case note on one real pilot or call (with permission) | Repost best performer with a new chart | Review tracker; decide pilot pricing |

## Engagement routine (20 minutes a day)

Reply to every comment within a day. Comment on 5 posts by risk, insurance or ESG people you want to reach. Never argue a number; if challenged, add the case to the ledger as an open question.

## What to measure

Replies and calls from posts, profile views from target roles, and inbound questions. Ignore likes.
