# CRI Engine — Physical Climate Risk Data Provenance Audit

**Date:** June 2026  
**Version:** CRI Engine v0.4  
**Scope:** Physical hazard pipeline — what data sources actually drive each output  
**Standing rule:** No engine changes. This is a standalone audit document.

---

## Executive Summary

The engine's physical climate risk pipeline is more capable than it appears — it does perform real downscaling and does make live API calls under the right conditions. However, three critical transparency problems exist:

1. **The final CRI output does not expose which data path was taken** (live API vs. fallback tables), making results look identical regardless of quality.
2. **WRI Aqueduct 4.0 values are pre-embedded lookup tables**, not live API calls, frozen at the time the engine was written.
3. **The GIS resolver uses embedded sampled grids** (≈200 cells each for elevation, Köppen zone, ERA5 temperature), not live GIS API queries.

These are solvable. The downscaling methodology is sound and well-cited. The issue is visibility, not absence of methodology.

---

## 1. The Five-Layer Physical Hazard Pipeline

Every call to `PhysicalHazardEngine.assess(asset_id, region, year, lat, lon, ...)` traverses up to five layers. Which layers execute depends on whether coordinates are provided.

### Layer 1 — WRI Aqueduct 4.0 Regional Baseline

**What it is:** Pre-embedded Python dict (`WRI_BASELINE` in `hazard_layers.py`) containing 5 hazard scores (0–5 scale) for 23 region codes: AU-WA, AU-QLD, AU-SA, AU-NSW, AU-VIC, AU-NT, US-TX, US-WY, US-OK, CA-AB, CA-QC, GB-ENG, NL-NH, ZA, CL-02, PE-01, BR-PA, ID-KI, CN-NM, IN-MH, MN-01, plus `global` fallback.

**What it provides:** `water_stress`, `riverine_flood`, `coastal_flood`, `drought`, `heat_baseline` — each a 0–5 severity score representing WRI Aqueduct 4.0 (2023) region-average values.

**Is it a live API call?** **No.** The values are hardcoded. The `WRIAqueductConnector` class exists in `connectors/wri_aqueduct.py` but is only referenced in `pipeline.py` (Pipeline class), which is not invoked in the default API execution path. `api/main.py` calls `run_engine()` from `orchestrator.py` directly, bypassing Pipeline entirely.

**What this means:** WRI Aqueduct data is correct as of when the table was populated. A region that experienced a significant change in water stress (e.g., Atacama post-2023 drought worsening) would not be reflected until the table is manually updated. The data resolution is also at province/state level — one score for all of AU-WA regardless of where in Western Australia an asset sits.

**Affected hazards:** All 10 core hazards use Layer 1 as their baseline anchor.

---

### Layer 2 — GIS Resolver (Embedded Spatial Tables)

**What it is:** `climate/gis/resolver.py` — pure Python, no external dependencies. Triggered automatically when `lat` and `lon` are provided to `assess()`.

**What it provides:** Six spatial attributes resolved from coordinates:

| Attribute | Source | Grid Resolution |
|---|---|---|
| `elevation_m` | SRTM v4.1 sampled values | ~200 cells, 1° grid |
| `coastal_km` | Natural Earth coastline bounding boxes | ~16 coastal strips |
| `koppen_zone` | Beck et al. (2018) Köppen–Geiger, aggregated | ~200 cells, 1° grid |
| `is_arid` | Köppen + WRI dryland bounding boxes | Combined lookup |
| `is_permafrost` | NSIDC 2020 permafrost, simplified bounding boxes | 5 lat/lon polygons |
| `is_cyclone_belt` | IBTrACS 1980–2023 track density boxes | 6 lat/lon polygons |
| `mean_winter_temp` | ERA5 climatology (1991–2020) | ~200 cells, 2° grid |
| `equipment_sensitivity` | Hard-coded per equipment-type dict | N/A |

**Is it a live GIS API call?** **No.** All data is embedded. File header states explicitly: "Pure Python, zero external dependencies beyond the standard library. No live API calls; all lookups use embedded tables." Source field returned: `"embedded_tables_v1"`.

**What this means:** The GIS resolver provides genuine spatial differentiation — a mine at (-22.3°, 118.6°) in the Pilbara gets elevation 480m, Köppen zone BWh, not coastal, not cyclone belt, not permafrost. This is correct and meaningful. But the lookup grid is coarse. If your asset coordinates are not in one of the ~200 sampled cells, the resolver falls through to latitude-band heuristics. The file explicitly notes: "Resolution accuracy: ±100 km is sufficient for TCFD directional disclosure. Clients requiring sub-km precision should wire in a live GIS API."

