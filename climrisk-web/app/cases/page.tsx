import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cases",
  description: "CRI case studies across beverages, energy, and mining. See how ClimRisk quantifies physical and transition risk for real asset portfolios.",
};

const CASES = [
  {
    id: "heineken",
    tag: "Beverages · Global",
    company: "Heineken N.V.",
    headline: "Water stress is a balance sheet risk. Not a sustainability metric.",
    problem:
      "Heineken operates 165 breweries across 70 countries. Production is water-intensive: 3.5 litres of water per litre of beer. Over 30% of facilities sit in WRI Aqueduct 'High' or 'Extremely High' water stress basins. Under CSRD and IFRS S2, these exposures require financial quantification: not narrative disclosure.",
    approach: [
      "Mapped 47 production assets against WRI Aqueduct 4.0 basin-level water stress indices",
      "Ran NGFS Phase 4 scenarios: Net Zero 2050, Delayed Transition, Current Policies",
      "Quantified physical loss cost per asset using regional water price escalation curves",
      "Modelled EU ETS carbon exposure across Scope 1 and Scope 2 for each scenario",
      "Generated CSRD Article 29a, IFRS S2, and TCFD disclosure reports",
    ],
    results: [
      { label: "CRI Score", value: "68 / 100" },
      { label: "Rating", value: "D" },
      { label: "Physical loss (2030)", value: "$42M / yr" },
      { label: "Carbon cost (2030)", value: "€26M EU ETS" },
      { label: "WACC uplift", value: "+185 bps" },
      { label: "EV at risk (NZE)", value: "−12.8%" },
    ],
    dominant: "Water stress · MX-NL and MENA facilities",
    sector: "beverages",
  },
  {
    id: "shell",
    tag: "Energy · Integrated",
    company: "Shell plc",
    headline: "Transition risk is not hypothetical for an oil major. It is a 2030 problem.",
    problem:
      "Shell's upstream portfolio spans 6 continents. Under a Net Zero 2050 scenario, oil demand peaks before 2030 and falls 70% by 2050. The financial impact is not symmetric: assets with high extraction costs face stranded asset risk before reserves are fully depreciated. Quantifying this requires scenario-specific NPV modelling, not ESG ratings.",
    approach: [
      "Segmented upstream assets by break-even cost (lifting cost + capex recovery)",
      "Applied NGFS NZE demand curves to production forecasts for each asset",
      "Identified stranded asset thresholds: year at which projected revenue < operating cost",
      "Modelled WACC uplift driven by regulatory carbon price and credit spread widening",
      "Generated EU Taxonomy DNSH assessment for each asset class",
    ],
    results: [
      { label: "CRI Score", value: "74 / 100" },
      { label: "Rating", value: "D" },
      { label: "Stranded assets (NZE)", value: "18% of reserves" },
      { label: "Carbon cost (2035)", value: "€4.2B EU ETS equiv." },
      { label: "WACC uplift", value: "+220 bps" },
      { label: "NPV at risk (NZE)", value: "−$28B" },
    ],
    dominant: "Demand destruction · high-cost upstream assets",
    sector: "oil",
  },
  {
    id: "diversified-mining",
    tag: "Mining · Diversified",
    company: "Diversified Mining Portfolio",
    headline: "Heat and water stress compound for open-pit assets. The models do not.",
    problem:
      "Open-pit mining operations in arid regions face a compounding physical risk profile. Heat stress reduces labour productivity. Water scarcity constrains processing. Regulatory pressure on tailings discharge adds compliance cost. Most climate risk models treat these as independent: CRI models their joint probability distribution across NGFS scenarios.",
    approach: [
      "Ran joint hazard exposure analysis: heat stress (WBGT), water availability, flood, tailings regulatory risk",
      "Mapped 12 operating mines against NASA NEX-GDDP temperature projections to 2050",
      "Quantified productivity loss curves: % output reduction per degree of WBGT exceedance",
      "Modelled water tariff escalation under chronic scarcity for processing-intensive assets",
      "Generated TCFD and IFRS S2 scenario analysis narrative with quantitative tables",
    ],
    results: [
      { label: "CRI Score", value: "61 / 100" },
      { label: "Rating", value: "C" },
      { label: "Physical loss (2040)", value: "$18M / yr" },
      { label: "Productivity impact", value: "−7% CAGR (NZE)" },
      { label: "WACC uplift", value: "+140 bps" },
      { label: "EV at risk (CP)", value: "−9.2%" },
    ],
    dominant: "Heat stress · Pilbara and Atacama assets",
    sector: "iron_ore",
  },
  {
    id: "european-bank",
    tag: "Banking · Loan book",
    company: "European Corporate Lending Portfolio",
    headline: "A bank's climate risk is the climate risk of its borrowers.",
    problem:
      "European banks face dual climate risk: direct physical exposure of owned assets (offices, data centres) and indirect transition risk transmitted through the loan book. A corporate loan to a water-stressed manufacturer carries embedded climate default risk. Regulators now require banks to quantify this at the counterparty level under EBA and ECB stress testing guidance.",
    approach: [
      "Scored 35 corporate borrowers using CRI ratings as counterparty climate risk proxies",
      "Estimated probability-of-default uplift as a function of CRI score under each NGFS scenario",
      "Aggregated expected credit loss (ECL) uplift across the loan portfolio for each scenario",
      "Generated BRSR and TCFD portfolio-level disclosure with sector breakdown",
      "Flagged 7 counterparties for immediate review: CRI D or E, loan maturity beyond 2035",
    ],
    results: [
      { label: "Portfolio avg CRI", value: "44 / 100" },
      { label: "Counterparties D/E", value: "7 of 35" },
      { label: "ECL uplift (NZE 2035)", value: "+€42M" },
      { label: "Loan book at risk", value: "23% by value" },
      { label: "Review flagged", value: "7 counterparties" },
      { label: "Disclosure ready", value: "BRSR + TCFD" },
    ],
    dominant: "Transition risk transmission · energy and materials sectors",
    sector: "financial_services",
  },
];

