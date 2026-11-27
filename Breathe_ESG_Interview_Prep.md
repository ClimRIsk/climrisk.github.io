# Breathe ESG — Interview Prep
**Interviewer:** Vanshika Sharma, People Coordinator (HR)
**Company:** Breathe ESG, Bengaluru
**Type:** HR screening call (round 1)

---

## PART 1 — What Breathe ESG is (know this cold)

Breathe ESG is **not a consulting firm**. They are a **B2B SaaS platform** that sells sustainability management software to enterprises.

Their tagline: "AI-powered ESG platform for carbon accounting, compliance reporting and data management."

**The problem they solve:** Most Indian corporations — especially the 1000+ companies now under SEBI's mandatory BRSR reporting — still run their ESG data collection on spreadsheets and email chains. Data comes from different plants, different teams, different formats. The result: missed deadlines, inconsistent numbers, and no real-time visibility into where emissions are coming from.

**What the platform does (seven modules):**
1. **ESG Data Management** — centralise all sustainability metrics, standardise them
2. **Carbon Accounting** — Scope 1 and 2 emissions; ingests site-level activity data, applies emission factors, produces auditable calculations
3. **Scope 3 Emissions** — supply chain and value chain emissions (15 GHG Protocol categories)
4. **ESG Reporting** — exports disclosures for BRSR, GRI, CDP, CSRD, TCFD, EcoVadis
5. **Product Carbon Footprint (PCF)** — calculates product-level lifecycle emissions
6. **Value Chain / Suppliers** — sends data requests to suppliers, tracks responses
7. **Decarbonisation** — scenario planning for reduction pathways

**Their AI engine** is called **INARA** — it reasons across the connected sustainability data to surface hotspots, check data quality, and answer questions like "which facility is our biggest emission source?" It's not a chatbot; it is the intelligence layer over their entire data infrastructure.

**Client base (confirmed on website):** Ambuja Cement, CEAT, Swiggy, Embassy Group, Paytm, Dhanuka, Rubrik, Star Cement, Navneet, Solmax — 40+ enterprises. Heavy industries dominate (cement, tyres, agrochem, real estate) because they have high emission footprints and are under SEBI scrutiny.

**Why ESG consultants inside a SaaS company?** Breathe ESG's ESG team doesn't just do reporting — they build the GHG calculation methodologies baked into the platform, onboard clients onto the product, validate client emission inventories, and advise on decarbonisation strategy. It's a consulting role that also feeds product development.

**Current open ESG roles on their site:**
ESG Analyst, ESG Associate, Senior ESG Associate, ESG Consultant, Assistant Manager ESG — all full-time, Bengaluru.

---

## PART 2 — The HR screening round with Vanshika

Vanshika is People Coordinator. She is **not** an ESG expert. Her job in this call is to:
- Verify the basic profile matches what the ESG team needs
- Check motivation (why ESG, why Breathe ESG)
- Understand your current situation (notice period, location, salary)
- Screen for communication ability and culture fit
- Decide whether to pass you to the ESG team lead

She will not ask you to calculate a Scope 3 Category 11 emission factor. That is round two. This call is about whether you understand what Breathe ESG does and whether you're serious about joining.

**Expect this call to be 20-30 minutes.**

---

## THE CORE ANGLE — Read this before everything else

**Do not lead with framework knowledge. Everyone applying for an ESG role knows GHG Protocol and BRSR. That is table stakes, not a differentiator.**

Your actual differentiator is this: **you built what Breathe ESG built, in a different domain.**

Breathe ESG built INARA — a system that takes messy, inconsistent activity data from multiple sources, standardises it, applies calculation methodology (emission factors), and produces trusted, traceable numbers. That is exactly what ClimRisk does, except the inputs are climate hazard projections instead of energy bills, and the calculation methodology is climate scenario parameters instead of GHG emission factors.

The architecture is identical:
- **Multiple messy data sources** → standardise → apply the right calculation logic → produce traceable output
- ClimRisk: climate model outputs (MRI-AGCM3.2-S, Open-Meteo) → downscaling/interpolation → hazard intensity factors → asset-level financial risk
- INARA: plant activity data → unit standardisation → emission factors → GHG inventory by scope

The problems you both had to solve:
- How do you handle missing values in the input data?
- How do you version and govern the "lookup table" (emission factors / climate parameters) so calculated outputs don't silently change when inputs update?
- How do you make every output figure traceable back to its source record and the specific methodology applied?
- How do you scale this across dozens of different data sources without breaking the calculation logic?

**This is the conversation you want to have — not "I know BRSR" but "I built the same system you built, and I want to work on the methodology layer."**

