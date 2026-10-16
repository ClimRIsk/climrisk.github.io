# ClimRisk: heat stress, urban heat and water stress — research brief and fix plan

Prepared 14 October 2026. Test site: 9.4713 N, 77.9107 E (Virudhunagar district, Tamil Nadu, India). Everything marked "measured here" was run on the engine in this session; everything marked "literature" comes from the sources listed at the end and was not independently reproduced.

## 1. What is wrong, with evidence

**Finding 1 — the Asset Intelligence panel does not score two of the three hazards that matter at this site.** The panel scores flood, landslide/debris flow, wildfire, urban heat and tropical cyclone. There is no water-stress or drought finding. Urban heat is computed from land cover only (built-up share, tree canopy, latitude band) and is capped at MODERATE in code; the code comment says "the temperature-based heat model is the next build". The headline therefore led with wildfire, a hazard the resident says they rarely see.

**Finding 2 — the engine already holds data that contradict that headline.** Measured here, WRI Aqueduct 4.0 (shipped offline in the engine) places the site in a basin with:

| Indicator | Score (0–5) | Label |
|---|---|---|
| Baseline water stress | 4.92 | Extremely High (withdrawals about 152% of available flow) |
| Baseline water depletion | 3.42 | High |
| Drought risk | 4.02 | High |
| Overall water risk | 4.38 | Extremely High |
| Water stress, 2030 / 2050 / 2080 (SSP3-RCP7.0) | 4.90 / 4.82 / 4.56 | stays Extremely High |

The data exist; they are not wired into the asset panel.

