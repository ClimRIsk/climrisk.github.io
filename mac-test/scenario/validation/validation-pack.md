# ClimRisk Model Lab: validation pack

Engine version 0.7.0, generated 2026-10-08. Every number below is computed or read from a results file when this report is built; none is typed by hand.

## 1. Scope and method

For each hazard the engine builds a model on its own, then tests it in four independent layers. A model is called *validated* only when it predicted data it had not been shown. The layers: (1) analytic benchmarks, (2) calibration of the hindcast test on synthetic records with known answers, (3) a global sweep of real data at many sites in every climate zone, (4) comparison with an independent second data source.

## 2. Layer 1: analytic benchmarks (26 of 26 passed)

| Component | Passed | Failures |
|---|---|---|
| Extreme-value fitting and return levels | 4 of 4 | none |
| Heat stress (WBGT, Magnus) | 2 of 2 | none |
| Fire Weather Index | 2 of 2 | none |
| Soil-water bucket / river routing | 4 of 4 | none |
| Earthquake (Gutenberg–Richter, ground motion) | 4 of 4 | none |
| Tropical-cyclone wind field (Holland) | 5 of 5 | none |
| Landslide infinite slope | 5 of 5 | none |

## 3. Layer 2: is the hindcast test itself calibrated?

On 150 synthetic stationary records the test wrongly failed 11 % (nominal about 10 %); on records with a strong built-in trend it detected the problem 97 % of the time.

## 4. Layer 3: global sweep (222 studies at 37 sites)

| Hazard | n | hindcast failed / no skill | no model (no exposure / too little data) | other | validated | validated after diagnosis | validated, small drift |
|---|---|---|---|---|---|---|---|
| cyclone | 37 | 2 | 26 | 3 | 6 | 0 | 0 |
| earthquake | 37 | 1 | 20 | 0 | 10 | 6 | 0 |
| fire | 37 | 4 | 1 | 0 | 22 | 0 | 10 |
| heat | 37 | 0 | 0 | 0 | 15 | 0 | 22 |
| rain | 37 | 10 | 0 | 0 | 24 | 0 | 3 |
| wind | 37 | 2 | 0 | 0 | 27 | 0 | 8 |

Not covered by this sweep: drought, river, flood, landslide. They are validated site by site when run, but have no worldwide pass rate yet.

Extreme-value hindcast: 88 of 147 passed outright (nominal false-fail rate about 10 %). Median size of the design-level drift where a hindcast failed or flagged: 5 %.

### Failures and no-skill results (listed in full)

- Dhaka (tropical monsoon) / rain: verified; hindcast FAILED (the early record does not predict the recent one)
- Manaus (tropical rainforest) / fire: verified; hindcast FAILED (the early record does not predict the recent one)
- Dakar (semi-arid coast) / rain: verified; hindcast FAILED (the early record does not predict the recent one)
- Dakar (semi-arid coast) / wind: verified; hindcast FAILED (the early record does not predict the recent one)
- Nairobi (tropical highland savanna) / earthquake: verified; hindcast FAILED (a stationary Gutenberg–Richter model does not describe this catalogue)
- Shanghai (humid subtropical) / rain: verified; hindcast FAILED (the early record does not predict the recent one)
- Sydney (mediterranean/oceanic) / fire: verified; hindcast FAILED (the early record does not predict the recent one)
- Sao Paulo (humid subtropical) / fire: verified; hindcast FAILED (the early record does not predict the recent one)
- Santiago (mediterranean) / rain: verified; hindcast FAILED (the early record does not predict the recent one)
- Cape Town (mediterranean) / rain: verified; hindcast FAILED (the early record does not predict the recent one)
- New York (temperate continental) / rain: verified; hindcast FAILED (the early record does not predict the recent one)
- London (temperate oceanic) / rain: verified; hindcast FAILED (the early record does not predict the recent one)
- New York (temperate continental) / cyclone: verified; hindcast FAILED (rates changed between early and late record)
- Ulaanbaatar (cold semi-arid) / fire: verified; hindcast FAILED (the early record does not predict the recent one)
- Mexico City (subtropical highland) / wind: verified; hindcast FAILED (the early record does not predict the recent one)
- Anchorage (subarctic) / rain: verified; hindcast FAILED (the early record does not predict the recent one)
- Addis Ababa (tropical highland) / rain: verified; hindcast FAILED (the early record does not predict the recent one)
- Manila (tropical coastal) / rain: verified; hindcast FAILED (the early record does not predict the recent one)
- Manila (tropical coastal) / cyclone: verified; hindcast FAILED (rates changed between early and late record)

### By climate zone