---

## PART 3 — Every question she will ask, with what to say

### Q1: "Tell me about yourself."

Do not recite your CV. Give her a 90-second narrative that lands on the builder angle, not the framework-knowledge angle.

**What to say:**

> "My work sits at the intersection of climate data and quantitative analysis. My MSc at Manipal was in Geology — that's where I built the technical foundation in earth systems and data modelling. I followed that with a second MSc at Erasmus Rotterdam in Urban Environment, Sustainability and Climate Change, which shifted my focus to applied climate risk. During that time I built ClimRisk — a computational engine in Python that processes physical climate hazard projections and translates them into asset-level financial risk metrics. The core technical problem in that work is the same problem Breathe ESG is solving with INARA: you have messy, multi-source data, and downstream stakeholders need to trust the number that comes out. My work was making climate risk numbers auditable. Breathe ESG's work is making GHG numbers auditable. When I saw that INARA was doing exactly this — indexing multiple data sources, cleaning inconsistencies, applying verified calculation logic, keeping every figure traceable to its source — I knew this was the team I wanted to build with."

**What this does differently from the old version:**
- Opens on a system-building problem, not a framework list
- Makes the ClimRisk-INARA parallel explicit — Vanshika will remember this
- Ends on "build with" not "work at" — signals you think like a builder, not a report-filler

---

### Q2: "Why Breathe ESG specifically?"

**What to say:**

> "Because you're building data infrastructure, not a reporting wrapper. Most ESG tools are glorified template-fillers. INARA is different — it's a reasoning layer that sits over live sustainability data, checks consistency, infers missing values, applies calculation methodology. I built something with the same architecture for climate risk. When I look at problems like emission factor versioning, boundary definition across multi-site organisations, or Scope 3 data gaps from suppliers — those are the same class of data quality and methodology problems I had to solve in ClimRisk. I want to work at that layer. I don't want to be the person who reads a client's BRSR disclosure and ticks a checklist. I want to be part of building the methodology that makes the platform's GHG calculations trustworthy at scale — which is what your ESG team actually does, based on the job description."

---

### Q3: "What is your background in sustainability / what have you worked on?"

She may phrase this as "tell me about your ESG experience" or "what frameworks are you familiar with?"

**Do not list frameworks like a menu.** That's the trap. Instead lead with what you built, then let the framework knowledge come out as evidence of depth.

**What to say:**

> "My primary work has been on building the quantitative side — specifically how you get from raw physical data to a calculation output you can defend in front of an auditor. In ClimRisk, that meant defining the right climate scenario parameters, selecting the appropriate hazard model outputs, and writing the calculation pipeline so every result was traceable. Applied to GHG: that maps directly to emission factor selection, activity data boundary-setting, and ensuring the Scope 1 and Scope 2 calculations are auditable. I understand GHG Protocol at that level — not just the framework as a document, but how the boundary decisions actually change your numbers, why location-based vs. market-based Scope 2 matters for a client with renewable energy contracts, what breaks when supplier data for Scope 3 is missing. That understanding came from building the kind of system that has to handle these edge cases programmatically, not from filling in reporting templates."

**What you're showing:** You understand GHG at a methodology level, not a framework-recitation level. That's what the ESG team lead will probe in round 2.

---

### Q4: "What are you currently doing / what's your current role?"

Fill in with your actual situation. The key is to frame it as forward momentum, not a gap or escape.

**If you are between roles:**
> "I completed my MSc at Erasmus last year and have been working on [ClimRisk / specific project / freelance work] while targeting roles in India's ESG space. I deliberately wanted to come back to India because the BRSR mandate and the pace of climate regulation here makes this one of the most interesting ESG markets in the world right now."

**If you have a current role:**
> State it clearly. Then: "I'm looking for a role where I can go deeper on GHG methodology and work with corporates at scale, which is what drew me to Breathe ESG."

---

### Q5: "What is your notice period?"

Answer honestly. If you are immediately available, say so without over-explaining it.

> "I can join immediately." (or state actual notice period)

If you have a 1-month notice: "One month. If the timeline works for the team, I can also discuss a transition arrangement."

---

### Q6: "Are you comfortable with Bengaluru / on-site?"

Straightforward. All Breathe ESG roles are Bengaluru, on-site.

> "Yes, Bengaluru works. I'm targeting Bengaluru roles specifically."

---

### Q7: "What are your salary expectations?"

This always comes up in Indian HR screens. Do not throw out a random number.

