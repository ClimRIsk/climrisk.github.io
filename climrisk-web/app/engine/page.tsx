import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "../components/Reveal";
import EngineGlobe from "../components/EngineGlobe";

export const metadata: Metadata = {
  title: "The CRI Engine",
  description:
    "A technical overview of the Climate Risk Intelligence Engine — geospatial pipeline, financial translation, data architecture, and methodological transparency.",
};

const SECTIONS = [
  {
    id: "pipeline",
    tag: "01",
    title: "The Geospatial Pipeline",
    body: "Every run starts from asset coordinates, not sector averages, through a three-tier stack built in-house. Tier 1 scores all 25 hazards from embedded SSP tables for every asset, with or without coordinates. Tier 2, when lat/lon is available, pulls live CMIP6 downscaled projections (three models via the Open-Meteo Climate API), ERA5 and NASA POWER baselines, and a live WRI Aqueduct point query, and merges those real deltas into the Tier 1 scores instead of leaving them as static lookups. Tier 3, where the optional GIS extra is installed, swaps in Copernicus DEM elevation, Global Surface Water floodplain extent and VIIRS active-fire data in place of the lookup tables entirely. At site level the engine also reads flood depths from the JRC river and Deltares coastal flood maps, cyclone wind from the NOAA IBTrACS track record, local flood defences from FLOPROS, and Sentinel-1/2 imagery. The result is a facility-level hazard profile that gets more precise as more data is available for a site, never a country- or sector-level proxy.",
    points: [
      { t: "Three-Tier Hazard Matrix", d: "Embedded SSP tables score every asset; live CMIP6/ERA5/NASA POWER downscaling at exact coordinates sharpens it when lat/lon is known; optional GIS rasters override it where installed." },
      { t: "NGFS Phase 5 Scenarios", d: "Seven NGFS Phase 5 pathways (three models) for the Risk Analyst; the legacy CRI score runs Net Zero 2050, Delayed Transition and Current Policies." },
      { t: "Production Loss Modelling", d: "Hazard exposure is converted into a production loss percentage before it ever touches a financial statement." },
    ],
  },
  {
    id: "financial-translation",
    tag: "02",
    title: "Financial Translation",
    body: "Physical loss and transition cost are translated into the language a CFO's office already speaks. A full discounted cash flow model runs the 2026–2050 horizon with a Gordon Growth terminal value, applying a WACC uplift built from a base rate, a scenario premium, and an asset-specific exposure premium. Underneath that sits a double-materiality translator: the two risk types move in opposite directions across the scenario set — transition risk is highest under Net Zero 2050 and physical risk is highest under Current Policies — so the engine derives annual hazard probabilities from each scenario's own GMST path, combines them into a joint expected-loss fraction, scales that by a sector-specific revenue-at-risk ratio, and discounts it into a physical NPV drag that sits alongside, and is additive to, the transition-risk NPV impact. The output is one EV haircut against baseline that actually contains both halves of the picture, not an abstract risk score.",
    points: [
      { t: "Carbon Cost Trajectory", d: "Scope 1 and 2 carbon costs, net of EU ETS free allocation, run against each scenario's carbon price path." },
      { t: "Abatement Capex (MACC)", d: "A marginal abatement cost curve prices the capex required to hit stated decarbonization targets — modelled as capex, not double-charged against the carbon cost." },
      { t: "Double Materiality (Physical + Transition NPV)", d: "Physical hazard intensity is converted into a discounted NPV drag, additive to the transition NPV impact, so a Net Zero 2050 run doesn't silently drop the physical side just because it's the low-physical-risk scenario." },
    ],
  },
  {
    id: "data-architecture",
    tag: "03",
    title: "Unified Data Architecture & Delivery",
    body: "Eighteen commodity classes — from iron ore and thermal coal to cement, agriculture, and financial services — run through the same underlying architecture, accessed through a single API surface. Custom scenarios can be defined inline for a single run or persisted and reused across an engagement.",
    points: [
      { t: "Modular Runs", d: "Physical, transition, and financial modules can be run independently or as a full pipeline." },
      { t: "Custom Scenario Support", d: "Carbon price paths, risk premiums, and abatement targets can be defined per engagement and saved for reuse." },
      { t: "Disclosure-Ready Output", d: "TCFD, IFRS S2, and CSRD reports are generated directly from engine outputs — not reconstructed after the fact." },
    ],
  },
  {
    id: "api-surface",
    tag: "04",
    title: "API Surface",
    body: "Every capability above is reachable through a REST API, so the engine can sit inside your own deal workflow or reporting pipeline instead of living as a standalone tool you have to open separately.",
    points: [
      { t: "Regulatory Endpoints", d: "POST /regulatory/sfdr-pai, POST /regulatory/eu-taxonomy, and POST /regulatory/pcaf return the SFDR PAI pack, EU Taxonomy alignment, and PCAF financed emissions for a given portfolio." },
      { t: "Stress & Physical Endpoints", d: "POST /stress/event replays a named historical event against a position, GET /stress/event/catalogue lists what's available, and POST /physical/slr and POST /physical/biodiversity return sea level rise exposure and TNFD nature risk scores." },
      { t: "Portfolio & Carbon Endpoints", d: "POST /portfolio/benchmark, /portfolio/counterparty and /portfolio/export.csv for portfolios; POST /carbon/inventory (with an assurance-pack workbook), /lca/{product}, /transition-plan, /real-estate/assess, /materiality/assess and /carbon-markets/* for carbon accounting and disclosure." },
    ],
  },
  {
    id: "ml-agentic",
    tag: "05",
    title: "ML & Agentic Intelligence",
    body: "Every score also carries a forward view. A gradient-boosted surrogate model, trained on 50,000 simulated company-years whose parameters are calibrated to NGFS pathways and EM-DAT disaster losses, forecasts a company's CRI score out to 2050 under three scenarios, with confidence bands rather than a single static number. Where emissions reporting is missing, an estimator trained on observed facility emissions from the US EPA Greenhouse Gas Reporting Program, matched to parent-company revenue and evaluated on held-out companies, fills the gap with a confidence-scored estimate instead of a flat sector average. A ClimateBERT-based scanner then reads the company's own disclosures for commitment specificity, flagging the gap between what's claimed and what's backed by capex. And a tool-calling AI agent, wired directly to the engine itself, can research a company from public financials and news, run the full assessment, or work through an entire watchlist unattended and deliver the results by email.",
    points: [
      { t: "Predictive CRI Trajectories", d: "A gradient-boosted surrogate forecasts the 0-100 CRI score for every year to 2050 across NZE, Delayed Transition and Current Policies, with confidence bands rather than a point estimate." },
      { t: "AI-Filled Emissions & Disclosure Scoring", d: "An estimator trained on EPA GHGRP observed emissions imputes missing Scope 1/2, while a ClimateBERT scanner flags the gap between a company's stated commitments and its actual capex." },
      { t: "Autonomous Portfolio Agents", d: "Research, full assessment, watchlist monitoring, and batch analysis across an entire portfolio, run unattended and delivered by email or through a conversational interface." },
    ],
  },
  {
    id: "transparency",
    tag: "06",
    title: "Methodological Transparency",
    body: "Every number the engine produces is traceable to a named hazard layer, a named scenario, and a named financial assumption. Nothing is a black box: we defend the CRI score and every input beneath it in front of a client's own quantitative or risk team, on request.",
    points: [
      { t: "No Black-Box Scoring", d: "The 0–100 CRI score decomposes into its physical, transition, and financial components on request." },
      { t: "Auditable Assumptions", d: "WACC premiums, abatement targets, and carbon price paths are documented, not embedded silently in the model." },
      { t: "Portfolio-Level Aggregation", d: "Value-at-Risk is computed at 95% and 99% confidence across a full portfolio, weighted by exposure." },
    ],
  },
];

