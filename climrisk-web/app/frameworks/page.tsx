import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Frameworks",
  description: "How ClimRisk outputs map to CSRD Article 29a, IFRS S2, TCFD, EU Taxonomy DNSH, SEBI BRSR, and SBTi. One engine. Every major climate disclosure framework.",
};

const FRAMEWORKS = [
  {
    id: "csrd",
    code: "CSRD Art.29a",
    full: "Corporate Sustainability Reporting Directive — Article 29a",
    jurisdiction: "European Union",
    mandate: "Mandatory for ~50,000 EU companies from 2026",
    desc: "CSRD requires companies to disclose material climate risks under the European Sustainability Reporting Standards (ESRS). Article 29a specifically mandates scenario-based physical and transition risk assessment with financial materiality thresholds.",
    required: [
      "Identification of material physical and transition risks",
      "Scenario analysis under at least two climate scenarios (including 1.5°C)",
      "Financial materiality assessment: quantified exposure in monetary terms",
      "DNSH (Do No Significant Harm) assessment for EU Taxonomy alignment",
      "Time horizon coverage: short (up to 5 years), medium (5-10), long (10+ years)",
    ],
    cri_outputs: [
      "Physical loss cost per asset (€/yr) at 2030, 2040, 2050",
      "Transition risk (carbon cost + demand reduction) by scenario",
      "Enterprise value at risk (%) under NZE 2050 and Delayed Transition",
      "DNSH scoring per asset against all six EU Taxonomy environmental objectives",
      "Scenario narrative text generated for each time horizon",
    ],
    status: "Full coverage",
    color: "blue",
  },
  {
    id: "ifrs-s2",
    code: "IFRS S2",
    full: "IFRS Sustainability Disclosure Standard S2 — Climate-related Disclosures",
    jurisdiction: "Global (ISSB)",
    mandate: "Adopted or referenced in 20+ jurisdictions including UK, Australia, Canada, Singapore",
    desc: "IFRS S2 requires entities to disclose information that enables users of financial statements to understand the effects of climate-related risks and opportunities. It mandates quantitative scenario analysis and cross-industry metric disclosure.",
    required: [
      "Governance: board oversight of climate risks and opportunities",
      "Strategy: climate risks integrated into overall strategy and financial planning",
      "Risk management: processes for identifying, assessing, and managing climate risks",
      "Metrics and targets: Scope 1, 2, 3 emissions; climate-related financial metrics",
      "Scenario analysis: forward-looking analysis under 1.5°C and 2°C pathways",
    ],
    cri_outputs: [
      "Financed emissions and carbon intensity per asset",
      "Physical risk exposure by asset, region, and hazard type",
      "Climate-related WACC uplift in basis points",
      "Scenario analysis table: financial impact under 3 NGFS scenarios",
      "Carbon cost as EU ETS exposure under each transition scenario",
    ],
    status: "Full coverage",
    color: "green",
  },
  {
    id: "tcfd",
    code: "TCFD",
    full: "Task Force on Climate-related Financial Disclosures",
    jurisdiction: "Global (IOSCO, FSB)",
    mandate: "Mandatory in UK, EU, Singapore, New Zealand; referenced globally",
    desc: "TCFD is the foundational framework for climate risk disclosure. It structures disclosure around four pillars: Governance, Strategy, Risk Management, and Metrics and Targets. CSRD and IFRS S2 are both built on TCFD's architecture.",
    required: [
      "Governance: board and management oversight of climate risk",
      "Strategy: short, medium, and long-term climate risk assessment with scenario analysis",
      "Risk management: integration of climate risk into enterprise risk management",
      "Metrics: GHG emissions (Scope 1, 2, 3), climate-related financial metrics",
      "Targets: emissions reduction targets and progress against them",
    ],
    cri_outputs: [
      "Scenario analysis narrative: physical and transition risk under 3 NGFS pathways",
      "Financial impact tables: loss cost, carbon cost, EV impact by scenario and year",
      "Sector-level risk summary for supply chain and value chain exposure",
      "Scope 1 and Scope 2 emissions with NGFS-consistent carbon price trajectories",
      "Board-ready executive summary with risk heat map and financial materiality",
    ],
    status: "Full coverage",
    color: "purple",
  },
  {
    id: "brsr",
    code: "SEBI / BRSR",
    full: "Business Responsibility and Sustainability Reporting — Core",
    jurisdiction: "India (SEBI)",
    mandate: "Mandatory for top 1,000 listed Indian companies from FY2022-23",
    desc: "BRSR is India's primary sustainability disclosure framework, mandated by SEBI. The BRSR Core subset focuses on quantitative, assurable metrics including GHG emissions, water intensity, and climate risk exposure. CRI covers the BRSR Core metrics relevant to climate financial risk.",
    required: [
      "GHG emissions intensity (Scope 1 and 2 per unit of revenue)",
      "Water consumption intensity and percentage from stressed sources",
      "Climate risk and opportunity identification at entity level",
      "BRSR Core leadership indicators on physical and transition risk",
      "Science-based targets or equivalent pathway description",
    ],
    cri_outputs: [
      "Scope 1 and 2 GHG emissions with intensity ratio (tCO2e / INR crore revenue)",
      "Water withdrawal by source: surface, groundwater, third-party; WRI Aqueduct stress rating",
      "Physical risk identification: assets in high-stress basins or extreme heat zones",
      "Transition risk monetisation: carbon cost under BRSR-relevant scenarios",
      "BRSR Core section output: ready-to-file structured data table",
    ],
    status: "Core coverage",
    color: "orange",
  },
];

