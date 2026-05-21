"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const ENGINE_STEPS = [
  { id: 1, label: "Ingesting asset coordinates",  time: 0,    detail: "5 assets · 4 countries" },
  { id: 2, label: "WRI Aqueduct 4.0 query",       time: 900,  detail: "Water stress per basin" },
  { id: 3, label: "IPCC AR6 hazard matrix",       time: 1800, detail: "25 hazard types" },
  { id: 4, label: "NGFS Phase 4 scenarios",       time: 2700, detail: "NZE · DT · CP" },
  { id: 5, label: "Physical loss quantification", time: 3500, detail: "Annual damage rates" },
  { id: 6, label: "Carbon cost modelling",        time: 4300, detail: "EU ETS · Scope 1+2" },
  { id: 7, label: "DCF + WACC uplift",            time: 5100, detail: "EV at risk computed" },
  { id: 8, label: "CRI Rating",                   time: 5800, detail: "Score · Rating · Report" },
];

const RESULTS = [
  { label: "CRI Score",   value: "68/100", badge: "D",      color: "#ef4444" },
  { label: "Water risk",  value: "$1.4B",  badge: "HIGH",   color: "#f59e0b" },
  { label: "NPV at risk", value: "$575M",  badge: "↓",      color: "#ef4444" },
  { label: "EV impact",   value: "−12.8%", badge: "NZE",    color: "#ef4444" },
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
      <div className="bg-[#030912] p-4 space-y-1.5 min-h-[220px] font-mono text-xs">
        {step === 0 && !done && (
          <p className="text-slate-700">$ cri run --company heineken-nv --scenarios all</p>
        )}
        {ENGINE_STEPS.slice(0, step).map((s) => (
          <div key={s.id} className="flex items-center gap-3">
            <span className="text-green-500 shrink-0">✓</span>
            <span className="text-slate-300">{s.label}</span>
            <span className="text-slate-700 ml-auto shrink-0 hidden sm:block">{s.detail}</span>
          </div>
        ))}
        {running && step < ENGINE_STEPS.length && (
          <div className="flex items-center gap-2 text-green-400">
            <span className="animate-blink">█</span>
            <span className="text-slate-500">{ENGINE_STEPS[step]?.label}...</span>
          </div>
        )}
      </div>
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
            <span className="text-xs text-slate-700 font-mono">CRI Engine v0.4 · NGFS Phase 4 · IPCC AR6</span>
            <Link href="/platform" className="text-xs text-green-400 hover:text-green-300 transition-colors">
              Full platform →
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
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid-dark bg-grid opacity-100 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-green-500/4 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/25 bg-green-500/6 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-green" />
              <span className="text-xs font-medium text-green-400 tracking-wide">CRI Engine v0.4 · NGFS Phase 4</span>
            </div>
            <h1 className="heading-xl text-white mb-6 text-balance">
              Climate intelligence<br />for{" "}
              <span className="grad-green">capital decisions.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-xl">
              Asset-level climate risk. Quantified in dollars, euros, and basis points.
              Upload a portfolio. Receive financial exposure and CSRD-ready disclosure in minutes.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <Link href="/contact" className="btn-primary text-base px-6 py-3.5">
                Book a demo
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
              <Link href="https://climrisk.io/app.html" target="_blank" className="btn-ghost text-base px-6 py-3.5">
                Access platform
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {["CSRD Art.29a", "IFRS S2", "TCFD", "EU Taxonomy", "BRSR"].map((f) => (
                <span key={f} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="w-1 h-1 rounded-full bg-green-500/40" />{f}
                </span>
              ))}
            </div>
          </div>

          {/* Right: engine demo */}
          <div>
            <EngineSimulation />
          </div>
        </div>
      </section>
    </>
  );
}
