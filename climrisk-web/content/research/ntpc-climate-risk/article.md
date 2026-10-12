On 21 May 2026, India's electricity demand touched a record 270.8 GW, according to the Union Ministry of Power. Coal-based plants were supplying 171.7 GW of it at that moment. Renewables, including hydro, met 34% of peak demand. **[Down To Earth 2026]**

One of the utilities behind that coal fleet is NTPC Ltd. Its group installed capacity is 89,108 MW across 53 stations, roughly 17% of the national total. **[Angel One 2026]** In FY2025-26 it reported Scope 1 emissions of about 309 million tonnes of CO2e. **[NTPC BRSR 2026]**

So what does climate risk look like for a company like this? Most people reach for floods and heat. We ran NTPC through the ClimRisk engine and the answer is the opposite of the usual story: the weather is not the problem. The carbon price that does not yet exist is.

![Sentinel-2 true-colour scene of the Singrauli coal belt, Madhya Pradesh and Uttar Pradesh, 14 April 2026. Contains modified Copernicus Sentinel-2 data (2026), via AWS Earth Search.](/research/ntpc-climate-risk/satellite-singrauli.png)

## A company built in a hurry, and still building

NTPC added 9,619 MW in FY26, its highest annual addition ever, of which 5,488 MW was green capacity across solar, wind and pumped storage. It generated 432.2 billion units and produced 48.65 million tonnes of coal from its own mines. **[SolarQuarter 2026]**

The stated direction is clear: 149 GW of capacity by 2032, of which 60 GW renewable. **[SolarQuarter 2026]** Capacity under construction is 33.5 GW. **[Angel One 2026]** Group capex in FY26 was about ₹55,986 crore, the highest ever. **[Angel One 2026]**

The same research note observes that India's National Electricity Plan envisages close to 90 GW of new coal by 2032 alongside 500 GW of non-fossil capacity. **[Angel One 2026]** In plain terms: renewables are growing fast, but the coal that already exists is not going away on a timetable anyone has written down.

![NTPC in five numbers, each sourced beside the figure.](/research/ntpc-climate-risk/key-figures.png)

> **SOURCE — Down To Earth, on the 21 May 2026 record:** "Coal-based thermal remained the mainstay throughout the day."

## The physical picture: quiet

We screened all 46 NTPC-linked assets in the ClimRisk register (NTPC Ltd, NTPC-SAIL Power Company and NTPC Tamil Nadu Energy). For the 20 highest emitters we pulled live river and coastal flood depths; for the rest we ran cyclone and policy checks only.

The result is unremarkable. Every one of the eight largest emitting sites screens negligible for river flood, coastal flood and cyclone. The Singrauli belt (Vindhyachal, Rihand, Singrauli) is inland, hundreds of kilometres from the nearest coast, and the engine finds no meaningful flood depth at any of the three. Across all 46 assets, the highest modelled average annual direct damage is 0.49% of asset value, and for most it is close to zero.

This is direct physical damage only. It does not capture what actually threatens an Indian coal plant in a hot year: water and heat. At Vindhyachal, the WRI Aqueduct 4.0 layer in the engine puts baseline water stress at 35% of available flow withdrawn ("Medium-High") and drought risk at 0.67 on a 0–1 index. **[WRI Aqueduct 2023]** Those are warning lights for cooling-water availability, not loss estimates. We do not model business interruption, so we do not put a dollar figure on them.

