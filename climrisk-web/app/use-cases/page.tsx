"use client";

import { useState } from "react";
import Link from "next/link";
import SectorVisual from "../components/SectorVisual";

type SectorId = "banking" | "insurance" | "asset-management" | "heavy-industry" | "real-estate";

const SECTORS: {
  id: SectorId;
  navLabel: string;
  buyer: string;
  hero: string;
  challenge: string;
  capabilities: { title: string; body: string }[];
  metrics: { label: string; value: string }[];
  visual: "line-comparison" | "accumulation" | "waterfall" | "table-overlay" | "before-after";
}[] = [
  {
    id: "banking",
    navLabel: "Banking & Credit Risk",
    buyer: "Chief Risk Officers, Credit Committee Chairs, ESG Compliance Leads",
    hero: "Translate forward-looking physical climate hazards into precise credit risk metrics and audit-ready regulatory disclosures.",
    challenge:
      "Backward-looking risk models fail to capture non-linear climate tipping points. Regulators and central banks now expect financial institutions to quantify exactly how extreme weather and chronic climate shifts move Probability of Default and Loss Given Default across an entire loan book.",
    capabilities: [
      {
        title: "Loan Book Stress-Testing",
        body: "Model portfolio-level asset impairment and stress-test lending exposure across 2030, 2040, and 2050. Simulate portfolio resilience under NGFS Phase 4 macro-financial scenarios.",
      },
      {
        title: "High-Resolution Collateral Revaluation",
        body: "Map credit exposure down to a 0.1° resolution grid. Reassess the physical vulnerability of real estate, agricultural, and industrial collateral against 26 distinct climate hazards, from coastal inundation to severe water stress.",
      },
      {
        title: "Audit-Ready Regulatory Disclosures",
        body: "Generate reporting aligned with IFRS S2, CSRD, and ECB stress-testing mandates. Export a full portfolio's physical risk profile into a single, consolidated CSV, ready to drop into an existing risk management system.",
      },
    ],
    metrics: [
      { label: "Scenarios Modeled", value: "NGFS Phase 4 & IPCC AR6" },
      { label: "Credit Metrics Adjusted", value: "PD, LGD, VaR" },
      { label: "Output Format", value: "Single CSV & IFRS S2 Reports" },
    ],
    visual: "line-comparison",
  },
  {
    id: "insurance",
    navLabel: "Insurance & Underwriting",
    buyer: "Chief Underwriting Officers, Actuaries, Reinsurance Structurers",
    hero: "Price forward-looking physical risk instead of underwriting against a rearview mirror.",
    challenge:
      "Actuarial models built on historical loss data miss the non-linear climate tipping points already showing up in claims. Underwriting and reinsurance teams need a forward-looking view of loss, not a backward-looking average extrapolated into a warmer world.",
    capabilities: [
      {
        title: "Forward-Looking Loss Estimates",
        body: "Quantify expected annual loss using CMIP6 projections and hazard layers resolved to 0.1°, not historical averages extrapolated forward.",
      },
      {
        title: "Policy Pricing & Deductibles",
        body: "Calibrate underwriting guidelines against high-resolution flood, heatwave, and wildfire projections, asset by asset rather than region by region.",
      },
      {
        title: "Portfolio Accumulation Risk",
        body: "Detect concentrated physical exposure across underwriting zones before a catastrophe event forces you to find out the hard way.",
      },
    ],
    metrics: [
      { label: "Hazard Types Modeled", value: "26" },
      { label: "Loss Metric", value: "Expected Annual Loss (EAL)" },
      { label: "Output Format", value: "Single CSV for Underwriting Systems" },
    ],
    visual: "accumulation",
  },
  {
    id: "asset-management",
    navLabel: "Asset Management & Private Equity",
    buyer: "Portfolio Managers, Investment Directors, ESG Analysts",
    hero: "Protect enterprise value, accelerate due diligence, and integrate physical climate risk directly into your Discounted Cash Flow models.",
    challenge:
      "Asset managers and private equity firms can't rely on historical data to protect future exit valuations. Pricing in physical climate vulnerability, operational downtime, and future adaptation capex during due diligence is still mostly guesswork, which leaves enterprise value exposed to shocks nobody modeled.",
    capabilities: [
      {
        title: "Climate-Adjusted Valuation Modeling",
        body: "Translate physical hazard data directly into financial impairment. Integrate climate shocks into DCF models to calculate Value at Risk, stressed NPV, and enterprise value impact across 2030, 2040, and 2050 holding periods.",
      },
      {
        title: "Adaptation ROI & Exit Strategy",
        body: "Model the cost-benefit of protective capex, cooling systems, flood defenses, before you sign, so resilience investment shows up as measurable savings over the hold, not just a line item in the deal memo.",
      },
      {
        title: "Seamless Portfolio-Wide Consolidation",
        body: "Complex, multi-entity targets don't have to mean fragmented reporting. Export complete, audit-ready physical and transition risk profiles into a single, consolidated CSV for LP reporting and CSRD compliance.",
      },
    ],
    metrics: [
      { label: "Valuation Metrics", value: "Climate-Adjusted EV, Stressed NPV, Adaptation ROI" },
      { label: "Scenarios Assessed", value: "NGFS Phase 4 & IPCC AR6" },
      { label: "Output Format", value: "Single CSV & LP-Ready TCFD Disclosures" },
    ],
    visual: "waterfall",
  },
  {
    id: "heavy-industry",
    navLabel: "Heavy Industry & Resources",
    buyer: "Chief Sustainability Officers, Operations Directors, Supply Chain Leads",
    hero: "Quantify climate-driven operational downtime, protect physical assets, and consolidate multi-facility emissions data into actionable financial metrics.",
    challenge:
      "Heavy industrials, cement and clinker production, brewing, chemical manufacturing, run on fixed, water-intensive, highly exposed assets. Extreme heat and water stress don't just damage infrastructure. They degrade workforce productivity, disrupt supply chains, and erode EBITDA margins directly.",
    capabilities: [
      {
        title: "Operational Disruption & Production Modeling",
        body: "Translate physical hazards directly into production loss. Sensitivity matrices for extreme heat, wildfire, and water stress calculate business interruption probability and cooling cost surges for mines, plants, and processing facilities.",
      },
      {
        title: "Asset-Level Hazard Resolution",
        body: "GIS-integrated coordinate mapping assesses precise physical risk across sprawling industrial footprints, including ecological restoration zones and coastal export terminals, down to a 0.1° resolution.",
      },
      {
        title: "Unified Multi-Facility Data Consolidation",
        body: "Generate complete emissions inventories and physical risk profiles for large, multi-site portfolios. Export asset, supplier, and emissions data into a single consolidated CSV instead of managing a separate file for every facility.",
      },
    ],
    metrics: [
      { label: "Key Hazards Assessed", value: "Water Stress, Extreme Heat, Wildfire" },
      { label: "Impact Metrics", value: "Business Interruption Probability, EBITDA Margin Impact" },
      { label: "Output Format", value: "Single CSV for Enterprise Portfolios" },
    ],
    visual: "table-overlay",
  },
  {
    id: "real-estate",
    navLabel: "Real Estate & Infrastructure",
    buyer: "REIT Executives, Infrastructure Fund Managers",
    hero: "Safeguard the built environment, optimize urban master planning, and quantify the financial ROI of large-scale climate adaptation.",
    challenge:
      "REITs, municipal developers, and infrastructure funds are facing rising insurance premiums and long-term asset depreciation. Standard risk models miss the hyper-local reality of urban heat islands and coastal storm surge, which leaves owners unable to put a number on what green infrastructure and structural adaptation are actually worth.",
    capabilities: [
      {
        title: "Hyper-Local Asset Vulnerability",
        body: "Resolve physical risk for commercial real estate, municipal utility grids, and coastal developments down to a 0.1° grid. Model flood depth, sea-level rise, and heat exposure at the exact property coordinate, ahead of the insurance renewal that would otherwise tell you first.",
      },
      {
        title: "Urban Master Planning & Green Infrastructure ROI",
        body: "Quantify the financial benefit of large-scale climate initiatives. See how urban canopy and tree-planting reduce ambient heat stress, lower cooling costs, and extend the life of the built environment.",
      },
      {
        title: "Unified Property Portfolio Consolidation",
        body: "Export physical risk and emissions data for sprawling, multi-city portfolios into a single consolidated CSV, ready to sit inside an existing asset management system without a fragmented report for every building.",
      },
    ],
    metrics: [
      { label: "Key Hazards Assessed", value: "Coastal Inundation, Urban Heat Island, Subsidence" },
      { label: "Impact Metrics", value: "Insurance Premium Escalation, Adaptation Payback Period" },
      { label: "Output Format", value: "Single CSV for Built Portfolios" },
    ],
    visual: "before-after",
  },
];