**Strategy:**
1. If she asks first, turn it gently: "I want to understand the role fully first — can you give me a sense of the band Breathe ESG has in mind for this position?"
2. If she insists on a number first: anchor to market rate for the role level, factoring in your dual MSc and specialisation.

**Market benchmarks for ESG roles in Bengaluru (2026):**
- ESG Analyst: 5–8 LPA
- ESG Associate: 7–12 LPA
- ESG Consultant: 10–18 LPA
- Senior ESG Associate / AM: 14–22 LPA

Breathe ESG is a funded SaaS startup — they pay competitively but equity/ESOPs may be part of the package.

**What to say if pushed:**
> "Based on my profile — dual postgraduate in geology and sustainability, with hands-on climate risk and GHG modelling experience — I'm looking at the [X to Y LPA] range, but I'm more interested in the role scope and growth path than in anchoring to a fixed number at this stage."

**Fill in X to Y based on which role they are considering you for.** Ask Vanshika which role they have in mind (see Part 5 — Questions to ask).

---

### Q8: "Why should we hire you over someone with more years of consulting experience?"

This may come indirectly as "do you have direct ESG consulting experience?" Her concern is real: someone with 3 years at an ESG consulting firm has client delivery experience you may not.

**What to say:**

> "A candidate with three years of ESG consulting experience has delivered a lot of BRSR disclosures and GHG inventories using the frameworks as given. What they typically haven't done is built the system that runs underneath. The ESG team at Breathe ESG doesn't just deliver frameworks to clients — it builds the GHG calculation methodology that INARA runs. That's a different skill. I built ClimRisk from scratch: I had to define the boundary logic, choose and version the calculation parameters, build the pipeline to handle missing and inconsistent input data, and make every output figure traceable. That is what your platform's calculation engine does for GHG. Someone who has spent three years filling in emission inventory templates for clients understands the output. I understand how to build what produces it."

---

### Q9: "Tell me about a specific project."

ClimRisk is the answer. Be specific, not abstract.

> "ClimRisk takes physical climate hazard projections — I worked with outputs from MRI-AGCM3.2-S and Open-Meteo — and translates them into asset-level financial risk metrics. The technical problem was not the analysis; it was the data pipeline. Climate model outputs come at coarse spatial resolution; financial assets sit at specific coordinates. I had to build the downscaling and interpolation logic, then apply hazard intensity parameters for the right climate scenario (RCP/SSP), then produce a risk metric per asset that you could trace back through every calculation step to the original model output. The logic is structurally identical to a GHG inventory: you have activity data at specific sites, you apply emission factors for the right fuel type and grid region, and the output has to be auditable back to source. INARA solves the same problem. I'd been solving it for a different input domain."

---

### Q10: "Do you have any questions for me?"

Always yes. This is where you show you are serious (see Part 5).

---

## PART 4 — Questions you must ask Vanshika

1. **"Which specific role are you considering me for — ESG Analyst, Associate, or Consultant level? I want to understand the scope before we go further."**
   This is critical. Since your outreach was cold, you don't know what level they're hiring for. Knowing this changes how you pitch yourself.

2. **"What does the ESG team structure look like currently? How many people are on it and who leads it?"**
   This tells you whether you'd be an early hire building from scratch or joining an established team.

3. **"What is the split between client delivery work and contributing to Breathe ESG's internal GHG methodology frameworks?"**
   This tells you whether the product development component from the job description is real or just a line in the JD.

4. **"What industries are most of your current clients from, and which GHG categories are most complex to handle in those sectors?"**
   This shows you understand that Scope 3 complexity varies by sector (cement = high Scope 3 Category 11 for use of sold products vs. IT = high Scope 3 Category 1 for purchased goods).

5. **"What would success look like in the first 90 days?"**
   Standard startup question. Gets you clarity and shows you're thinking about delivery, not just getting the offer.

---

## PART 5 — Round 2 (ESG team lead) — what they will probe

Vanshika's job is to screen and pass you. The ESG team lead's job is to test depth. They will NOT be impressed by framework recitation. They will probe on methodology decisions — the kind of choices you have to make when building a GHG inventory programmatically.

**The questions they will actually ask:**

**"How do you handle missing activity data in a Scope 3 inventory?"**
This is the data quality problem. Options: spend-based estimation using emission intensity factors ($/tCO2e), interpolation from prior years, supplier-specific data requests. The right answer depends on materiality — which categories are large enough to matter. Cement company: Category 11 (use of sold product in construction) is massive; Category 6 (business travel) is irrelevant. Prioritise data quality effort by materiality, estimate everything else with spend-based method, flag data quality clearly.
Parallel to ClimRisk: same problem as handling gaps in climate model outputs at specific asset locations — you interpolate, you flag uncertainty, you don't pretend the number is clean.

