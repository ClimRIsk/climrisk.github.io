import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "../components/Reveal";

export const metadata: Metadata = {
  title: "The Firm",
  description:
    "ClimRisk B.V., a quantitative climate risk advisory forged in hard-to-abate industry and European regulatory practice. Founded by Shrinivash Dhamodhara Kannan.",
};

const DNA = [
  {
    label: "Corporate Registration",
    body: "ClimRisk B.V. is registered under Dutch Chamber of Commerce (KvK) number 95420134, giving the firm a genuine European legal presence, not a shell entity set up to sell CSRD compliance from abroad.",
  },
  {
    label: "Scientific Standard",
    body: "Built on peer-reviewed IPCC AR6 physical hazard data and NGFS Phase 4 transition scenarios. Nothing in the hazard layer is proprietary weather data of unknown provenance.",
  },
  {
    label: "Auditing Standard",
    body: "Engineered around ISO 14067 carbon footprint methodology and dynamic Life Cycle Assessments, the same standard our own carbon auditing work is accredited against.",
  },
];

export default function CompanyPage() {
  return (
    <div className="pt-40 pb-32 px-6">
      {/* Hero / Mission */}
      <div className="max-w-4xl mx-auto mb-24">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">The Firm</p>
          <h1 className="heading-xl grad-text mb-6">Ground truth data for a warming world.</h1>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
            ClimRisk was built to bridge the gap between peer-reviewed earth science and enterprise
            balance sheets, translating physical climate hazards into audit-ready financial intelligence.
          </p>
        </Reveal>
      </div>

      <div className="max-w-4xl mx-auto space-y-20">
        {/* Origin story */}
        <Reveal>
          <div className="grid md:grid-cols-[160px_1fr] gap-10">
            <span className="text-xs font-mono text-zinc-600">01</span>
            <div>
              <h2 className="heading-md text-white mb-4">From the Ground to the Ledger</h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                The CRI Engine didn't start as a software idea. It started with a geology background and
                years of hands-on carbon accounting and sustainability work inside heavy industry, where
                the gap between academic climate models and strict financial reporting mandates is not
                theoretical. It's a spreadsheet that doesn't reconcile.
              </p>
              <p className="text-zinc-400 leading-relaxed">
                Corporate sustainability and risk teams are stuck between the two: climate science that
                speaks in degrees and probabilities, and disclosure regimes that demand a number in
                dollars, defensible to an auditor. ClimRisk exists to close that specific gap, not to be
                another dashboard sitting on top of data nobody has reconciled.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Regulatory edge */}
        <Reveal delayMs={80}>
          <div className="grid md:grid-cols-[160px_1fr] gap-10">
            <span className="text-xs font-mono text-zinc-600">02</span>
            <div>
              <h2 className="heading-md text-white mb-4">The European Regulatory Edge</h2>
              <p className="text-zinc-400 leading-relaxed">
                A postgraduate specialization from Erasmus University Rotterdam gives the firm a native
                fluency in the European regulatory architecture, CSRD, IFRS S2, and the supervisory
                expectations behind them, before a single client engagement begins. We're not translating
                software built for another market into European compliance language after the fact.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Leadership */}
        <Reveal delayMs={160}>
          <div className="grid md:grid-cols-[160px_1fr] gap-10">
            <span className="text-xs font-mono text-zinc-600">03</span>
            <div>
              <h2 className="heading-md text-white mb-6">Leadership</h2>
              <div className="panel p-7">
                <p className="text-xs uppercase tracking-widest text-zinc-500 font-mono mb-2">Founder & Lead Architect</p>
                <h3 className="text-white font-semibold text-lg mb-4">
                  <a
                    href="https://www.linkedin.com/in/shrinivash-dhamodhara-kannan/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 decoration-zinc-600 hover:decoration-gold-300 transition-colors"
                  >
                    Shrinivash Dhamodhara Kannan
                  </a>
                </h3>
                <p className="text-zinc-400 leading-relaxed mb-4">
                  Shrinivash designed the CRI Engine at the intersection of earth science and corporate
                  carbon auditing. He holds an MSc in Urban Environment, Sustainability & Climate Change
                  from Erasmus University Rotterdam and an MSc in Geology from Manipal University, and is
                  an ISO 14067 Accredited Carbon Footprint Auditor.
                </p>
                <p className="text-zinc-400 leading-relaxed">
                  His work extends into urban climate resilience as Climate Data & Geospatial Lead for
                  INHAF's ClimACT-Chennai Initiative, building the Python data pipelines and QGIS spatial
                  models behind that programme. That combination, geology, carbon auditing, and applied
                  geospatial work, is the background the ClimRisk platform is built on top of.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Company DNA */}
      <div className="max-w-4xl mx-auto mt-32 pt-16 border-t border-white/8">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">Company DNA</p>
          <h2 className="heading-lg grad-text mb-12">Trust and verification, not just a claim.</h2>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-5">
          {DNA.map((d, i) => (
            <Reveal key={d.label} delayMs={i * 60}>
              <div className="panel p-6 h-full">
                <h3 className="text-sm font-semibold text-white mb-3">{d.label}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{d.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="text-zinc-600 text-sm font-mono mt-8">
          ClimRisk B.V. · Amsterdam, Netherlands · KVK 95420134
        </p>
      </div>

      <div className="max-w-4xl mx-auto mt-24 pt-16 border-t border-white/8 flex flex-wrap gap-4">
        <Reveal>
          <div className="flex flex-wrap gap-4">
            <Link href="/contact" className="btn-primary">Engage the Firm</Link>
            <Link href="mailto:shri@climrisk.io" className="btn-ghost">shri@climrisk.io</Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
