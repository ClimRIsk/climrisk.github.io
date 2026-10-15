In the first days of September 2026, China's Ministry of Ecology and Environment (MEE) issued the 2026 allowance plan for the national carbon market. It covers power generators for 2025 and 2026, and, for 2026, steel, cement and aluminium smelting. Allowances stay free, allocated on emissions intensity, "unchanged from 2025" for the three new sectors **[Xinhua 2026; Mysteel 2026]**.

That is a quiet sentence. Behind it sits the largest industrial carbon market on earth: roughly 1,500 newly covered enterprises and about 3 billion tonnes of CO₂ a year, more than 20% of China's emissions **[Carbon Herald 2025]**. The first compliance deadline for those three sectors is 31 December 2026 **[MEE 2026]**.

For lenders and investors the question is not whether China prices carbon. It does. The question is how much of that price reaches a plant's cash flow, and what happens to it when the price stops being polite.

![Key figures: China's carbon market, October 2026, each with its source](/research/china-ets-steel-cement-aluminium/key-figures.png)

## What actually changed

The architecture is now clear from official documents. A January 2026 MEE notice sets the inclusion threshold for steel, cement and aluminium smelting at 26,000 tonnes of direct CO₂e a year, and gives provinces until 31 October 2026 to publish the 2027 list of covered emitters **[MEE 2026]**. Reporting for 2025 emissions was due by 31 March; verification for these sectors by 31 July; allocation of 2025 allowances by 30 September; and surrender of allowances by 31 December **[MEE 2026]**.

> **SOURCE — MEE, September 2026 (as reported by Xinhua):** allowances are allocated free of charge on the basis of carbon-intensity control; the long-term aim is to phase in a mix of free and paid allocation.

Two details matter for financial modelling. First, the system is a benchmark system: a plant that is cleaner than its sector benchmark holds surplus allowances, and a plant that is dirtier must buy the shortfall. Second, the MEE says allocation will "reward the efficient and penalise the laggards" and will gradually align with capacity-replacement and output-control policy, with tighter treatment of obsolete capacity and captive power plants **[Sxcoal 2026]**. Direct emissions are covered; indirect emissions from purchased electricity are not **[Mysteel 2026]**.

## The price is low, and that is the point

The ETS price the ClimRisk engine uses for China in 2026 is US$11.6 a tonne, from the World Bank's carbon pricing data, up from US$8.2 in 2023 **[World Bank]**. In yuan, a January–August 2026 average of about ¥83.9 a tonne has been reported, against ¥73.3 in 2025 **[Discovery Alert 2026, citing MEE Environmental Planning Institute]**. A year earlier, in October 2025, allowances touched ¥58.8, a two-year low, on oversupply **[Carbon Herald 2025]**.

Compare that with the EU. The EU's CBAM certificate price for the third quarter of 2026 is €82.32 a tonne **[SteelOrbis 2026]**. A steel producer in Hubei faces a domestic carbon price that is a small fraction of the one its European customers now pay at the border.

Free allocation makes the gap wider in practice. The engine's treatment of the China ETS samples the share of emissions actually charged between 5% and 25%, because a benchmark system charges only above the intensity benchmark. At today's price that means a very small bill.

## What it costs a plant: three register assets

We ran three plants from the ClimRisk asset register through the four-stage Risk Analyst. All three sit inside the newly covered sectors. Emissions are held at today's level with no abatement unless stated, and asset values are register benchmarks, so treat the results as screening-grade.

| Plant | Sector | Direct CO₂ (Mt/yr) | Asset value (USD) |
|---|---|---|---|
| Baowu Echeng Iron & Steel, Ezhou, Hubei | Steel | 8.7 | 2.24bn |
| Conch Tongling cement plant, Anhui | Cement | 3.9 | 0.72bn |
| Chiping Xinfa aluminium smelter, Shandong | Aluminium | 1.9 | 2.73bn |

![Baowu Echeng Iron & Steel, Ezhou, Hubei, Sentinel-2 true colour, 7 October 2026. Contains modified Copernicus Sentinel-2 data (2026), via AWS Earth Search](/research/china-ets-steel-cement-aluminium/echeng-steel-sentinel2.png)

At 2026 prices, the engine's median annual carbon cost is about US$5.6 million for the Echeng steelworks, US$2.4 million for the Tongling cement plant and US$1.3 million for the Chiping smelter **[ClimRisk engine]**. Against asset values in the hundreds of millions to billions of dollars, that is noise. Under the Current Policies scenario, the present value of carbon cost from 2026 to 2050 is about US$0.06 billion for the steelworks (95th percentile US$0.15 billion) **[ClimRisk engine]**.

This is what a low carbon price does to risk assessment: it produces a comfortable number. The number is accurate for the policy in force. It is not a forecast of the policy.

## What the scenarios say happens next

The NGFS Phase 5 scenarios do not assume China holds the price near US$12. In the engine's China price paths, the Delayed transition scenario keeps the price at US$11.6 until 2030, then lifts it to about US$138 by 2040 and US$401 by 2050 (median). Net Zero 2050 starts at about US$68 in 2026 and reaches US$219 by 2030 and US$457 by 2040. Nationally Determined Contributions (NDCs) reaches only US$22 by 2040 **[ClimRisk engine, NGFS Phase 5]**.

![China ETS observed price versus NGFS Phase 5 median carbon prices for China, 2022 to 2050. Source: World Bank; NGFS via ClimRisk engine](/research/china-ets-steel-cement-aluminium/china-price-paths.png)

The financial consequence is a cliff rather than a slope. For the Echeng steelworks, the engine's median annual carbon cost goes from US$5.6 million today to US$163 million in 2035 and US$249 million in 2040 under a Delayed transition. For Tongling cement it reaches US$85 million by 2040, and for the Chiping smelter US$85 million by 2040 **[ClimRisk engine]**.

![Median annual carbon cost per plant under NGFS NDCs, Delayed transition and Net Zero 2050. Source: ClimRisk engine](/research/china-ets-steel-cement-aluminium/plant-annual-cost.png)

Present values from 2026 to 2050, discounted at 7%, unabated, in US dollars:

| Scenario | Echeng steel (median, 95th pct) | Tongling cement | Chiping aluminium |
|---|---|---|---|
| NDCs | 0.17bn, 0.34bn | 0.07bn, 0.14bn | 0.05bn, 0.09bn |
| Delayed transition | 1.85bn, 3.40bn | 0.63bn, 1.10bn | 0.58bn, 1.04bn |
| Net Zero 2050 | 8.95bn, 15.48bn | 2.94bn, 5.69bn | 2.73bn, 4.38bn |

Read these as the cost of inaction, not as expected losses. Under Net Zero 2050 the unabated carbon bill for Echeng is four times the plant's benchmark value, and the engine's operator closes the plant in 99.7% of runs. That is the scenario telling you that unabated blast-furnace steel does not survive a US$200-plus carbon price, not that the owner will lose four times its asset. Under the Delayed transition, where the price jumps after 2030, the engine has the steelworks start abating around 2036, which trims the present value of its carbon cost from US$1.96 billion to US$1.72 billion (mean) **[ClimRisk engine]**.

The aluminium result carries a caveat. The engine has no abatement library for smelting, so it reports the cost of inaction only.

## The transmission pathways

How does a free-allocation market turn into a balance-sheet problem? There are four routes.

**Allocation tightening.** The MEE has said the long-term plan moves toward a mix of free and paid allocation **[Xinhua 2026]**. Each step down in free share converts a benchmark into a bill.

**The surplus ends.** Mysteel reported that allowance supply was ample enough to last until 2027, giving companies a buffer **[Mysteel 2025]**. Once the buffer is gone, plants that are dirtier than benchmark become net buyers.

**Capacity policy.** Allocation is being aligned with capacity replacement and output control **[Sxcoal 2026]**. For an older blast furnace, the carbon market and the capacity quota become the same constraint.

**The border.** Chinese steel, aluminium and cement exported to the EU meet CBAM. Under the EU rules, a carbon price effectively paid in the country of origin can be deducted from the CBAM obligation, so a higher Chinese price shifts revenue from the EU treasury to China's. In 2026 the CBAM payable share is only 2.5% of the obligation, rising to 100% by 2034 **[Reed Smith]**. The first declaration and certificate surrender is due by 30 September 2027 **[Climease]**.

## What lenders, investors and operators should do

Lenders to Chinese steel, cement and aluminium should stop reading the current allowance price as the risk. It is the lowest-information number in the file. A better test is a stress at the Delayed transition price path, with the plant's allocation benchmark position (above or below), its age and its fuel route.

Equity investors in listed producers should ask three questions on the next results call: how many tonnes of 2025 allowances were allocated against verified emissions; what the company expects to buy or sell by the 31 December surrender; and what share of output goes to EU buyers.

Operators should measure rather than wait. The plants that hold surplus today are the ones that can sell it, and those that carry a shortfall into 2027 will do so at a price that is already rising. Abatement that starts in 2030 is cheaper than abatement forced in 2036.

## Method and limitations

Prices are from the World Bank Carbon Pricing Dashboard and the NGFS Phase 5 scenarios; the October 2026 policy facts are from the MEE and Xinhua. The ¥83.9 average is a secondary report and should be treated as indicative. The 3 billion tonne coverage figure comes from MEE statements as reported in 2025 and the coverage and entity counts vary between sources.

## How ClimRisk measured this

Each plant was run through the ClimRisk four-stage Risk Analyst: physical hazards with flood defences, carbon-pricing policies in force, NGFS Phase 5 transition scenarios for China, and a 3,000-draw Monte Carlo loss distribution for 2026–2050, discounted at 7%. Emissions are the register's direct estimates and are held unabated. Asset values are register benchmarks. EU export share is not modelled, and no financials (EBITDA, leverage, covenants) are computed. Physical flood and cyclone risk is negligible at all three sites, so the result is a carbon result. The satellite image is Copernicus Sentinel-2 scene S2A_50RKU_20261007_0_L2A.
