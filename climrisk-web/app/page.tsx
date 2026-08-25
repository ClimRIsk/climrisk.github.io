import Link from "next/link";
import Reveal from "./components/Reveal";
import CounterUp from "./components/CounterUp";

const MANDATES = [
  {
    tag: "01",
    title: "Carbon Auditing & Data Assurance",
    body: "Algorithmic imputation and unified data consolidation that turn fragmented emissions records into audit-ready baselines.",
    href: "/capabilities#carbon-auditing",
  },
  {
    tag: "02",
    title: "Dynamic Life Cycle Assessments",
    body: "Asset-level hazard mapping and operational degradation modelling, translated directly into financial terms.",
    href: "/capabilities#lca",
  },
  {
    tag: "03",
    title: "Regulatory Transition & Physical Stress Testing",
    body: "NGFS-aligned scenario execution, translated into PD & LGD credit-risk terms, and defended at the collateral level.",
    href: "/capabilities#stress-testing",
  },
];

const INTELLIGENCE = [
  {
    kicker: "Flagship Study",
    title: "We Ran 21 Global Industries Through Every Climate Scenario",
    detail: "Break-even carbon prices from $27/t (coal power) to $82/t (oil refining) — the full sector-by-sector exposure map.",
    href: "/research",
  },
  {
    kicker: "Physical Risk · South & SE Asia",
    title: "The Supply Chain Tax",
    detail: "A heat dome over South and Southeast Asia and its direct line to landed cost.",
    href: "/research",
  },
  {
    kicker: "Physical Risk · South Asia · Agricultural Finance",
    title: "The Monsoon, Repriced",
    detail: "What a shifting monsoon does to agricultural credit books across South Asia.",
    href: "/research",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="hero-drift inline-flex items-center gap-2 text-xs font-mono text-gold-200 border border-white/8 rounded-full px-3 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-terminal" />
            CRI ENGINE v0.5 · NGFS PHASE 4 · CMIP6
          </div>
          <h1 className="hero-drift animation-delay-200 heading-xl grad-text mb-6">
            A Quantitative Advisory Firm<br />for a <span className="grad-gold">Repricing World.</span>
          </h1>
          <p className="hero-drift animation-delay-400 text-lg text-zinc-400 max-w-2xl leading-relaxed mb-10">
            We translate peer-reviewed climate science into asset-level financial exposure —
            Capital-at-Risk, EBITDA compression, and audit-ready disclosure under IFRS&nbsp;S2, TCFD, and CSRD.
          </p>
          <div className="hero-drift animation-delay-600 flex flex-wrap items-center gap-4">
            <Link href="/contact" className="btn-primary">
              Book a Technical Demo
            </Link>
            <Link href="/engine" className="btn-ghost">
              See the Engine
            </Link>
          </div>

          <div className="hero-drift animation-delay-600 mt-14 pt-8 border-t border-white/8">
            <p className="text-xs uppercase tracking-widest text-zinc-600 mb-4">
              Powered by frameworks and data from
            </p>
            <div className="flex flex-wrap gap-x-10 gap-y-3 text-sm font-mono text-zinc-500">
              <span>NGFS</span>
              <span>IPCC</span>
              <span>WRI Aqueduct</span>
              <span>Copernicus</span>
              <span>TCFD</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="px-6 py-16 border-y border-white/8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 21, suffix: "", label: "Industries stress-tested" },
            { value: 25, suffix: "+", label: "Physical hazard types" },
            { value: 4, suffix: "", label: "NGFS scenario pathways" },
            { value: 92, suffix: "%", label: "Model confidence, audited" },
          ].map((s) => (
            <Reveal key={s.label}>
              <div className="text-center md:text-left">
                <CounterUp value={s.value} suffix={s.suffix} className="text-4xl font-bold text-white" />
                <p className="text-sm text-zinc-500 mt-2">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Three mandates */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">Our Mandate</p>
          <h2 className="heading-lg grad-text mb-16 max-w-2xl">
            Three practices. One discipline: translating physical reality into financial language.
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6">
          {MANDATES.map((m, i) => (
            <Reveal key={m.title} delayMs={i * 120}>
              <Link href={m.href} className="panel panel-hover block p-8 h-full">
                <span className="text-xs font-mono text-zinc-600">{m.tag}</span>
                <h3 className="heading-md text-white mt-4 mb-3">{m.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{m.body}</p>
                <span className="inline-flex items-center gap-1.5 text-sm text-gold-200 mt-6">
                  Learn more
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Infrastructure teaser */}
      <section className="px-6 py-24 border-t border-white/8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <Reveal>
            <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">Under the Hood</p>
            <h2 className="heading-lg grad-text mb-6">The CRI Engine</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              Every conclusion we deliver traces back to a geospatial pipeline built on IPCC AR6 hazard
              matrices and NGFS Phase 4 scenarios — asset coordinates in, Capital-at-Risk out, with full
              methodological transparency at every step.
            </p>
            <Link href="/engine" className="btn-ghost">
              Read the technical whitepaper
            </Link>
          </Reveal>
          <Reveal delayMs={120}>
            <div className="panel h-72 flex items-center justify-center relative overflow-hidden">
              <div className="scan-line" style={{ top: "20%" }} />
              <span className="loading-mono">GEOSPATIAL_ENGINE · SEE /engine FOR LIVE RENDER</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Recent intelligence */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <Reveal>
          <div className="flex items-end justify-between mb-16 flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">Recent Intelligence</p>
              <h2 className="heading-lg grad-text">Research from the desk</h2>
            </div>
            <Link href="/research" className="btn-ghost">View all research</Link>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6">
          {INTELLIGENCE.map((a, i) => (
            <Reveal key={a.title} delayMs={i * 120}>
              <Link href={a.href} className="panel panel-hover block p-7 h-full">
                <p className="text-xs font-mono text-zinc-600 mb-3">{a.kicker}</p>
                <h3 className="text-white font-semibold leading-snug mb-3">{a.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{a.detail}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Final close */}
      <section className="px-6 py-32 border-t border-white/8 text-center">
        <Reveal>
          <h2 className="heading-lg grad-text mb-4">See how we map 10,000 assets in under 5 minutes.</h2>
          <p className="text-zinc-500 mb-10">Book a Technical Demo — no obligation, no boilerplate deck.</p>
          <Link href="/contact" className="btn-primary">Book a Technical Demo</Link>
        </Reveal>
      </section>
    </>
  );
}