| Zone | hindcast failed / no skill | no model (no exposure / too little data) | other | validated | validated after diagnosis | validated, small drift |
|---|---|---|---|---|---|---|
| cold continental | 0 | 3 | 1 | 4 | 0 | 4 |
| cold semi-arid | 1 | 2 | 0 | 3 | 0 | 0 |
| high altitude | 0 | 1 | 0 | 2 | 1 | 2 |
| hot desert | 0 | 7 | 0 | 10 | 0 | 1 |
| humid subtropical | 2 | 6 | 0 | 16 | 0 | 6 |
| humid subtropical/temperate | 0 | 0 | 0 | 4 | 1 | 1 |
| island | 0 | 1 | 0 | 2 | 0 | 3 |
| mediterranean | 2 | 5 | 0 | 11 | 2 | 4 |
| mediterranean/oceanic | 1 | 2 | 0 | 2 | 0 | 1 |
| mountain | 0 | 1 | 0 | 4 | 0 | 1 |
| semi-arid coast | 2 | 2 | 0 | 0 | 0 | 2 |
| small island | 0 | 2 | 0 | 3 | 0 | 1 |
| subarctic | 1 | 1 | 0 | 4 | 0 | 0 |
| subpolar oceanic | 0 | 1 | 0 | 5 | 0 | 0 |
| subtropical highland | 1 | 0 | 1 | 4 | 0 | 0 |
| temperate | 0 | 1 | 0 | 4 | 0 | 1 |
| temperate continental | 2 | 1 | 0 | 2 | 0 | 1 |
| temperate oceanic | 1 | 3 | 0 | 5 | 1 | 2 |
| tropical coastal | 2 | 2 | 0 | 4 | 0 | 4 |
| tropical highland | 1 | 1 | 0 | 4 | 0 | 0 |
| tropical highland savanna | 1 | 1 | 0 | 3 | 0 | 1 |
| tropical monsoon | 1 | 0 | 1 | 7 | 1 | 2 |
| tropical rainforest | 1 | 4 | 0 | 1 | 0 | 6 |

## 5. Layer 4: independent-source cross-check

# Cross-source comparison

- rain: no site pair with different sources yet

- heat: no site pair with different sources yet

- wind: no site pair with different sources yet

- fire: no site pair with different sources yet

## 6. Data sources and licences

| Source | Used for | Licence |
|---|---|---|
| NASA POWER (MERRA-2 / IMERG) | Daily rain, temperature, humidity, wind, 1981 onward | CC BY 4.0: commercial use permitted with attribution |
| ERA5 via Open-Meteo free tier | Daily/hourly reanalysis, 1979 onward (development cross-check only) | Free tier is non-commercial; not used for production numbers |
| Copernicus ERA5 / ERA5-Land / GloFAS (CDS) | Reanalysis, land and river discharge | Free licence, commercial use with attribution (requires user registration; adapter planned) |
| World Bank CCKP CMIP6 0.25° (NEX-GDDP-CMIP6 downscaled) | Climate-scenario ensemble, 1950-2100 | CMIP6 output CC0; portal content MPL; commercial use with acknowledgement |
| USGS earthquake catalogue (ComCat/FDSN) | Earthquakes M4+, 1973 onward | US Government work: public domain |
| IBTrACS | Tropical-cyclone best tracks | Open, with citation (NOAA NCEI) |
| Terrain tiles (AWS Open Data / Copernicus DEM) | Elevation for flood and landslide studies | Open data licences, attribution |

## 7. What the engine does not model (stated, not hidden)

- **Storm surge and coastal flooding from the sea.** Needs hydrodynamic surge modelling with bathymetry and tide gauges; the flood study handles rain and river flooding only.
- **Sea-level rise.** No open, commercially licensed regional sea-level product is wired in yet (NASA/IPCC AR6 projections are the candidate).
- **Hail, tornado, convective wind.** Reanalysis and climate models do not resolve them; needs radar and storm-report climatologies.
- **Subsidence, erosion, permafrost.** Needs ground-motion and soil data not yet integrated.
- **Wind, cyclone, drought and fire under future climate.** Projections cover extreme rain and extreme heat only; the CMIP6 products used do not provide a wind-extreme or fire index, and cyclone change is not robust at grid scale.
- **Independent audit and station validation.** Reanalysis and satellite-based products are not weather stations. Station-level validation (GHCN-Daily, national services) is the next independent check.
- **Scale.** A study takes seconds to minutes per hazard per place; screening a million assets needs a batch pipeline on pre-computed grid cells, which the portfolio mode implements per 0.25° cell.

## 8. Reproduce

`python -m cri.modellab.validation_pack sweep.jsonl compare.md out/` regenerates this report. The sweep is `python tools/global_sweep.py`.

This report is generated evidence, not an independent audit.