const RATING_COLORS: Record<string, string> = {
  A: "text-green-400",
  B: "text-green-500",
  C: "text-yellow-400",
  D: "text-orange-400",
  E: "text-red-400",
};

export default function CasesPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 border-b border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/4 mb-6">
            <span className="text-xs text-slate-500 font-mono">Case studies</span>
          </div>
          <h1 className="heading-xl text-white mb-5 max-w-3xl text-balance">
            The engine. Applied.
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            CRI analysis across real portfolios and sectors. Every result is reproducible.
            Every number has a methodology behind it.
          </p>
        </div>
      </section>

      {/* Cases */}
      {CASES.map((c, i) => (
        <section
          key={c.id}
          id={c.id}
          className="px-6 py-20 border-t border-white/6"
        >
          <div className="max-w-7xl mx-auto">
            {/* Tag + headline */}
            <span className="text-xs font-mono text-green-500 tracking-widest mb-4 block">
              {c.tag}
            </span>
            <h2 className="heading-md text-white mb-3 max-w-3xl">{c.company}</h2>
            <p className="text-slate-300 text-lg max-w-3xl mb-10 leading-relaxed italic">
              &ldquo;{c.headline}&rdquo;
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Problem + approach */}
              <div className="md:col-span-2 space-y-7">
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                    The problem
                  </h3>
                  <p className="text-slate-400 leading-relaxed text-sm">{c.problem}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                    Approach
                  </h3>
                  <div className="space-y-2">
                    {c.approach.map((step, j) => (
                      <div key={j} className="flex items-start gap-3 text-sm">
                        <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                        <span className="text-slate-400">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-mono">
                  Dominant hazard: {c.dominant}
                </p>
              </div>

              {/* Results panel */}
              <div>
                <div className="rounded-xl border border-white/8 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-black/30 border-b border-white/6">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    <span className="ml-3 text-xs text-slate-600 font-mono">cri output</span>
                  </div>
                  <div className="bg-[#030912] p-5">
                    <p className="font-mono text-xs text-slate-600 mb-3">
                      {c.company.toUpperCase()}
                    </p>
                    <div className="space-y-2.5">
                      {c.results.map((r) => (
                        <div key={r.label} className="flex justify-between items-baseline">
                          <span className="text-xs text-slate-600 font-mono">{r.label}</span>
                          <span
                            className={`text-xs font-bold font-mono ${
                              r.label === "Rating"
                                ? RATING_COLORS[r.value] ?? "text-white"
                                : r.value.startsWith("−") || r.value.startsWith("+")
                                ? r.value.startsWith("−")
                                  ? "text-orange-400"
                                  : "text-red-400"
                                : "text-slate-300"
                            }`}
                          >
                            {r.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="px-6 pb-24 pt-8 border-t border-white/6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-2xl border border-green-500/20 bg-green-500/4 p-10">
            <h2 className="heading-md text-white mb-4">Run your portfolio next.</h2>
            <p className="text-slate-500 mb-8">
              30-minute demo. Live analysis on your sector. No data sharing required.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="btn-primary px-8 py-3.5">
                Book a demo →
              </Link>
              <Link href="/platform" className="btn-ghost px-8 py-3.5">
                See the platform
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
