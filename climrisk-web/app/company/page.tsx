import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Company",
  description: "ClimRisk builds financial infrastructure for climate risk intelligence. Based in Amsterdam. Founded by Shrinivash Kannan.",
};

const ROADMAP = [
  {
    phase: "Q1 2026",
    status: "done",
    items: [
      "CRI Engine v0.4 with non-extractive sector coverage",
      "Platform pilot launch with access code system",
      "CSRD Art.29a and IFRS S2 disclosure modules",
      "Heineken case study published",
    ],
  },
  {
    phase: "Q2 2026",
    status: "current",
    items: [
      "API v1: REST endpoints for run_full() and disclosure export",
      "Portfolio aggregation: correlated loss and sector rollup",
      "Scenario sensitivity analysis: carbon price stress test",
      "Additional sector benchmarks: infrastructure, utilities",
    ],
  },
  {
    phase: "Q3 2026",
    status: "planned",
    items: [
      "Bank loan book module: counterparty CRI scoring at scale",
      "Real estate module: building-level physical risk scoring",
      "Interactive portfolio map with Leaflet.js drill-down",
      "EU Taxonomy alignment scoring per asset",
    ],
  },
  {
    phase: "Q4 2026",
    status: "planned",
    items: [
      "Enterprise tier: custom data feeds and white-label reports",
      "SBTi alignment tracker with pathway deviation alerts",
      "Regulatory update module: automatic NGFS Phase 5 migration",
      "Partnership integrations: Bloomberg, MSCI data feeds",
    ],
  },
];

const PRINCIPLES = [
  {
    label: "Quantitative only.",
    desc: "Climate risk means nothing until it is expressed in dollars, euros, or basis points. CRI produces financial numbers. Not ratings. Not colour bands. Not scores out of five.",
  },
  {
    label: "Asset-level resolution.",
    desc: "Portfolio averages hide the risk. A company with 10 facilities in low-risk regions and 2 in extreme water stress looks fine in aggregate. CRI scores every asset.",
  },
  {
    label: "Transparent methodology.",
    desc: "Every hazard input, scenario curve, and financial transfer function is named and versioned. Auditors and regulators can trace every number to its source.",
  },
  {
    label: "Regulation-ready output.",
    desc: "CSRD, IFRS S2, TCFD, BRSR. The engine generates the structured disclosures regulators require. Not narrative approximations of what those disclosures might say.",
  },
];

