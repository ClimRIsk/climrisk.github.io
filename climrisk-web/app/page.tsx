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

const GLOBE_POINTS = [
  {lat:-6.21, lng:106.84,color:"#ef4444",size:0.65},
  {lat:23.72, lng:90.40, color:"#ef4444",size:0.58},
  {lat:25.77, lng:-80.19,color:"#ef4444",size:0.50},
  {lat:18.96, lng:72.82, color:"#ef4444",size:0.50},
  {lat:6.45,  lng:3.39,  color:"#f59e0b",size:0.45},
  {lat:31.23, lng:121.47,color:"#f59e0b",size:0.45},
  {lat:29.76, lng:-95.37,color:"#f59e0b",size:0.44},
  {lat:25.20, lng:55.27, color:"#f59e0b",size:0.42},
  {lat:30.05, lng:31.23, color:"#f59e0b",size:0.40},
  {lat:40.71, lng:-74.01,color:"#22c55e",size:0.38},
  {lat:51.92, lng:4.47,  color:"#22c55e",size:0.36},
  {lat:35.68, lng:139.69,color:"#22c55e",size:0.36},
  {lat:1.35,  lng:103.82,color:"#22c55e",size:0.34},
  {lat:-33.87,lng:151.21,color:"#22c55e",size:0.34},
  {lat:51.51, lng:-0.12, color:"#3b82f6",size:0.32},
  {lat:48.86, lng:2.35,  color:"#3b82f6",size:0.30},
  {lat:37.77, lng:-122.41,color:"#3b82f6",size:0.30},
  {lat:19.07, lng:-99.14,color:"#f59e0b",size:0.40},
  {lat:55.75, lng:37.62, color:"#22c55e",size:0.34},
  {lat:-34.61,lng:-58.38,color:"#22c55e",size:0.36},
];

const GLOBE_ARCS = [
  {startLat:25.77,startLng:-80.19,endLat:51.51,endLng:-0.12,   color:"rgba(239,68,68,0.7)"},
  {startLat:-6.21,startLng:106.84,endLat:1.35,endLng:103.82,   color:"rgba(245,158,11,0.6)"},
  {startLat:18.96,startLng:72.82, endLat:25.20,endLng:55.27,   color:"rgba(239,68,68,0.6)"},
  {startLat:40.71,startLng:-74.01,endLat:48.86,endLng:2.35,    color:"rgba(59,130,246,0.55)"},
  {startLat:29.76,startLng:-95.37,endLat:37.77,endLng:-122.41, color:"rgba(239,68,68,0.5)"},
  {startLat:23.72,startLng:90.40, endLat:18.96,endLng:72.82,   color:"rgba(239,68,68,0.55)"},
  {startLat:6.45, startLng:3.39,  endLat:30.05,endLng:31.23,   color:"rgba(245,158,11,0.5)"},
  {startLat:51.92,startLng:4.47,  endLat:51.51,endLng:-0.12,   color:"rgba(59,130,246,0.45)"},
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
  const globeEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = globeEl.current;
    if (!el) return;
    let resizeHandler: (() => void) | null = null;

    const script = document.createElement("script");
    script.src = "https://unpkg.com/globe.gl@2";
    script.async = true;
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const GlobeFn = (window as any).Globe;
      if (!GlobeFn || !el) return;

      const g = GlobeFn()(el)
        .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
        .backgroundImageUrl("https://unpkg.com/three-globe/example/img/night-sky.png")
        .atmosphereColor("rgba(60,140,255,0.22)")
        .atmosphereAltitude(0.20)
        .pointsData(GLOBE_POINTS)
        .pointLat("lat").pointLng("lng")
        .pointColor("color").pointRadius("size").pointAltitude(0.015)
        .arcsData(GLOBE_ARCS)
        .arcStartLat("startLat").arcStartLng("startLng")
        .arcEndLat("endLat").arcEndLng("endLng")
        .arcColor("color").arcAltitude(0.22)
        .arcDashLength(0.38).arcDashGap(0.18).arcDashAnimateTime(2800)
        .width(window.innerWidth).height(window.innerHeight);

      g.controls().autoRotate = true;
      g.controls().autoRotateSpeed = 0.28;
      g.controls().enableZoom = false;
      g.controls().enablePan = false;
      g.pointOfView({ lat: 15, lng: 35, altitude: 2.1 });

      resizeHandler = () => g.width(window.innerWidth).height(window.innerHeight);
      window.addEventListener("resize", resizeHandler);
    };
    document.head.appendChild(script);

    return () => {
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  return (
    <>
      {/* ── 3-D Globe background ── */}
      <div
        ref={globeEl}
        style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
      />
      {/* gradient overlay: left = dark (text readable), right = transparent (globe shows) */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none",
          background:
            "linear-gradient(to right, rgba(3,9,18,0.97) 0%, rgba(3,9,18,0.80) 40%, rgba(3,9,18,0.35) 70%, rgba(3,9,18,0.10) 100%)",
        }}
      />

      {/* ── Hero ── */}
      <section
        className="relative min-h-screen flex flex-col justify-center px-6 pt-24 pb-16 overflow-hidden"
        style={{ position: "relative", zIndex: 2 }}
      >
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
