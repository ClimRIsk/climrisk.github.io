import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Research",
  description: "ClimRisk methodology papers, validation studies, LinkedIn articles, and engine release notes. NGFS Phase 4, IPCC AR6, WRI Aqueduct, NASA NEX-GDDP.",
};

const PAPERS = [
  {
    type: "Methodology",
    title: "The CRI Scoring Framework",
    subtitle: "Physical risk, transition risk, and financial quantification across NGFS Phase 4 scenarios",
    desc: "Full documentation of the CRI scoring methodology. Covers hazard physics, financial translation, scenario calibration, and rating construction. Intended for risk officers, auditors, and regulators.",
    tags: ["NGFS Phase 4", "IPCC AR6", "CSRD", "IFRS S2"],
    status: "Available on request",
    href: "mailto:shri@climrisk.io?subject=CRI Methodology Document",
  },
  {
    type: "Validation study",
    title: "CRI Engine v0.4 Validation Report",
    subtitle: "Benchmark accuracy against MSCI Climate VaR, Sustainalytics Physical Risk, and internal models",
    desc: "Directional accuracy 91% against MSCI Climate VaR on a 120-company test set. EV impact MAE of ±8 percentage points. Score correlation r=0.87. Full methodology and test set described.",
    tags: ["Validation", "MSCI", "Sustainalytics", "91% accuracy"],
    status: "Available on request",
    href: "mailto:shri@climrisk.io?subject=CRI Validation Report",
  },
  {
    type: "LinkedIn article",
    title: "Heineken: Water Stress as a Balance Sheet Risk",
    subtitle: "CRI case study · published May 2026",
    desc: "Applied analysis of Heineken N.V.'s 47-brewery portfolio. Maps water stress exposure across WRI Aqueduct basins, quantifies physical loss under three NGFS scenarios, and translates to WACC uplift and enterprise value impact.",
    tags: ["Heineken", "Water stress", "CSRD", "WACC uplift"],
    status: "Published",
    href: "https://linkedin.com/in/shrinivash",
  },
  {
    type: "Engine release",
    title: "CRI Engine v0.4 Release Notes",
    subtitle: "Sector coverage expansion, run_full() API, BRSR support",
    desc: "Added 8 non-extractive sector commodity types (beverages, food, chemicals, manufacturing, retail, financial services, real estate, agriculture). Added run_full() multi-scenario entry point. Populated pillar score fields on all RunResults objects.",
    tags: ["v0.4", "API", "Python", "Pydantic v2"],
    status: "Released",
    href: "mailto:shri@climrisk.io?subject=CRI Engine v0.4 Documentation",
  },
];

