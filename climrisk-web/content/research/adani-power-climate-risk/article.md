On 22 July 2026, Adani Power reported a strong first quarter: plant load factor of 77.9%, up from 67.0% a year earlier, 28.8 billion units sold, and profit after tax of ₹4,866.60 crore, up 47.2%. **[Adani Power Q1 FY27 2026]**

The same release carried a sentence that matters more for a lender than any of those numbers. The company's target is 45 GW, against 18,330 MW installed today. **[Adani Power Q1 FY27 2026]**

That is a company aiming to more than double a mostly coal-fired fleet at a moment when India charges nothing for the carbon that fleet emits. We ran Adani Power through the ClimRisk engine. The weather is not the story. The date a carbon price arrives is.

![Sentinel-2 true-colour scene of the Mundra Thermal Power Project, Gujarat, 11 October 2026. Contains modified Copernicus Sentinel-2 data (2026), scene S2B_42QWL_20261011, via AWS Earth Search.](/research/adani-power-climate-risk/sat-mundra.png)

## A fleet that is running harder, and growing

Demand set the tone. India's peak demand hit a record 270.8 GW in May 2026, and Adani Power says it generated a record 31 billion units in the quarter. **[Adani Power Q1 FY27 2026]** Its average tariff under long-term power purchase agreements was ₹5.95 per kWh, and merchant sales fetched ₹7.04 per kWh. **[Adani Power Q1 FY27 2026]**

Growth is being financed with debt. Total debt stood at ₹58,381 crore on 30 June 2026, up from ₹53,556 crore at 31 March; net debt was ₹47,643 crore. **[Adani Power Q1 FY27 2026]** Fuel cost rose 30% year on year to ₹9,513 crore. **[Adani Power Q1 FY27 2026]**

The pipeline is concrete. Mahan Phase II (1,600 MW) is over 88% complete and due for commercial operation in the first quarter of FY28. Raipur Phase II (1,600 MW) is 62% complete, Raigarh Phase II (1,600 MW) 54%, Korba Phase II (1,320 MW) is expected this year, and a 1,600 MW greenfield unit at Mirzapur has started execution. The company says 87% of upcoming capacity has environmental clearance and 56% is tied up under long-term PPAs. **[Adani Power Q1 FY27 2026]**

![Adani Power in five numbers, each sourced beside the figure.](/research/adani-power-climate-risk/key-figures.png)

India's grid is not standing still either. In 2025, fossil fuels supplied 73% of its electricity, wind and solar 14%, and coal generation fell 2.9% as clean sources met all the extra demand. **[Ember 2026]** Coal is still the base of the system. But the direction of travel is not in doubt, and a plant commissioned in 2028 will be running in 2050.

## The physical picture: quiet, with one caveat

The ClimRisk register holds eight Adani Power assets, with total emissions of about 78.6 million tonnes of CO2e a year (Climate TRACE v6) and a benchmark value of $25.7 billion. The two biggest are Mundra in Gujarat (26.4 Mt) and Tiroda in Maharashtra (19.4 Mt).

Tiroda is inland and screens negligible for cyclone. Mundra sits on the Kutch coast, so it is the one site where weather deserves a look. Our cyclone history (IBTrACS, 46 years) finds 22 storms within 200 km, five reaching tropical-storm strength at the site and one Category 1: an unnamed 1998 cyclone with peak winds of 42.3 m/s passing 27 km away. Cyclone Biparjoy in 2023 came within 77 km at 23.7 m/s. The engine's 1-in-100-year wind at Mundra is 35.7 m/s, Category 1.

Modelled average annual direct damage at Mundra is 0.11% of asset value, about $9 million a year on an $8.1 billion plant. The 1-in-250-year event costs about $641 million, 7.9% of value. Coastal flood depths read as zero at every return period, and the site is assumed to be defended to roughly a 1-in-100-year standard (FLOPROS).

![Map of Adani Power register assets, coloured by physical screening level.](/research/adani-power-climate-risk/assets-map.png)

![Sentinel-2 true-colour scene of the Tiroda Thermal Power Project, Maharashtra, 9 October 2026. Contains modified Copernicus Sentinel-2 data (2026), scene S2B_44QLJ_20261009, via AWS Earth Search.](/research/adani-power-climate-risk/sat-tiroda.png)

The caveat is coverage. Of the eight assets, only one had a coastal flood map read and none had a river flood map read (the live read failed). The portfolio physical loss is therefore a lower bound. We also do not model business interruption. Water is the more realistic operating risk: the WRI Aqueduct 4.0 layer puts baseline water stress at Mundra in the "extremely high" class (withdrawals about 7.7 times available flow). **[WRI Aqueduct 2023]** We have not checked which cooling source the plant uses, so we flag this as context, not as a loss.

## The policy picture: a price that does not exist yet

India has a Carbon Credit Trading Scheme. It is intensity-based, with a FY2023-24 baseline and compliance years 2025-26 and 2026-27. Notified targets cover aluminium, cement, chlor-alkali, pulp and paper, refineries, petrochemicals and textiles, with iron and steel and fertiliser pending. **[ICAP 2026]** Power generation is not on the list.

Draft intensity rules issued on 26 June 2026 cover iron and steel, cement and aluminium, and a July 2026 report from the think tank Climate Risk Horizons notes that the power sector, which accounts for roughly 55% of India's greenhouse gas emissions, sits outside mandatory targets and in a voluntary mechanism. **[Down To Earth 2026]** The same report suggests an initial credit price of around $10 a tonne. **[Down To Earth 2026]**

