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
    id: "transparency",
    tag: "04",
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
          <Link href="/contact" className="btn-primary mt-4 inline-flex">Book a Technical Demo</Link>
        </Reveal>
      </div>
    </div>
  );
}
