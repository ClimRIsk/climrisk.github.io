import Link from "next/link";
import Reveal from "./components/Reveal";
import CounterUp from "./components/CounterUp";
import GlobeBackground from "./components/GlobeBackground";
import IsometricShowcase from "./components/IsometricShowcase";
import LiveAssessWidget from "./components/LiveAssessWidget";
import { allArticles } from "../lib/research";
import { CardThumb } from "./components/ResearchCardThumb";
import ScenarioExplorer from "./components/ScenarioExplorer";

const MANDATES = [
  {
    tag: "01",
    title: "Carbon Auditing & Data Assurance",
    body: "Activity data turned into a GHG Protocol / ISO 14064-1 inventory — Scope 1, 2 and all 15 Scope 3 categories — with an assurance pack that traces every tonne to its evidence.",
    href: "/capabilities#carbon-auditing",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1Z" />
        <path d="M6 6h12v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6Z" />
        <path d="m9 13 2 2 4-4" />
      </svg>
    ),
  },
  {
    tag: "02",
    title: "Dynamic Life Cycle Assessments",
    body: "Cradle-to-gate product carbon footprints (ISO 14067-aligned) for cement, steel, aluminium, ammonia or any product, with uncertainty bands, an EU CBAM cost view and 2050 grid pathways.",
    href: "/capabilities#lca",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 2v4M17 2 14 5" />
        <path d="M3 12a9 9 0 0 1 15.3-6.4" />
        <path d="M7 22v-4M7 22l3-3" />
        <path d="M21 12a9 9 0 0 1-15.3 6.4" />
      </svg>
    ),
  },
  {
    tag: "03",
    title: "Regulatory Transition & Physical Stress Testing",
    body: "NGFS-aligned scenario execution, translated into PD & LGD credit-risk terms, and defended at the collateral level.",
    href: "/capabilities#stress-testing",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2 4 5v6c0 5 3.4 8.6 8 11 4.6-2.4 8-6 8-11V5l-8-3Z" />
        <path d="M9 12.5 11 15l4.5-5" />
      </svg>
    ),
  },
];