![NTPC's eight largest emitting sites by annual CO2e, with flood and cyclone screen result.](/research/ntpc-climate-risk/top-sites.png)

## The policy picture: nothing priced yet

India has a Carbon Credit Trading Scheme. It is intensity-based, with baseline-and-credit allocation. Its notified targets cover aluminium, cement, chlor-alkali, pulp and paper, and, in later notifications, iron and steel, fertiliser, refineries, petrochemicals and textiles, with a FY2023-24 baseline and two compliance years, 2025-26 and 2026-27. **[ICAP 2026]** Power generation is not on that list.

The World Bank Carbon Pricing Dashboard agrees: no carbon price currently applies to electricity generation in India. **[World Bank 2026]** The ClimRisk policy check on Vindhyachal returns an effective carbon price of $0 per tonne.

That is the whole transition-risk story in one line. A plant emitting 36 million tonnes a year, our estimate for Vindhyachal from Climate TRACE, faces no explicit price on any of them today.

## One plant, one bill: Vindhyachal

Vindhyachal in Madhya Pradesh is the biggest single source in the register: 36.2 million tonnes of CO2e a year (Climate TRACE), valued by the engine at $8.4 billion on a benchmark basis. Run as a standalone asset with emissions unabated, the median annual carbon cost looks like this:

- **Current Policies:** about $10 million a year in 2030, still about $10 million in 2040, $20 million in 2050.
- **Delayed transition:** about $10 million in 2030, $410 million in 2035, $690 million in 2040, $1.46 billion in 2050.
- **Net Zero 2050:** about $800 million in 2030, $1.36 billion in 2035, $2.07 billion in 2040, $4.46 billion in 2050.

Those annual costs reflect the engine's own activity assumptions, which reduce output as prices rise, so they are lower than the plain arithmetic of emissions times price. The shape is what matters. In a Delayed transition world the bill is close to zero for the first five years and then climbs steeply, which is exactly the profile that ordinary credit reviews tend to miss. The standalone run and the company run use different settings (3,000 and 1,500 Monte Carlo draws respectively) and give different present values for the same plant, so we do not mix them; portfolio figures below come from the company run only.

## The scenario picture: a bill that depends on when policy arrives

The NGFS Phase 5 scenarios do not assume India stays at zero. They assume a shadow price that arrives at different times. Median India prices in our engine, in USD per tonne of CO2:

- **Current Policies:** $0.9 in 2026, $3 by 2035, $6.3 by 2050.
- **Delayed transition:** $2.2 in 2030, then $71.6 by 2035 and $383.6 by 2050.
- **Net Zero 2050:** $57.6 in 2026, $146 by 2030, $1,019 by 2050.

How much of that reaches a plant depends on policy design, and the engine samples that. **[NGFS 2024]**

![NGFS Phase 5 median carbon price paths for India, 2026–2050.](/research/ntpc-climate-risk/ngfs-carbon-price.png)

Here is the portfolio view. The asset register values NTPC's 46 assets at about $111 billion on a benchmark basis (not book value). Present value of carbon-related loss, 2026–2050, unabated, discounted at 7% real, median with 5th–95th range:

- **Current Policies:** $3.1 billion (2.5% of value); range $0.0–14.2 billion.
- **Delayed transition:** $32.0 billion (26%); range $27.1–41.4 billion.
- **Below 2°C:** $44.4 billion (36%); range $29.2–60.5 billion.
- **Net Zero 2050:** $58.2 billion (47%); range $50.2–97.5 billion.

The spread between Current Policies and Delayed transition is the thing to remember. The same fleet is worth a few percent less or more than a quarter less, depending on when a price shows up. For a lender, that is a duration question, not a probability of default.

![Modelled climate loss for NTPC's register assets by NGFS scenario, with 5th–95th percentile range.](/research/ntpc-climate-risk/scenario-loss.png)

## Where the numbers are soft

These results are the cost of inaction. The engine has no abatement library for coal power, so it applies no retirement, co-firing, carbon capture or efficiency response. NTPC is adding renewables fast, which would change the unabated emissions path. We also model no pass-through of carbon cost to buyers of power through tariffs; how much of any carbon price would fall on NTPC rather than its customers is a regulatory question the engine does not answer.

Asset values are benchmark estimates for every site, not book values. The register's emissions sum to about 380 million tonnes against 309 million tonnes in NTPC's own FY26 report. The gap is differing scope (the register includes joint ventures) and year, and we have not reconciled it plant by plant.

## What investors, lenders and operators should do

For investors, split the two stories. NTPC the renewable builder and NTPC the coal operator have different risk profiles, and a single group-level rating blurs them. Ask which scenario the equity story assumes.

For lenders, treat the carbon price as a date, not a number. In the Delayed transition scenario the median price is $2.2 in 2030 and $71.6 by 2035, so a loan that runs past 2035 meets the price in its second half. Ask for a dated retirement or conversion plan, and for contracted replacement capacity.

For operators, the near-term operational risk is water and heat, which the engine only flags. Cooling-water sourcing in the Singrauli belt deserves its own review.

For everyone, watch the Indian scheme's next notification. The day a power-sector intensity target appears is the day the table above stops being a scenario and becomes a schedule.

![Map of NTPC register assets, coloured by physical screening level.](/research/ntpc-climate-risk/assets-map.png)

## How ClimRisk measured this

ClimRisk ran each of NTPC's 46 register assets through its four-stage Risk Analyst: physical hazards with flood defences (FLOPROS), carbon-pricing policies in force (World Bank), NGFS Phase 5 transition scenarios (IIASA), and a Monte Carlo loss distribution for 2026–2050 (1,500 draws for the company run, discounted at 7% real). Emissions are from Climate TRACE v6, asset values from benchmark cost curves, and flood depths were fetched live for the top 20 emitters. Figures are screening-grade; validate asset values and emissions with the owner before decisions. ClimRisk is not investment advice.