The World Bank Carbon Pricing Dashboard agrees that no carbon price applies to electricity generation in India. **[World Bank 2026]** Our policy check on Mundra returns an effective price of $0 per tonne on 26.4 million tonnes a year.

> **SOURCE — Down To Earth, 29 Jul 2026 (summary, not a direct quote):** the Climate Risk Horizons report recommends bringing the power sector into later iterations of the Indian scheme.

## What the NGFS scenarios say

The NGFS Phase 5 scenarios do not assume India stays at zero. They assume a shadow price that arrives at different times. Median India prices in our engine, in USD per tonne of CO2:

- **Current Policies:** $2.2 in 2030, $6.3 by 2050.
- **Delayed transition:** $2.2 in 2030, then $71.6 by 2035 and $383.6 by 2050.
- **Below 2°C:** $73.2 in 2030, $197.2 by 2050.
- **Net Zero 2050:** $146 in 2030, $1,019 by 2050.

How much of that reaches a plant depends on policy design, and the engine samples it. **[NGFS 2024]**

![NGFS Phase 5 median carbon price paths for India, 2026–2050.](/research/adani-power-climate-risk/ngfs-carbon-price.png)

Here is the portfolio view for the eight register assets. Present value of climate-related loss, 2026–2050, emissions unabated, discounted at 7% real, median with 5th–95th range:

- **Current Policies:** $0.6 billion (2% of value); range $0.0–3.8 billion.
- **NDCs:** $4.0 billion (14%); range $1.5–11.4 billion.
- **Delayed transition:** $6.9 billion (25%); range $5.0–9.9 billion.
- **Below 2°C:** $9.4 billion (33%); range $6.0–14.2 billion.
- **Net Zero 2050:** $13.1 billion (46%); range $9.7–22.2 billion.

The same fleet is worth a rounding error less, or almost half less, depending on when a price shows up. For a lender with a 15-year loan, that is a duration question more than a probability-of-default question.

![Modelled climate loss for Adani Power's register assets by NGFS scenario, with 5th–95th percentile range.](/research/adani-power-climate-risk/scenario-loss.png)

## One plant, one bill: Mundra

Run on its own at the benchmark value of $8.1 billion, with emissions unabated, Mundra's median annual carbon cost looks like this:

- **Current Policies:** $7 million in 2030, $11 million in 2040, $16 million in 2050.
- **Delayed transition:** $7 million in 2030, $309 million in 2035, $518 million in 2040, $1.08 billion in 2050.
- **Net Zero 2050:** $589 million in 2030, $1.02 billion in 2035, $1.54 billion in 2040, $3.35 billion in 2050.

In a Delayed transition world the bill is close to zero until 2030 and then climbs steeply. That is exactly the profile that ordinary credit reviews tend to miss, and it lands in the second half of the life of a loan signed today. The standalone run (3,000 draws) gives a Delayed-transition mean loss of $3.9 billion, 48% of value, with the 95th percentile capped at the full $8.1 billion. The company run (1,500 draws) gives a lower $2.4 billion mean for the same plant. We do not mix the two; portfolio figures come from the company run only.

![Mundra: median annual carbon cost by NGFS scenario, 2026–2050.](/research/adani-power-climate-risk/mundra-annual-cost.png)

## Where the numbers are soft

These results are the cost of inaction. The engine has no abatement library for coal power, so it applies no retirement, co-firing, carbon capture or efficiency response. Adani Power's own plans, including its 40 MW solar plant, are not modelled. **[Adani Power Q1 FY27 2026]**

The register covers eight assets and does not include the 45 GW pipeline, the plants acquired through insolvency, or any unit not yet built. Emissions of new units would add to the exposure. Asset values are benchmark estimates, not book values, and the engine includes no EBITDA, leverage or covenant effects, so we cannot say how much of a carbon cost would be recovered through tariffs. Where PPAs allow pass-through, part of the bill falls on buyers. Where they do not, it falls on the equity. That is a contract question the engine cannot answer from outside.

Finally, physical coverage is partial, as above, and the source figures come from the company's own results release, which we have not audited.

## What investors, lenders and operators should do

For investors, ask which scenario the 45 GW story assumes. A plan that is fully contracted in rupees but unhedged against a carbon price is a bet on the timing of Indian policy.

For lenders, treat the carbon price as a date, not a number. In the Delayed transition scenario the median price is $2.2 in 2030 and $71.6 by 2035, so a loan that runs beyond 2035 meets the price in its second half. Ask for tariff pass-through terms in each PPA and a dated plan for conversion or retirement.

For operators, the near-term operational risk is water and heat, which the engine flags only. A cooling-water review of the largest sites would be cheap compared with any carbon scenario.

For everyone, watch the Indian scheme's next notification. The day a power-sector intensity target appears is the day the table above stops being a scenario and becomes a schedule.

## How ClimRisk measured this

ClimRisk ran each of Adani Power's eight register assets through its four-stage Risk Analyst: physical hazards with flood defences (FLOPROS), carbon-pricing policies in force (World Bank), NGFS Phase 5 transition scenarios (IIASA), and a Monte Carlo loss distribution for 2026–2050 (1,500 draws for the company run, 3,000 for single-plant runs, discounted at 7% real). Emissions are from Climate TRACE v6, asset values from benchmark cost curves, and flood depths were attempted live for the top 20 emitters. Figures are screening-grade; validate asset values and emissions with the owner before decisions. ClimRisk is not investment advice.