export default function Home() {
  const latestResearch = allArticles()
    .filter((a) => a.status !== "in-progress")
    .slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-12 px-6 overflow-hidden">
        <GlobeBackground />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
            background:
              "linear-gradient(to right, rgba(10,11,14,0.95) 0%, rgba(10,11,14,0.82) 45%, rgba(10,11,14,0.45) 75%, rgba(10,11,14,0.15) 100%)",
          }}
        />
        <div className="max-w-5xl mx-auto relative" style={{ zIndex: 2 }}>
          <div className="hero-drift inline-flex items-center gap-2 text-xs font-mono text-gold-200 border border-white/8 rounded-full px-3 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-terminal" />
            CRI ENGINE · NGFS PHASE 5 · IPCC AR6
          </div>
          <h1 className="hero-drift animation-delay-200 heading-xl grad-text mb-6">
            The Climate Risk You Haven&rsquo;t Priced <span className="grad-gold">Is Still on Your Books.</span>
          </h1>
          <p className="hero-drift animation-delay-400 text-lg text-zinc-400 max-w-2xl leading-relaxed mb-10">
            Regulators, reinsurers, and your own credit committee are moving to asset-level physical risk
            numbers under TCFD, IFRS&nbsp;S2, and Basel&nbsp;III. The CRI Engine prices yours now &mdash;
            Capital-at-Risk, EBITDA compression, and audit-ready disclosure under SFDR, EU Taxonomy, PCAF
            and TNFD too &mdash; before the gap becomes someone else&rsquo;s finding.
          </p>
          <div className="hero-drift animation-delay-600 flex flex-wrap items-center gap-4">
            <Link href="/contact" className="btn-primary">
              Book a Demo
            </Link>
            <Link href="https://climrisk.io/app.html" target="_blank" className="btn-ghost">
              Launch Platform ↗
            </Link>
          </div>

          <div className="hero-drift animation-delay-600 mt-14 pt-8 border-t border-white/8">
            <p className="text-xs uppercase tracking-widest text-zinc-600 mb-4">
              Powered by frameworks and data from
            </p>
            <div className="flex flex-wrap gap-2">
              {["NGFS", "IPCC", "WRI Aqueduct", "Copernicus", "TCFD", "SFDR", "EU Taxonomy", "PCAF", "TNFD", "Basel III"].map((f) => (
                <span key={f} className="text-xs font-mono text-zinc-400 border border-white/10 bg-white/[0.03] rounded-full px-3 py-1.5">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live assessment */}
      <section className="px-6 pt-12 pb-20 border-b border-white/8">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <Reveal>
            <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">Live, Not a Mockup</p>
            <h2 className="heading-lg grad-text mb-4">Analyse a real company, right now.</h2>
            <p className="text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              Type a company with industrial sites. The engine finds its mapped facilities, reads flood maps and
              cyclone tracks at the largest ones, applies the carbon prices in force there, and prices the loss to
              2050 under each NGFS scenario. No sample data, no canned demo.
            </p>
          </Reveal>
        </div>
        <div className="max-w-3xl mx-auto">
          <Reveal delayMs={100}>
            <LiveAssessWidget />
          </Reveal>
        </div>
      </section>

      {/* Trust banner */}
      <section className="px-6 py-10 border-b border-white/8">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs uppercase tracking-widest text-zinc-600 font-mono mb-6">
            Assets & Emissions Modelled For
          </p>
          <div className="trust-strip flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm font-semibold text-zinc-300 mb-10">
            <span>Maritime Terminals</span>
            <span>Energy Infrastructure</span>
            <span>Light Manufacturing</span>
            <span>Real Estate Portfolios</span>
            <span>Mining & Extraction</span>
            <span>Agricultural Assets</span>
          </div>

          <div className="pt-8 border-t border-white/8">
            <p className="text-center text-xs uppercase tracking-widest text-zinc-600 font-mono mb-5">
              No logo wall yet — an open validation record instead
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { v: "69% validated", d: "published, failures included" },
                { v: "No vendor AI", d: "resident agent needs no API key" },
                { v: "Fully local option", d: "an LLM that never leaves your machine" },
                { v: "Every script named", d: "re-run any validation test yourself" },
              ].map((b) => (
                <Link
                  key={b.v}
                  href="/validation"
                  className="group flex items-center gap-2 text-xs font-mono border border-terminal/30 bg-terminal/5 hover:bg-terminal/10 hover:border-terminal/50 rounded-full pl-3 pr-3.5 py-1.5 transition-colors duration-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-terminal shrink-0" />
                  <span className="text-zinc-200 font-semibold">{b.v}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-500">{b.d}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="px-6 py-16 border-y border-white/8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 18, suffix: "", label: "Commodities modelled" },
            { value: 25, suffix: "", label: "Parametric hazard functions" },
            { value: 7, suffix: "", label: "NGFS Phase 5 scenarios" },
            { value: 94, suffix: "", label: "Carbon-pricing instruments mapped" },
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

      {/* Scale strip — how wide, not just how deep */}
      <section className="px-6 py-16 border-b border-white/8 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-8">
            Any Coordinate, Not a Pre-Mapped Database
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "0.1°", label: "downscaled resolution, worldwide" },
              { value: "Any", label: "lat/lon on Earth — no fixed asset list to miss you" },
              { value: "3", label: "live data tiers (CMIP6, ERA5, NASA POWER, WRI Aqueduct) — not a static lookup" },
              { value: "2100", label: "scenario horizon across 7 NGFS Phase 5 pathways" },
            ].map((s) => (
              <Reveal key={s.label}>
                <div className="text-center md:text-left">
                  <div className="text-3xl font-bold grad-text">{s.value}</div>
                  <p className="text-sm text-zinc-500 mt-2 leading-snug">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive scenario explorer */}
      <section className="px-6 py-24 border-b border-white/8">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <Reveal>
            <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">Interactive</p>
            <h2 className="heading-lg grad-text mb-4">Drag the year. Change the scenario.</h2>
            <p className="text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              The same Monte Carlo loss distribution every Story Report runs on, exposed as something you can
              actually move. Switch between NGFS-style pathways and scrub from 2026 to 2050 to see how fast the
              expected loss — and its tail — compounds depending on how late the transition actually happens.
            </p>
          </Reveal>
        </div>
        <div className="max-w-3xl mx-auto">
          <Reveal delayMs={100}>
            <ScenarioExplorer />
          </Reveal>
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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-600">{m.tag}</span>
                  <span className="text-gold-200/70 mandate-icon">{m.icon}</span>
                </div>
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
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">Under the Hood</p>
            <h2 className="heading-lg grad-text mb-6 max-w-2xl">The CRI Engine, at a glance.</h2>
            <p className="text-zinc-400 leading-relaxed mb-12 max-w-2xl">
              Every conclusion we deliver traces back to a geospatial pipeline built on IPCC AR6 hazard
              matrices and NGFS Phase 5 scenarios. Asset coordinates in, Capital-at-Risk out, with full
              methodological transparency at every step. The same engine also forecasts where that score
              moves through 2050, scans a company's own disclosures for the gap between claims and capex,
              and can work through an entire watchlist unattended. This is a look at three of the modules
              underneath.
            </p>
          </Reveal>
          <Reveal delayMs={100}>
            <IsometricShowcase />
          </Reveal>
          <div className="mt-8">
            <Link href="/engine" className="btn-ghost">
              Read the technical whitepaper
            </Link>
          </div>
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
          {latestResearch.map((a, i) => (
            <Reveal key={a.slug} delayMs={i * 120}>
              <Link href={a.href ?? `/research/${a.slug}`} className="panel panel-hover block h-full overflow-hidden">
                <CardThumb a={a} heightClass="h-36" />
                <div className="p-7 pt-5">
                  <p className="text-xs font-mono text-zinc-600 mb-3">{a.kicker}</p>
                  <h3 className="text-white font-semibold leading-snug mb-3">{a.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{a.detail}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Final close */}
      <section className="relative overflow-hidden border-t border-white/8">
        <img
          src="/cta/alpine-valley.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,11,14,0.32) 0%, rgba(10,11,14,0.72) 55%, rgba(10,11,14,0.95) 100%)",
          }}
        />
        <div className="relative px-6 py-32 text-center" style={{ zIndex: 2 }}>
          <Reveal>
            <h2 className="heading-lg grad-text mb-4">See how we screen 10,000 assets in seconds.</h2>
            <p className="text-zinc-400 mb-10">Book a Technical Demo, no obligation and no boilerplate deck.</p>
            <Link href="/contact" className="btn-primary">Book a Technical Demo</Link>
          </Reveal>
          <p className="text-[10px] font-mono text-zinc-600 mt-10">
            Sentinel-2 L2A, Lauterbrunnen Valley, Swiss Alps (24 Jul 2026), via AWS Earth Search
          </p>
        </div>
      </section>
    </>
  );
}
