import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cases",
  description: "Worked examples of the CRI Engine on Heineken and Shell, and illustrative workflows for a mining portfolio and a bank loan book.",
};

const CASES = [
  {
    company: "Heineken N.V.",
    tag: "Beverages · Global · worked example",
    headline: "Transition cost outweighs physical loss by 2030.",
    stat: "−16.9% EV under Net Zero 2050 vs Current Policies",
    detail: "Company engine on a simplified four-site model: $43.6M carbon cost and $40.9M physical loss in 2030 under Net Zero 2050. Reproduce with `cri run --company heineken`.",
    kind: "Public company · simplified asset set",
  },
  {
    company: "Shell plc",
    tag: "Energy · Integrated · worked example",
    headline: "Demand destruction drives stranding.",
    stat: "$75B cumulative stranded write-downs under Net Zero 2050",
    detail: "Company engine on a simplified two-segment model: 2030 carbon cost $3.7B under Net Zero 2050, and enterprise value 73% below Current Policies. Reproduce with `cri run --company shell`.",
    kind: "Public company · simplified asset set",
  },
  {
    company: "Diversified mining portfolio",
    tag: "Mining · illustrative",
    headline: "Heat and water stress compound.",
    stat: "Joint heat and water-stress screening",
    detail: "A hypothetical 12-mine portfolio showing the workflow: WBGT heat stress and WRI Aqueduct 4.0 water stress per site, productivity loss curves scaled to IPCC AR6 regional warming.",
    kind: "Illustrative — not a client portfolio",
  },
  {
    company: "European bank loan book",
    tag: "Banking · illustrative",
    headline: "Borrower risk is your risk.",
    stat: "Climate-adjusted PD / LGD and ECL",
    detail: "A hypothetical book of corporate counterparties showing the workflow: counterparty climate scores, PD and LGD adjustments, ECL uplift under Net Zero 2050, and TCFD and BRSR output.",
    kind: "Illustrative — not a client portfolio",
  },
];

export default function CasesPage() {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 pt-28 pb-20">
      <div className="max-w-7xl mx-auto w-full">
        <div className="max-w-2xl mb-14">
          <span className="text-xs font-mono text-green-500 tracking-widest mb-4 block">Case studies</span>
          <h1 className="heading-xl text-white mb-5">The engine. Applied.</h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Worked examples on public companies, re-run on the current engine, and illustrative
            workflows on hypothetical books. None of these is a client engagement.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5 mb-12">
          {CASES.map((c) => (
            <div key={c.company} className="rounded-xl border border-white/7 bg-[#0b1f38]/50 p-7">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs font-mono text-slate-600 mb-1">{c.tag}</p>
                  <h2 className="text-white font-bold text-lg">{c.company}</h2>
                </div>
              </div>
              <p className="text-green-400 font-semibold text-sm mb-2">{c.headline}</p>
              <p className="text-xs font-mono text-slate-500 mb-3">{c.stat}</p>
              <p className="text-slate-500 text-sm leading-relaxed mb-3">{c.detail}</p>
              <p className="text-[11px] font-mono text-slate-600">{c.kind}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/contact" className="btn-primary">Run your portfolio →</Link>
          <Link href="/platform" className="btn-ghost">See the platform</Link>
        </div>
      </div>
    </section>
  );
}
