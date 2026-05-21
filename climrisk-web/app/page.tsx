"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const TICKER_ITEMS = [
  { label: "DEN BOSCH · WATER RISK",   value: "€26M ETS exposure",  dir: "neg" },
  { label: "MONTERREY · WATER STRESS", value: "4.6/5.0 WRI",        dir: "neg" },
  { label: "VUNG TAU · CYCLONE RISK",  value: "6.8% annual loss",   dir: "neg" },
  { label: "ADDIS ABABA · HEAT",       value: "SSP3-7.0 flagged",   dir: "neg" },
  { label: "NZE 2050 · CARBON PRICE",  value: "$130/tCO₂e by 2030", dir: "neu" },
  { label: "CSRD ART.29A · STATUS",    value: "DNSH compliant",     dir: "pos" },
  { label: "CRI ENGINE",               value: "v0.4 · NGFS Phase 4", dir: "neu" },
  { label: "IPCC AR6 HAZARDS",         value: "25 types covered",   dir: "pos" },
];

const ENGINE_STEPS = [
  { id: 1, label: "Ingesting asset coordinates",  time: 0,    detail: "5 assets · 4 countries · lat/lon resolved" },
  { id: 2, label: "WRI Aqueduct 4.0 query",       time: 900,  detail: "Water stress indices pulled per basin" },
  { id: 3, label: "IPCC AR6 hazard matrix",       time: 1800, detail: "25 hazard types · SSP1-2.6 → SSP3-7.0" },
  { id: 4, label: "NGFS Phase 4 scenarios",       time: 2800, detail: "NZE 2050 · Delayed Transition · Current Policies" },
  { id: 5, label: "Physical risk quantification", time: 3700, detail: "Annual damage rates · Decade trajectories" },
  { id: 6, label: "Carbon cost modelling",        time: 4500, detail: "EU ETS · CBAM · Scope 1+2 exposure" },
  { id: 7, label: "DCF + WACC uplift",            time: 5300, detail: "Enterprise value at risk · Equity delta" },
  { id: 8, label: "CRI Rating computed",          time: 6000, detail: "Composite score · Pillar breakdown · Report" },
];

const RESULTS = [
  { label: "CRI Score",   value: "68/100",  badge: "D",    color: "#ef4444" },
  { label: "Water risk",  value: "$1.4B",   badge: "HIGH",  color: "#f59e0b" },
  { label: "NPV at risk", value: "$575M",   badge: "↓",    color: "#ef4444" },
  { label: "EV impact",   value: "−12.8%",  badge: "↓",    color: "#ef4444" },
];

const VALIDATION_STATS = [
  { value: "91%",  label: "directional accuracy vs MSCI ESG",  note: "47-company benchmark" },
  { value: "±8%",  label: "EV impact mean absolute error",      note: "vs Moody's climate VAR" },
  { value: "0.87", label: "Pearson r vs S&P Global CSA",        note: "Sector-controlled" },
  { value: "25",   label: "IPCC AR6 hazard types modelled",     note: "Heat to inundation" },
];

const USE_CASES = [
  { sector: "Banks",          example: "Physical risk in loan portfolios" },
  { sector: "Asset Managers", example: "Portfolio climate stress testing" },
  { sector: "Manufacturing",  example: "Facility-level hazard exposure" },
  { sector: "Mining",         example: "Asset stranding probability" },
  { sector: "Real Estate",    example: "Flood and heat risk per property" },
  { sector: "Consultancies",  example: "CSRD / IFRS S2 client reports" },
];