const DATA_SOURCES = [
  {
    name: "WRI Aqueduct 4.0",
    desc: "Basin-level water risk indicators: baseline water stress, interannual variability, drought severity, groundwater depletion. 180 countries. Used for all physical water risk scoring.",
    category: "Physical hazard",
  },
  {
    name: "NASA NEX-GDDP-CMIP6",
    desc: "Downscaled global climate projections at 25km resolution to 2100. Temperature, precipitation, humidity extremes. Used for heat stress, cold snap, and precipitation anomaly scoring.",
    category: "Physical hazard",
  },
  {
    name: "NGFS Phase 4 Scenarios",
    desc: "Net Zero 2050, Delayed Transition, Current Policies. Demand curves and carbon price trajectories for 16 commodity sectors. Used for transition risk and financial quantification.",
    category: "Scenarios",
  },
  {
    name: "IPCC AR6 Working Group II",
    desc: "Physical climate impact projections by sector and region. Used to calibrate hazard-to-loss transfer functions: crop yield loss, labour productivity, infrastructure damage.",
    category: "Calibration",
  },
  {
    name: "EU ETS Carbon Price Path",
    desc: "Historical EU ETS settlement prices and forward curves implied by NGFS trajectories. Used for Scope 1 and Scope 2 carbon cost quantification under each scenario.",
    category: "Transition risk",
  },
  {
    name: "IBISWorld / MSCI sector benchmarks",
    desc: "Sector-average EBITDA margins, capex intensity, and leverage ratios. Used to construct sector benchmark distributions for CRI rating normalisation.",
    category: "Benchmarks",
  },
  {
    name: "OpenStreetMap / Google Geocoding API",
    desc: "Address-to-coordinate resolution for uploaded assets. Used in the data intake pipeline to geocode plant locations before spatial hazard analysis.",
    category: "Geospatial",
  },
  {
    name: "EM-DAT Global Disaster Database",
    desc: "Historical physical damage records by disaster type and region. Used to validate physical loss cost calibration against observed insurance loss data.",
    category: "Validation",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Physical hazard": "text-blue-400 border-blue-500/30 bg-blue-500/8",
  Scenarios: "text-purple-400 border-purple-500/30 bg-purple-500/8",
  Calibration: "text-yellow-400 border-yellow-500/30 bg-yellow-500/8",
  "Transition risk": "text-orange-400 border-orange-500/30 bg-orange-500/8",
  Benchmarks: "text-slate-400 border-slate-500/30 bg-slate-500/8",
  Geospatial: "text-cyan-400 border-cyan-500/30 bg-cyan-500/8",
  Validation: "text-green-400 border-green-500/30 bg-green-500/8",
};

export default function ResearchPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 border-b border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/4 mb-6">
            <span className="text-xs text-slate-500 font-mono">Research</span>
          </div>
          <h1 className="heading-xl text-white mb-5 max-w-3xl text-balance">
            Methodology. Validation. Calibration.
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            The engine is only as credible as its sources and its tests.
            Every score is traceable to a peer-reviewed data source and benchmarked against commercial providers.
          </p>
        </div>
      </section>

      {/* Papers and articles */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="heading-md text-white mb-3">Publications and reports.</h2>
          <p className="text-slate-500 mb-10">Methodology documents, validation studies, and applied analyses.</p>
          <div className="grid md:grid-cols-2 gap-5">
            {PAPERS.map((p) => (
              <Link
                key={p.title}
                href={p.href}
                target={p.href.startsWith("http") ? "_blank" : undefined}
                className="group block rounded-2xl border border-white/7 bg-[#0b1f38]/50 p-7 hover:border-white/14 hover:bg-[#0b1f38] transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full border border-white/10 text-slate-500 bg-white/4">
                    {p.type}
                  </span>
                  <span
                    className={`text-xs font-mono ${
                      p.status === "Published" || p.status === "Released"
                        ? "text-green-500"
                        : "text-slate-600"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <h3 className="text-white font-bold mb-1.5">{p.title}</h3>
                <p className="text-xs text-slate-500 mb-3">{p.subtitle}</p>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">{p.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {p.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded border border-white/8 text-slate-600 bg-white/3"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Data sources */}
      <section className="px-6 py-20 border-t border-white/6">
        <div className="max-w-7xl mx-auto">
          <h2 className="heading-md text-white mb-3">Data sources.</h2>
          <p className="text-slate-500 mb-10">
            Every hazard score, scenario curve, and financial benchmark traces to a named source.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {DATA_SOURCES.map((s) => (
              <div
                key={s.name}
                className="rounded-xl border border-white/7 bg-[#0b1f38]/40 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm">{s.name}</h3>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded border ${
                      CATEGORY_COLORS[s.category] ?? "text-slate-400"
                    }`}
                  >
                    {s.category}
                  </span>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Model update log */}
      <section className="px-6 py-20 border-t border-white/6">
        <div className="max-w-7xl mx-auto">
          <h2 className="heading-md text-white mb-3">Engine changelog.</h2>
          <p className="text-slate-500 mb-10">Version history with methodology changes flagged.</p>
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-black/30 border-b border-white/6">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="ml-3 text-xs text-slate-600 font-mono">CHANGELOG</span>
            </div>
            <div className="bg-[#030912] p-6 font-mono text-xs space-y-5">
              {[
                {
                  version: "v0.4.0",
                  date: "May 2026",
                  changes: [
                    "Added 8 non-extractive sector commodity types (beverages, food, chemicals, manufacturing, retail, financial services, real estate, agriculture)",
                    "Added run_full() multi-scenario entry point for portfolio analysis",
                    "Populated pillar score fields (exposure_score, transition_score, financial_score, adaptive_score) via run_full()",
                    "Added BRSR Core disclosure module",
                    "Added SBTi scope coverage assessment",
                  ],
                },
                {
                  version: "v0.3.0",
                  date: "March 2026",
                  changes: [
                    "Migrated to NGFS Phase 4 scenario set (from Phase 3)",
                    "Updated WRI Aqueduct to version 4.0",
                    "Added EU ETS forward curve for carbon cost projection",
                    "Added RatingEngine with sector benchmark normalisation",
                    "Pydantic v2 migration",
                  ],
                },
                {
                  version: "v0.2.0",
                  date: "December 2025",
                  changes: [
                    "Added IFRS S2 quantitative disclosure module",
                    "Added TCFD scenario narrative generator",
                    "Physical loss cost now in USD (previously index only)",
                    "Added NASA NEX-GDDP temperature hazard layer",
                  ],
                },
                {
                  version: "v0.1.0",
                  date: "September 2025",
                  changes: [
                    "Initial release: WRI Aqueduct water stress scoring",
                    "NGFS Phase 3 transition risk module",
                    "CSRD Article 29a disclosure generator",
                    "CRI composite score (A to E rating)",
                  ],
                },
              ].map((entry) => (
                <div key={entry.version}>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-green-400 font-bold">{entry.version}</span>
                    <span className="text-slate-600">{entry.date}</span>
                  </div>
                  <div className="space-y-1 pl-4 border-l border-white/6">
                    {entry.changes.map((c, j) => (
                      <div key={j} className="text-slate-500">
                        <span className="text-slate-700 mr-2">+</span>
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 pt-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-2xl border border-green-500/20 bg-green-500/4 p-10">
            <h2 className="heading-md text-white mb-4">Questions about the methodology?</h2>
            <p className="text-slate-500 mb-8">
              The full CRI methodology document is available on request. We respond within 24 hours.
            </p>
            <Link href="/contact" className="btn-primary px-8 py-3.5">
              Request methodology doc →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