**How GIS overrides affect specific hazards:**

- **Cyclone (`cyclone`):** `is_cyclone_belt_override` from GIS IBTrACS boxes. Enables cyclone risk even for region codes not in the hardcoded `CYCLONE_REGIONS` set.
- **Permafrost thaw (`permafrost_thaw`):** `is_permafrost_override` from GIS NSIDC boxes. Enables risk even for region codes not in `PERMAFROST_REGIONS`.
- **Dust storm (`dust_storm`):** `is_arid_override` from GIS Köppen + dryland boxes. Enables risk even for region codes not in `DUST_STORM_REGIONS`.
- **Blade icing and freeze-thaw cycle:** `mean_winter_temp_override` from GIS ERA5 grid. Replaces the region-code lookup table with coordinate-level ERA5 data — this is the most granular GIS override.
- **Coastal hazards (flood_coastal, SLR, saltwater intrusion):** `coastal_km` from GIS replaces the binary `is_coastal` flag, and applies a continuous coastal proximity factor (0–1) computed via Haversine to reference coastline points.

---

### Layer 3 — Sub-Grid Elevation Downscaling (Analytic)

**What it is:** `_subgrid_elevation_correction()` and `_resolve_spatial_context()` in `hazard_layers.py`. Analytic correction, no data calls.

**What it provides:** Three multiplicative correction factors applied to Layer 1 baseline scores:

| Factor | Formula | Basis |
|---|---|---|
| `flood_factor` | Piecewise: 1.25× (below floodplain) → 0.20× (>600m above regional mean) | LISFLOOD sub-grid DEM analysis; WRI Aqueduct 4.0 validation report |
| `heat_factor` | `exp(-0.0025 × elev_delta)` — lapse rate −0.25% per 10m above mean | WMO standard atmosphere; IPCC AR6 WG1 Ch2 |
| `water_stress_factor` | −15% per 500m above regional mean, capped at −40% | FAO AQUASTAT; WRI Aqueduct 4.0 sub-basin analysis |

**Is this real downscaling?** Yes. This is genuine sub-grid downscaling: a factory in a river valley gets flood_factor 1.25× amplification; a mine 600m above the regional average gets 0.20× reduction. The formulas are documented, cited, and applied to every asset with coordinates.

**What it requires:** An elevation value — from GIS Layer 2 (if coordinates provided) or from the `REGION_ELEVATION_M` regional average table (if coordinates missing).

**What this means for transparency:** The `HazardScore.notes` field for each hazard carries the sub-grid correction applied. For example, riverine flood notes: `"Grid baseline 1.60 × sub-grid correction 0.65 = adjusted 1.04"`. This data is in the output object but not surfaced to the end user in current API responses.

---

### Layer 4 — Live NASA POWER API Call (Real Meteorological Data)

**What it is:** `connectors/nasa_power.py` — real HTTP call to `https://power.larc.nasa.gov/api/temporal/climatology/point`. Triggered automatically in `assess()` when `lat` and `lon` are provided and `_depth == 0`.

**What it provides:** 2001–2020 climatological normals at exact asset coordinates:
- `T2M_MAX`: Annual mean of daily maximum temperature (°C)
- `PRECTOTCORR`: Annual mean corrected precipitation (mm/day)
- `RH2M`: Annual mean relative humidity (%)
- Monthly breakdowns of all the above

**Caching:** Responses are cached to disk at `src/cri/.cache/nasa_power/{lat}_{lon}.json`, rounded to the nearest 0.25° grid cell. A second call for the same area does not re-query the API.

**When does it succeed?** When the network is available and NASA POWER is reachable (timeout: 10 seconds). On failure, `get_baseline()` returns `None` and the engine falls silently back to the WRI regional table.

**Affected hazards when live data succeeds:**

- **Heat stress:** Baseline temperature from NASA POWER `T2M_MAX` replaces the WRI regional `heat_baseline`. Instead of "AU-WA regional heat baseline = 2.8/5", the engine uses the actual measured maximum temperature at those coordinates (e.g., 38.4°C at Pilbara) to compute heat severity. `data_source` becomes `"NASA POWER 2001-2020 baseline + Open-Meteo CMIP6 warming delta"`.
- **Riverine flood:** Live CMIP6 precipitation delta (from Layer 5) replaces the IPCC Clausius-Clapeyron average when available.

