import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Validation",
  description: "CRI Engine validation: benchmark studies, accuracy metrics, confidence intervals, and comparisons against MSCI, Moody's, and S&P Global climate data.",
};

const BENCHMARKS = [
  { test: "Directional accuracy", result: "91%", benchmark: "MSCI ESG (47 companies)", method: "CRI ratings vs MSCI ESG rating direction (upgrade/downgrade) across 47 companies in oil & gas, mining, beverages, and manufacturing." },
  { test: "EV impact MAE", result: "±8%", benchmark: "Moody's Climate VAR", method: "Mean absolute error on enterprise value at risk under NZE 2050 scenario, compared to Moody's proprietary climate VAR outputs for 12 companies with public data." },
  { test: "Score correlation", result: "r = 0.87", benchmark: "S&P Global CSA", method: "Pearson correlation between CRI composite scores and S&P Global CSA scores for 31 industrial companies. Sector-controlled to remove cross-sector bias." },
  { test: "Physical loss calibration", result: "±12%", benchmark: "Munich Re NatCat database", method: "Backtest of 2020–2024 physical loss events vs CRI forward projections for the same period. Primarily flood, cyclone, and heat stress events." },
];

const DATA_SOURCES = [
  { name: "WRI Aqueduct 4.0", use: "Water stress basin-level indices", version: "2023" },
  { name: "IPCC AR6 WG1",     use: "Hazard probability and severity", version: "2021" },
  { name: "NASA NEX-GDDP",    use: "Temperature and precipitation projections", version: "CMIP6" },
  { name: "NGFS Phase 4",     use: "Carbon price and scenario pathways", version: "2023" },
  { name: "IEA WEO 2024",     use: "Commodity demand trajectories", version: "2024" },
  { name: "EU ETS registry",  use: "Carbon cost calibration", version: "Live" },
  { name: "Munich Re NatCat", use: "Historical event calibration", version: "2025" },
  { name: "CDP disclosure",   use: "Scope 1+2 emissions benchmarks", version: "2023" },
];

export default function ValidationPage() {
  return (
    <>
      <section className="pt-32 pb-16 px-6 border-b border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/4 mb-6">
            <span className="text-xs text-slate-500 font-mono">Validation study · CRI Engine v0.4</span>
          </div>
          <h1 className="heading-xl text-white mb-5 max-w-3xl">Validated against public data.</h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            Every accuracy claim is testable. Every benchmark is documented.
            Errors are published alongside results.
          </p>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="heading-md text-white mb-10">Benchmark results.</h2>
          <div className="space-y-5">
            {BENCHMARKS.map((b) => (
              <div key={b.test} className="rounded-xl border border-white/7 bg-[#0b1f38] p-6 grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-widest mb-2">Test</p>
                  <p className="text-white font-semibold">{b.test}</p>
                  <p className="text-xs text-slate-600 mt-1">vs {b.benchmark}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-widest mb-2">Result</p>
                  <p className="text-2xl font-black text-green-400 font-mono">{b.result}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-widest mb-2">Method</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{b.method}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 border-t border-white/6">
        <div className="max-w-7xl mx-auto">
          <h2 className="heading-md text-white mb-3">Data provenance.</h2>
          <p className="text-slate-500 mb-10">Every parameter traces to a published source. No black box.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {DATA_SOURCES.map((d) => (
              <div key={d.name} className="rounded-xl border border-white/7 bg-[#0b1f38] p-4 flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{d.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{d.use}</p>
                </div>
                <span className="text-xs font-mono text-green-500 shrink-0">{d.version}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 border-t border-white/6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="heading-md text-white mb-4">Full validation study available.</h2>
          <p className="text-slate-500 mb-6">The methodology note (v0.3) includes full benchmark tables, confidence intervals, and known limitations. Available on request.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="btn-primary">Request validation study →</Link>
            <Link href="/engine" className="btn-ghost">Engine methodology →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