export default function CompanyPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 border-b border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/4 mb-6">
            <span className="text-xs text-slate-500 font-mono">Company</span>
          </div>
          <h1 className="heading-xl text-white mb-5 max-w-3xl text-balance">
            Financial infrastructure for climate risk.
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            ClimRisk builds the engine layer between raw climate science and capital decisions.
            Based in Amsterdam. Working with banks, asset managers, and industrial companies globally.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-14 items-start">
          <div>
            <span className="text-xs font-mono text-green-500 tracking-widest mb-4 block">
              Why we exist
            </span>
            <h2 className="heading-md text-white mb-5">
              Climate risk is a financial risk. The tools have not caught up.
            </h2>
            <div className="space-y-4 text-slate-400 leading-relaxed">
              <p>
                The TCFD framework was published in 2017. CSRD mandates climate risk disclosure for 50,000 European companies by 2026. IFRS S2 requires quantitative scenario analysis for all ISSB reporters. The regulatory pressure is real and growing.
              </p>
              <p>
                The problem: the existing toolchain is not built for financial quantification. ESG rating platforms produce relative scores. Consulting engagements produce static PDF reports. Neither gives a CFO the number they need to put in the notes to the accounts.
              </p>
              <p>
                ClimRisk is the engine layer. Upload an asset registry. Receive physical loss cost in dollars, carbon exposure in euros, WACC uplift in basis points, and enterprise value at risk as a percentage. Asset by asset. Scenario by scenario. Disclosure-ready.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {PRINCIPLES.map((p) => (
              <div key={p.label} className="rounded-xl border border-white/7 bg-[#0b1f38]/40 p-5">
                <h3 className="text-white font-bold text-sm mb-2">{p.label}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="px-6 py-20 border-t border-white/6">
        <div className="max-w-7xl mx-auto">
          <span className="text-xs font-mono text-green-500 tracking-widest mb-4 block">
            Founder
          </span>
          <div className="grid md:grid-cols-3 gap-10 items-start">
            <div className="md:col-span-2">
              <h2 className="heading-md text-white mb-5">Shrinivash Kannan</h2>
              <div className="space-y-4 text-slate-400 leading-relaxed">
                <p>
                  Shri built ClimRisk after observing a consistent gap in financial practice: climate risk frameworks were well-developed at the regulatory and scientific level, but the translation to balance sheet numbers was missing. Consultants produced qualitative assessments. Data providers produced index scores. Neither was sufficient for financial disclosure or capital allocation.
                </p>
                <p>
                  The CRI engine was built from first principles: climate hazard physics, NGFS scenario economics, and financial modelling combined into a single computational pipeline. The goal is that any company with an asset registry and 3 minutes can receive CSRD-grade financial risk outputs.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 mt-6">
                <Link
                  href="mailto:shri@climrisk.io"
                  className="text-sm text-slate-400 hover:text-white transition-colors font-mono"
                >
                  shri@climrisk.io
                </Link>
                <Link
                  href="https://linkedin.com/in/shrinivash"
                  target="_blank"
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  LinkedIn →
                </Link>
              </div>
            </div>
            <div className="rounded-xl border border-white/7 bg-[#0b1f38]/40 p-6">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-4">
                Company details
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Entity</span>
                  <span className="text-slate-300">ClimRisk B.V.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Jurisdiction</span>
                  <span className="text-slate-300">Netherlands</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">KVK</span>
                  <span className="text-slate-300 font-mono">95420134</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Location</span>
                  <span className="text-slate-300">Amsterdam</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Engine version</span>
                  <span className="text-slate-300 font-mono text-green-500">v0.4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Scenarios</span>
                  <span className="text-slate-300">NGFS Phase 4</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="px-6 py-20 border-t border-white/6">
        <div className="max-w-7xl mx-auto">
          <h2 className="heading-md text-white mb-3">Product roadmap.</h2>
          <p className="text-slate-500 mb-10">
            Engine development, platform features, and sector expansion.
          </p>
          <div className="grid md:grid-cols-4 gap-4">
            {ROADMAP.map((phase) => (
              <div
                key={phase.phase}
                className={`rounded-xl border p-5 ${
                  phase.status === "current"
                    ? "border-green-500/30 bg-green-500/4"
                    : phase.status === "done"
                    ? "border-white/7 bg-[#0b1f38]/40"
                    : "border-white/5 bg-[#0b1f38]/20"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-slate-400">{phase.phase}</span>
                  {phase.status === "done" && (
                    <span className="text-xs text-green-500 font-mono">done</span>
                  )}
                  {phase.status === "current" && (
                    <span className="text-xs text-green-400 font-mono animate-pulse">now</span>
                  )}
                  {phase.status === "planned" && (
                    <span className="text-xs text-slate-600 font-mono">planned</span>
                  )}
                </div>
                <div className="space-y-2">
                  {phase.items.map((item, j) => (
                    <div key={j} className="flex items-start gap-2 text-xs">
                      <span
                        className={`mt-0.5 shrink-0 ${
                          phase.status === "done"
                            ? "text-green-500"
                            : phase.status === "current"
                            ? "text-green-400"
                            : "text-slate-700"
                        }`}
                      >
                        {phase.status === "done" ? "✓" : "·"}
                      </span>
                      <span
                        className={
                          phase.status === "planned" ? "text-slate-600" : "text-slate-400"
                        }
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 pt-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-2xl border border-green-500/20 bg-green-500/4 p-10">
            <h2 className="heading-md text-white mb-4">Work with us.</h2>
            <p className="text-slate-500 mb-8">
              Pilot clients, data partnerships, and research collaborations welcome.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="btn-primary px-8 py-3.5">
                Get in touch →
              </Link>
              <Link href="/cases" className="btn-ghost px-8 py-3.5">
                See case studies
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
