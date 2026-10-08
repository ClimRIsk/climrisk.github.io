import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "../components/Reveal";

export const metadata: Metadata = {
  title: "Platform",
  description:
    "Six ways into the CRI Engine: the AI Risk Analyst, the Physical Risk Report, the Asset Twin, Story Reports, the ClimRisk Agent, and Model Lab — what each one actually does, with a real run shown for each. The agent now runs with no API key, and an optional model that runs entirely on your own machine.",
};

const TERMINAL = [
  "$ cri ingest portfolio.xlsx",
  "",
  "Parsing 3 assets... ✓",
  "  [1/3] Chennai cement        AAL 0.62%  PV loss (Current Policies) $17.7M",
  "  [2/3] Rotterdam refinery    AAL 0.00%  PV loss (Current Policies) $0.0M",
  "  [3/3] Bad row               ✗ invalid or missing coordinates",
  "Consolidated CSV: portfolio_climrisk.csv  (3 rows)",
  "",
  "$ cri lca steel --route eaf --kwh 450 --country DEU",
  "1 t crude steel: 228 kg CO2e  (P5–P95 185–279)",
  "  A3 process emissions            80.0",
  "  A3 electricity (lifecycle)     148.3",
  "  excluded: Scrap / DRI feedstock upstream",
];

