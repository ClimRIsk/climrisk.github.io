# ClimRisk study pack: say it in 30 seconds

How to use this: read one topic, say the answer out loud in your own words, then say the limit. Naming the limit first is what makes people trust you. Each topic has three parts: **Answer** (30 seconds), **Limit** (say it before they ask), **Ask back** (one question that moves the conversation to ground you know).

If you blank: "Let me say what I built and where it stops." Then use the Answer and the Limit.

---

## 0. The one-line answer to "is ClimRisk a black box?"

**Answer:** No. Every number comes with its source, its assumptions and a way to change them. You can change rain, curve number, roughness, drainage and storm length, and the tool shows which one moves the answer most. There is also a ledger that lists, per site, what is quantified, what is only an assumed range, and what is not assessed.

**Limit:** The ledger lists ranges side by side. It does not combine them into one confidence band, and I say so.

**Ask back:** "Which input would you want to tweak first on a site you know?"

---

## 1. BRSR Principle 6 (environment)

**Answer:** BRSR is SEBI's sustainability report for listed Indian companies. Principle 6 is environment. The BRSR Core assurance items under P6 are energy (Essential Q1), water consumed (Q3), water discharged (Q4), greenhouse gases (Q7) and waste (Q9). ClimRisk maps its outputs to those lines (`docs/BRSR_P6_MAP.md`), and marks the ones it estimates as modelled, not measured.

**Limit:** Our figures are modelled estimates. A company's reported BRSR figure is measured and assured. We do not replace it; we cross-check and fill gaps. I have not yet read the full Annexure II line by line.

**Ask back:** "Do your clients struggle more with Scope 3, or with getting site-level energy and water data in the first place?"

---

## 2. AHP (Analytic Hierarchy Process)

**Answer:** AHP turns a group's pairwise judgments ("A matters twice as much as B") into weights. I use the Saaty 1 to 9 scale, take the principal eigenvector as the weights, and check the consistency ratio. If it is above 0.10 the judgments contradict each other and I flag it. Several people are combined with the geometric mean, and a random-weight test shows whether the ranking is stable.

**Limit:** The tool ships with no default judgments. The weights are only as good as the people who give them. It is a way to make a judgment explicit, not a source of truth.

**Ask back:** "Who would normally supply the judgments on your side: risk, sustainability or operations?"

---

## 3. Damage costs

**Answer:** Damage cost = hazard depth or wind, through a damage curve, times asset value. For floods I use the JRC continental depth-damage curves (Huizinga et al. 2017), which give damage as a fraction of value by depth, by sector and by region.

**Limit:** Curves are transferred from other regions and the ledger shows that as a spread. That spread is a transfer range, not a confidence interval. Sector and asset value come from the user.

**Ask back:** "Do you have claims or loss data we could check a curve against?"

---

## 4. JRC and global flood modelling

**Answer:** The JRC runs the global river flood system (CEMS-GloFAS): a hydrology model (LISFLOOD) feeds a flood model (LISFLOOD-FP) and produces 90 m depth maps for 10 to 500 year return periods. I use these as the river-flood reference and compare my own terrain model with them.

**Limit:** The maps are coarse for small streams and city drainage. That is exactly the gap I found in Chennai.

**Ask back:** "Do you use the global maps directly, or correct them with local data?"

---

## 5. GCMs (global climate models)

**Answer:** GCMs are the CMIP6 models that simulate climate under scenarios (SSPs). I use the 10th percentile, median and 90th percentile across models (from the World Bank climate portal) so the user sees a spread, not one number.

**Limit:** Global models are coarse, so downscaling adds error. Scenario choice is a separate uncertainty from model spread, and I keep them separate.

**Ask back:** "Which scenario and horizon do your clients ask for most: 2030, 2050 or 2100?"

---

## 6. IRIS (tropical cyclone model)

**Answer:** IRIS is Imperial College's storm model (Sparks and Toumi 2024). It generates 10,000 years of synthetic tropical cyclones from 1980 to 2021 climate, which gives far better tail statistics than the roughly 40 years of real tracks. I planned it as a cross-check against my own cyclone wind estimate.

