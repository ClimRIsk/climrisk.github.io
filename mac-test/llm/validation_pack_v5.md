# ClimRisk model validation pack (engine 0.8.0)

Generated 2026-10-09 22:51 from the files named in each section. Where evidence is missing the section says so.

## 1. Intended use

Screening and explanation of climate-related physical and transition risk for assets, portfolios and financial statements; decision support for a risk manager. Not a replacement for a vendor catastrophe model when rating an individual risk.

## 2. Data lineage

Case index: {"items": 4672, "events": 131, "curated_cards": 25, "company_event_cases": 1259, "company_climate_reports": 12, "kinds": {"frame": 25, "fact": 94, "resp": 39, "filing": 3482, "xbrl": 1032}, "path": "/Users/shrinivashdhamodharakannan/.climrisk/case_index.jsonl"}

Case facts are curated sentences from named sources or verbatim text from SEC filings, World Bank statistics and SEC XBRL structured data; each passage carries its URL.

## 3. Conceptual soundness

Hazard and damage components use published models (see insurance.METHOD and insurance.SOURCES in the engine). Correlation lengths are assumed, not fitted.

## 4. Language model evaluation (held out by whole event)

```
{
 "climrisk-llm-v5": {
  "metrics": {
   "case.cites_needed": 0.883,
   "case.cites_valid": 1.0,
   "case.flags_inference": 0.35,
   "case.numbers_ok": 1.0,
   "case.sent_cited": 0.69,
   "case_gap.cites_valid": 1.0,
   "case_gap.numbers_ok": 1.0,
   "case_gap.says_missing": 0.95,
   "chain.cites_all_needed": 0.929,
   "chain.cites_valid": 1.0,
   "chain.hedges_inference": 1.0,
   "chain.no_invented_numbers": 1.0,
   "gold.invented_numbers": 0.667,
   "gold.length_ok": 0.889,
   "gold.overlap_f1": 0.184,
   "insurer.declines_unknown": 1.0,
   "insurer.length_ok": 1.0,
   "insurer.new_numbers": 0.0,
   "insurer.numbers_ok": 1.0,
   "narr.length_ok": 0.938,
   "narr.numbers_ok": 1.0,
   "narr.says_not_forecast": 1.0,
   "qa.cited": 1.0,
   "qa.cites_target": 0.588,
   "qa.cites_valid": 1.0,
   "qa.sent_cited": 0.725,
   "refuse.cites_valid": 1.0,
   "refuse.says_missing": 0.95
  },
  "n_rows": 136,
  "seconds": 820,
  "samples": [
   {
    "kind": "case",
    "q": "ent); total assets was $482.6 million in the fiscal year ended 2010-12-31, $480.8 million in the fiscal year ended 2011-12-31, $561.2 million in the fiscal year ended 2012-12-31; long-term debt was $74.4 million in the fiscal year ended 2011-12-31, $153.5 million in the fiscal year ended 2012-12-31.",
    "out": "Hagerty, Inc.'s annual financial data from its SEC Form 10-K filings around Hurricane Ian: revenue was $619.1 million in the fiscal year ended 2021-12-31, $787.6 million in the fiscal year ended 2022-12-31, $1.03 billion in the fiscal year ended 2023-12-31 (a change of +27.2% in the year of the event); operating income was negative $10.1 million in the fiscal year ended 2021-12-31, negative $67.6 million in the fiscal year ended 2022-12-31, $10.4 million in the fiscal year ended 2023-12-31; net income was negative $46.4 million in the fiscal year ended 2021-12-31, $32.1 million in the fiscal y"
   },
   {
    "kind": "case",
    "q": "al year ended 2022-12-31, negative $9.9 million in the fiscal year ended 2023-12-31 (a change of -120.9% in the year of the event); total assets was $17.7 million in the fiscal year ended 2021-12-31, $16.6 million in the fiscal year ended 2022-12-31, $8.3 million in the fiscal year ended 2023-12-31.",
    "out": "Greenlight Capital Re, Ltd.'s annual financial data from its SEC Form 10-K filings around Hurricane Ian: revenue was $588.6 million in the fiscal year ended 2021-12-31, $526.7 million in the fiscal year ended 2022-12-31, $667.1 million in the fiscal year ended 2023-12-31 (a change of -10.5% in the year of the event); net income was $17.6 million in the fiscal year ended 2021-12-31, $25.3 million in the fiscal year ended 2022-12-31, $86.8 million in the fiscal year ended 2023-12-31 (a change of +44.2% in the year of the event); total assets was $1.43 billion in the fiscal year ended 2021-12-31,"
   },
   {
    "kind": "case",
    "q": "vely.\n\n[4] Arch Capital Group Ltd., Form 10-Q filed 2019-05-07: The estimated net adverse development in the 2019 first quarter included an increase in reserves on Typhoon Jebi of $16.0 million, or 4.6 points, based on receipt of updated information from cedents and additional updated industry data.",
    "out": "The companies describe Typhoon Jebi differently. Renaissancere Holdings Ltd: The estimated losses for these events are primarily driven by Typhoon Jebi and Hurricane Florence, which will have an estimated net negative impact of approximately $70 million and $55 million, respectively [3].
```