const CAPABILITIES = [
  {
    id: "risk-analyst",
    tag: "01",
    title: "AI Risk Analyst",
    intro:
      "The entry point for most engagements. Point it at a company name, a single site, or a full asset list, and it runs the same pipeline every time: site physical hazards — cyclone, river and coastal flood with local defences — into the carbon policies actually in force, into the NGFS transition paths, out to a Monte Carlo loss distribution and a list of actions. Three ways in, one method underneath.",
    points: [
      {
        t: "Three Input Modes",
        d: "A company name searched against the global heavy-industry asset register (power, cement, steel, aluminium, refining, chemicals, mining); one site by coordinates, sector and activity; or a bulk asset list (.xlsx/.csv) with its own template.",
      },
      {
        t: "Financials Are Optional, Never Assumed",
        d: "Without an asset value, money figures come back zero; without emissions, carbon cost is left out. Add commissioning year, revenue, EBITDA, debt and covenant terms and the same run adds EBITDA-at-risk, leverage, credit-rating drift and impairment — the Analyst states what's missing rather than filling it with a sector average.",
      },
      {
        t: "Saved, Not Disposable",
        d: "Every run is kept under Recent Assessments and reopens without re-running — so a number you defend to a credit committee this quarter is still the same number next quarter, not a fresh roll of the dice.",
      },
    ],
  },
  {
    id: "physical-risk-report",
    tag: "02",
    title: "Physical Risk Report",
    intro:
      "A pure engineering read on one site: what the hazard maps say, what that does to the structures actually standing there, and what a named protection measure leaves behind. No financials — this is the report you hand to the plant manager, not the CFO.",
    points: [
      {
        t: "Structure By Structure, Not Site-Wide",
        d: "A 2D hydraulic solver routes mapped flood depths over real terrain and timed water arrival per structure — in one sample run across 64 modelled structures, water reached the first affected tank about 95 minutes into the rise, well before its floor sat clear of the surge.",
      },
      {
        t: "Wind Against Design Rating, Not a Generic Threshold",
        d: "Each component's gust loading at its own height is checked against its design wind rating — the same sample run flagged a silo taking 91.2 m/s at 30 m, 5.09 kPa, 166% of its 55 m/s design wind under the 1-in-100-year cyclone.",
      },
      {
        t: "Protection Scenarios, Quantified",
        d: "Raise equipment 2.6 m, or build a 3.8 m flood barrier — each option is re-run through the same solver and comes back as \"0 inundated, 4 wet\" or \"1 inundated, 0 wet,\" not a qualitative before/after.",
      },
    ],
  },
  {
    id: "asset-twin",
    tag: "03",
    title: "Asset Twin",
    intro:
      "The real site, modelled in 3D from its own footprints and terrain — the environment the Physical Risk Report is generated from. You can step through a flood or cyclone replay, compare it against what actually happened at the site since 1980, and test a protection overlay before it's built.",
    points: [
      {
        t: "Built From the Site's Own Geometry",
        d: "Structures are placed on their real footprints over local terrain, not a generic block model — so a flood routed over the twin reaches the buildings that are actually in its path, in the order water would actually reach them.",
      },
      {
        t: "Validated Against the Historical Record",
        d: "A tropical-storm track archive back to 1980 and an all-cause wind reanalysis to 1950 are replayed against the twin so a hazard scenario can be checked against what the site has already lived through, not only what a model projects.",
      },
      {
        t: "A Protection Overlay You Can Test, Not Just Describe",
        d: "A flood wall, raised equipment or a drainage change is added to the twin and re-run through the same solver — so \"what remains\" after a mitigation is a number from the model, not an assumption in a slide.",
      },
    ],
  },
  {
    id: "story-reports",
    tag: "04",
    title: "Story Reports",
    intro:
      "Physical, transition, financial, LCA/ISO 14067, carbon audit and CBAM — delivered as a narrative for a named reader, not a spreadsheet. Each one runs a 500-draw Monte Carlo loss distribution at a 7% discount rate, states the mean and the tail separately, and closes with a \"Method and limits\" section that says what the model does not cover.",
    points: [
      {
        t: "The Mean and the Tail, Both Stated",
        d: "A sample Financial Risk story on a refinery asset put the expected loss to 2050 at $128.8m (25.8% of a $500m asset value) under a delayed transition — and the 1-in-20 outcome, the number that actually tests a covenant, at $347.4m.",
      },
      {
        t: "Reader-Segmented, Not One-Size-Fits-All",
        d: "The same run is reframed for who's reading it: the lender gets the 95th percentile and expected shortfall, the insurer gets the direct-damage share against single-year return periods, the investor gets the spread across scenarios and what it implies for the plan.",
      },
      {
        t: "Honest About the Edge of the Model",
        d: "Every report ends with its own limits stated in writing — in the sample above: direct physical damage only, business interruption excluded, a screening-grade model pending owner validation of asset value and defence standards. Nothing is quietly rounded up.",
      },
    ],
  },
  {
    id: "climrisk-agent",
    tag: "05",
    title: "ClimRisk Agent",
    intro:
      "A resident agent that lives inside the engine itself, not bolted on as a third-party chat widget. As of October 2026 it runs with no API key at all: by default it answers from the sources the engine has learned, assembled rather than generated by an outside vendor, and an optional free model (Ollama, about 2\u00a0GB, no account) can be added so it writes more fluent answers \u2014 entirely on your own machine, never a cloud call. It can build a twin, run a scenario, research a company's live hazard exposure, monitor a watchlist, and draft the content a risk or IR team needs once the numbers are in.",
    points: [
      {
        t: "An Autopilot Inbox",
        d: "The agent now works in the background while the app is simply open \u2014 scanning live hazards, re-running watched sites against the 3D twin, drafting posts \u2014 and reports back on request: \"what did you find while I was away?\"",
      },
      {
        t: "Four Content Types From One Assessment",
        d: "A finished run drafts into a LinkedIn article, an investor memo, a case study or regulatory commentary \u2014 same underlying numbers, four different readers.",
      },
      {
        t: "A Watchlist It Actually Monitors",
        d: "Companies added to a watchlist are checked for material changes without a rerun being requested by hand, with \"which companies in my watchlist carry the highest transition risk\" answerable directly in chat.",
      },
    ],
  },
  {
    id: "model-lab",
    tag: "06",
    title: "Model Lab",
    intro:
      "Ask it to build a hazard model and it does the work a modeller would: picks the physics, pulls terrain and reanalysis data, runs the model, puts it through verification tests, checks it against the historical record where one exists, and writes up the method and the result in plain language \u2014 across twelve hazard types, from flood inundation and fire weather to earthquake recurrence and storm surge, at any coordinate on request.",
    points: [
      {
        t: "Verified Before It's Trusted",
        d: "A sample flood study at 22.2645, 91.805 passed 7 of 7 internal verification tests in 33 seconds and still reported itself as \"verified only\" \u2014 it had no gauge observations to calibrate or validate against at that site, and said so rather than implying more confidence than the data supports.",
      },
      {
        t: "Run At 37 Cities, Failures Published",
        d: "A 222-study sweep across every inhabited climate zone came back 153 of 222 validated or validated with a small, real drift \u2014 69% \u2014 with the rest, including one bug found and fixed mid-sweep, written up in full on the Updates page, not quietly dropped.",
      },
      {
        t: "Some \"Failures\" Are Climate Signal",
        d: "At several cities the rainfall or fire hindcast failed because the recent record is measurably higher than the early record predicted \u2014 the hazard is intensifying. The engine reports that as the finding, not an error to hide.",
      },
    ],
  },
];

