import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Company",
  description: "ClimRisk B.V. — financial infrastructure for climate risk. Amsterdam. Founded by Shrinivash D Kannan.",
};

const ROADMAP = [
  { phase: "Q1 2026", status: "done",    item: "CRI Engine v0.4 · Platform pilot · CSRD and IFRS S2 modules" },
  { phase: "Q2 2026", status: "current", item: "API v1 · Portfolio aggregation · Scenario sensitivity analysis" },
  { phase: "Q3 2026", status: "planned", item: "Bank loan book module · Real estate · Interactive asset map" },
  { phase: "Q4 2026", status: "planned", item: "Enterprise tier · SBTi tracker · Bloomberg and MSCI integrations" },
];

export default function CompanyPage() {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 pt-28 pb-20">
      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">
        <div>
          <span className="text-xs font-mono text-green-500 tracking-widest mb-4 block">Company</span>
          <h1 className="heading-xl text-white mb-5 text-balance">
            Financial infrastructure<br />for climate risk.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-5">
            ClimRisk builds the engine layer between raw climate science and capital decisions.
            The gap: regulatory frameworks demand financial quantification, but the existing toolchain
            produces qualitative ratings. We produce dollars, euros, and basis points.
          </p>
          <p className="text-slate-500 leading-relaxed mb-10">
            Founded by{" "}
            <a
              href="https://www.linkedin.com/in/shrinivash-dhamodhara-kannan/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white underline underline-offset-2 decoration-slate-600 hover:decoration-white transition-colors"
            >
              Shrinivash D Kannan
            </a>
            . Based in Amsterdam.
            ClimRisk B.V. · KVK 95420134.
          </p>
          <div className="flex flex-wrap gap-4 mb-12">
            <Link href="/contact" className="btn-primary">Work with us →</Link>
            <Link href="mailto:shri@climrisk.io" className="btn-ghost">shri@climrisk.io</Link>
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-5">Roadmap</p>
          <div className="space-y-2">
            {ROADMAP.map((r) => (
              <div
                key={r.phase}
                className={`flex items-start gap-4 rounded-lg border px-4 py-3 ${
                  r.status === "current"
                    ? "border-green-500/25 bg-green-500/5"
                    : r.status === "done"
                    ? "border-white/7 bg-[#0b1f38]/40"
                    : "border-white/4 bg-[#0b1f38]/20"
                }`}
              >
                <span className="text-xs font-mono text-slate-600 shrink-0 w-14">{r.phase}</span>
                <span className="text-sm text-slate-400 flex-1">{r.item}</span>
                <span className={`text-xs font-mono shrink-0 ${
                  r.status === "done" ? "text-green-500" :
                  r.status === "current" ? "text-green-400 animate-pulse" :
                  "text-slate-700"
                }`}>
                  {r.status === "done" ? "✓" : r.status === "current" ? "now" : "·"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
