import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Solutions",
  description: "CRI risk scoring for banks, asset managers, manufacturing, mining, real estate, and consultancies.",
};

const SECTORS = [
  {
    id: "banks",
    name: "Banks",
    line: "Counterparty climate risk in your loan book.",
    detail: "Score borrowers by CRI rating. Quantify ECL uplift under each NGFS scenario. EBA and ECB stress testing ready.",
  },
  {
    id: "asset-managers",
    name: "Asset Managers",
    line: "Portfolio climate stress testing. Asset by asset.",
    detail: "Physical and transition risk across equities, bonds, and real assets. SFDR and EU Taxonomy alignment scoring.",
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    line: "Facility-level hazard exposure in financial terms.",
    detail: "Water stress, heat, flood, and supply chain disruption translated to revenue impact and WACC uplift per plant.",
  },
  {
    id: "mining",
    name: "Mining",
    line: "Stranded asset probability. NZE demand curves applied.",
    detail: "Commodity demand destruction under Net Zero. Break-even cost vs projected revenue by scenario. Reserve life impact.",
  },
  {
    id: "real-estate",
    name: "Real Estate",
    line: "Physical risk per property. Flood, heat, coastal.",
    detail: "Building-level exposure to inundation, extreme heat, and subsidence. Rental income and cap rate impact modelled.",
  },
  {
    id: "consultancies",
    name: "Consultancies",
    line: "CSRD and IFRS S2 deliverables. White-label ready.",
    detail: "Run analysis for your clients. Export branded disclosure reports. API access available for integration.",
  },
];

export default function SolutionsPage() {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 pt-28 pb-20">
      <div className="max-w-7xl mx-auto w-full">
        <div className="max-w-2xl mb-14">
          <span className="text-xs font-mono text-green-500 tracking-widest mb-4 block">Solutions</span>
          <h1 className="heading-xl text-white mb-5">
            Built for your sector.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            The same engine. Outputs calibrated to what each sector needs to see.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {SECTORS.map((s) => (
            <div key={s.id} className="rounded-xl border border-white/7 bg-[#0b1f38]/50 p-6 hover:border-white/14 hover:bg-[#0b1f38] transition-all duration-200 group">
              <h2 className="text-white font-bold mb-2">{s.name}</h2>
              <p className="text-green-400 text-sm font-medium mb-3">{s.line}</p>
              <p className="text-slate-500 text-sm leading-relaxed">{s.detail}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/contact" className="btn-primary">Book a sector demo →</Link>
          <Link href="/cases" className="btn-ghost">See case studies</Link>
        </div>
      </div>
    </section>
  );
}