**Limit:** I have not ingested IRIS. The data was not reachable from my environment, and the status document says so. What exists is the cross-check plan and a ledger slot, not a result.

**Ask back:** "Which part of IRIS do you find most useful: wind, rain or surge?"

---

## 7. Model uncertainty and multi-source modelling

**Answer:** I separate five kinds of uncertainty: internal variability, scenario, structural (different models disagree), parameter, and sampling. Each entry in the ledger has a status: quantified, assumed range, or not assessed. Multi-source means I run more than one source for the same quantity and show where they disagree. Example: rainfall from ERA5, NASA POWER and a rain gauge.

**Limit:** I show the disagreement; I do not claim a probability for it.

**Ask back:** "When two sources disagree, do your clients want the worse case, or both side by side?"

---

## 8. Digital twin

**Answer:** In DestinE, a digital twin is a planet-scale simulation. Mine is an asset-level twin: a 3D model of one site with its buildings, terrain, water depth over time, and a what-if for protection (raise equipment, add a barrier). The agent re-runs the solver to check that a fix works.

**Limit:** Building footprints come from OpenStreetMap and are an illustrative layout where the data is missing. It is not a survey and I label it as such.

**Ask back:** "Would your clients want one site in detail, or a portfolio view first?"

---

## 9. The flood case: Chennai 2015 (your best story)

**Answer:** My engine used to miss city flooding from heavy rain. Chennai 2015 was the test. Gridded rainfall gave about 101 mm for the day, but the rain gauge recorded about 345 mm, because gridded data smooths out point extremes. I added gauge-anchored design rain and a catchment-scale rain-on-grid model (6 km radius, about 67 m cells, 24 hour storm), with drains-overwhelmed and drains-working bounds.

**What I corrected myself:** my first headline for Velachery was 0.97 m, but that was the single deepest cell. I changed the headline to the mean over a 200 m window and report the pin cell and deepest cell too.

**Limit:** At Velachery the depth stops responding to rain above about 130 mm, because the terrain controls it. So the number is a ponding flag, not a return-period depth. The model also misses river and reservoir-release flooding (Mudichur). The new setup is not yet scored against Environment Agency outlines; the older setup scored AUC 0.64 to 0.71.

**Ask back:** "What flood data do you trust most for Indian cities?"

---

## 10. If they say "this is surface level" or "this is vibe coding"

Do not defend. Say: "That's fair on the parts I haven't opened up yet. Here is what I can show you in detail: the Chennai case, the sensitivity and the uncertainty ledger." Then open one of them and walk through where it breaks. People who show the failure point first are not read as vibe coders.

## 11. Speaking tips for you

- Two sentences at a time. Stop and let them react.
- The Limit line is not an apology. It is the strongest part.
- If you forget a term, say what it does: "the weights from pairwise judgments" is fine.
- Keep this page open during calls. Nobody minds a person who checks a note.

---

## 12. Downscaling (asked directly in the interview)

**Answer:** I don't run my own downscaling model. The climate projections come from the World Bank portal's CMIP6 ensemble, which is statistically downscaled and bias-corrected by NASA (the NEX-GDDP dataset, using a method called BCSD) to 0.25 degrees, about 25 km. I apply the change as a delta-change factor: today's observed or reanalysis level, times the models' relative change. For one site I then do a separate physical step: a catchment-scale rain-on-grid run, and I subtract the site's own ground height from the water surface, so depth is at the building, not the 25 km cell.

**Limit:** Delta-change assumes the change in a 25 km model holds for a point extreme, and short intense rain is the weakest part of that. It also keeps today's storm structure. I check it against a second pipeline: seven HighResMIP models via Open-Meteo. For Chennai they gave a wider range (0.77 to 1.56) than the portal band (0.84 to 1.32), so at one site the models do not settle the sign.

**Also say if pushed:** I found elevation "downscaling" factors in an older report path that were attributed to LISFLOOD and WRI but were my own heuristics. I relabelled them. That is in `docs/DOWNSCALING.md`.