export default function UseCasesPage() {
  const [active, setActive] = useState<SectorId>("banking");
  const sector = SECTORS.find((s) => s.id === active)!;

  return (
    <div className="pt-32 pb-32">
      <div className="max-w-5xl mx-auto px-6 mb-10">
        <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">Use Cases</p>
        <h1 className="heading-xl grad-text mb-5 max-w-3xl">Built for your sector, not a generic dashboard.</h1>
        <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
          The same CRI Engine, calibrated to what each buyer actually needs to see when they open it.
        </p>
      </div>

      {/* Sticky tab nav */}
      <div className="sticky top-16 z-30 bg-[#0A0B0E]/95 backdrop-blur-md border-y border-white/8 mb-14">
        <div className="max-w-5xl mx-auto px-6 overflow-x-auto">
          <div className="flex gap-1 py-3 min-w-max">
            {SECTORS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors duration-300 ${
                  active === s.id ? "text-white bg-white/8" : "text-zinc-500 hover:text-white hover:bg-white/5"
                }`}
              >
                {s.navLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        <p className="text-xs uppercase tracking-widest text-zinc-600 font-mono mb-4">
          Built for {sector.buyer}
        </p>
        <h2 className="heading-lg grad-text mb-10 max-w-2xl">{sector.hero}</h2>

        <div className="panel p-7 mb-10">
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-mono mb-3">The Challenge</p>
          <p className="text-zinc-400 leading-relaxed">{sector.challenge}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-start mb-12">
          <div className="space-y-6">
            {sector.capabilities.map((c) => (
              <div key={c.title}>
                <h3 className="text-white font-semibold mb-2">{c.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
          <SectorVisual mode={sector.visual} />
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-14">
          {sector.metrics.map((m) => (
            <div key={m.label} className="panel p-5">
              <p className="text-[0.65rem] uppercase tracking-widest text-zinc-600 font-mono mb-2">{m.label}</p>
              <p className="text-sm text-white font-semibold leading-snug">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 pt-8 border-t border-white/8">
          <Link href="/contact" className="btn-primary">Book a sector demo</Link>
          <Link href="/methodology" className="btn-ghost">See the full methodology</Link>
        </div>
      </div>
    </div>
  );
}
