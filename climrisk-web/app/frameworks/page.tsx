import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Frameworks",
  description: "CSRD/ESRS, GHG Protocol and ISO 14064-1, IFRS S2, TCFD, SFDR, EU Taxonomy, PCAF, TNFD, SEBI BRSR and SBTi — the outputs the CRI Engine produces for each.",
};

const FRAMEWORKS = [
  {
    code: "CSRD / ESRS",
    jurisdiction: "EU · ESRS E1 and ESRS 1",
    coverage: "E1",
    outputs: ["Double materiality IRO register (ESRS 1)", "E1-1 transition plan fields", "E1-6 Scope 1–3 inventory", "E1-7 carbon credits disclosure", "Physical loss cost by scenario"],
  },
  {
    code: "GHG Protocol / ISO 14064-1",
    jurisdiction: "Global · corporate inventories",
    coverage: "Full",
    outputs: ["Scope 1, 2 (location + market), 3 (15 categories)", "Consolidation & base-year recalculation", "Assurance pack with audit trail"],
  },
  {
    code: "IFRS S2",
    jurisdiction: "Global · ISSB",
    coverage: "Full",
    outputs: ["Scenario analysis (3 pathways)", "Carbon cost (€ ETS)", "WACC uplift (bps)", "GHG intensity ratio"],
  },
  {
    code: "TCFD",
    jurisdiction: "Global · FSB",
    coverage: "Full",
    outputs: ["Risk narrative by time horizon", "Financial impact tables", "Supply chain exposure", "Board-ready summary"],
  },
  {
    code: "EU Taxonomy",
    jurisdiction: "EU · Regulation 2020/852",
    coverage: "DNSH",
    outputs: ["DNSH per environmental objective", "Asset-level alignment", "Substantial contribution check"],
  },
  {
    code: "SFDR",
    jurisdiction: "EU · RTS Annex I",
    coverage: "Full",
    outputs: ["All 18 PAI indicators", "Article 29 disclosure pack", "Principal adverse impact statement"],
  },
  {
    code: "TNFD",
    jurisdiction: "Global · voluntary",
    coverage: "LEAP",
    outputs: ["Nature risk score by asset", "Protected-area proximity (OpenStreetMap)", "ENCORE sector dependency flags"],
  },
  {
    code: "PCAF",
    jurisdiction: "Global · financed emissions",
    coverage: "Full",
    outputs: ["Financed emissions across 6 asset classes", "Data quality scoring", "Attribution factor breakdown"],
  },
  {
    code: "SEBI / BRSR",
    jurisdiction: "India · Mandatory",
    coverage: "Core",
    outputs: ["GHG intensity (tCO₂e / INR crore)", "Principle 6 environment disclosures", "Physical and transition risk identification"],
  },
  {
    code: "SBTi",
    jurisdiction: "Global · voluntary",
    coverage: "Scope",
    outputs: ["Target ambition vs SBTi minimum rates", "Deviation alerts vs target path", "Net-zero standard check"],
  },
];

export default function FrameworksPage() {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 pt-28 pb-20">
      <div className="max-w-7xl mx-auto w-full">
        <div className="max-w-2xl mb-14">
          <span className="text-xs font-mono text-green-500 tracking-widest mb-4 block">Frameworks</span>
          <h1 className="heading-xl text-white mb-5">
            The major frameworks.<br />One engine.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Run the CRI analysis once. The engine generates the outputs each disclosure framework requires.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {FRAMEWORKS.map((f) => (
            <div key={f.code} className="rounded-xl border border-white/7 bg-[#0b1f38]/50 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-bold text-sm">{f.code}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{f.jurisdiction}</p>
                </div>
                <span className="text-xs font-mono text-green-500 border border-green-500/30 bg-green-500/8 px-2 py-0.5 rounded-full">
                  {f.coverage}
                </span>
              </div>
              <div className="space-y-1">
                {f.outputs.map((o) => (
                  <div key={o} className="flex items-start gap-2 text-xs">
                    <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                    <span className="text-slate-500">{o}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/contact" className="btn-primary">Book a framework demo →</Link>
          <Link href="/platform" className="btn-ghost">See platform outputs</Link>
        </div>
      </div>
    </section>
  );
}