**Ask back:** "Would you rather see delta-change on observed baselines, or fits on daily downscaled series like NEX-GDDP?"

**Open data he mentioned:** ERA5, NASA POWER, Sentinel, WorldCover, JRC water, FIRMS, CCKP are used. CHIRPS (satellite plus gauge rain) is used as a storm-day cross-check, and HighResMIP models via Open-Meteo as a second projection pipeline. Not yet used: IMERG directly, GHSL, daily NEX-GDDP, CORDEX. Say that plainly; do not claim them.

---

## 14. "How do you compare with Moody's, Jupiter or Fathom?"

**Answer:** They validate against claims and published benchmarks. I can show one honest benchmark: my city-flood model scored AUC 0.84, 0.85 and 0.74 against Environment Agency flood outlines in Oxford, Reading and Bristol, up from about 0.67 for the earlier setup. Where I am ahead is transparency: a per-site ledger that shows what is measured, what is assumed and what is not assessed. The independent vendor studies (GARP, Investor Leadership Network) found vendors disagree and asked for exactly that.

**Limit:** A plain terrain score (height above nearby low ground) still beats my flood model on ranking in two of the three towns, and I have no observed depths and no claims data, so I cannot say what loss a site would see. The benchmark also caught a bug of mine: bad rain-gauge values had inflated one site's design rain 3.3 times. I fixed it and said so.

**Ask back:** "Do you have claims or loss data from one event we could test against?"

---

## 13. India's own observed data (NRSC atlases)

**Answer:** I read two ISRO/NRSC atlases and put their district numbers next to my models. The Flood Affected Area Atlas gives the area mapped as flooded per district, 1998 to 2022, from satellite images. The Landslide Atlas gives a rank of 147 mountain districts by exposure to landslides. If my model says LOW and the atlas says the district is in the top quarter, the report says so and tells you to look at the site's own terrain.

**Limit:** Both are district scale. The flood atlas misses Chennai 2015 (its Tamil Nadu list stops at 2012 and 2020), so a low Chennai reading never clears a site. The landslide table is exposure, not hazard, and a district that is not ranked is "not assessed", not safe. The licence for reusing the atlases is not confirmed: NRSC's published licence covers its satellite images, not these PDFs. I use district numbers with credit and would ask NRSC in writing before selling on them.

**Not done, and why:** river gauge levels (India-WRIS needs a registered download and the portal did not respond from my setup), the Bhukosh landslide inventory (no download found), FABDEM (non-commercial licence), FastFlood as a benchmark (API needs a paid key for commercial use). GHSL is open under CC BY 4.0 but I have not wired it in.

**Ask back:** "Which of these would your clients trust first: satellite flood history or gauge records?"

---

## 15. Compound hazards: what the engine does and does not do (for the Stanford conversation)

**Answer:** The engine assesses each hazard on its own, so it does not yet model compound damage. What it does report now is co-occurrence: any site profile carries a compound block, the uncertainty ledger lists it, and there is an endpoint for it. I measured it at ten sites. On ERA5 daily data at ten sites from 1950 to 2025, heavy-rain days and strong-gust days landed together about four times as often as chance (median ratio 3.9, above 1 at 8 of 10 sites), and heat extremes fell in dry spells about 2.4 times as often as chance (9 of 10 sites). Same-day heat and heavy rain went the other way: they almost never share a day (median 0.11). I check the method with a control that shifts one series by whole years, which returns a ratio near 1.

**Limit:** This is statistical dependence in reanalysis, not damage. It does not show that joint damage exceeds the sum of single-hazard damage, because the engine has no loss data to test that. It is same-day only, ten sites, and ERA5 smooths extremes. The early and late halves of the record do not show a consistent change in dependence, and ERA5 itself changed over that period, so I do not claim a warming result. The old hand-typed co-occurrence matrix in the code is an assumption and is labelled as one.

**Ask back:** "Would you test super-additivity on event loss data first, or build the warming-level dependence of the hazards first?"