**What happens when it fails?** The engine falls back to Layer 1 (WRI regional table) and Layer 3 (sub-grid elevation correction). The `AssetHazardProfile.live_baseline` field is `None`. The `live_projection` field shows `"live": False`. The heat stress `data_source` field says `"WRI Aqueduct 4.0 regional baseline + IPCC AR6 Ch11.3"`.

---

### Layer 5 — Live Open-Meteo CMIP6 Projection (Climate Model Output)

**What it is:** `connectors/open_meteo_climate.py` — real HTTP call to Open-Meteo's CMIP6 climate projections API. Triggered only when Layer 4 also succeeds.

**What it provides:** CMIP6 (MRI-AGCM3.2-S model) temperature and precipitation projections at asset coordinates for a specific future year. This is the actual delta-downscaling step:

```
Step 1: NASA POWER MERRA-2 (2001-2020) → observed baseline at asset
Step 2: Open-Meteo CMIP6 historical (year 2010) → model's own baseline (removes GCM bias)
Step 3: Open-Meteo CMIP6 future (target year, SSP) → future projection
Warming delta = CMIP6_future_T2M − CMIP6_historical_T2M  (model-consistent)
Projected T = NASA POWER observed + warming delta × SSP scaling factor
```

**Why this is real downscaling:** This is the standard delta-downscaling (bias correction + pattern scaling) approach used in applied climate science. It respects the model's own internal consistency while anchoring the baseline to observed climatology. The SSP scaling factor comes from IPCC AR6 WG1 Table 4.5 GMST ratios (e.g., SSP1-2.6 warms less than SSP5-8.5).

**When does it fail?** If the Open-Meteo CMIP6 API is unavailable for the requested year/scenario, the engine reverts to IPCC AR6 Ch4 GMST warming trajectories (regional warming lookup tables in `ssp_scenarios.py`). This is scientifically defensible but less granular — it uses the global mean warming trajectory, not a coordinate-specific CMIP6 signal.

---

## 2. The Transparency Gap: What the Output Does Not Show

The five layers above represent genuinely different data quality levels. A run on an asset with valid coordinates, network access, and a cached NASA POWER response produces meaningfully better output than one running without coordinates. Yet the final `CRIScore` and `RunResults` that flow to the API response look identical in both cases.

### What information is computed but not surfaced

| Field | Location | What it tells you | Exposed in API? |
|---|---|---|---|
| `AssetHazardProfile.live_baseline` | `hazard_layers.py` | NASA POWER T2M_MAX and precipitation at asset coordinates | No — not in RunResults |
| `AssetHazardProfile.live_projection` | `hazard_layers.py` | Whether live CMIP6 data was used; warming delta; data source | No |
| `AssetHazardProfile.downscaling_method` | `hazard_layers.py` | Full 5-step methodology description, including which path was taken | No |
| `AssetHazardProfile.spatial_resolution` | `hazard_layers.py` | Whether coordinates were used or region centroid fell back | No |
| `HazardScore.data_source` | Per hazard | Which dataset drove this specific hazard (live or fallback) | No |
| `HazardScore.notes` | Per hazard | Sub-grid correction factors applied (flood_factor, heat_factor, etc.) | No |
| `AssetGISAttributes.source` | `gis/resolver.py` | Always returns `"embedded_tables_v1"` — tells you GIS is not live | No |

### What a trusted output should show

For a result to be independently auditable (TCFD physical risk disclosure standard), each hazard loss fraction should be traceable to:

1. **What baseline dataset was used** — "WRI Aqueduct 4.0 regional table" vs. "NASA POWER MERRA-2 2001-2020 at (-22.3, 118.6)"
2. **What warming signal was applied** — "IPCC AR6 Ch4 SSP3 trajectory for AU-WA" vs. "Open-Meteo MRI-AGCM3.2-S CMIP6 delta-downscaled at asset grid cell"
3. **What sub-grid correction was applied** — flood_factor, heat_factor, and whether they were from live elevation or regional average
4. **Whether any live API calls failed** — and what fallback path was taken

This information is all computed inside `AssetHazardProfile` — it's just not plumbed into `YearResult`, `RunResults`, or the API response.

---

## 3. Data Source Classification by Hazard

The table below states, for each hazard, what data actually drives the output in a standard run (coordinates provided, APIs available vs. unavailable).

