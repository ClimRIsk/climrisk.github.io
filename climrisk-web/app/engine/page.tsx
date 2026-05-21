import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Engine",
  description: "The CRI Engine methodology: GPS hazard physics, NGFS Phase 4 scenarios, financial quantification, and composite rating. Four-layer architecture explained.",
};

const LAYERS = [
  {
    num: "01",
    title: "GPS Hazard Physics",
    sub: "Real spatial data. Not lookup tables.",
    desc: "Asset coordinates are resolved against WRI Aqueduct 4.0 for water stress, NASA NEX-GDDP for temperature and precipitation, and IPCC AR6 WG1 hazard atlases for 25 hazard types. The result is an asset-specific hazard probability path from 2026 to 2050 under each SSP scenario.",
    sources: ["WRI Aqueduct 4.0", "NASA NEX-GDDP", "IPCC AR6 WG1 Ch11", "FEMA flood zones", "Global Cyclone Risk Model"],
    outputs: ["Annual production loss fraction per hazard", "Decade-by-decade trajectory", "Asset vulnerability multipliers by equipment type"],
  },
  {
    num: "02",
    title: "Climate Scenarios",
    sub: "NGFS Phase 4. Three pathways.",
    desc: "Three NGFS Phase 4 scenarios define the policy and physical environment: Net Zero 2050 (front-loaded transition), Delayed Transition (policy lag then emergency repricing), and Current Policies (physical risk dominant). Each scenario carries a carbon price path, commodity demand curve, and physical hazard trajectory.",
    sources: ["NGFS Phase 4 (2023)", "IIASA scenario database", "IEA WEO 2024", "Wood Mackenzie consensus"],
    outputs: ["Carbon price path 2026–2050 ($/tCO₂e)", "Commodity demand index by sector", "Physical hazard intensity multipliers"],
  },
  {
    num: "03",
    title: "Financial Quantification",
    sub: "Every hazard becomes a dollar number.",
    desc: "For each asset and each scenario year: revenue from volume × price, opex with carbon-inflated energy cost, physical loss cost from hazard-disrupted production margin, carbon cost from Scope 1+2 EU ETS exposure, transition capex from abatement MACC, and stranded asset writedowns when price falls below full unit cost.",
    sources: ["CDP disclosed emissions data", "Wood Mackenzie commodity prices", "EU ETS registry", "MSCI peer financials"],
    outputs: ["Annual FCF trajectory per scenario", "Physical loss cost by hazard (€)", "Carbon cost as EU ETS exposure (€)", "Stranded asset writedowns (€)"],
  },
  {
    num: "04",
    title: "Composite CRI Rating",
    sub: "A–E. Backed by three pillar scores.",
    desc: "The composite CRI score (0–100) weights three pillars: Physical Risk (avg annual loss / revenue across scenarios), Transition Risk (carbon burden + EBITDA compression under NZE), and Financial Impact (NPV delta NZE vs Current Policies, WACC uplift, equity VaR). DCF discounts all FCF streams at climate-adjusted WACC.",
    sources: ["MSCI ESG benchmark (47 companies)", "Moody's climate VAR study", "S&P Global CSA ratings", "Academic TCFD validation literature"],
    outputs: ["CRI Rating A–E", "Composite score 0–100", "Physical / Transition / Financial pillar scores", "Enterprise and equity value at risk"],
  },
];

export default function EnginePage() {
  return (
    <>
      <section className="pt-32 pb-16 px-6 border-b border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/4 mb-6">
            <span className="text-xs text-slate-500 font-mono">Methodology</span>
          </div>
          <h1 className="heading-xl text-white mb-5 max-w-3xl">The CRI Engine.</h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed mb-6">
            Four layers. GPS hazard physics to composite climate rating.
            Every calculation traces to a published source.
          </p>
          <div className="flex gap-4">
            <Link href="/validation" className="btn-ghost">See validation results →</Link>
            <Link href="https://climrisk.io/CRI_Methodology_Morelli_v0.3.pdf" target="_blank" className="btn-ghost">
              Download methodology PDF →
            </Link>
          </div>
        </div>
      </section>

      {LAYERS.map((layer, i) => (
        <section key={layer.num} className={`px-6 py-20 ${i > 0 ? "border-t border-white/6" : ""}`}>
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="md:col-span-1">
                <div className="text-5xl font-black text-white/6 font-mono mb-4">{layer.num}</div>
                <h2 className="heading-md text-white mb-2">{layer.title}</h2>
                <p className="text-green-400 text-sm font-medium mb-4">{layer.sub}</p>
                <div className="space-y-1">
                  <p className="text-xs text-slate-600 uppercase tracking-widest mb-2">Data sources</p>
                  {layer.sources.map((s) => (
                    <div key={s} className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-green-500/40 shrink-0" />{s}
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <p className="text-slate-400 leading-relaxed mb-8">{layer.desc}</p>
                <div className="rounded-xl border border-white/7 bg-[#0b1f38] p-5">
                  <p className="text-xs text-slate-600 uppercase tracking-widest mb-3">Outputs</p>
                  <div className="space-y-2">
                    {layer.outputs.map((o) => (
                      <div key={o} className="flex items-start gap-3 text-sm">
                        <span className="text-green-500 mt-0.5 shrink-0">→</span>
                        <span className="text-slate-300">{o}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="px-6 py-16 border-t border-white/6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="heading-md text-white mb-4">Questions about the methodology?</h2>
          <p className="text-slate-500 mb-6">The full methodology note is available as a PDF. For validation study access or technical questions, contact the team.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="btn-primary">Contact us →</Link>
            <Link href="/validation" className="btn-ghost">See validation →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