**"Location-based vs. market-based Scope 2 — when does it matter?"**
Location-based: use the grid's average emission factor (India CEA grid = ~0.71 tCO2/MWh in 2024). Market-based: use the specific emission factor from the energy certificate or PPA the company purchased. If a company bought solar RECs, market-based Scope 2 can be near zero while location-based remains high. Both must be reported under GHG Protocol Scope 2 Guidance. This matters enormously for companies claiming renewable energy progress.
Parallel to ClimRisk: same as choosing between global climate model averages vs. downscaled local projections — the number changes depending on what the stakeholder is actually trying to demonstrate.

**"Ambuja Cement is a client. What is their most material Scope 3 category?"**
Category 11 (use of sold products). Cement is used in concrete in construction. The combustion of limestone to make clinker (Scope 1) is their largest source, but downstream in Scope 3, the embodied carbon of the cement they sell is Category 11. This is why cement companies are under SBTi pressure — they can't decarbonise by switching energy source; they need process innovation (alternative binders, carbon capture).

**"What would break in an INARA-style system if emission factors aren't versioned properly?"**
Historical emission calculations become wrong retroactively if the emission factor database is updated and old calculations re-run with new factors. You need to pin each calculation to the specific emission factor version used at the time of reporting, not let it drift with updates. This is an audit integrity problem. Same problem exists in ClimRisk with climate model version changes.

**"How would you approach a client whose plant data comes in 12 different formats from 12 facilities?"**
This is the actual data onboarding problem Breathe ESG's ESG team faces. Answer: define a canonical schema first (units, activity categories, time period), then build an ingestion mapping for each facility. Flag outliers and anomalies (a facility reporting 10x higher fuel consumption than the year before). Don't start calculating until the input data quality score is acceptable. This is the same thing INARA's pipeline does automatically — but clients need to be guided through it.

**Key technical facts to have ready (not to list, but to use when relevant):**
- India CEA grid emission factor: ~0.71 tCO2/MWh (location-based, 2024)
- GHG Protocol Scope 3 Standard: 15 categories (8 upstream, 7 downstream)
- Cement Scope 3: Category 11 dominates (use of sold products in construction)
- BRSR: mandatory for top 1000 listed companies from FY 2022-23; Section C Principle 6 covers environmental disclosures
- SBTi near-term target: 42% absolute reduction in Scope 1+2 by 2030 (1.5°C pathway)
- Market-based vs. location-based Scope 2: both required under GHG Protocol Scope 2 Guidance

---

## PART 6 — Red flags to watch for

**Red flag 1: "We'll define the role once you join."**
In an 11-50 person company, roles can be fluid — that's normal. But if they can't tell you at all what you'd be doing, push back: "Can you give me a sense of the primary work in the first three months?"

**Red flag 2: "We're offering equity/ESOPs but keeping base modest."**
Ask: "What is the base salary and vesting schedule?" ESOPs from a seed-stage startup are worth something only at exit. Understand the base independently.

**Red flag 3: "We need someone who can also do some business development."**
This is code for a hybrid ESG/sales role. If that's what it is, fine — but go in knowing that, because the work is very different from pure GHG methodology.

**Red flag 4: Urgency pressure — "We need someone in two weeks."**
Not inherently bad in a startup. But if they can't give you reasonable time to decide after an offer, that is a signal about the culture.

---

## QUICK SUMMARY — What to do before the call

**The one thing to internalise:** You are not an ESG analyst who knows some frameworks. You are someone who built what INARA is. Lead with that. Let the framework knowledge show up as evidence, not as the pitch.

1. Go to breatheesg.com/solutions/carbon-accounting and read it carefully. Know what INARA does — specifically: it ingests site-level data, standardises units, applies emission factors, produces traceable calculations. That is ClimRisk applied to GHG data.
2. Know at least 5 clients by name and what sector they're in: Ambuja Cement (heavy industry, cement), CEAT (tyres/rubber), Dhanuka (agrochem), Swiggy (food tech), Paytm (fintech). The first three are heavy emitters with real Scope 1+3 complexity.
3. Prepare your 90-second intro that makes the ClimRisk-INARA parallel explicit. Practice saying it out loud twice before the call.
4. Your first question to Vanshika: "Which role level are you considering me for?" — do not quote salary before you know this.
5. Write down the 5 questions in Part 4. Ask at least 3. The one about ESG team structure and what percentage of time is methodology vs. client delivery is the most important.