**Finding 3 — the heat model that does exist overstates heat stress.** The Model Lab "extreme heat" study reports a 100-year wet-bulb globe temperature (WBGT, a heat-stress index in °C) of 38.0 at this site, "evidence grade A", and the same series puts 239 days a year above 32 °C (the study's own line for "even light work is unsafe"). Measured here:

- The study uses the simplified formula `0.567 T + 0.393 e + 3.94` on NASA POWER daily maximum temperature with the day's dew-point vapour pressure.
- On the hottest day in 43 years (24 April 2016, Tmax 42.7 °C, dew point 21.2 °C, RH about 30%) the psychrometric wet-bulb is 27.1 °C. A first-principles shade bracket (`WBGT = 0.7 Tnwb + 0.3 Tg`, natural wet bulb 0 to 2 °C above psychrometric, globe 0 to 2 °C above air) gives 31.8 to 33.8 °C. The engine says 38.0.
- Days a year above 32 °C: 239 from the engine formula against 15 at the top of the bracket.
- The input temperature is not the problem. Against the nearest long-record station (Madurai, 44 km away, 1,958 matched days): median annual-maximum Tmax 40.5 °C observed vs 40.2 °C in NASA POWER; 95th percentile 40.4 vs 39.3; mean daily bias −2.1 °C (the grid runs cooler on ordinary days). So the extremes are reasonable and the index formula is where the error enters.
- "Grade A" here means: formulas reproduce textbook values, the extreme-value fit is consistent with held-out years of the same reanalysis series, the licence allows commercial use, the record is long and the confidence interval is narrow. None of that tests the absolute heat-stress number against a physical reference or against measured WBGT. That is the gap a sceptical reviewer will find.

Limit of this check: it is a bracket, not a validation. It has no solar load, and Kong & Huber report that simplified indices can under-state extremes in dry subtropical regions when radiation matters. A proper answer needs the Liljegren model on hourly data (section 3).

**Also fixed in this session (small):** the heat study's headline said "It did NOT predict the held-out years" while its status line said "verified… small, practically minor drift" and the evidence table scored it as predicted. The sentence now says it predicted the held-out years only approximately when the drift is minor.

## 2. Why this is a platform problem, not one address

The same check run at eight sites (script: `climate_risk_engine/scripts/heat_index_crosscheck.py`; results: `Research/heat_index_crosscheck.json`):

| Site | Tmax °C | Engine sWBGT max | Shade bracket (same day) | Days/yr >32: engine vs bracket top |
|---|---|---|---|---|
| Virudhunagar IN | 43.5 | 38.0 | 31.8–33.8 | 239 vs 15 |
| Dhaka BD | 44.5 | 39.3 | 32.2–34.2 | 200 vs 16 |
| Kolkata IN | 46.8 | 41.0 | 33.7–35.7 | 210 vs 44 |
| Houston US | 44.8 | 38.7 | 32.3–34.3 | 107 vs 8 |
| Phoenix US (hot-dry) | 50.6 | 36.7 | 31.1–33.1 | 53 vs 2 |
| Jacobabad PK (hot-dry) | 52.4 | 41.7 | 34.7–36.7 | 146 vs 95 |
| Riyadh SA (hot-dry) | 47.5 | 36.4 | 30.9–32.9 | 21 vs 0 |
| Oslo NO | 31.2 | 29.1 | 24.4–26.4 | 0 vs 0 |

On each site's hottest day the engine sits above the top of the bracket by 2.7 to 5.2 °C (Oslo smallest, Kolkata largest), so every heat result built on this formula (asset panel, Risk Analyst, portfolio downtime) inherits the bias. Separately, the asset panel's hazard list is the same for every location, so any site where heat or water is the dominant exposure gets the same blind spot.

## 3. What the research says to build

### 3.1 Heat stress (people, outdoor work, building cooling)

- **Replace the simplified WBGT with the Liljegren physical model.** Kong & Huber (2022, *Earth's Future*) compare simplified WBGT and the Environmental Stress Index with a well-validated explicit model (Liljegren) in an idealised setting and in ERA5. Their finding: simplified WBGT greatly overestimates heat stress in hot-humid areas, may under-state extremes in dry subtropical regions, and they recommend discontinuing it; the Liljegren approach is preferred. Lemke & Kjellstrom (2012, *Industrial Health*) compared methods for workplace WBGT from routine climate data and favoured Liljegren for outdoor work. Open-source Python/Cython implementations exist (PyWBGT, Zenodo v1.0.0; pywbgt and lwbgt on PyPI). **Licences were not confirmed from what I retrieved — read each LICENSE file before bundling; lwbgt carries Argonne/DOE attribution terms.**
- **Add UTCI as the people-facing index.** ERA5-HEAT (Di Napoli et al., 2021, *Geoscience Data Journal*) provides hourly mean radiant temperature and UTCI on a 0.25° grid from 1979, free through the Copernicus Climate Data Store (a 0.25° cell is about 31 km, so it does not resolve a street). Standard UTCI heat classes: 26–32 moderate, 32–38 strong, 38–46 very strong, above 46 extreme. I found no validation of UTCI specific to the hot-humid tropics; treat that as an open question.
- **Needs hourly inputs.** Both Liljegren and UTCI need hourly temperature, humidity, wind and solar radiation, not daily maxima. Daily NASA POWER cannot supply them; ERA5 hourly or POWER hourly can. Licensing matters: Open-Meteo's free hosted API is non-commercial (self-hosting or a paid plan is needed for a product), NASA POWER states no restrictions on use and asks for a citation, ERA5 requires visible Copernicus attribution (CC BY 4.0 wording as per ECMWF).
- **Report the right outputs.** Hours per year above defined classes (not only a 100-year maximum), the hottest 3-day mean, and for India the IMD heat-wave definition: plains need Tmax ≥ 40 °C with departure from normal ≥ 4.5 °C (or an absolute 45 °C), coastal stations need ≥ 37 °C with ≥ 4.5 °C departure, met at two or more stations for two days. IMD's "hot and humid" is a separate advisory category with no fixed humidity threshold. I found no Tamil Nadu-specific criteria.

### 3.2 Urban heat

- The current score is a land-cover proxy and says so in its caveat. The measurable alternative is surface urban heat island intensity from Landsat Collection 2 Level-2 surface temperature (30 m, cloud-screened clear dates), taken as the difference between the site and a rural reference ring, with a minimum number of clear observations.
- **Cautions from the literature:** surface temperature is not air temperature; a 2022 ECOSTRESS validation reports a bias of −1.61 K and RMSE of 3.08 K against SURFRAD stations, and an urban study found logger measurements are not strictly equivalent to satellite LST, with bias correction helping only partly. I found no source giving a transfer function from LST to air temperature or WBGT, so the engine should report surface heat island as an exposure indicator, never as an air-temperature or WBGT increment, until a local calibration exists.
- A Tamil Nadu Landsat study (2000 vs 2020) reports urban expansion of 75% and warming concentrated in built-up land. It is state-level and gives no Madurai or Virudhunagar number.
- The STAC connector already used for Sentinel-2 can likely serve Landsat; I did not verify the Planetary Computer collection's band scaling — check the USGS Level-2 documentation before coding.

### 3.3 Water stress and drought

- **Wire Aqueduct 4.0 into the asset panel now.** It is offline, licensed CC BY 4.0, and already returns baseline stress, depletion, drought, seasonal and interannual variability and 2030/2050/2080 projections. It must be labelled what it is: a basin-scale (HydroBASINS level 6) screening indicator of withdrawals relative to available renewable supply. WRI states key elements such as overall water risk cannot be directly measured and are not validated, and the EU adaptation portal summary notes limited local applicability, no inter-basin transfers, and no non-renewable (fossil) groundwater.
- **Add a local groundwater layer for India.** Aqueduct reports an insignificant groundwater-table trend at this site (−1.04 cm/yr, no score), which sits oddly beside heavy extraction reported nationally. CGWB's Dynamic Ground Water Resources assessment classifies assessment units as over-exploited (extraction above 100% of extractable resource), critical (90–100%) and so on; Tamil Nadu is reported with 392 of 1,202 units over-exploited in the 2024 report, and the state profile lists Virudhunagar among districts with salinity problems. I did not find the Virudhunagar block-level category; the district tables of the CGWB Tamil Nadu report need to be read directly.
- **Add a site-level drought index.** SPEI computed from CHIRPS or ERA5-Land rainfall and potential evapotranspiration is the common approach; an India-specific village-level SPEI dataset uses CHIRPS 0.05° with Priestley–Taylor PET. A Gujarat comparison of ERA5 against station SPEI found the best agreement at the 6-month scale. I found no published validation of SPEI against stations at site level in India beyond that, so any SPEI the engine produces needs a local check against IMD or GHCN stations (Madurai is available).
- **Keep two definitions apart.** "Water stress" for a home or a plant (can the tap or the plant's supply fail?) is not the same as basin competition for water. The product should say which one it is reporting.

### 3.4 Validation and honesty rules for all three

1. Separate **verified** (code reproduces the equation), **hindcast-consistent** (statistics of one dataset are stable) and **validated** (agrees with independent observation within a stated tolerance). Only the third earns an "A".
2. Every site should get a **coverage table**: for each hazard, modelled / proxy only / data missing / not modelled, shown in the headline. Missing must never read as low.
3. Independent references available now: GHCN-Daily stations (Madurai TMAX, 44 km; engine already has the station index), IMD heat-wave records, CGWB categories, Aqueduct as screening only.

## 4. Proposed order of work

| # | Change | Done when |
|---|---|---|
| 1 | Add a **water stress and drought finding** to Asset Intelligence from Aqueduct, with basin-scale caveat and projections | The home site headline is water stress, not wildfire; severity mapping documented; test for the site |
| 2 | Add a **hazard coverage table** to the panel and export | Every hazard shows modelled / proxy / missing; a failed fetch cannot appear as low risk |
| 3 | Relabel the current heat output **"screening: simplified WBGT, overstated in humid climates"** and stop showing grade A for it | Evidence grade cannot exceed what absolute validation supports |
| 4 | Implement **Liljegren WBGT and UTCI on hourly data** (licence check first), keep sWBGT only as a labelled comparison | Cross-site check shows engine inside the physical bracket; hours-per-class reported |
| 5 | **Station validation** of Tmax and humidity inputs at 20+ stations across climates; report bias by climate | Published bias table; acceptance thresholds written before the run |
| 6 | **Landsat surface heat island** indicator with rural reference and clear-date count | Shown as surface indicator only; not converted to air temperature |
| 7 | **India groundwater** layer from CGWB block categories | Site shows block category and stage of extraction, with source year |
| 8 | **SPEI** drought index with local station check | Site SPEI series plus validation against Madurai |

Items 1–3 are small and could be done next. Items 4–8 each need data, licence checks and a validation run.

## 5. What I could not establish

- Whether the sWBGT in Kong & Huber is identical to the formula in the engine; the sources I retrieved describe it as a simplified WBGT but I could not confirm the Bureau of Meteorology point from them. My own bracket check shows the overstatement regardless, but the paper's methods section should be read.
- Licences of PyWBGT, pywbgt and lwbgt.
- Whether UTCI performs well in hot-humid tropics.
- The Virudhunagar block-level CGWB category and the Landsat Level-2 scaling in the Planetary Computer catalogue.
- Whether the dock fix removes the "needs an API key" message in the packaged app: it reads the page's own API-key box and the app's session token, and the existing dock test still passes, but I have not run it in a browser.

## Sources

- Kong & Huber (2022), Explicit calculations of Wet Bulb Globe Temperature compared with approximations and why it matters for labor productivity: https://essopenarchive.org/doi/full/10.1002/essoar.10507637.1
- Lemke & Kjellstrom (2012), Calculating Workplace WBGT from Meteorological Data: https://dx.doi.org/10.2486/indhealth.ms1352
- PyWBGT: https://github.com/QINQINKONG/PyWBGT ; Zenodo v1.0.0: https://zenodo.org/records/5980536 ; pywbgt: https://pypi.org/project/pywbgt/ ; lwbgt: https://pypi.org/project/lwbgt/
- ERA5-HEAT (Di Napoli et al. 2021): https://reading-9.eprints-hosting.org/91423/9/gdj3.102.pdf and https://doi.org/10.24381/cds.553b7518
- UTCI classes: https://pmc.ncbi.nlm.nih.gov/articles/PMC5201358/table/ijerph-13-01217-t002
- IMD heat-wave definitions: https://mausam.imd.gov.in/pdfs/heatcolduser/Definition.pdf
- WRI Aqueduct 4.0 FAQ and limitations: https://www.wri.org/aqueduct/faq ; EU adaptation portal summary: https://mission-adaptation-portal.ec.europa.eu/aqueduct-global-water-risk-atlas-wri_en ; country rankings dataset note: https://datasets.wri.org/datasets/aqueduct-40-current-and-future-country-rankings
- CGWB Tamil Nadu state profile: https://cgwb.gov.in/old_website/State-Profiles/Tamil%20Nadu.pdf ; Virudhunagar aquifer report: https://cgwb.gov.in/sites/default/files/2022-11/report_virudhunagar_drkrajarajan_final_compressed.pdf
- SPEI with ERA5 vs stations (Saurashtra): https://plantarchives.org/article/76-%20A%20Comparative%20Assessment%20of%20Observed%20and%20ERA5%20Data%20for%20SPEI-Based%20Drought%20Analysis%20in%20the%20Saurashtra%20Region%20537-546%20(Sp-84).pdf ; India village-level SPEI dataset: https://b2find.eudat.eu/dataset/6bb06666-03d1-55e2-af52-6f0fddc09703
- Landsat SUHI product and Tamil Nadu study: https://www.usgs.gov/publications/mapping-surface-urban-heat-island-effect-using-landsat-surface-temperature-product ; ISPRS India megacities: https://isprs-annals.copernicus.org/articles/IV-5/71/2018/
- Data licences: Open-Meteo terms https://open-meteo.com/en/terms ; ERA5 licence https://apps.ecmwf.int/datasets/licences/era5 ; NASA POWER https://science.data.nasa.gov/about/license
- Station data used for the Madurai input check: NOAA GHCN-Daily, station IN020081700 (public domain).
