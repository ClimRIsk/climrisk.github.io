import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Platform",
  description: "How the CRI Engine reaches you: an advisory retainer, embedded in your deal due diligence, or licensed white-label for your own clients.",
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
  "──────────────────────────────────────────",
  "Physical loss (2030):    $42M / yr",
  "Carbon cost (2030):      €26M EU ETS",
  "WACC uplift:             +185 bps",
  "EV impact (NZE):         −12.8%",
  "──────────────────────────────────────────",
  "Report ready:  Heineken_CSRD_2026.pdf",
];

const ENGAGEMENT_MODELS = [
  {
    label: "Advisory Retainer",
    desc: "Embedded climate risk intelligence for private equity, asset managers, and lenders underwriting large transactions.",
  },
  {
    label: "Embedded Due Diligence",
    desc: "Plugged directly into your deal workflow. A TCFD disclosure, an SFDR PAI pack, an EU Taxonomy screen, and a physical risk VaR come back as one engagement, not a subscription.",
  },
  {
    label: "White Label",
    desc: "Financial institutions license the engine under their own brand for client reporting, with our team running the analysis behind it.",
  },
];

export default function PlatformPage() {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 pt-28 pb-20">
      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">
        <div>
          <span className="text-xs font-mono text-green-500 tracking-widest mb-4 block">Platform</span>
          <h1 className="heading-xl text-white mb-5 text-balance">
            Built into how<br />we work with you.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            The CRI Engine sits underneath every engagement. Hand us an asset registry and it resolves
            coordinates, pulls real spatial data, and runs the full NGFS scenario suite in minutes. What
            you receive back always comes through an advisor who can defend the number, not a download link.
          </p>
          <div className="space-y-4 mb-10">
            {ENGAGEMENT_MODELS.map((m) => (
              <div key={m.label} className="flex items-start gap-3 text-sm">
                <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                <div>
                  <span className="text-white font-medium">{m.label}</span>
                  <p className="text-slate-500 mt-1">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/contact" className="btn-primary">Book a Technical Demo</Link>
            <Link href="https://climrisk.io/app.html" target="_blank" className="btn-ghost">
              See a live walkthrough
            </Link>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden border border-white/8">
          <div className="flex items-center gap-2 px-4 py-3 bg-black/30 border-b border-white/6">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            <span className="ml-3 text-xs text-slate-600 font-mono">climrisk-engine</span>
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
