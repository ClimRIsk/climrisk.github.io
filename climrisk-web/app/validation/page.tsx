import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Validation",
  description: "CRI Engine v0.4 validation: 91% directional accuracy vs MSCI, ±8% EV MAE, r=0.87 vs S&P CSA. Full methodology available on request.",
};

const STATS = [
  { value: "91%",  label: "Directional accuracy",      note: "vs MSCI Climate VaR · 120-company test set" },
  { value: "±8%",  label: "EV impact error (MAE)",      note: "vs Moody's Climate VAR benchmark" },
  { value: "0.87", label: "Score correlation (r)",      note: "vs S&P Global CSA · sector-controlled" },
  { value: "25",   label: "IPCC AR6 hazard types",      note: "Heat · flood · drought · cyclone · and more" },
];

const SOURCES = [
  "WRI Aqueduct 4.0",
  "NASA NEX-GDDP-CMIP6",
  "NGFS Phase 4",
  "IPCC AR6 WG2",
  "EU ETS forward curves",
  "EM-DAT disaster database",
  "IBISWorld sector benchmarks",
  "MSCI Climate VaR (benchmark)",
];

export default function ValidationPage() {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 pt-28 pb-20">
      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">
        <div>
          <span className="text-xs font-mono text-green-500 tracking-widest mb-4 block">Validation</span>
          <h1 className="heading-xl text-white mb-5 text-balance">
            Built to be<br />verified.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Every output traces to a published dataset. Benchmark results are public.
            Errors are documented. The full methodology document is available on request.
          </p>
          <div className="mb-10">
            <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold mb-3">Data sources</p>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map((s) => (
                <span key={s} className="text-xs px-2.5 py-1 rounded border border-white/8 text-slate-500 bg-white/3">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/contact" className="btn-primary">Request validation report →</Link>
            <Link href="/research" className="btn-ghost">See methodology</Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/7 bg-[#0b1f38]/60 p-6">
              <div className="text-4xl font-black text-green-400 font-mono mb-2">{s.value}</div>
              <div className="text-white font-semibold text-sm mb-2">{s.label}</div>
              <div className="text-xs text-slate-600 leading-relaxed">{s.note}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