const COLOR_MAP: Record<string, { border: string; badge: string; tag: string }> = {
  blue:   { border: "border-blue-500/20",   badge: "border-blue-500/30 text-blue-400 bg-blue-500/8",   tag: "text-blue-400" },
  green:  { border: "border-green-500/20",  badge: "border-green-500/30 text-green-400 bg-green-500/8",  tag: "text-green-400" },
  purple: { border: "border-purple-500/20", badge: "border-purple-500/30 text-purple-400 bg-purple-500/8", tag: "text-purple-400" },
  orange: { border: "border-orange-500/20", badge: "border-orange-500/30 text-orange-400 bg-orange-500/8", tag: "text-orange-400" },
};

export default function FrameworksPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 border-b border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/4 mb-6">
            <span className="text-xs text-slate-500 font-mono">Regulatory frameworks</span>
          </div>
          <h1 className="heading-xl text-white mb-5 max-w-3xl text-balance">
            Every major framework. One engine.
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            CSRD, IFRS S2, TCFD, EU Taxonomy, BRSR. The CRI engine generates the outputs each framework requires.
            Run once. Disclose everywhere.
          </p>
        </div>
      </section>

      {/* Framework overview strip */}
      <section className="px-6 py-8 border-b border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FRAMEWORKS.map((f) => {
              const colors = COLOR_MAP[f.color];
              return (
                <a
                  key={f.id}
                  href={`#${f.id}`}
                  className={`rounded-xl border ${colors.border} bg-[#0b1f38]/40 p-4 hover:bg-[#0b1f38]/70 transition-colors`}
                >
                  <div className={`text-sm font-bold mb-1 ${colors.tag}`}>{f.code}</div>
                  <div className="text-xs text-slate-600">{f.jurisdiction}</div>
                  <div className="text-xs text-slate-700 mt-1">{f.status}</div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Framework detail sections */}
      {FRAMEWORKS.map((f, i) => {
        const colors = COLOR_MAP[f.color];
        return (
          <section
            key={f.id}
            id={f.id}
            className="px-6 py-20 border-t border-white/6"
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-wrap items-start gap-4 mb-6">
                <span
                  className={`text-xs font-mono px-2.5 py-1 rounded-full border ${colors.badge}`}
                >
                  {f.code}
                </span>
                <span className="text-xs text-slate-600 font-mono pt-1">{f.jurisdiction}</span>
              </div>
              <h2 className="heading-md text-white mb-2">{f.full}</h2>
              <p className="text-xs text-slate-600 font-mono mb-5">{f.mandate}</p>
              <p className="text-slate-400 leading-relaxed mb-10 max-w-3xl">{f.desc}</p>

              <div className="grid md:grid-cols-2 gap-8">
                {/* What the framework requires */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
                    What {f.code} requires
                  </h3>
                  <div className="space-y-3">
                    {f.required.map((req, j) => (
                      <div key={j} className="flex items-start gap-3 text-sm">
                        <span className="text-slate-700 mt-0.5 shrink-0">·</span>
                        <span className="text-slate-400">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What CRI produces */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
                    What ClimRisk produces
                  </h3>
                  <div className="space-y-3">
                    {f.cri_outputs.map((out, j) => (
                      <div key={j} className="flex items-start gap-3 text-sm">
                        <span className={`mt-0.5 shrink-0 ${colors.tag}`}>✓</span>
                        <span className="text-slate-400">{out}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Comparison table */}
      <section className="px-6 py-20 border-t border-white/6">
        <div className="max-w-7xl mx-auto">
          <h2 className="heading-md text-white mb-3">Output coverage by framework.</h2>
          <p className="text-slate-500 mb-10">Every CRI output is mapped to at least one disclosure requirement.</p>
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/6 bg-black/20">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                      CRI Output
                    </th>
                    {["CSRD", "IFRS S2", "TCFD", "BRSR"].map((fw) => (
                      <th key={fw} className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                        {fw}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { output: "Physical loss cost (€/yr, per asset)", csrd: true, ifrs: true, tcfd: true, brsr: false },
                    { output: "Carbon cost / EU ETS exposure", csrd: true, ifrs: true, tcfd: true, brsr: true },
                    { output: "WACC uplift (basis points)", csrd: true, ifrs: true, tcfd: true, brsr: false },
                    { output: "Enterprise value at risk (%)", csrd: true, ifrs: true, tcfd: true, brsr: false },
                    { output: "Scope 1 and Scope 2 GHG emissions", csrd: true, ifrs: true, tcfd: true, brsr: true },
                    { output: "Water stress rating (WRI Aqueduct)", csrd: true, ifrs: false, tcfd: false, brsr: true },
                    { output: "DNSH assessment (EU Taxonomy)", csrd: true, ifrs: false, tcfd: false, brsr: false },
                    { output: "3-scenario narrative (NZE / DT / CP)", csrd: true, ifrs: true, tcfd: true, brsr: false },
                    { output: "2030 / 2040 / 2050 time horizon tables", csrd: true, ifrs: true, tcfd: true, brsr: false },
                    { output: "GHG intensity ratio (tCO2e / revenue)", csrd: true, ifrs: true, tcfd: false, brsr: true },
                  ].map((row) => (
                    <tr key={row.output} className="hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{row.output}</td>
                      {[row.csrd, row.ifrs, row.tcfd, row.brsr].map((v, j) => (
                        <td key={j} className="text-center px-4 py-3.5">
                          {v ? (
                            <span className="text-green-500 text-sm">✓</span>
                          ) : (
                            <span className="text-slate-800 text-sm">·</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 pt-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-2xl border border-green-500/20 bg-green-500/4 p-10">
            <h2 className="heading-md text-white mb-4">Which framework do you need?</h2>
            <p className="text-slate-500 mb-8">
              Book a demo and we will walk through the exact outputs your disclosure requires.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="btn-primary px-8 py-3.5">
                Book a demo →
              </Link>
              <Link href="/platform" className="btn-ghost px-8 py-3.5">
                See platform outputs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
