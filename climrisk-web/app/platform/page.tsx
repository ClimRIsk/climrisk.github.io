import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Platform",
  description: "The CRI Platform: dashboard, asset upload, risk maps, scenario outputs, and CSRD-ready disclosure reports. Built for banks, asset managers, and industrial companies.",
};

const MODULES = [
  {
    id: "dashboard",
    label: "01 / Dashboard",
    title: "Portfolio risk at a glance.",
    desc: "The ClimRisk dashboard aggregates physical exposure, transition risk, and financial impact across your entire asset base. CRI ratings by sector, geography, and scenario — in one view.",
    stats: [
      { value: "5s", label: "time to portfolio overview" },
      { value: "3", label: "NGFS scenarios in parallel" },
    ],
    features: ["Asset-level CRI scores", "Geographic heat map", "Scenario comparison strip", "Regulatory framework status"],
    terminal: [
      "PORTFOLIO SUMMARY   ·   Q1 2026",
      "─────────────────────────────────",
      "Assets analysed:     47",
      "High risk (D–E):     12  (25.5%)",
      "Elevated risk (C):   18  (38.3%)",
      "Moderate or lower:   17  (36.2%)",
      "─────────────────────────────────",
      "Worst exposure:      Water stress · MX-NL",
      "Scenario stress:     NZE 2050 · EV −14.2%",
    ],
  },
  {
    id: "upload",
    label: "02 / Data Intake",
    title: "Upload once. Receive everything.",
    desc: "Paste an Excel sheet or CSV with your asset registry. The engine resolves coordinates via geocoding, enriches with open-source spatial data, and runs the full analysis automatically.",
    stats: [
      { value: "<3min", label: "from upload to full report" },
      { value: "0", label: "consultants required" },
    ],
    features: ["Excel / CSV upload", "Lat/lon geocoding", "WRI Aqueduct enrichment", "NGFS scenario resolution"],
    terminal: [
      "$ cri ingest portfolio.xlsx",
      "",
      "Parsing 47 assets...           ✓",
      "Resolving coordinates...       ✓",
      "WRI Aqueduct water stress...   ✓",
      "NASA NEX-GDDP temperature...   ✓",
      "NGFS Phase 4 scenarios...      ✓",
      "",
      "Ready. Run: cri analyze --all",
    ],
  },
  {
    id: "outputs",
    label: "03 / Risk Outputs",
    title: "Financial numbers. Not heatmaps.",
    desc: "Every output is financial. Physical loss cost in dollars. Carbon cost as EU ETS exposure. WACC uplift in basis points. Enterprise value at risk as a percentage. No qualitative ratings — quantitative results.",
    stats: [
      { value: "8", label: "financial metrics per asset" },
      { value: "2026", label: "to 2050 trajectory" },
    ],
    features: ["Annual physical loss cost (€)", "EU ETS carbon cost (€)", "WACC uplift (bps)", "EV at risk (%)"],
    terminal: [
      "HEINEKEN N.V.   CRI: 68   Rating: D",
      "─────────────────────────────────────",
      "Physical loss (2030):    $42M/yr",
      "Carbon cost (2030):      €26M EU ETS",
      "WACC uplift:             +185 bps",
      "NPV at risk:             −$575M",
      "EV impact (NZE):         −12.8%",
      "─────────────────────────────────────",
      "Dominant hazard:         Water stress",
    ],
  },
  {
    id: "maps",
    label: "04 / Asset Map",
    title: "Every asset. On a risk map.",
    desc: "Leaflet.js powered map with per-asset CRI rating overlays. Click any asset to drill into its hazard profile, scenario trajectory, and financial breakdown. Export as GeoJSON for GIS integration.",
    stats: [
      { value: "25", label: "hazard types per asset" },
      { value: "GeoJSON", label: "export for GIS teams" },
    ],
    features: ["Interactive asset map", "Hazard layer overlays", "Drill-down per asset", "GeoJSON / KML export"],
    terminal: [
      "MAP LAYER: Water Stress (WRI Aqueduct)",
      "─────────────────────────────────────",
      "Monterrey  (25.7°N 100.3°W)  4.6/5 ■■■■□",
      "Meoqui     (28.3°N 105.5°W)  4.5/5 ■■■■□",
      "Den Bosch  (51.7°N 5.3°E)    1.2/5 ■□□□□",
      "Vung Tau   (10.4°N 107.1°E)  2.8/5 ■■□□□",
      "Addis Ababa (9.0°N 38.7°E)   3.1/5 ■■■□□",
      "─────────────────────────────────────",
      "Basin-level data: WRI Aqueduct 4.0",
    ],
  },
  {
    id: "reports",
    label: "05 / Disclosure Reports",
    title: "CSRD-ready reports. One click.",
    desc: "The engine generates structured disclosure reports for CSRD Article 29a, IFRS S2, TCFD, EU Taxonomy DNSH, and BRSR. Narrative text, data tables, and scenario analysis included.",
    stats: [
      { value: "5",      label: "regulatory frameworks" },
      { value: "PDF",    label: "and structured data export" },
    ],
    features: ["CSRD Art.29a DNSH", "IFRS S2 quantitative", "TCFD scenario narrative", "EU Taxonomy alignment"],
    terminal: [
      "GENERATING CSRD REPORT  ·  Art.29a",
      "─────────────────────────────────────",
      "Physical risk section...       ✓",
      "Transition risk section...     ✓",
      "Scenario analysis (3)...       ✓",
      "DNSH assessment...             ✓",
      "Financial materiality...       ✓",
      "─────────────────────────────────────",
      "Report ready:  Heineken_CSRD_2026.pdf",
    ],
  },
];