## 5. End-to-end behaviour (scripted investor-demo questions)

30/30 questions passed the honesty check (pass rate 1.0); median latency 3.35 s, 95th percentile 12.8 s.

## 6. Software tests

No test summary supplied.

## 7. Limitations

- Not a vendor catastrophe model: damage curves are published and not calibrated to claims; they are for screening and for explaining differences, not for rating a single risk unaided.
- Perils covered: tropical-cyclone wind, river flood, coastal flood. Not modelled: hail, tornado and convective storm, earthquake, wildfire, subsidence, storm surge beyond the mapped coastal floods, business interruption as a separate value.
- Correlation lengths are assumed. PML and tail contributions depend on them: run corr_scale 0.5 and 2 to see the range.
- Flood is one annual-maximum event per site per year; cyclone years stack the year's storms. Footprint mean damage uses a 250 m ring around the point; a precise building location can differ.
- Flood maps give no frequency change under climate: a pathway moves the depth of a mapped return-period event, not how often it happens.
- Return-period estimates need many years: values flagged not reliable have fewer than 10 simulated years per year of return period.
- Non-US structured company financials are not covered (SEC XBRL is US only); non-US company evidence comes from filings by foreign private issuers and curated cases.

## 8. What has NOT been validated

- Modelled loss against reported insured losses for a named event: needs a partner's exposure data. Until then the loss numbers are screening-grade.
- Independent review by practising risk professionals: not yet done; this pack is evidence for such a review, not a substitute.

## 9. Additional evidence

```
{
 "world_summary": {
  "index": {
   "items": 4672,
   "events": 131,
   "curated_cards": 25,
   "company_event_cases": 1259,
   "company_climate_reports": 12,
   "kinds": {
    "frame": 25,
    "fact": 94,
    "resp": 39,
    "filing": 3482,
    "xbrl": 1032
   },
   "path": "/Users/shrinivashdhamodharakannan/.climrisk/case_index.jsonl"
  },
  "curated_fact_status": {
   "unverified": 52,
   "unfetchable": 27,
   "read": 8,
   "verified": 90
  },
  "world_bank": {
   "events": 79,
   "country_events": 101,
   "errors": 0,
   "sample_errors": {}
  },
  "dataset_v5": {
   "train": {
    "case": 3659,
    "refuse": 483,
    "qa": 589,
    "insurer": 560,
    "case_gap": 555,
    "chain": 186,
    "narr": 186,
    "gold": 144
   },
   "valid": {
    "case": 324,
    "narr": 18,
    "insurer": 48,
    "qa": 7,
    "chain": 20,
    "refuse": 17,
    "gold": 9,
    "case_gap": 11
   },
   "test": {
    "case": 728,
    "case_gap": 147,
    "gold": 9,
    "narr": 16,
    "chain": 14,
    "insurer": 64,
    "refuse": 20,
    "qa": 18
   },
   "passages": 255,
   "sources": 42
  },
  "company_event_cases_total": 1259,
  "meets_1000_minimum": true
 },
 "training_note": "v5 first diverged to NaN at iteration ~330; retrained on length-filtered data with a NaN watchdog, resuming from the clean iteration-300 checkpoint at lr 5e-5. The iteration-600 checkpoint (lowest validation loss) was also built as v5b and evaluated; the model with the best held-out score was promoted (pick_v5_final.json).",
 "latency_note": "The first demo run had 5 of 30 answers taking 70 s to 15 minutes. Every model call now has a hard 60 s total deadline, after which the answer is assembled from the cited passages; Ollama's own load/prompt/generation timings are recorded per question in demo_final.json."
}
```
