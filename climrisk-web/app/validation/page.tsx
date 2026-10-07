import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Validation",
  description:
    "How the CRI Engine is tested against observed data: cyclone winds vs measured station winds, flood scores vs FEMA insurance claims, emissions estimates vs EPA-reported emissions, and a worldwide QA run. Weak results are published too.",
};

type Test = {
  title: string;
  truth: string;
  headline: { value: string; label: string }[];
  detail: string;
  verdict: string;
  script: string;
};

const TESTS: Test[] = [
  {
    title: "Tropical cyclone wind",
    truth: "Measured hourly winds at 148 weather stations (NOAA ISD) within 150 km of 26 storms' tracks",
    headline: [
      { value: "1.01×", label: "median model ÷ observed" },
      { value: "63%", label: "within ±30% of measured" },
      { value: "79%", label: "gale-force hit rate" },
    ],
    detail:
      "Leave-one-storm-out calibration. Correlation r = 0.53, RMSE 7.7 m/s, gale false-alarm rate 26%. Skill is strongest in the North Atlantic (r = 0.69, 76 stations) and weakest in the West Pacific (r = 0.31).",
    verdict: "Usable for site screening; basin-dependent.",
    script: "scripts/validate_tc_wind.py",
  },
  {
    title: "Flood exposure vs insurance claims",
    truth: "FEMA NFIP claims per km² of built-up land, 180 census tracts in Harris TX, East Baton Rouge LA and Charleston SC",
    headline: [
      { value: "0.61–0.78", label: "held-out AUC, top vs bottom claim quintile" },
      { value: "3", label: "US counties (pluvial, riverine, coastal)" },
      { value: "0.44", label: "AUC of the earlier point score (no skill)" },
    ],
    detail:
      "The area model (built-up land × height above nearest drainage) is fitted on two counties and tested on the third: AUC 0.61 in Harris, 0.78 in East Baton Rouge, 0.73 in Charleston. The earlier single-point terrain score showed no skill in Harris County, so site-level flood losses now come from JRC river and Deltares coastal flood depth maps instead.",
    verdict: "Moderate skill in three US counties; not yet evidence of global skill.",
    script: "scripts/backtest_flood_area.py · scripts/backtest_flood_nfip.py",
  },
  {
    title: "Emissions estimates",
    truth: "EPA GHGRP 2023 reported emissions for 163 US companies, matched to SEC revenue",
    headline: [
      { value: "3.5×", label: "median error factor" },
      { value: "44%", label: "within 3× of reported" },
      { value: "31%", label: "within 2× of reported" },
    ],
    detail:
      "Revenue-based estimates are best for oil & gas (62% within 2×) and weakest for utilities, where fuel mix dominates. The engine therefore uses reported or facility-level emissions (Climate TRACE, EPA GHGRP) wherever they exist and labels revenue-based estimates as such.",
    verdict: "Screening-grade only — replace with reported data before any decision.",
    script: "scripts/evaluate_emissions_models.py",
  },
  {
    title: "Worldwide QA run",
    truth: "Manual review of site analyses and company asset maps on every inhabited continent",
    headline: [
      { value: "17 / 17", label: "site analyses judged sensible" },
      { value: "34 / 35", label: "company asset maps judged sensible" },
    ],
    detail:
      "Sites range from Fiji and Dhaka to Lima, Lagos and Kedarnath. Failures found in earlier rounds (a pin on open water read as flooding, a lake counted as new flood water) were fixed in the engine and re-tested.",
    verdict: "A sanity check, not a statistical benchmark.",
    script: "scripts/world_qa.py",
  },
  {
    title: "Historical disaster calibration",
    truth: "16 sourced catastrophe losses, 1997–2022 (EM-DAT, Munich Re NatCatSERVICE, Swiss Re sigma, FAO, World Bank and national disaster agencies), each compared against a single representative company run",
    headline: [
      { value: "16", label: "sourced historical events, 1997–2022" },
      { value: "1 / 16", label: "events inside the 20% \"calibrated\" band" },
      { value: "25.1%", label: "best result: 2010–12 Queensland floods" },
    ],
    detail:
      "Each event's documented loss is compared against the engine's own hazard output for one representative company, normalised to loss-as-percent-of-revenue because historical figures are economy-wide and the engine runs at company level. Error climbs past 100% for most events — not because the hazard magnitudes are wrong, but because one proxy company cannot stand in for an entire economy's sector mix. It is a transparency check on the calibration module itself, never used to tune the model: run per-event from the same script shown below.",
    verdict: "A deliberately blunt check. The measured-hazard results above are the stronger evidence; this one is published for the same reason they are — so a reviewer sees it, not only the results that flattered the model.",
    script: "climate_risk_engine/src/cri/climate/scenarios/calibration.py · historical_events.py",
  },
];

const SOURCES = [
  "NGFS Phase 5 (IIASA)",
  "IPCC AR6",
  "NOAA IBTrACS v04r01",
  "NOAA ISD station winds",
  "JRC river flood maps (CEMS-GloFAS)",
  "Deltares Global Flood Maps",
  "FLOPROS flood protection",
  "JRC Huizinga 2017 depth-damage curves",
  "WRI Aqueduct 4.0",
  "Copernicus Sentinel-1 & Sentinel-2",
  "ESA WorldCover",
  "FEMA NFIP claims (OpenFEMA)",
  "EPA GHGRP 2023",
  "Climate TRACE",
  "World Bank Carbon Pricing Dashboard",
  "OpenStreetMap protected areas",
  "ENCORE (UNEP-WCMC)",
  "PCAF Global Standard, Part A",
  "SFDR RTS Annex I",
];

export default function ValidationPage() {
  return (
    <section className="px-6 pt-36 pb-24">
      <div className="max-w-6xl mx-auto">
        <span className="text-xs font-mono text-green-500 tracking-widest mb-4 block">Validation</span>
        <h1 className="heading-xl text-white mb-5 text-balance">Tested against what actually happened.</h1>
        <p className="text-slate-400 text-lg leading-relaxed mb-4 max-w-3xl">
          Each model is compared with observed data it was not fitted on — measured winds, insurance claims,
          reported emissions. We publish the weak results alongside the strong ones, and every test can be
          re-run from the script named under it.
        </p>
        <p className="text-slate-500 text-sm leading-relaxed mb-14 max-w-3xl">
          We have not benchmarked against commercial climate-VaR products, whose models and outputs are not public.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {TESTS.map((t) => (
            <div key={t.title} className="rounded-xl border border-white/7 bg-[#0b1f38]/60 p-7 flex flex-col">
              <h2 className="text-white font-semibold text-lg mb-1">{t.title}</h2>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">Truth: {t.truth}</p>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {t.headline.map((h) => (
                  <div key={h.label}>
                    <div className="text-2xl font-black text-green-400 font-mono">{h.value}</div>
                    <div className="text-[11px] text-slate-500 leading-snug mt-1">{h.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">{t.detail}</p>
              <p className="text-sm text-white mb-3">{t.verdict}</p>
              <p className="text-[11px] font-mono text-slate-600 mt-auto">{t.script}</p>
            </div>
          ))}
        </div>

        <div className="mb-10">
          <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold mb-3">Data sources</p>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <span key={s} className="text-xs px-2.5 py-1 rounded border border-white/8 text-slate-500 bg-white/3">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/contact" className="btn-primary">Request the validation data →</Link>
          <Link href="/methodology" className="btn-ghost">See full methodology</Link>
        </div>
      </div>
    </section>
  );
}
