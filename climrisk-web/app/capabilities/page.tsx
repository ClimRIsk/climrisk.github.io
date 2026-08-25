import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "../components/Reveal";

export const metadata: Metadata = {
  title: "Capabilities & Advisory",
  description:
    "Three advisory practices — Carbon Auditing & Data Assurance, Dynamic Life Cycle Assessments, and Regulatory Transition & Physical Stress Testing — engineered for European banking supervisors and Chief Risk Officers.",
};

const PRACTICES = [
  {
    id: "carbon-auditing",
    tag: "Practice 01",
    title: "Carbon Auditing & Data Assurance",
    intro:
      "Fragmented, self-reported emissions data is the single largest liability in a climate risk book. We build the audit-ready baseline underneath it.",
    points: [
      {
        title: "Algorithmic Imputation",
        body: "Where primary data is missing or unreliable, we apply statistically defensible imputation methods rather than industry-average placeholders — every estimate is traceable to its method.",
      },
      {
        title: "Unified Data Consolidation",
        body: "Scope 1, 2, and 3 records from disparate systems, subsidiaries, and reporting years are reconciled into a single, internally consistent dataset.",
      },
      {
        title: "Audit-Ready Baselines",
        body: "The resulting baseline is structured to withstand external audit and regulatory review — not just internal reporting.",
      },
    ],
  },
  {
    id: "lca",
    tag: "Practice 02",
    title: "Dynamic Life Cycle Assessments (LCA)",
    intro:
      "Static LCAs age the moment they're published. We build assessments that move with the hazard data and the balance sheet.",
    points: [
      {
        title: "Asset-Level Hazard Mapping",
        body: "Physical hazard exposure is mapped to individual facilities and assets, not sector averages or country-level proxies.",
      },
      {
        title: "Operational Degradation Modeling",
        body: "We model how chronic and acute hazards degrade operational performance over time — output, uptime, input costs — asset by asset.",
      },
      {
        title: "Financial Translation",
        body: "Degradation pathways are converted directly into financial terms: EBITDA impact, capex requirements, and asset-level valuation adjustments.",
      },
    ],
  },
  {
    id: "stress-testing",
    tag: "Practice 03",
    title: "Regulatory Transition & Physical Stress Testing",
    intro:
      "Engineered to speak the language of European banking supervisors and Chief Risk Officers.",
    points: [
      {
        title: "NGFS-Aligned Scenario Execution",
        body: "Stress tests are run against the full NGFS Phase 4 scenario suite, not a single simplified pathway.",
      },
      {
        title: "Credit Risk Translation (PD & LGD)",
        body: "Physical and transition risk outputs are translated directly into Probability of Default and Loss Given Default adjustments.",
      },
      {
        title: "Collateral Valuation & Capital Defense",
        body: "Collateral values are re-tested under climate stress, giving risk teams a defensible position on capital adequacy.",
      },
    ],
  },
];

export default function CapabilitiesPage() {
  return (
    <div className="pt-40 pb-32 px-6">
      <div className="max-w-4xl mx-auto mb-24">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">Capabilities & Advisory</p>
          <h1 className="heading-xl grad-text mb-6">Three practices. One discipline.</h1>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
            Each practice is built to withstand the scrutiny of a European banking supervisor or a
            Chief Risk Officer's own quantitative team — not to impress a marketing audience.
          </p>
        </Reveal>
      </div>

      <div className="max-w-5xl mx-auto space-y-24">
        {PRACTICES.map((p, i) => (
          <Reveal key={p.id} delayMs={i * 80}>
            <div id={p.id} className="grid md:grid-cols-[200px_1fr] gap-10 scroll-mt-28">
              <div>
                <span className="text-xs font-mono text-zinc-600">{p.tag}</span>
                <h2 className="heading-md text-white mt-3">{p.title}</h2>
              </div>
              <div>
                <p className="text-zinc-400 leading-relaxed mb-8">{p.intro}</p>
                <div className="grid sm:grid-cols-3 gap-5">
                  {p.points.map((pt) => (
                    <div key={pt.title} className="panel p-5">
                      <h3 className="text-sm font-semibold text-white mb-2">{pt.title}</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed">{pt.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Client engagement flow */}
      <div className="max-w-5xl mx-auto mt-32 pt-16 border-t border-white/8">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">How We Work</p>
          <h2 className="heading-lg grad-text mb-12">The Client Engagement Flow</h2>
        </Reveal>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { n: "01", t: "Scoping Call", d: "We define the asset universe, the frameworks in scope, and the decision the output needs to support." },
            { n: "02", t: "Data Assurance", d: "Your data — however fragmented — is consolidated into an audit-ready baseline before any modelling begins." },
            { n: "03", t: "Scenario Execution", d: "The CRI Engine runs the full NGFS scenario suite against your asset universe, asset by asset." },
            { n: "04", t: "Delivery & Defense", d: "You receive an audit-ready report and a working session to defend the methodology to your own stakeholders." },
          ].map((s) => (
            <div key={s.n} className="panel p-6">
              <span className="text-2xl font-mono text-gold-200">{s.n}</span>
              <h3 className="text-white font-semibold mt-3 mb-2">{s.t}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-24 text-center">
        <Reveal>
          <Link href="/contact" className="btn-primary">Book a Technical Demo</Link>
        </Reveal>
      </div>
    </div>
  );
}
