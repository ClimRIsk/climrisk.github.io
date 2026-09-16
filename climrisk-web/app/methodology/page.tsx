import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "../components/Reveal";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How the CRI Engine turns IPCC AR6 hazard data into audit-ready financial exposure: the seven-step pipeline, the data architecture behind it, the DCF and VaR math, and the frameworks it satisfies.",
};

const PIPELINE = [
  {
    n: "01",
    title: "Climate Hazard Quantification",
    body: "26 hazards across four SSP emission scenarios, drawn from CMIP6, NGFS Phase 4, and IPCC AR6, resolved to a 0.1° grid.",
    tag: "NASA · CMIP6 · ERA5",
  },
  {
    n: "02",
    title: "Asset-Level Exposure Mapping",
    body: "A GIS lat/lon resolver maps each asset to its precise hazard cell, integrating WRI Aqueduct, SRTM elevation, and NASA land use data.",
    tag: "GIS · Aqueduct · SRTM",
  },
  {
    n: "03",
    title: "Operational Disruption Modelling",
    body: "An equipment sensitivity matrix combined with sector-specific vulnerability curves calculates business interruption probability, asset by asset.",
    tag: "BI Model · Sensitivity Matrix",
    emphasis: true,
  },
  {
    n: "04",
    title: "Revenue & Cash Flow Translation",
    body: "Annual loss fractions are mapped to revenue impact and validated against IPCC AR6 observed regional losses, not modelled in isolation.",
    tag: "DCF · ALF · Revenue Model",
    emphasis: true,
  },
  {
    n: "05",
    title: "Enterprise Value Impact",
    body: "Climate-adjusted EV, Value at Risk, and stressed NPV are computed across three time horizons: 2030, 2040, and 2050.",
    tag: "EV · VaR · NPV",
  },
  {
    n: "06",
    title: "Adaptation ROI Analysis",
    body: "A cost-benefit read on adaptation measures, flood walls, cooling systems, supply chain diversification, each with its own payback period.",
    tag: "Adaptation · ROI · Payback",
  },
  {
    n: "07",
    title: "Audit-Ready Report Output",
    body: "IFRS S2, TCFD, and CSRD-aligned reports with IPCC AR6 citations, peer benchmarking, and confidence intervals attached to every figure.",
    tag: "IFRS S2 · TCFD · CSRD",
  },
];

const DATA_GROUPS = [
  {
    group: "Physical Climate Models",
    items: [
      { name: "CMIP6", detail: "34 GCMs, SSP1-2.6 through SSP5-8.5, horizon to 2100." },
      { name: "ERA5 Reanalysis", detail: "0.25° hourly resolution, 1940 to present, 300+ variables." },
    ],
  },
  {
    group: "Earth Observation",
    items: [
      { name: "NASA Earth Observing System", detail: "0.1° × 0.1° resolution, updated daily. LULC, MODIS, GRACE." },
      { name: "WRI Aqueduct", detail: "Watershed-level water risk across 13 indicator layers." },
    ],
  },
  {
    group: "Financial Transition Scenarios",
    items: [
      { name: "NGFS Phase 4", detail: "6 scenario pathways, referenced by 80+ central banks and supervisors." },
    ],
  },
  {
    group: "The Engine",
    items: [
      { name: "CRI Engine v0.5", detail: "26 hazards modelled, validated against IPCC AR6 WG1 and WG2, IFRS S2 ready." },
    ],
  },
];