| Hazard | Layer 1 (Always) | Layer 2 (GIS, if lat/lon) | Live API path | Fallback |
|---|---|---|---|---|
| heat_stress | WRI heat_baseline | GIS elevation → heat_factor | NASA POWER T2M_MAX + Open-Meteo CMIP6 warming delta | WRI heat_baseline × IPCC AR6 warming trajectory |
| flood_riverine | WRI riverine_flood | GIS elevation → flood_factor, LULC runoff | Open-Meteo CMIP6 precipitation delta | WRI × IPCC Clausius-Clapeyron |
| flood_coastal | WRI coastal_flood | GIS coastal_km → coastal_factor, elevation gate | N/A | WRI × IPCC AR6 Ch9 SLR |
| sea_level_rise | IPCC AR6 Ch9 SLR | GIS coastal_km → coastal_factor, elevation gate | N/A | Same — no live path for SLR |
| saltwater_intrusion | WRI water_stress + IPCC SLR | GIS coastal proximity | N/A | Same |
| landslide | IPCC AR6 WG2 Ch5 | GIS elevation, LULC cover | N/A | Same |
| wildfire | NASA FIRMS historical (embedded) | GIS LULC fuel load | N/A | Same |
| cyclone | IBTrACS (embedded tables) | GIS cyclone belt override | N/A | Same |
| drought | WRI drought | — | N/A | Same |
| water_stress | WRI water_stress | GIS elevation → water_stress_factor | N/A | Same |
| extreme_cold | Hardcoded regional baseline | GIS elevation | N/A | Same |
| blade_icing | Hardcoded regional table | GIS ERA5 mean winter temp | N/A | Region lookup |
| extratropical_cyclone | Hardcoded ETC baseline | — | N/A | Same |
| flash_flood | WRI riverine_flood (proxy) | GIS LULC, elevation | N/A | Same |
| permafrost_thaw | Hardcoded regional | GIS NSIDC permafrost zone | N/A | Region lookup |
| dust_storm | Hardcoded regional | GIS Köppen + dryland zone | N/A | Region lookup |
| hail | Hardcoded regional | — | N/A | Same |
| lightning | TRMM/LIS density (embedded) | — | N/A | Same |
| subsidence | InSAR/WRI (embedded) | — | N/A | Same |
| freeze_thaw_cycle | Hardcoded regional | GIS ERA5 mean winter temp | N/A | Region lookup |
| compound_flood | WRI coastal + riverine | GIS coastal proximity | N/A | Same |
| avalanche | Hardcoded regional | GIS elevation | N/A | Same |
| marine_heatwave | Hardcoded regional | GIS coastal proximity | N/A | Same |
| glof | Hardcoded regional | — | N/A | Same |
| tornado | NOAA SPC (embedded) | — | N/A | Same |

**Key finding:** Only two hazards — heat_stress and flood_riverine — can use live API data from NASA POWER and Open-Meteo. The other 23 hazards use embedded data regardless of connectivity.

---

## 4. What "Downscaling" Actually Means in This Engine

The user's concern about downscaling transparency is valid. Here is what the engine does and does not do, clearly stated:

**What it DOES:**

1. **Elevation-based sub-grid correction** (all assets with elevation data): A genuine downscaling from the 25km WRI Aqueduct grid cell average to the asset's specific elevation. An asset 400m above the regional mean receives a flood_factor of 0.50 — halving its flood exposure relative to the grid average. This is not an approximation; it implements the LISFLOOD sub-grid DEM methodology cited in WRI Aqueduct's own validation report.

2. **Haversine coastal proximity decay** (all assets with coordinates): Replaces binary "is coastal" with a continuous 0–1 factor based on actual distance to a reference coastline, comparable to CLIMADA's coastal exposure methodology.

3. **Delta-downscaling of temperature and precipitation** (when coordinates provided AND NASA POWER + Open-Meteo APIs available): The three-step bias-corrected delta-downscaling described in Section 1, Layer 5. This is real CMIP6 output at asset coordinates.

4. **Köppen–Geiger climate zone** and **ERA5 mean winter temperature** overrides (when coordinates provided): These replace generic region-code lookups for blade icing, freeze-thaw cycles, and dust-storm applicability with spatially resolved values from ERA5 reanalysis.

**What it DOES NOT DO:**

1. **Query WRI Aqueduct live** for current water stress, riverine flood, or drought data. All WRI values are a frozen 2023 snapshot.

2. **Query a live DEM** for terrain analysis. Elevation comes from a ~200-cell sampled lookup (if asset is in the lookup) or a regional average (if not).

