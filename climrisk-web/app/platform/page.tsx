import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Platform",
  description: "Upload assets. Receive financial risk scores. Generate CSRD-ready disclosure reports. No setup. No consultants.",
};

const TERMINAL = [
  "$ cri ingest portfolio.xlsx",
  "",
  "Parsing 47 assets...           ✓",
  "Resolving coordinates...       ✓",
  "WRI Aqueduct water stress...   ✓",
  "NASA NEX-GDDP temperature...   ✓",
  "NGFS Phase 4 scenarios...      ✓",
  "",
  "HEINEKEN N.V.   CRI: 68   Rating: D",
  "─────────────────────────────────────",
  "Physical loss (2030):    $42M / yr",
  "Carbon cost (2030):      €26M EU ETS",
  "WACC uplift:             +185 bps",
  "EV impact (NZE):         −12.8%",
  "─────────────────────────────────────",
  "Report ready:  Heineken_CSRD_2026.pdf",
];

const MODULES = [
  { label: "Dashboard",          desc: "Portfolio CRI scores by sector, geography, and scenario" },
  { label: "Data Intake",        desc: "Excel / CSV upload with geocoding and WRI enrichment" },
  { label: "Risk Outputs",       desc: "Physical loss, carbon cost, WACC uplift, EV at risk" },
  { label: "Asset Map",          desc: "Interactive map with hazard layer overlays and drill-down" },
  { label: "Disclosure Reports", desc: "CSRD, IFRS S2, TCFD, BRSR — one click to PDF" },
];

export default function PlatformPage() {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 pt-28 pb-20">
      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">
        <div>
          <span className="text-xs font-mono text-green-500 tracking-widest mb-4 block">Platform</span>
          <h1 className="heading-xl text-white mb-5 text-balance">
            Upload once.<br />Receive everything.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Paste an asset registry. The engine resolves coordinates, pulls real spatial data,
            runs three NGFS scenarios, and returns financial exposure and disclosure reports.
            Under 3 minutes. No consultants.
          </p>
          <div className="space-y-2.5 mb-10">
            {MODULES.map((m) => (
              <div key={m.label} className="flex items-start gap-3 text-sm">
                <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                <div>
                  <span className="text-white font-medium">{m.label}</span>
                  <span className="text-slate-500"> — {m.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="https://climrisk.io/app.html" target="_blank" className="btn-primary">
              Access platform →
            </Link>
            <Link href="/contact" className="btn-ghost">Book a demo</Link>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden border border-white/8">
          <div className="flex items-center gap-2 px-4 py-3 bg-black/30 border-b border-white/6">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            <span className="ml-3 text-xs text-slate-600 font-mono">climrisk-platform</span>
          </div>
          <div className="bg-[#030912] p-5 font-mono text-xs text-slate-400 leading-relaxed space-y-0.5">
            {TERMINAL.map((line, i) => (
              <div key={i} className={line.startsWith("─") ? "text-slate-800" : line === "" ? "h-3" : ""}>
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