function EngineSimulation() {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function runEngine() {
    if (running) return;
    setRunning(true);
    setDone(false);
    setStep(0);
    timers.current.forEach(clearTimeout);
    timers.current = ENGINE_STEPS.map((s, i) =>
      setTimeout(() => {
        setStep(i + 1);
        if (i === ENGINE_STEPS.length - 1) { setRunning(false); setDone(true); }
      }, s.time)
    );
  }

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return (
    <div className="rounded-xl overflow-hidden border border-white/8 shadow-panel">
      {/* Terminal bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/6 bg-black/30">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        <span className="ml-3 text-xs text-slate-500 font-mono">cri-engine · Heineken N.V. · 5 assets</span>
        <button
          onClick={runEngine}
          disabled={running}
          className={`ml-auto text-xs px-3 py-1 rounded font-mono border transition-all ${
            running
              ? "border-green-500/20 bg-green-900/30 text-green-500 cursor-wait"
              : "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 cursor-pointer"
          }`}
        >
          {running ? "▶ running..." : done ? "▶ run again" : "▶ run analysis"}
        </button>
      </div>

      {/* Log */}
      <div className="bg-[#030912] p-4 space-y-1.5 min-h-[240px] font-mono text-xs">
        {step === 0 && !done && (
          <p className="text-slate-700">
            $ cri run --company heineken-nv --assets 5 --scenarios all
          </p>
        )}
        {ENGINE_STEPS.slice(0, step).map((s) => (
          <div key={s.id} className="flex items-start gap-3">
            <span className="text-green-500 shrink-0">✓</span>
            <span className="text-slate-300">{s.label}</span>
            <span className="text-slate-700 ml-auto shrink-0">{s.detail}</span>
          </div>
        ))}
        {running && step < ENGINE_STEPS.length && (
          <div className="flex items-center gap-2 text-green-400">
            <span className="animate-blink">█</span>
            <span className="text-slate-500">{ENGINE_STEPS[step]?.label}...</span>
          </div>
        )}
      </div>

      {/* Results */}
      {done && (
        <div className="bg-[#060f1e] border-t border-white/6 px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            {RESULTS.map((r) => (
              <div key={r.label} className="bg-white/3 rounded-lg p-3 border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-600">{r.label}</span>
                  <span className="text-xs font-bold px-1.5 rounded" style={{ color: r.color, background: `${r.color}18` }}>
                    {r.badge}
                  </span>
                </div>
                <div className="text-base font-bold text-white font-mono">{r.value}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-700 font-mono">CRI Engine v0.4 · 6.3s · NGFS Phase 4 · IPCC AR6</span>
            <Link href="/platform" className="text-xs text-green-400 hover:text-green-300 transition-colors">
              Full report →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* Ticker */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-[#030912]/80 backdrop-blur-sm border-b border-white/5 overflow-hidden h-7">
        <div className="animate-ticker flex items-center h-full" style={{ width: "max-content" }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center shrink-0 px-5 gap-2 text-xs font-mono border-r border-white/5 h-full">
              <span className="text-slate-700">{item.label}</span>
              <span className={item.dir === "neg" ? "text-red-400" : item.dir === "pos" ? "text-green-400" : "text-slate-400"}>
                {item.value}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="relative pt-44 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-grid-dark bg-grid opacity-100 pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-green-500/5 blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/25 bg-green-500/6 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-green" />
              <span className="text-xs font-medium text-green-400 tracking-wide">CRI Engine v0.4 · NGFS Phase 4 · IPCC AR6</span>
            </div>
            <h1 className="heading-xl text-white mb-6 text-balance">
              Climate intelligence<br />
              for{" "}
              <span className="grad-green">capital decisions.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-2xl">
              Quantify physical risk, transition risk, and financial exposure across your portfolio.
              Asset by asset. Scenario by scenario. From GPS hazard physics to EV at risk — in minutes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/platform" className="btn-primary text-base px-6 py-3.5">
                Explore the platform
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
              <Link href="/validation" className="btn-ghost text-base px-6 py-3.5">See validation</Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-10">
              {["CSRD Ready", "IFRS S2", "TCFD", "EU Taxonomy", "BRSR", "SBTi"].map((f) => (
                <span key={f} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="w-1 h-1 rounded-full bg-green-500/50" />{f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why ESG fails */}
      <section className="px-6 py-16 border-t border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { stat: "$0", label: "financial outputs from most ESG tools", problem: "ESG scores don't quantify financial loss.", detail: "They rank exposure. They don't translate a $1.4B water risk to balance sheet impact next quarter." },
              { stat: "83%", label: "of TCFD reporters lack quantitative physical risk", problem: "Physical risk is treated as binary.", detail: "High/medium/low heatmaps don't model asset-level cash flow disruption or scenario-specific damage rates." },
              { stat: "NGFS P4", label: "only 12% of firms use the full scenario set", problem: "Scenario analysis stops at carbon price.", detail: "Transition risk includes commodity demand shifts, CBAM, stranded assets, and WACC repricing — all need modelling." },
            ].map((card, i) => (
              <div key={i} className="rounded-xl border border-white/7 bg-[#0b1f38] p-6">
                <div className="text-2xl font-black text-white font-mono mb-0.5">{card.stat}</div>
                <div className="text-xs text-slate-600 mb-4">{card.label}</div>
                <p className="text-sm font-semibold text-white mb-2">{card.problem}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{card.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Engine */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-14 items-start">
          <div>
            <span className="block w-10 h-0.5 bg-green-500 rounded mb-6" />
            <h2 className="heading-lg text-white mb-5">Watch the engine run.</h2>
            <p className="text-slate-400 leading-relaxed mb-7">
              The CRI Engine ingests your asset coordinates, pulls real spatial data from WRI Aqueduct
              and IPCC AR6, runs three NGFS scenarios, and returns financial exposure in one pass.
            </p>
            <div className="space-y-3 mb-8">
              {["GPS hazard physics from real spatial datasets", "Three NGFS Phase 4 scenarios in parallel", "Asset-level physical and transition risk", "DCF with climate-adjusted WACC", "CSRD, TCFD, and IFRS S2 disclosure output"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm">
                  <span className="text-green-500">✓</span>
                  <span className="text-slate-400">{item}</span>
                </div>
              ))}
            </div>
            <Link href="/engine" className="btn-ghost">Deep dive into the methodology →</Link>
          </div>
          <EngineSimulation />
        </div>
      </section>

      {/* Validation */}
      <section className="px-6 py-20 border-t border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="block w-10 h-0.5 bg-green-500 rounded mx-auto mb-6" />
            <h2 className="heading-lg text-white mb-3">Built to be verified.</h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Every output traces to published datasets. Benchmark results are public. Errors are documented.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {VALIDATION_STATS.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/7 bg-[#0b1f38] p-6 text-center">
                <div className="text-3xl font-black text-green-400 font-mono mb-2">{s.value}</div>
                <div className="text-sm text-white font-medium mb-1">{s.label}</div>
                <div className="text-xs text-slate-600">{s.note}</div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/validation" className="btn-ghost inline-flex">Read the full validation study →</Link>
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="block w-10 h-0.5 bg-green-500 rounded mb-6" />
              <h2 className="heading-lg text-white">Built for every climate-exposed sector.</h2>
            </div>
            <Link href="/solutions" className="btn-ghost shrink-0">All solutions →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {USE_CASES.map((uc) => (
              <Link
                key={uc.sector}
                href={`/solutions#${uc.sector.toLowerCase().replace(" ", "-")}`}
                className="rounded-xl border border-white/7 bg-[#0b1f38] p-5 hover:border-green-500/30 hover:bg-green-500/3 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-white">{uc.sector}</span>
                  <svg className="text-slate-700 group-hover:text-green-500 transition-colors" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </div>
                <p className="text-xs text-slate-500">{uc.example}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-2xl border border-green-500/20 bg-green-500/4 p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-dark bg-grid opacity-50 pointer-events-none" />
            <div className="relative">
              <h2 className="heading-md text-white mb-4">Run your first analysis today.</h2>
              <p className="text-slate-500 mb-8">
                Upload a portfolio, receive asset-level climate risk scores, financial exposure,
                and a CSRD-ready disclosure report. No consultancy required.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="https://climrisk.io/app.html" target="_blank" className="btn-primary text-base px-8 py-3.5">
                  Access platform
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
                <Link href="/contact" className="btn-ghost text-base px-8 py-3.5">Book a demo</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
