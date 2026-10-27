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
    body: "Product carbon footprints follow ISO 14067 methodology — cradle-to-gate, IPCC AR6 GWP100, biogenic carbon reported separately — with uncertainty bands and every exclusion stated.",
  },
];

export default function CompanyPage() {
  return (
    <div className="pb-32">
      {/* Hero / Mission — real Sentinel-2 crop, not a flat background */}
      <div className="relative overflow-hidden">
        <img
          src="/company/jakobshavn-ice-margin.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "38% 30%" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, rgba(10,11,14,0.94) 0%, rgba(10,11,14,0.80) 32%, rgba(10,11,14,0.46) 60%, rgba(10,11,14,0.72) 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,11,14,0.40) 0%, transparent 24%, transparent 78%, rgba(10,11,14,0.98) 100%)",
          }}
        />
        <div className="relative pt-40 pb-28 px-6">
          <div className="max-w-4xl mx-auto">
            <Reveal>
              <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">The Firm</p>
              <h1 className="heading-xl grad-text mb-6">Ground truth data for a warming world.</h1>
              <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
                ClimRisk was built to bridge the gap between peer-reviewed earth science and enterprise
                balance sheets, translating physical climate hazards into audit-ready financial intelligence.
              </p>
              <p className="text-[10px] font-mono text-zinc-600 mt-8">
                Sentinel-2 L2A, Sermeq Kujalleq ice margin, Greenland (29 Jul 2026), via AWS Earth Search
              </p>
            </Reveal>
          </div>
        </div>
      </div>

      <div className="px-6">
      <div className="max-w-4xl mx-auto space-y-20 mt-16">
        {/* Origin story */}
        <Reveal>
          <div className="grid md:grid-cols-[160px_1fr] gap-10">
            <span className="text-xs font-mono text-zinc-600">01</span>
            <div>
              <h2 className="heading-md text-white mb-4">From the Ground to the Ledger</h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                The CRI Engine didn't start as a software idea. It started inside the complex realities of
                heavy industry and large-scale environmental management, running ISO 14067 clinker
                production assessments and managing large greenhouse gas inventories, while overseeing an
                87-hectare post-mining ecological restoration. That's where the gap between academic
                climate models and strict financial reporting mandates stopped being theoretical. It became
                a spreadsheet that doesn't reconcile.
              </p>
              <p className="text-zinc-400 leading-relaxed">
                Corporate sustainability and risk teams are stuck between the two: climate science that
                speaks in degrees and probabilities, and disclosure regimes that demand a number in
                dollars, defensible to an auditor, with no way to translate physical vulnerabilities into
                audit-ready data assurance without the process fragmenting across hundreds of isolated
                spreadsheets. ClimRisk exists to close that specific gap: dynamic life cycle assessments
                and consolidated financial risk metrics through one mathematically rigorous platform.
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
                  Shrinivash designed the CRI Engine by combining on-the-ground geological expertise with
                  rigorous corporate carbon auditing. He holds an MSc in Urban Environment, Sustainability
                  & Climate Change from Erasmus University Rotterdam and an MSc in Geology from Manipal
                  University, and is an ISO 14067 Accredited Carbon Footprint Auditor. Prior to founding
                  ClimRisk, he served as a Geologist and Sustainability Lead in heavy building materials,
                  managing complex emissions inventories and the 87-hectare post-mining restoration
                  referenced above.
                </p>
                <p className="text-zinc-400 leading-relaxed">
                  His work extends into urban climate resilience as Project Lead for climate change
                  initiatives at INHAF, driving inclusive urban master planning and green infrastructure
                  projects, including the Python data pipelines and QGIS spatial models behind the
                  ClimACT-Chennai Initiative. That combination, geology, carbon auditing, and applied
                  geospatial work, is the background the ClimRisk platform is built on top of.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Real-image section break */}
      <div className="max-w-4xl mx-auto mt-20">
        <div className="relative rounded-xl overflow-hidden border border-white/8" style={{ aspectRatio: "21 / 9" }}>
          <img
            src="/company/palisades-fire-scar.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "50% 38%" }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(0deg, rgba(10,11,14,0.92) 0%, rgba(10,11,14,0.15) 55%, rgba(10,11,14,0.35) 100%)",
            }}
          />
          <div className="absolute left-0 right-0 bottom-0 p-6 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-white font-semibold">
                Pacific Palisades, California — the January 2025 fire perimeter, read ten weeks on
              </p>
              <p className="text-[10px] font-mono text-zinc-600 mt-1">
                Sentinel-2 L2A (18 Mar 2025), via AWS Earth Search
              </p>
            </div>
            <p className="text-zinc-400 text-sm max-w-xs text-right hidden md:block">
              Every section above is a claim about the firm. This is the one page where a claim about
              the planet earns its own frame.
            </p>
          </div>
        </div>
      </div>

      {/* Company DNA */}
      <div className="max-w-4xl mx-auto mt-20 pt-16 border-t border-white/8">
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
    </div>
  );
}
