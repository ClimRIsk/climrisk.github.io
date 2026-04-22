# CRI Methodology — v0.1 (draft)

This document defines how climate scenarios flow through to a company's financial statements and valuation. Every formula here is deliberately simple in this draft — the intent is to lock the *shape* of the pipeline before we tune coefficients or add non-linearities.

---

## 1. Pipeline overview

```
  Scenario   ─┐
              ├──► Climate drivers (year t)  ──► Operational impact (year t)  ──► Financial impact (year t)  ──► Valuation
  Company    ─┘           │                              │                                │
  baseline               └── asset-level overlay ────────┘                                │
                                                                                          ▼
                                                                                 DCF, EBITDA compression,
                                                                                 implied share-price impact
```

We run this pipeline per scenario `s`, per company `c`, per year `t ∈ [T₀, T_end]`, and aggregate.

---

## 2. Scenarios (climate layer input)

Each scenario is a named, versioned set of time-series drivers:

| Driver | Unit | Source (target) |
|---|---|---|
| `carbon_price[s,t]` | USD / tCO₂e | NGFS, IEA WEO, internal overlays |
| `commodity_demand_index[s,t,commodity]` | index, 2025 = 100 | IEA, internal |
| `commodity_price[s,t,commodity]` | USD / unit | IEA, forward curves, analyst overlays |
| `tech_cost_curve[s,t,tech]` | USD / kW, USD / kWh, etc. | IEA, BNEF-style inputs |
| `physical_hazard[s,t,region,hazard]` | index or probability | WRI Aqueduct, IPCC, internal |
| `policy_shock[s,t,region]` | dummy × magnitude | manual overlays |

Canonical scenario set (initial):
- **NZE 2050** (IEA Net Zero by 2050) — aggressive, front-loaded transition.
- **Delayed Transition** (NGFS) — policy lag, abrupt repricing ~2030.
- **Current Policies** — effectively a hot-house / 3°C+ baseline.
- **Below 2°C Orderly** — smooth glide path, reference case.

Scenarios are stored as structured data (Pydantic/Parquet), not code — so analysts can author new ones without engineering.

---

## 3. Climate drivers → operational impact

### 3.1 Revenue

For each commodity `k` a company sells:

```
volume[c,k,t]  = baseline_volume[c,k,t] × (1 + demand_elasticity[k] × Δdemand_index[s,k,t])
                 × (1 − physical_disruption[c,t])

price[c,k,t]   = scenario_price[s,k,t] × (1 + green_premium_or_brown_discount[k,s,t])

revenue[c,t]   = Σ_k  volume[c,k,t] × price[c,k,t]
```

Where `physical_disruption[c,t]` is a weighted average across the company's assets of their annual hazard-driven lost-production estimate.

### 3.2 Cost structure

Operating costs are decomposed so the climate exposure is explicit:

```
opex[c,t] = energy_cost[c,t] + labor[c,t] + materials[c,t]
         + water_cost[c,t]      ← rises with water-stress index
         + logistics[c,t]       ← disrupted by extreme weather
         + other[c,t]
```

### 3.3 Carbon cost (the key transition-risk lever)

```
scope1_2_emissions[c,t] = emissions_intensity[c,k] × volume[c,k,t]  (summed over k)

carbon_cost[c,t] = scope1_2_emissions[c,t]
                 × carbon_price[s,t]
                 × carbon_price_coverage[c,region,t]        ∈ [0, 1]
                 × (1 − free_allocation[c,region,t])
```

Scope 3 is tracked separately and flows through the supply-chain / customer-demand path, not directly into cost.

### 3.4 Transition & adaptation capex

```
transition_capex[c,t]  = Σ_abatement_lever   cost_per_tCO2_abated[lever,t] × tCO2_abated[c,lever,t]
adaptation_capex[c,t]  = Σ_asset             hazard_exposure × adaptation_unit_cost
stranded_writedowns[c,t] = f( asset_utilization_path[s], carrying_value )
```

The marginal abatement cost curve (MACC) per company is a first-class input and one of the most defensible levers we expose to users.