export default function EnginePage() {
  return (
    <div className="pt-40 pb-32 px-6">
      <div className="max-w-4xl mx-auto mb-16">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">The CRI Engine</p>
          <h1 className="heading-xl grad-text mb-6">
            Climate science, translated into <span className="grad-gold">financial exposure.</span>
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
            A technical overview of the pipeline underneath every report we deliver — from asset
            coordinates to Capital-at-Risk.
          </p>
        </Reveal>
      </div>

      <div className="max-w-5xl mx-auto mb-24">
        <Reveal>
          <EngineGlobe />
          <p className="text-xs text-zinc-600 font-mono mt-3 text-center">
            Live geospatial hazard render — one node per resolved asset coordinate.
          </p>
        </Reveal>
      </div>

      <div className="max-w-5xl mx-auto space-y-24">
        {SECTIONS.map((s, i) => (
          <Reveal key={s.id} delayMs={i * 60}>
            <div id={s.id} className="grid md:grid-cols-[160px_1fr] gap-10 scroll-mt-28">
              <div>
                <span className="text-xs font-mono text-zinc-600">SECTION {s.tag}</span>
                <h2 className="heading-md text-white mt-3">{s.title}</h2>
              </div>
              <div>
                <p className="text-zinc-400 leading-relaxed mb-8">{s.body}</p>
                <div className="grid sm:grid-cols-3 gap-5">
                  {s.points.map((pt) => (
                    <div key={pt.t} className="panel p-5">
                      <h3 className="text-sm font-semibold text-white mb-2">{pt.t}</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed">{pt.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="max-w-5xl mx-auto mt-32 text-center pt-16 border-t border-white/8">
        <Reveal>
          <h2 className="heading-lg grad-text mb-4">See how we screen 10,000 assets in seconds.</h2>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <Link href="/contact" className="btn-primary">Book a Technical Demo</Link>
            <Link href="/platform" className="btn-ghost">See the five tools built on this engine</Link>
            <Link href="/methodology" className="btn-ghost">Read the full methodology</Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