const FRAMEWORKS = [
  { name: "CSRD Art.29a", status: "Full" },
  { name: "IFRS S2",      status: "Full" },
  { name: "TCFD",         status: "Full" },
  { name: "EU Taxonomy",  status: "DNSH" },
  { name: "BRSR",         status: "Core" },
  { name: "SBTi",         status: "Scope" },
];

export default function PlatformPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 border-b border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/4 mb-6">
            <span className="text-xs text-slate-500 font-mono">Platform overview</span>
          </div>
          <h1 className="heading-xl text-white mb-5 max-w-3xl text-balance">
            The CRI Platform.
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mb-8 leading-relaxed">
            Upload assets. Receive financial risk scores. Generate disclosure reports.
            No setup. No consultants. Infrastructure for climate-financial intelligence.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="https://climrisk.io/app.html" target="_blank" className="btn-primary">
              Access platform →
            </Link>
            <Link href="/contact" className="btn-ghost">Book a demo</Link>
          </div>
        </div>
      </section>

      {/* Module sections */}
      {MODULES.map((mod, i) => (
        <section key={mod.id} id={mod.id} className={`px-6 py-20 ${i % 2 === 1 ? "border-t border-white/6" : ""}`}>
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-14 items-start">
            {/* Text side */}
            <div className={i % 2 === 1 ? "md:order-2" : ""}>
              <span className="text-xs font-mono text-green-500 tracking-widest mb-4 block">{mod.label}</span>
              <h2 className="heading-md text-white mb-4">{mod.title}</h2>
              <p className="text-slate-400 leading-relaxed mb-7">{mod.desc}</p>
              <div className="flex gap-8 mb-7">
                {mod.stats.map((s) => (
                  <div key={s.label}>
                    <div className="text-2xl font-black text-green-400 font-mono">{s.value}</div>
                    <div className="text-xs text-slate-600">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {mod.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <span className="text-green-500 text-base">✓</span>
                    <span className="text-slate-400">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Terminal side */}
            <div className={i % 2 === 1 ? "md:order-1" : ""}>
              <div className="rounded-xl overflow-hidden border border-white/8">
                <div className="flex items-center gap-2 px-4 py-3 bg-black/30 border-b border-white/6">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  <span className="ml-3 text-xs text-slate-600 font-mono">climrisk-platform</span>
                </div>
                <div className="bg-[#030912] p-5 font-mono text-xs text-slate-400 leading-relaxed space-y-0.5">
                  {mod.terminal.map((line, j) => (
                    <div key={j} className={line.startsWith("─") ? "text-slate-800" : line === "" ? "h-3" : ""}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Frameworks */}
      <section className="px-6 py-20 border-t border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="heading-md text-white mb-3">Every major framework. One engine.</h2>
            <p className="text-slate-500">Output once. Disclose everywhere.</p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {FRAMEWORKS.map((f) => (
              <div key={f.name} className="rounded-xl border border-white/7 bg-[#0b1f38] p-4 text-center">
                <div className="text-sm font-bold text-white mb-1">{f.name}</div>
                <div className="text-xs text-green-500">{f.status} coverage</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 pt-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-2xl border border-green-500/20 bg-green-500/4 p-10">
            <h2 className="heading-md text-white mb-4">Ready to run your portfolio?</h2>
            <p className="text-slate-500 mb-8">
              Access codes available for pilot clients. Contact shri@climrisk.io for onboarding.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="https://climrisk.io/app.html" target="_blank" className="btn-primary px-8 py-3.5">
                Access platform →
              </Link>
              <Link href="/contact" className="btn-ghost px-8 py-3.5">Book a demo</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
