import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Engine",
  description: "GPS hazard physics to financial output. 25 hazard types, NGFS Phase 4, IPCC AR6, DCF with climate-adjusted WACC.",
};

const LAYERS = [
  {
    num: "01",
    name: "GPS Hazard Physics",
    desc: "WRI Aqueduct 4.0 water stress · NASA NEX-GDDP temperature · IPCC AR6 flood and cyclone",
    out: "25 hazard scores per asset",
  },
  {
    num: "02",
    name: "Climate Scenarios",
    desc: "NGFS Phase 4: Net Zero 2050, Delayed Transition, Current Policies · 2026 to 2050 trajectories",
    out: "Demand and price paths per commodity",
  },
  {
    num: "03",
    name: "Financial Quantification",
    desc: "Physical loss cost ($/yr) · EU ETS carbon cost (€) · WACC uplift (bps) · NPV and EV at risk (%)",
    out: "8 financial metrics per asset per scenario",
  },
  {
    num: "04",
    name: "CRI Rating",
    desc: "Composite score 0–100 · Sector-normalised A–E rating · Pillar breakdown: physical, transition, financial",
    out: "CRI score + CSRD / IFRS S2 / TCFD disclosure",
  },
];

export default function EnginePage() {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 pt-28 pb-20">
      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">
        <div>
          <span className="text-xs font-mono text-green-500 tracking-widest mb-4 block">Engine</span>
          <h1 className="heading-xl text-white mb-5 text-balance">
            From GPS coordinates<br />to financial exposure.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            The CRI engine runs in four layers. Each layer is auditable, versioned, and traceable
            to a named peer-reviewed data source. No black box. No ESG proxy scores.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/validation" className="btn-primary">See validation →</Link>
            <Link href="/contact" className="btn-ghost">Request methodology doc</Link>
          </div>
        </div>
        <div className="space-y-3">
          {LAYERS.map((layer) => (
            <div key={layer.num} className="rounded-xl border border-white/7 bg-[#0b1f38]/60 p-5">
              <div className="flex items-start gap-4">
                <span className="text-xs font-mono text-green-500 shrink-0 mt-0.5">{layer.num}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm mb-1">{layer.name}</p>
                  <p className="text-slate-500 text-xs leading-relaxed mb-2">{layer.desc}</p>
                  <p className="text-xs font-mono text-green-500/70">→ {layer.out}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
