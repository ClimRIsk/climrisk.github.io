import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cases",
  description: "CRI analysis applied to Heineken, Shell, diversified mining, and a European bank loan book.",
};

const CASES = [
  {
    company: "Heineken N.V.",
    tag: "Beverages · Global",
    headline: "Water stress is a balance sheet risk.",
    stat: "−12.8% EV under NZE 2050",
    detail: "47 breweries. 30%+ in high water stress basins. $42M physical loss per year by 2030. €26M EU ETS exposure. +185 bps WACC uplift. CRI rating: D.",
    score: "68",
    rating: "D",
  },
  {
    company: "Shell plc",
    tag: "Energy · Integrated",
    headline: "Demand destruction hits before 2030.",
    stat: "18% of reserves stranded under NZE",
    detail: "Upstream portfolio segmented by break-even cost. High-cost assets stranded as oil demand peaks under NZE. $28B NPV at risk. WACC uplift +220 bps.",
    score: "74",
    rating: "D",
  },
  {
    company: "Mining Portfolio",
    tag: "Mining · Diversified",
    headline: "Heat and water stress compound.",
    stat: "−7% CAGR productivity under NZE",
    detail: "12 open-pit mines. Joint probability analysis: WBGT heat stress and water scarcity. Productivity loss curves calibrated to IPCC AR6 regional projections.",
    score: "61",
    rating: "C",
  },
  {
    company: "European Bank",
    tag: "Banking · Loan book",
    headline: "Borrower risk is your risk.",
    stat: "+€42M ECL uplift by 2035",
    detail: "35 corporate counterparties scored by CRI. 7 flagged D/E with loan maturity beyond 2035. ECL uplift quantified under NZE. BRSR and TCFD output generated.",
    score: "44",
    rating: "C",
  },
];

const RATING_COLOR: Record<string, string> = {
  A: "text-green-400", B: "text-green-500", C: "text-yellow-400", D: "text-orange-400", E: "text-red-400",
};

export default function CasesPage() {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 pt-28 pb-20">
      <div className="max-w-7xl mx-auto w-full">
        <div className="max-w-2xl mb-14">
          <span className="text-xs font-mono text-green-500 tracking-widest mb-4 block">Case studies</span>
          <h1 className="heading-xl text-white mb-5">The engine. Applied.</h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Real portfolios. Real asset registries. Every number is reproducible.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5 mb-12">
          {CASES.map((c) => (
            <div key={c.company} className="rounded-xl border border-white/7 bg-[#0b1f38]/50 p-7">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs font-mono text-slate-600 mb-1">{c.tag}</p>
                  <h2 className="text-white font-bold text-lg">{c.company}</h2>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="text-xs text-slate-600 font-mono">CRI</div>
                  <div className="text-2xl font-black text-white font-mono">{c.score}</div>
                  <div className={`text-sm font-bold font-mono ${RATING_COLOR[c.rating]}`}>{c.rating}</div>
                </div>
              </div>
              <p className="text-green-400 font-semibold text-sm mb-2">{c.headline}</p>
              <p className="text-xs font-mono text-slate-500 mb-3">{c.stat}</p>
              <p className="text-slate-500 text-sm leading-relaxed">{c.detail}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/contact" className="btn-primary">Run your portfolio →</Link>
          <Link href="/platform" className="btn-ghost">See the platform</Link>
        </div>
      </div>
    </section>
  );
}
