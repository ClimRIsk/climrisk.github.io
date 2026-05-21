import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Research",
  description: "CRI methodology documents, validation studies, LinkedIn articles, and engine changelog.",
};

const PUBLICATIONS = [
  { type: "Methodology",      title: "The CRI Scoring Framework",              status: "On request",   href: "mailto:shri@climrisk.io?subject=CRI Methodology Document" },
  { type: "Validation",       title: "CRI Engine v0.4 Validation Report",      status: "On request",   href: "mailto:shri@climrisk.io?subject=CRI Validation Report" },
  { type: "LinkedIn article", title: "Heineken: Water Stress as Balance Sheet Risk", status: "Published", href: "https://linkedin.com/in/shrinivash" },
  { type: "Release notes",    title: "CRI Engine v0.4 — Changelog",            status: "Released",     href: "mailto:shri@climrisk.io?subject=Engine v0.4 Documentation" },
];

const SOURCES = [
  { name: "WRI Aqueduct 4.0",         role: "Water risk · basin-level" },
  { name: "NASA NEX-GDDP-CMIP6",      role: "Temperature · precipitation" },
  { name: "NGFS Phase 4",             role: "Demand curves · carbon prices" },
  { name: "IPCC AR6 WG2",             role: "Hazard-to-loss transfer functions" },
  { name: "EU ETS forward curves",    role: "Carbon cost trajectories" },
  { name: "EM-DAT",                   role: "Historical loss validation" },
];

export default function ResearchPage() {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 pt-28 pb-20">
      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-start">
        <div>
          <span className="text-xs font-mono text-green-500 tracking-widest mb-4 block">Research</span>
          <h1 className="heading-xl text-white mb-5 text-balance">
            Every number.<br />A named source.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            The engine is only as credible as its sources and its tests.
            Methodology documents and validation reports available on request.
          </p>
          <div className="space-y-2 mb-10">
            {PUBLICATIONS.map((p) => (
              <a
                key={p.title}
                href={p.href}
                target={p.href.startsWith("http") ? "_blank" : undefined}
                className="flex items-center justify-between rounded-lg border border-white/7 bg-[#0b1f38]/40 px-4 py-3 hover:border-white/14 hover:bg-[#0b1f38] transition-all group"
              >
                <div>
                  <span className="text-xs text-slate-600 font-mono mr-3">{p.type}</span>
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{p.title}</span>
                </div>
                <span className={`text-xs font-mono shrink-0 ml-4 ${p.status === "Published" || p.status === "Released" ? "text-green-500" : "text-slate-600"}`}>
                  {p.status}
                </span>
              </a>
            ))}
          </div>
          <Link href="/contact" className="btn-primary">Request methodology doc →</Link>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-5">Data sources</p>
          <div className="space-y-2">
            {SOURCES.map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-lg border border-white/6 bg-[#0b1f38]/30 px-4 py-3">
                <span className="text-sm text-white font-medium">{s.name}</span>
                <span className="text-xs text-slate-600 ml-4">{s.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