export default function MethodologyPage() {
  return (
    <div className="pt-40 pb-32 px-6">
      {/* Hero */}
      <div className="max-w-4xl mx-auto mb-24">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">Methodology</p>
          <h1 className="heading-xl grad-text mb-6">
            The Intelligence Layer Between<br />
            <span className="grad-gold">Climate Science and Financial Decisions.</span>
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
            ClimRisk translates peer-reviewed climate science into asset-level financial risk, expressed
            in dollars, not degrees. This page is the whitepaper version: the pipeline, the data behind
            it, the financial math, and the frameworks it was built to satisfy, for the risk managers and
            quants who need to defend the number before they sign off on it.
          </p>
        </Reveal>
      </div>

      {/* Pipeline */}
      <div className="max-w-5xl mx-auto mb-32">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">How It Works</p>
          <h2 className="heading-lg grad-text mb-4">From climate science to financial decisions.</h2>
          <p className="text-zinc-400 leading-relaxed max-w-2xl mb-14">
            Seven steps, run in sequence, every time. Steps three and four are where most of the
            engineering effort has gone: turning a hazard probability into a number that shows up on an
            income statement is the hard part, not the hazard data itself.
          </p>
        </Reveal>
        <div className="space-y-0">
          {PIPELINE.map((s, i) => (
            <Reveal key={s.n} delayMs={i * 50}>
              <div className={`flex gap-6 py-6 ${i !== PIPELINE.length - 1 ? "border-b border-white/8" : ""}`}>
                <span className={`text-2xl font-mono shrink-0 w-12 ${s.emphasis ? "text-gold-200" : "text-zinc-700"}`}>
                  {s.n}
                </span>
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-white font-semibold">{s.title}</h3>
                    {s.emphasis && (
                      <span className="text-[0.65rem] uppercase tracking-widest font-mono text-gold-200 border border-gold-200/30 rounded-full px-2 py-0.5">
                        Proprietary
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-2 max-w-2xl">{s.body}</p>
                  <span className="text-xs font-mono text-zinc-600">{s.tag}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Data architecture */}
      <div className="max-w-5xl mx-auto mb-32">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">Data Provenance</p>
          <h2 className="heading-lg grad-text mb-4">Transparent by design.</h2>
          <p className="text-zinc-400 leading-relaxed max-w-2xl mb-14">
            Every number the engine produces is traceable to one of these sources. Risk managers need to
            know exactly which models sit underneath a disclosure so they can defend it to their own
            auditors, so here they are, grouped by what they actually do.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 gap-5">
          {DATA_GROUPS.map((g, i) => (
            <Reveal key={g.group} delayMs={i * 60}>
              <div className="panel p-6 h-full">
                <p className="text-xs uppercase tracking-widest text-zinc-500 font-mono mb-4">{g.group}</p>
                <div className="space-y-4">
                  {g.items.map((it) => (
                    <div key={it.name}>
                      <p className="text-sm font-semibold text-white mb-1">{it.name}</p>
                      <p className="text-xs text-zinc-500 leading-relaxed">{it.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Financial math */}
      <div className="max-w-5xl mx-auto mb-32">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">The Financial Math</p>
          <h2 className="heading-lg grad-text mb-4">DCF, VaR, and NPV, stated plainly.</h2>
          <p className="text-zinc-400 leading-relaxed max-w-2xl mb-10">
            We don't publish the proprietary scoring model itself, but the financial machinery around it
            is not a secret. This is what an auditor would need to know to follow the math.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-5">
          <Reveal delayMs={0}>
            <div className="panel p-6 h-full">
              <h3 className="text-sm font-semibold text-white mb-2">Discounted Cash Flow</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                A full DCF runs the 2026 to 2050 horizon with a Gordon Growth terminal value. The discount
                rate is each company's own base WACC, typically 8 to 9 percent, stressed with a scenario
                premium and an asset-specific exposure premium on top.
              </p>
            </div>
          </Reveal>
          <Reveal delayMs={60}>
            <div className="panel p-6 h-full">
              <h3 className="text-sm font-semibold text-white mb-2">Value at Risk</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Portfolio VaR is computed at 95% and 99% confidence, weighted by exposure across the full
                asset book, and reported alongside the WACC uplift that's actually driving it.
              </p>
            </div>
          </Reveal>
          <Reveal delayMs={120}>
            <div className="panel p-6 h-full">
              <h3 className="text-sm font-semibold text-white mb-2">Net Present Value</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Stressed NPV is reported at three checkpoints, 2030, 2040, and 2050, so a board can see
                where in the horizon the exposure actually bites, not just the endpoint number.
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Regulatory alignment (the output) */}
      <div className="max-w-5xl mx-auto pt-16 border-t border-white/8">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">The Output</p>
          <h2 className="heading-lg grad-text mb-6">
            Science this rigorous exists to satisfy frameworks this specific.
          </h2>
          <p className="text-zinc-400 leading-relaxed max-w-2xl mb-8">
            Everything above feeds the same disclosure engine. See the full breakdown of what each
            framework requires and what the engine hands back on the frameworks page.
          </p>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-mono text-zinc-500 mb-10">
            <span>IFRS S2</span>
            <span>TCFD</span>
            <span>CSRD</span>
            <span>SFDR</span>
            <span>EU Taxonomy</span>
            <span>PCAF</span>
            <span>TNFD</span>
            <span>Basel III</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/frameworks" className="btn-primary">See framework coverage</Link>
            <Link href="/contact" className="btn-ghost">Request the full methodology document</Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