const ENGAGEMENT_MODELS = [
  {
    label: "Advisory Retainer",
    desc: "Embedded climate risk intelligence for private equity, asset managers, and lenders underwriting large transactions.",
  },
  {
    label: "Embedded Due Diligence",
    desc: "Plugged directly into your deal workflow. A TCFD disclosure, an SFDR PAI pack, an EU Taxonomy screen, and a physical risk VaR come back as one engagement, not a subscription.",
  },
  {
    label: "White Label",
    desc: "Financial institutions license the engine under their own brand for client reporting, with our team running the analysis behind it.",
  },
];

export default function PlatformPage() {
  return (
    <div className="pt-40 pb-32 px-6">
      {/* Hero */}
      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center mb-32">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">Platform</p>
          <h1 className="heading-xl grad-text mb-6 text-balance">
            One engine. <span className="grad-gold">Six ways in.</span>
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed mb-8 max-w-xl">
            Everything below runs on the ClimRisk desktop app against the local engine instance — the
            same build our own advisory team opens for every engagement. Hand it an asset registry and
            it resolves coordinates, pulls real spatial and track-record data, and runs the full NGFS
            scenario suite in minutes. What comes back still goes through an advisor who can defend the
            number, not a download link.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/contact" className="btn-primary">Book a Technical Demo</Link>
            <Link href="https://climrisk.io/app.html" target="_blank" className="btn-ghost">
              See a live walkthrough
            </Link>
          </div>
        </Reveal>
        <Reveal delayMs={80}>
          <div className="rounded-xl overflow-hidden border border-white/8">
            <div className="flex items-center gap-2 px-4 py-3 bg-black/30 border-b border-white/6">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              <span className="ml-3 text-xs text-zinc-600 font-mono">climrisk-engine</span>
            </div>
            <div className="bg-[#030912] p-5 font-mono text-xs text-zinc-400 leading-relaxed space-y-0.5">
              {TERMINAL.map((line, i) => (
                <div key={i} className={line === "" ? "h-3" : ""}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* Six capabilities, deep sections */}
      <div className="max-w-4xl mx-auto mb-16">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">Inside the App</p>
          <h2 className="heading-lg grad-text mb-4">What you actually open.</h2>
          <p className="text-zinc-400 leading-relaxed max-w-2xl">
            Six tools, each built indigenously and run against the same stress parameters underneath —
            not six vendors stitched together. The chat agent among them runs with no API key by
            default, and an optional language model that never leaves your own machine. Here is what
            each one does, with a real sample run shown where one exists.
          </p>
        </Reveal>
      </div>

      <div className="max-w-5xl mx-auto space-y-24 mb-32">
        {CAPABILITIES.map((c, i) => (
          <Reveal key={c.id} delayMs={i * 60}>
            <div id={c.id} className="grid md:grid-cols-[200px_1fr] gap-10 scroll-mt-28">
              <div>
                <span className="text-xs font-mono text-zinc-600">{c.tag}</span>
                <h3 className="heading-md text-white mt-3">{c.title}</h3>
              </div>
              <div>
                <p className="text-zinc-400 leading-relaxed mb-8">{c.intro}</p>
                <div className="grid sm:grid-cols-3 gap-5">
                  {c.points.map((pt) => (
                    <div key={pt.t} className="panel p-5">
                      <h4 className="text-sm font-semibold text-white mb-2">{pt.t}</h4>
                      <p className="text-xs text-zinc-500 leading-relaxed">{pt.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Engagement models */}
      <div className="max-w-5xl mx-auto pt-16 border-t border-white/8">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">How It Reaches You</p>
          <h2 className="heading-lg grad-text mb-4">Built into how we work with you.</h2>
          <p className="text-zinc-400 leading-relaxed max-w-2xl mb-12">
            The platform above is never sold as a standalone download. It sits underneath one of three
            engagement models, each ending with an advisor, not a login.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-5 mb-24">
          {ENGAGEMENT_MODELS.map((m, i) => (
            <Reveal key={m.label} delayMs={i * 60}>
              <div className="panel p-6 h-full">
                <h3 className="text-sm font-semibold text-white mb-2">{m.label}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{m.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto text-center">
        <Reveal>
          <h2 className="heading-lg grad-text mb-4">See all six run against your own asset list.</h2>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <Link href="/contact" className="btn-primary">Book a Technical Demo</Link>
            <Link href="/engine" className="btn-ghost">See the engine underneath</Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