---

## 4. Operational impact → financial impact

### 4.1 Income statement

```
EBITDA[c,t] = revenue[c,t] − opex[c,t] − carbon_cost[c,t] − physical_loss_cost[c,t]
D&A[c,t]    = baseline_D&A + D&A_on(transition_capex + adaptation_capex) + accelerated_D&A_on(stranded)
EBIT[c,t]   = EBITDA[c,t] − D&A[c,t]
NOPAT[c,t]  = EBIT[c,t] × (1 − tax_rate)
```

### 4.2 Free cash flow

```
FCF[c,t] = NOPAT[c,t] + D&A[c,t]
         − (maintenance_capex + transition_capex[c,t] + adaptation_capex[c,t])
         − Δ working_capital[c,t]
```

### 4.3 Climate-adjusted WACC

```
WACC_adj[c,s] = WACC_base[c] + climate_risk_premium[c,s]

climate_risk_premium[c,s] = β_transition × transition_exposure[c]
                          + β_physical   × physical_exposure[c]
                          + β_policy     × regulatory_uncertainty[c,s]
```

`β` coefficients are calibrated (a) empirically where we have CDS / bond-spread data, and (b) judgementally where we don't — documented and versioned.

### 4.4 Valuation (climate-adjusted DCF)

```
NPV[c,s] = Σ_{t=T₀}^{T_end}  FCF[c,t] / (1 + WACC_adj[c,s])^(t − T₀)
         + TerminalValue[c,s] / (1 + WACC_adj[c,s])^(T_end − T₀)
```

With equity bridge:
```
equity_value[c,s] = NPV[c,s] − net_debt + non_operating_assets
implied_share_price[c,s] = equity_value[c,s] / shares_outstanding
```

---

## 5. Output metrics (per company × scenario)

| Metric | Definition |
|---|---|
| **EBITDA compression** | `EBITDA[s] / EBITDA[baseline] − 1`, year by year |
| **NPV impact** | `NPV[s] / NPV[baseline] − 1` |
| **Implied share-price delta** | vs. current market price |
| **Carbon cost share of EBITDA** | `carbon_cost[t] / EBITDA_baseline[t]` |
| **Stranded-asset ratio** | `Σ stranded_writedowns / book_value` |
| **Most-exposed assets** | ranked by contribution to NPV loss |
| **Break-even carbon price** | price at which climate-adjusted NPV = baseline NPV |
| **Scenario divergence** | fan chart of NPV across scenarios |

---

## 6. Non-linearities we explicitly model

Linear scaling misses the economic reality. The engine handles:

1. **Margin compression under rising carbon costs** — percentage hit to EBITDA grows faster than carbon cost once gross margin thins.
2. **Asset-level tipping points** — once a mine's unit cost exceeds the scenario's commodity price, it goes idle (volume → 0, stranded write-down triggered).
3. **Demand-price interaction** — in transition scenarios, "green" commodities (copper, lithium, aluminium) enjoy price *and* volume tailwinds; this compounds rather than adds.
4. **Physical disruption clustering** — hazard events correlate (e.g., simultaneous water stress across Chilean copper belt), so we use joint-probability overlays, not independent draws.
5. **Adaptation capex crowding out growth capex** — forced transition spend displaces expansion spend, reducing long-run volume growth.

---

## 7. What's explicitly *not* in v0.1

- Scope 3 feedback loops into demand (tracked separately, not yet priced).
- Endogenous commodity price formation (we take scenario prices as given).
- Portfolio-level correlation engine (comes in Phase 2).
- Litigation / reputational risk (qualitative overlay only for now).

---

## 8. Open questions — to validate with you

1. Which scenario set do we treat as canonical — NGFS, IEA NZE, or a hybrid?
2. Do you want the DCF to run on a fixed horizon (e.g., 2025–2050) or a two-stage explicit + terminal?
3. How should we handle companies that don't publicly disclose asset-level emissions — proxy by commodity intensity, or require a user override?
4. What's your preferred treatment of free allowances / carbon-border adjustments by region?
