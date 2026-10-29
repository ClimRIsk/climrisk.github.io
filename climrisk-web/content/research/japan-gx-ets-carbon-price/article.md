On 1 April 2026, Japan's emissions trading system stopped being a club and became a law. Companies that emit more than 100,000 tonnes of CO₂ a year, an estimated 300 to 400 of them and about 60% of the country's emissions, must now hold allowances for what they burn **[Eco-Business 2026; GlobalDeal 2026]**. Under the system's annual calendar, those companies file baseline emissions, targets and transition plans with the Ministry of Economy, Trade and Industry (METI) by 30 September, and METI makes free allocations by 30 November **[KELP 2026]**. So the first allocation of the mandatory era is about a month away.

What it will be worth is a different matter. No allowance has yet traded. The market opens in autumn 2027 **[GlobalDeal 2026]**. What exists today is a corridor: a government-set floor of ¥1,700 and a ceiling of ¥4,300 per tonne of CO₂, or roughly US$11 and US$29 **[ICAP 2026]**.

That corridor is the whole story for lenders. It says that Japan has decided how much its largest emitters will pay for carbon, within a band, for years. The ClimRisk engine lets us ask the follow-up question: how does that band compare with what the NGFS climate scenarios say these plants will eventually face?

![Key figures: Japan's GX-ETS, October 2026, each number with its source](/research/japan-gx-ets-carbon-price/key-figures.png)

## What actually changed

Japan has had a carbon tax since 2012. It is very small: the World Bank's dashboard puts it at US$1.8 a tonne in 2026, down from US$2.4 in 2021 **[World Bank 2026]**. The GX-ETS is the first instrument that can charge Japanese heavy industry a meaningful price.

The design is a compromise, and its details matter for anyone modelling cash flows.

**It has no cap.** The system sets no economy-wide limit on covered emissions. A Kyoto University analysis puts it plainly: it "is not designed as a mechanism that sets an economy-wide cap" **[KELP 2026]**. Allowances are allocated free, mostly against sector benchmarks that cover about 90% of regulated emissions, with grandfathering for the rest. The benchmark tightens from the intensity of the top 50% of firms towards the top 32.5% by FY2030 **[RIETI 2026]**.

**The price is boxed in.** The ceiling is set at the cost of switching a power plant from coal to LNG: a ten-year median of about ¥4,370 per tonne, for a 40%-efficient coal unit against a 54.9%-efficient gas unit. The floor rests on the pre-surge average price of J-Credits, about ¥1,620 **[Shulman Advisory 2025]**. From FY2027, both limits rise each year by inflation plus 3 percentage points, which METI has said is "a level … intended to exceed typical corporate investment discount rates" **[Eco-Business 2026]**. METI's own projection for FY2030 is a ¥4,840 ceiling and ¥1,913 floor **[Shulman Advisory 2025]**.

**The ceiling doubles as the penalty.** A company short of allowances pays METI 1.1 times the ceiling price per missing tonne.

> **SOURCE — KELP (Kyoto University), June 2026:** the shortfall payment is "a charge equal to 1.1 times the ceiling carbon price set by METI", and "does not function as an administrative penalty".

Because the charge is a price rather than a sanction, the effective ceiling for a covered plant is about ¥4,730 (¥4,300 × 1.1), not ¥4,300. We use the plain ceiling below and flag that this slightly understates the worst case.

**Power is treated differently.** Fuel-specific benchmarks give coal plants more free allowances than gas plants, a concession requested by the electricity utilities' federation **[Argus 2025]**. Paid auctions for the power sector begin only in FY2033, and gradually **[Renewable Energy Institute 2026]**. A fossil-fuel levy on importers and extractors starts in FY2028 **[GlobalDeal 2026]**.

Offsets are allowed, but capped at 10% of a firm's obligation **[ICAP 2026]**. The Renewable Energy Institute notes that annual J-Credit issuance of around 1–1.5 million tonnes is far below the roughly 60 million tonnes that cap could absorb **[Renewable Energy Institute 2026]**. Scarcity of credits, in other words, should tend to push firms towards the ceiling, not away from it.

## The price is low, and the band is narrow

The ceiling is the interesting number, because it is the maximum a Japanese emitter can be asked to pay per tonne under the ETS. Extending METI's +3% a year rule beyond FY2030, in constant yen, ClimRisk arithmetic puts the ceiling at about US$32 a tonne in 2030, US$43 in 2040 and US$58 in 2050.

Compare that with the NGFS Phase 5 scenarios as run in the ClimRisk engine for Japan. The median carbon price in the Below 2°C scenario is about US$132 a tonne in 2040. In the NDCs scenario it is about US$160. In Delayed transition it is about US$296, and in Net Zero 2050 about US$528 **[ClimRisk engine, NGFS Phase 5]**. In 2040, only the Current Policies scenario, at about US$2 a tonne, sits below the corridor.

![Japan's GX-ETS price corridor (floor to ceiling) against NGFS Phase 5 median carbon prices for Japan, 2026–2050](/research/japan-gx-ets-carbon-price/price-corridor.png)

The Renewable Energy Institute argues the ceiling is too low to do its job. Using forward fuel-cost projections from BloombergNEF, it estimates that coal-to-gas switching would need at least ¥8,400 a tonne in 2026 and about ¥16,000 by 2030, and notes that the FY2030 ceiling is far below the IEA Net Zero scenario's US$130 for advanced economies in 2030 **[Renewable Energy Institute 2026]**. That is an advocacy organisation's estimate and should be read as such. But the direction matches what our scenario overlay shows.

The system is also not tied to Japan's climate pledge. METI declined public comments asking it to align the ETS with the national target and the 1.5°C goal **[AMT Law 2026]**.

## What it costs a plant: three register assets

We ran three plants from the ClimRisk asset register through the four-stage Risk Analyst. Emissions are the register's direct estimates, held at today's level. Asset values are register benchmarks, so treat all results as screening-grade.

| Plant | Sector | Direct CO₂ (Mt/yr) | Asset value (USD) |
|---|---|---|---|
| JFE West Japan Works, Fukuyama | Steel | 15.7 | 13.0bn |
| Nippon Steel East Japan Works, Kimitsu | Steel | 12.5 | 10.0bn |
| JERA Hekinan power station | Coal-fired power | 19.6 | 13.1bn |

![JFE West Japan Works, Fukuyama, Sentinel-2 true colour, 9 October 2026. Contains modified Copernicus Sentinel-2 data (2026), via AWS Earth Search](/research/japan-gx-ets-carbon-price/sat-fukuyama.png)

First, physical risk is not the issue. Cyclone severity is rated low at all three sites, with a 1-in-100-year wind of 50 m/s at Fukuyama, 61 m/s at Kimitsu and 55 m/s at Hekinan. Modelled average annual damage is 0.03%, 0.09% and 0.05% of asset value, and coastal flood depths are negligible behind roughly 1-in-200-year defences **[ClimRisk engine; FLOPROS; Deltares]**. River-flood depths could not be read at Fukuyama, so the physical figure there is a lower bound.

Second, the engine does not yet have an ETS price to apply, because none exists. Today it sees only the US$1.8 carbon tax. Under Current Policies the present value of carbon cost from 2026 to 2050, unabated, is about US$0.63 billion for Fukuyama, US$0.50 billion for Kimitsu and US$0.36 billion for Hekinan **[ClimRisk engine]**.

Under Delayed transition, the same plants' unabated carbon cost rises to about US$9.0 billion, US$7.2 billion and US$6.6 billion. Under Net Zero 2050 it reaches US$22.7 billion, US$18.1 billion and US$15.0 billion. Those are present values at a 7% real discount rate, with a wide spread: the 95th percentile for Fukuyama under Net Zero 2050 is US$39 billion **[ClimRisk engine, 3,000 draws]**.

Now add the corridor. At the ceiling in FY2033, the year power auctions begin, the carbon price is about US$35 a tonne. If only 10% of emissions are effectively charged, which is the engine's central assumption for a benchmark system (range 5–25%), the annual bill is about US$55 million for Fukuyama, US$44 million for Kimitsu and US$69 million for Hekinan. If every tonne is paid for, as in a full auction, it is about US$555 million, US$441 million and US$692 million **[ClimRisk arithmetic; ICAP]**.

![Annual carbon bill in FY2033 at three register plants: GX-ETS ceiling versus NGFS Below 2°C and Delayed transition medians](/research/japan-gx-ets-carbon-price/plant-bills-2033.png)

Set against the scenarios, the picture is uneven. For the steel plants, a fully paid ceiling bill would exceed the engine's median 2033 cost under Below 2°C (US$432 million and US$346 million) and Delayed transition (US$374 million and US$302 million). Those scenario figures include the engine's abatement response, and the engine's steel abatement library is a screening-grade electric-arc-furnace set, so it flatters blast-furnace plants. For Hekinan, which is unabated in the engine, the full-auction ceiling bill (US$692 million) is about 2.5 times the Below 2°C median (US$277 million). The reason is the model's own: it assumes only part of a scenario's price reaches a plant and part is passed on to customers, while an auction charges the plant directly.

![JERA Hekinan power station, Aichi, Sentinel-2 true colour, 1 October 2026. Contains modified Copernicus Sentinel-2 data (2026), via AWS Earth Search](/research/japan-gx-ets-carbon-price/sat-hekinan.png)

The honest summary is that the corridor is cheap while allocation is free and expensive for power if auctions are full. The first is where most Japanese industry sits until the early 2030s. The second is where the policy risk is concentrated.

## The financial transmission

Three channels matter, in rising order of consequence.

The first is cost and margin. A 10% charged share at US$30 a tonne is a rounding error for a US$13 billion steelworks. But the share is a policy choice, and the benchmark is set to tighten towards the top 32.5% of performers by FY2030.

The second is export competitiveness. The engine flags that the Fukuyama and Kimitsu products fall in scope of the EU's Carbon Border Adjustment Mechanism, where the EU's CBAM certificate price was €82.32 a tonne for the third quarter of 2026 **[SteelOrbis 2026]**. A domestic carbon price paid is deductible, so a Japanese exporter paying ¥4,300 at home still owes the EU the difference. A higher domestic price is, for exporters, partly a transfer from Brussels to Tokyo. We did not model the EU export share, which is not in the register.

The third is power. Power has the longest runway, since auctions start only in FY2033. A coal-fired plant that runs on free coal-weighted allocation until then and meets a paid price afterwards has a step in its cost curve that is easy to miss in a model that smooths prices.

## What lenders, investors and operators should do

Lenders should stop treating "Japan has an ETS" as the same statement as "Japan prices carbon". For the next several years, the effective price at most plants is set by the allocation formula, not the allowance price. Ask borrowers what share of their tonnes they expect to buy, and at what price in the FY2027 and FY2028 band.

Investors in utilities should model FY2033 as a discrete event. The question is not the ceiling in isolation, but how many tonnes are auctioned, whether the fuel-based benchmark has been phased down by then (the METI proposal does so from FY2029–30 **[Argus 2025]**), and whether co-firing with ammonia or hydrogen counts. Those rules are still open.

Operators should build the plant-level emissions record now. Allocation is calculated on historical output, verification is annual, and the transition plan that firms must file by 30 September also sets the baseline against which later tightening is measured.

Everyone should stress the ceiling. Our extension of the +3% rule is arithmetic, not a forecast. Annual limits are set from FY2027, and a government that has made the ceiling a price rather than a penalty can also move it.

## Method and limitations

Policy facts are from ICAP, METI-derived reports (Eco-Business, Shulman Advisory, GlobalDeal, Argus), law-firm and university analyses (AMT Law, KELP) and RIETI. Some are secondary summaries of METI documents, and the fuller allocation guidelines should be checked against METI's own publications before any transaction. The US dollar values use the conversion given by ICAP (¥4,300 = US$28.73). The 2030–2050 corridor is ClimRisk arithmetic extending METI's stated real +3% a year. The 10% charged share is the engine's default for benchmark systems, not an observed figure. Physical results exclude business interruption and river flood for these sites.

## How ClimRisk measured this

Each plant was run through the ClimRisk four-stage Risk Analyst: physical hazards with flood defences, carbon-pricing policies in force from the World Bank dashboard, NGFS Phase 5 transition scenarios for Japan, and a 3,000-draw Monte Carlo loss distribution for 2026–2050 discounted at 7%. Emissions are the register's estimates, with no abatement for Hekinan and the engine's screening-grade abatement library for steel; asset values are register benchmarks; EU export share is not modelled. The satellite image is Copernicus Sentinel-2 scene S2B_53SLU_20261009_0_L2A.
