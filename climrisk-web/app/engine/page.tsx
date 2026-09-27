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
    body: "Every run starts from asset coordinates, not sector averages. Each facility is resolved against a GIS layer covering 25+ physical hazard types — heat stress, flooding, cyclone exposure, drought, sea-level rise, and water stress among them — sourced from WRI Aqueduct, Copernicus, and IPCC AR6 hazard matrices. The result is a facility-level hazard profile, not a country- or sector-level proxy.",
    points: [
      { t: "Asset-Level Resolution", d: "Lat/lon GIS resolution against 25+ hazard layers, per facility." },
      { t: "NGFS Phase 4 Scenarios", d: "Net Zero 2050, Delayed Transition, and Current Policies pathways, run in parallel." },
      { t: "Production Loss Modelling", d: "Hazard exposure is converted into a production loss percentage before it ever touches a financial statement." },
    ],
  },
  {
    id: "financial-translation",
    tag: "02",
    title: "Financial Translation",
    body: "Physical loss and transition cost are translated into the language a CFO's office already speaks. A full discounted cash flow model runs the 2026–2050 horizon with a Gordon Growth terminal value, applying a WACC uplift built from a base rate, a scenario premium, and an asset-specific exposure premium. The output is an EV haircut against baseline, not an abstract risk score.",
    points: [
      { t: "Carbon Cost Trajectory", d: "Scope 1 and 2 carbon costs, net of EU ETS free allocation, run against each scenario's carbon price path." },
      { t: "Abatement Capex (MACC)", d: "A marginal abatement cost curve prices the capex required to hit stated decarbonization targets — modelled as capex, not double-charged against the carbon cost." },
      { t: "EV Haircut & WACC Uplift", d: "Full DCF output: enterprise value under stress versus baseline, and the WACC uplift driving that gap." },
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
      { t: "Portfolio Endpoints", d: "POST /portfolio/benchmark compares active climate VaR against a chosen index, and POST /portfolio/counterparty returns concentration and climate VaR broken out by counterparty." },
    ],
  },
  {
    id: "ml-agentic",
    tag: "05",
    title: "ML & Agentic Intelligence",
    body: "Every score also carries a forward view. A gradient-boosted trajectory model, trained on NGFS Phase 4 pathways and decades of disaster-loss data, forecasts a company's CRI score out to 2050 under all three scenarios, with confidence bands rather than a single static number. Where emissions reporting is missing or stale, an XGBoost model trained on over 14,000 verified CDP disclosures fills the gap with a confidence-scored estimate instead of a flat sector average. A ClimateBERT-based scanner then reads the company's own disclosures for commitment specificity, flagging the gap between what's claimed and what's backed by capex. And a tool-calling AI agent, wired directly to the engine itself, can research a company from public financials and news, run the full assessment, or work through an entire watchlist unattended and deliver the results by email.",
    points: [
      { t: "Predictive CRI Trajectories", d: "A GradientBoostingRegressor forecasts the 0-100 CRI score for every year to 2050 across NZE, Delayed Transition, and Current Policies, with confidence bands rather than a point estimate." },
      { t: "AI-Filled Emissions & Disclosure Scoring", d: "An XGBoost model imputes missing Scope 1/2/3 data against verified CDP disclosures, while a ClimateBERT scanner flags the gap between a company's stated commitments and its actual capex." },
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
          <h2 className="heading-lg grad-text mb-4">See how we map 10,000 assets in under 5 minutes.</h2>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <Link href="/contact" className="btn-primary">Book a Technical Demo</Link>
            <Link href="/methodology" className="btn-ghost">Read the full methodology</Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
