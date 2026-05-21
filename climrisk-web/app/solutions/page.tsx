import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Solutions",
  description: "ClimRisk for banks, asset managers, manufacturing, mining, real estate, insurance, consultancies, and governments. Sector-specific climate financial risk intelligence.",
};

const SECTORS = [
  { id: "banks", label: "Banks", problem: "Physical and transition risk in loan portfolios is largely unmeasured.", inputs: ["Corporate loan book", "Project finance assets", "Real estate collateral"], outputs: ["Physical risk per borrower (€)", "Carbon cost burden vs EBITDA", "Portfolio Climate VaR", "TCFD / EBA stress test outputs"], metric: "Credit risk re-pricing before regulators mandate it." },
  { id: "asset-managers", label: "Asset Managers", problem: "ESG scores don't quantify climate-driven equity downside.", inputs: ["Equity or fixed income portfolio", "Company asset registries", "Sector allocations"], outputs: ["EV at risk under NZE 2050 (%)", "Physical exposure per holding", "SFDR Article 8/9 climate metrics", "Portfolio-level CRI rating"], metric: "Quantify climate alpha and downside in every fund." },
  { id: "manufacturing", label: "Manufacturing", problem: "Facility-level physical risk is invisible until a flood or heat event hits.", inputs: ["Plant locations (lat/lon)", "Production volumes", "Energy and carbon data"], outputs: ["Flood/heat/drought loss per facility (€)", "EU ETS cost trajectory", "Adaptation capex requirements", "Supply chain vulnerability map"], metric: "Know which facilities are at risk before insurance renewal." },
  { id: "mining", label: "Mining", problem: "Water stress and heat are already disrupting operations in Latin America and Australia.", inputs: ["Mine coordinates", "Commodity type and volume", "Remaining asset life"], outputs: ["Water stress index (WRI Aqueduct)", "Stranded asset probability by scenario", "Break-even carbon price", "Physical loss trajectory 2026–2050"], metric: "Model stranding before capex is committed." },
  { id: "real-estate", label: "Real Estate", problem: "Flood and heat risk is repricing assets faster than valuers are adjusting.", inputs: ["Property coordinates", "Asset type and value", "Lease tenure"], outputs: ["Flood risk by return period (1-in-20yr)", "Heat stress habitability threshold", "Insurance cost trajectory", "Green premium vs brown discount"], metric: "Avoid stranded brown assets. Price the green premium." },
  { id: "consultancies", label: "Consultancies", problem: "Clients need CSRD and IFRS S2 reports. Manual analysis doesn't scale.", inputs: ["Client asset data", "Sector and geography", "Reporting framework"], outputs: ["CSRD Art.29a disclosure", "IFRS S2 quantitative metrics", "TCFD scenario narrative", "EU Taxonomy DNSH assessment"], metric: "Run 10x more CSRD engagements with the same team." },
];

export default function SolutionsPage() {
  return (
    <>
      <section className="pt-32 pb-16 px-6 border-b border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/4 mb-6">
            <span className="text-xs text-slate-500 font-mono">Solutions by sector</span>
          </div>
          <h1 className="heading-xl text-white mb-5 max-w-3xl">Built for your sector.</h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            The same engine. Sector-specific inputs, outputs, and metrics for every climate-exposed industry.
          </p>
        </div>
      </section>

      {SECTORS.map((sector, i) => (
        <section key={sector.id} id={sector.id} className={`px-6 py-20 ${i > 0 ? "border-t border-white/6" : ""}`}>
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-14 items-start">
            <div>
              <h2 className="heading-md text-white mb-3">{sector.label}</h2>
              <p className="text-slate-500 mb-6 italic">{sector.problem}</p>
              <div className="mb-6">
                <p className="text-xs text-slate-600 uppercase tracking-widest mb-3">Inputs</p>
                <div className="space-y-1.5">
                  {sector.inputs.map((inp) => (
                    <div key={inp} className="flex items-center gap-2 text-sm text-slate-400">
                      <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />{inp}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                <p className="text-xs text-green-500 font-semibold mb-1">Why it matters</p>
                <p className="text-sm text-slate-300">{sector.metric}</p>
              </div>
            </div>
            <div className="rounded-xl border border-white/7 bg-[#0b1f38] p-6">
              <p className="text-xs text-slate-600 uppercase tracking-widest mb-4">Outputs from the CRI Engine</p>
              <div className="space-y-3">
                {sector.outputs.map((out) => (
                  <div key={out} className="flex items-start gap-3 text-sm">
                    <span className="text-green-500 shrink-0">→</span>
                    <span className="text-slate-300">{out}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="px-6 py-16 border-t border-white/6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="heading-md text-white mb-4">Your sector not listed?</h2>
          <p className="text-slate-500 mb-6">The engine runs on any asset with coordinates. Contact us to discuss agriculture, infrastructure, shipping, or government portfolios.</p>
          <Link href="/contact" className="btn-primary">Get in touch →</Link>
        </div>
      </section>
    </>
  );
}
