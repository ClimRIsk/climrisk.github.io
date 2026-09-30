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
        title: "Inventory From Activity Data",
        body: "Fuel, electricity, refrigerant, travel, freight, waste and spend records become a GHG Protocol / ISO 14064-1 inventory: Scope 1, Scope 2 both location- and market-based, and all 15 Scope 3 categories. Factors from UK DESNZ 2026, US EPA eGRID, the AIB and Green-e residual mixes and US EPA USEEIO.",
      },
      {
        title: "Consolidation & Base Year",
        body: "Entities are consolidated by operational control, financial control or equity share; base-year recalculation is tested against the 5 % significance threshold; every Scope 3 category is either reported or excluded with a written reason.",
      },
      {
        title: "Assurance Pack",
        body: "Each reported tonne traces back to its input, emission factor, working, evidence reference and data-quality score. The workbook lets an assurance provider re-perform every line — the ISO 14064-1 report content is generated with it.",
      },
    ],
  },
  {
    id: "lca",
    tag: "Practice 02",
    title: "Dynamic Life Cycle Assessments (LCA)",
    intro:
      "Cradle-to-gate product carbon footprints built from a plant's own data, and kept current as grids decarbonise and carbon border rules phase in.",
    points: [
      {
        title: "ISO 14067-Aligned Footprints",
        body: "Life-cycle stages A1–A3 per tonne — raw materials, inbound freight, process CO₂, fuel combustion, fuel supply chains and lifecycle grid electricity — using IPCC 2006, GCCA cement protocol, Ember and UK DESNZ 2025 factors, with biogenic CO₂ reported separately. Templates for cement and clinker, steel, aluminium and ammonia; any other product from a custom inventory.",
      },
      {
        title: "Uncertainty & Transparency",
        body: "Every result carries a Monte Carlo P5–P95 band sized by data quality, a data-quality score, and a written list of what was excluded and why. Plant-specific inputs are required — nothing is silently filled with a default.",
      },
      {
        title: "Dynamic to 2050 & CBAM",
        body: "The footprint is re-run for every year to 2050 as the grid decarbonises under each NGFS Phase 5 scenario, with an optional decarbonisation plan, and an EU CBAM view prices embedded emissions against the free-allocation phase-out.",
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
        body: "Stress tests are run against the NGFS Phase 5 scenario suite — seven pathways from three models — not a single simplified pathway.",
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

const ENGINE_CAPABILITIES = [
  {
    title: "Regulatory Compliance Suite",
    body: "Full SFDR PAI reporting across all 18 indicators, EU Taxonomy alignment across the six environmental objectives, and PCAF financed emissions, structured to drop straight into an Article 29 or SFDR RTS filing.",
  },
  {
    title: "Historical Event Stress Tests",
    body: "Replay eight named events — Hurricane Harvey, the 2021 European floods, the 2022 Pakistan floods, Australia's Black Summer, the Camp Fire, the 2003 European heatwave, the 2021 Texas freeze and Typhoon Hagibis — against any position in your book.",
  },
  {
    title: "Sea Level Rise Exposure",
    body: "IPCC AR6 sea level rise projections across SSP1 through SSP5, with coastal inundation probability at 2030, 2050, and 2100, adjusted for regional subsidence.",
  },
  {
    title: "Nature & Biodiversity Risk",
    body: "Built on the TNFD LEAP framework. Protected areas mapped in OpenStreetMap that contain the site or lie within 5 and 25 km, layered with ENCORE sector dependency data, resolve to a nature risk score and the disclosure flags that follow from it. (Key Biodiversity Areas and the WDPA need a separate licence.)",
  },
  {
    title: "Portfolio Benchmark Comparison",
    body: "Active climate VaR against any index, from its published sector weights, split into sector allocation and regional exposure — both sides measured with the same engine — alongside a sector tilt table and a Herfindahl-Hirschman concentration read.",
  },
  {
    title: "JRC Flood Depth Modelling",
    body: "Point-level flood expected annual loss, calculated from the European Commission's JRC LISFLOOD-FP hydraulic rasters and the Huizinga 2017 depth-damage curves.",
  },
  {
    title: "Predictive Risk Trajectories",
    body: "A gradient-boosted surrogate model, trained on 50,000 simulated company-years calibrated to NGFS pathways and EM-DAT disaster losses, projects a company's CRI score out to 2050 across three scenarios, with confidence bands attached.",
  },
  {
    title: "WRI Aqueduct 4.0 Water Risk",
    body: "All 13 Aqueduct 4.0 indicators at any coordinate — water stress, depletion, variability, groundwater decline, riverine and coastal flood, drought and more — with industry-weighted overall risk and water stress projections to 2030, 2050 and 2080 under three scenarios.",
  },
  {
    title: "Transition Plan Builder",
    body: "Targets, decarbonisation levers, capex and opex become a year-by-year emissions path with a marginal abatement cost curve, the gap to target, avoided carbon cost under NGFS prices, and the ESRS E1-1 and UK TPT fields.",
  },
  {
    title: "Real Estate Stranding",
    body: "Energy-use and operational-carbon intensity per building, projected to 2050 as grids decarbonise and retrofits land, against the decarbonisation pathway you use (such as CRREM), with EPC and minimum-standard checks for the Netherlands, UK and France.",
  },
  {
    title: "Double Materiality & Carbon Markets",
    body: "A CSRD impacts-risks-opportunities register scored on ESRS 1 criteria, an EU ETS compliance position as CBAM phases out free allocation, and a carbon-credit screen against ICVCM, SBTi and EU claim rules.",
  },
  {
    title: "SBTi Alignment Check",
    body: "A company's absolute target tested against the SBTi minimum contraction rates (4.2 %/yr Scope 1+2, 2.5 %/yr Scope 3, 90 % by 2050), with deviation alerts when reported emissions drift above the path.",
  },
  {
    title: "AI Research & Monitoring Agent",
    body: "A tool-calling agent can research a company from public financials and news, run a full assessment, monitor a watchlist for material rating changes, or work through an entire portfolio unattended.",
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

      {/* Engine capabilities */}
      <div className="max-w-5xl mx-auto mt-32 pt-16 border-t border-white/8">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">What the Engine Covers</p>
          <h2 className="heading-lg grad-text mb-4">Eight capabilities behind every engagement.</h2>
          <p className="text-zinc-400 leading-relaxed max-w-2xl mb-12">
            These sit underneath all three practices above. They are the modules our advisory teams
            actually run when a mandate calls for them, not a features list written for a sales page.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ENGINE_CAPABILITIES.map((c, i) => (
            <Reveal key={c.title} delayMs={i * 60}>
              <div className="panel p-6 h-full">
                <h3 className="text-sm font-semibold text-white mb-2">{c.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
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