3. **Dynamically fetch land cover** from NASA MODIS or Copernicus HLS. LULC is a region-code-to-type mapping (e.g., AU-WA → shrubland) with no per-asset or per-year variation.

4. **Use satellite-derived hazard observations** (e.g., current flood extent from Sentinel-1, current fire perimeter from VIIRS). The engine is purely forward-looking (scenario projection), not observational.

5. **Downscale anything below 0.25° resolution** for most hazards. The NASA POWER cache rounds to the nearest 0.25° cell; WRI Aqueduct is at ~25km. The effective resolution for most hazards is 25km (0.25°), with elevation corrections applied analytically.

---

## 5. The WRI Aqueduct Connector: Why It Exists But Is Not Used

`climate_risk_engine/src/cri/connectors/wri_aqueduct.py` exists and is imported in `engine/pipeline.py`. However:

- **`api/main.py`** calls `run_engine(company, scenario)` from `orchestrator.py`, which calls `simulate()` → `compute_year()` → `PhysicalHazardEngine.assess()`. This path never touches `Pipeline`.
- **`Pipeline`** (in `engine/pipeline.py`) is designed as an intake layer for production clients — it would call `wri.get_asset_water_stress(lat, lon)` for each asset before passing the company to the engine. But `_enrich_asset_hazards()` currently returns the asset unchanged (explicit stub).
- **The live WRI Aqueduct API** at `https://api.resourcewatch.org/v1/` requires an API key and rate-limit management for production use.

**What would need to change to activate live WRI data:** `_enrich_asset_hazards()` in `pipeline.py` would need to call `wri.get_asset_water_stress(lat, lon)` and patch the resulting value into the asset's hazard parameters before the engine run. This would then override the `WRI_BASELINE` dict values with live data. This is a planned production feature, not a gap in methodology.

---

## 6. What Makes a Result Trustworthy (and When This Engine Is)

The engine produces trustworthy directional results when:

- The company's assets are in regions covered by the `WRI_BASELINE` table (not the `global` fallback)
- Asset coordinates (lat/lon) are provided — enabling GIS resolution, sub-grid corrections, and live API downscaling
- The equipment_type is specified — enabling per-hazard sensitivity multipliers
- Network access is available so NASA POWER and Open-Meteo calls succeed (warmly improves heat stress and flood specifically)

The engine produces lower-quality (but still directionally valid) results when:

- Only a region code is provided — all hazards use regional averages, no sub-grid corrections
- Network is unavailable — falls back to WRI regional table + IPCC warming trajectories
- Asset is outside the ~200-cell GIS lookup tables — elevation, Köppen zone, and ERA5 temperature use latitude-band heuristics

The engine's results are **not yet production-grade for professional physical climate risk rating** because:

- WRI Aqueduct data is static (embedded table, not live queried per asset)
- GIS data is from sampled, embedded grids — not a live GIS API providing sub-km resolution
- Provenance is not exposed in API output — a reviewer cannot determine from the returned score whether live or fallback data drove the result
- Downscaling applies to only 2 of 25 hazards via live API; the other 23 always use embedded tables

---

## 7. Recommendations (No Engine Changes — Observation Only)

These are observations, not instructions to change the engine.

**Transparency (highest priority):**  
The `AssetHazardProfile.live_baseline`, `.live_projection`, `.downscaling_method`, and per-hazard `HazardScore.data_source` and `.notes` fields already contain the provenance data. Exposing these through the API response (in a `data_provenance` or `physical_hazard_detail` field) would make results auditable without changing any calculation logic.

**WRI Aqueduct:**  
Activating the existing `_enrich_asset_hazards()` stub in `pipeline.py` to call the live WRI Aqueduct connector would bring real per-asset water stress, flood, and drought baselines into the calculation. The connector file already implements the API call structure.

**GIS resolution:**  
The `gis/resolver.py` file's own header acknowledges: "Clients requiring sub-km precision should wire in a live GIS API." Replacing the sampled embedded tables with live calls to the Google Elevation API or SRTM web service, and to a live Köppen classification service, would improve accuracy for assets not in the current ~200-cell lookup.

**Indicator of live vs. fallback:**  
A single boolean or enum field on the API response — `data_quality: "live" | "regional_baseline" | "global_fallback"` — would immediately communicate to users whether their result used real meteorological data or regional averages.

---

*Audit based on direct code reading. All findings cite specific file and function locations. No assumptions made on data sourcing beyond what the source code demonstrates.*
