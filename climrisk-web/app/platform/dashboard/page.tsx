"use client";
/**
 * ClimRisk Company Assessment Dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * Assembles all five chart components into a full-page climate risk dashboard.
 * Fetches live data from the ClimRisk API and renders:
 *   1. KPI cards — CRI rating, ITR, total EV impact
 *   2. Scenario Fan Chart — EV trajectory NZE / Delayed / CP
 *   3. EV Waterfall — bridge from base EV to climate-adjusted EV
 *   4. Carbon Pathway — actual vs. required 1.5°C decarbonization path
 *   5. CRI Radar — 4-pillar spider chart vs. sector median
 *   6. Confidence Heatmap — data quality provenance table
 */

import React, { useEffect, useState, useCallback } from "react";
import ScenarioFanChart from "../../components/charts/ScenarioFanChart";
import EVWaterfallChart from "../../components/charts/EVWaterfallChart";
import CarbonPathwayChart from "../../components/charts/CarbonPathwayChart";
import CRIRadarChart from "../../components/charts/CRIRadarChart";
import ConfidenceHeatmap from "../../components/charts/ConfidenceHeatmap";
import MACCChart, { MACCProject } from "../../components/charts/MACCChart";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssessmentData {
  company_profile: {
    resolved_name: string;
    sector: string;
    jurisdiction: string;
    revenue_usd_m: { value: number; tier: string } | null;
    scope1_mt_co2e: { value: number; tier: string; source: string } | null;
    scope2_mt_co2e: { value: number; tier: string; source: string } | null;
    scope3_mt_co2e: { value: number; tier: string; source: string } | null;
    data_gaps: { field_name: string }[];
  };
  risk_assessment: {
    scenarios: {
      nze:     { enterprise_value_usd_m: number; npv_impact_pct: number; exposure_score: number; transition_score: number; financial_score: number; adaptive_score: number };
      delayed: { enterprise_value_usd_m: number; npv_impact_pct: number };
      cp:      { enterprise_value_usd_m: number; npv_impact_pct: number };
    };
    rating: { rating: string; physical_pillar: number; transition_pillar: number; financial_pillar: number; adaptive_pillar: number };
  };
  extended_risk: {
    paris_alignment?: {
      implied_temperature_rise: number;
      itr_label: string;
      itr_color: string;
      trajectory_years: number[];
      trajectory_scope12_mt: number[];
      trajectory_1_5_budget: number[];
      trajectory_2_0_budget: number[];
      // Decision tier (new)
      decision_tier?: string;              // HOLD | WATCH | REDUCE | EXIT
      composite_risk_score?: number;       // 0-100
      decision_rationale?: string;
      decision_weights?: Record<string, number>;
      // 2030 interim milestone (new)
      interim_2030_target_mt?: number;
      interim_2030_projected_mt?: number;
      interim_2030_gap_mt?: number;
      interim_2030_on_track?: boolean;
      interim_2030_required_annual_reduction_pct?: number;
      // Data flags
      data_gaps?: string[];
    };
    physical_risk?: {
      // EAL uncertainty bands (new)
      eal_p10_usd_m?: number;
      eal_p50_usd_m?: number;
      eal_p90_usd_m?: number;
      npv_p10_usd_m?: number;
      npv_p50_usd_m?: number;
      npv_p90_usd_m?: number;
      // Compound event (new)
      compound_event_uplift_pct?: number;
      compound_event_pairs?: string[];
      // Tipping point stress (new)
      eal_tipping_point_stress_usd_m?: number;
      npv_tipping_point_stress_usd_m?: number;
      // Climate WACC (new)
      climate_credit_spread_bps?: number;
      climate_adjusted_wacc?: number;
      npv_at_adjusted_wacc_usd_m?: number;
      // Insurance withdrawal (new)
      insured_fraction_baseline?: number;
      insured_fraction_2050?: number;
      insurance_protection_gap_usd_m?: number;
      insurance_withdrawal_risk_flag?: boolean;
      // Sovereign adaptive capacity (new)
      country_adaptive_capacity?: number;
      adaptive_capacity_damage_uplift_pct?: number;
      // Wildfire / SLR (new)
      wildfire_eal_2050_usd_m?: number;
      slr_expected_loss_2050_usd_m?: number;
      // MACC projects (new)
      macc_projects?: MACCProject[];
    };
    stranded_assets?: { total_npv_impairment_usd_m: number };
    cbam?: { total_cost_usd_m: number };
    water_stress?: { total_npv_drag_usd_m: number };
    wildfire_risk?: { total_npv_loss_usd_m: number };
    litigation_risk?: { financial_impact: { expected_usd_m: number } };
  };
  trajectory?: {
    scope1_trajectory: number[];
    years: number[];
  };
  data_gaps: { field: string; reason: string }[];
}

// ─── Demo / fallback data ─────────────────────────────────────────────────────

function makeDemoData(): AssessmentData {
  const years = Array.from({ length: 26 }, (_, i) => 2025 + i);
  // Simulated EV trajectories (baseline = 5000 USD M)
  const base = 5000;
  const nze     = years.map((_, i) => base * (1 - 0.008 * i));
  const delayed  = years.map((_, i) => base * (1 - 0.020 * i));
  const cp       = years.map((_, i) => base * (1 - 0.033 * i));

  // Simulated emissions trajectory
  const scope12 = years.map((_, i) => 18 * Math.pow(0.93, i));
  // 1.5°C budget: linear decline from 15 Mt to 0.5 Mt
  const b15 = years.map((_, i) => Math.max(0.5, 15 - (15 - 0.5) * (i / 25)));
  const b20 = years.map((_, i) => Math.max(1,   20 - (20 - 1)   * (i / 25)));

  return {
    company_profile: {
      resolved_name: "Demo Company PLC",
      sector: "steel",
      jurisdiction: "DE",
      revenue_usd_m: { value: 12_500, tier: "VERIFIED" },
      scope1_mt_co2e: { value: 18.2, tier: "VERIFIED", source: "EUTL 2023" },
      scope2_mt_co2e: { value: 3.1,  tier: "REPORTED", source: "CDP 2023" },
      scope3_mt_co2e: { value: 42.5, tier: "ESTIMATED", source: "EEIO sector model" },
      data_gaps: [],
    },
    risk_assessment: {
      scenarios: {
        nze:     { enterprise_value_usd_m: nze[0],     npv_impact_pct: -14,  exposure_score: 62, transition_score: 48, financial_score: 55, adaptive_score: 71 },
        delayed: { enterprise_value_usd_m: delayed[0], npv_impact_pct: -28 },
        cp:      { enterprise_value_usd_m: cp[0],      npv_impact_pct: -42 },
      },
      rating: { rating: "B+", physical_pillar: 62, transition_pillar: 48, financial_pillar: 55, adaptive_pillar: 71 },
    },
    extended_risk: {
      paris_alignment: {
        implied_temperature_rise: 2.3,
        itr_label: "Moderately misaligned",
        itr_color: "orange",
        trajectory_years: years,
        trajectory_scope12_mt: scope12,
        trajectory_1_5_budget: b15,
        trajectory_2_0_budget: b20,
        decision_tier: "WATCH",
        composite_risk_score: 38,
        decision_rationale: "Composite score 38/100 (moderate). ITR 2.3°C. 2030 gap of 2.1 Mt requires engagement.",
        decision_weights: { "itr_alignment (50% weight)": 32, "budget_overshoot (30% weight)": 48, "interim_2030_gap (20% weight)": 42 },
        interim_2030_target_mt: 9.1,
        interim_2030_projected_mt: 11.2,
        interim_2030_gap_mt: 2.1,
        interim_2030_on_track: false,
        interim_2030_required_annual_reduction_pct: 5.8,
        data_gaps: [],
      },
      physical_risk: {
        eal_p10_usd_m: 82,
        eal_p50_usd_m: 124,
        eal_p90_usd_m: 188,
        npv_p10_usd_m: 790,
        npv_p50_usd_m: 1190,
        npv_p90_usd_m: 1810,
        compound_event_uplift_pct: 11.4,
        compound_event_pairs: ["flood+heat (co-occur=18%, uplift=2.2%)", "heat+water_stress (co-occur=35%, uplift=4.2%)", "heat+wildfire (co-occur=28%, uplift=3.4%)"],
        eal_tipping_point_stress_usd_m: 248,
        npv_tipping_point_stress_usd_m: 2380,
        climate_credit_spread_bps: 48,
        climate_adjusted_wacc: 0.128,
        npv_at_adjusted_wacc_usd_m: 980,
        insured_fraction_baseline: 0.70,
        insured_fraction_2050: 0.52,
        insurance_protection_gap_usd_m: 310,
        insurance_withdrawal_risk_flag: false,
        country_adaptive_capacity: 0.87,
        adaptive_capacity_damage_uplift_pct: 0.0,
        wildfire_eal_2050_usd_m: 8.4,
        slr_expected_loss_2050_usd_m: 0.0,
        macc_projects: [
          { name: "Onsite Solar (5 MW)", mac_usd_per_tco2e: -48, co2e_mitigated_mt_pa: 0.012, capex_usd_m: 4.2, annual_savings_usd_m: 0.74, roi_pct: 17.6, category: "renewables" },
          { name: "Water Recycling System", mac_usd_per_tco2e: -22, co2e_mitigated_mt_pa: 0.006, capex_usd_m: 1.8, annual_savings_usd_m: 0.22, roi_pct: 12.2, category: "efficiency" },
          { name: "NBS — 87 ha Mangrove", mac_usd_per_tco2e: 8, co2e_mitigated_mt_pa: 0.031, capex_usd_m: 2.6, annual_savings_usd_m: 0.11, roi_pct: 4.2, category: "nature" },
          { name: "DRI-EAF Steel Upgrade", mac_usd_per_tco2e: 42, co2e_mitigated_mt_pa: 0.85, capex_usd_m: 180, annual_savings_usd_m: 2.1, roi_pct: 1.2, category: "efficiency" },
          { name: "CCS Capture Unit", mac_usd_per_tco2e: 95, co2e_mitigated_mt_pa: 1.2, capex_usd_m: 320, annual_savings_usd_m: 0.4, roi_pct: 0.1, category: "carbon_capture" },
        ],
      },
      stranded_assets: { total_npv_impairment_usd_m: 480 },
      cbam:            { total_cost_usd_m: 95 },
      water_stress:    { total_npv_drag_usd_m: 62 },
      wildfire_risk:   { total_npv_loss_usd_m: 28 },
      litigation_risk: { financial_impact: { expected_usd_m: 45 } },
    },
    trajectory: {
      scope1_trajectory: scope12,
      years,
    },
    data_gaps: [
      { field: "Scope 3 Emissions", reason: "CDP submission not found — estimated from EEIO" },
      { field: "Facility Coordinates", reason: "Multi-site — geocoder returned headquarters only" },
    ],
  };
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className="text-2xl font-black" style={{ color: color ?? "#1e293b" }}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── ITR color helper ─────────────────────────────────────────────────────────
function itrHex(itr: number): string {
  if (itr <= 1.5) return "#16a34a";
  if (itr <= 2.0) return "#ca8a04";
  if (itr <= 2.5) return "#ea580c";
  return "#dc2626";
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState("");
  const [sector, setSector] = useState("steel");
  const [error, setError] = useState<string | null>(null);
  const [usedDemo, setUsedDemo] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const loadDemo = useCallback(() => {
    setData(makeDemoData());
    setUsedDemo(true);
    setError(null);
  }, []);

  // Load demo on mount
  useEffect(() => {
    loadDemo();
  }, [loadDemo]);

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

  const runAssessment = async () => {
    if (!company.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // POST to /agent/assess — synchronous endpoint returns AssessmentData directly.
      // The API key is optional; when CRI_API_KEYS is unset on the server, auth is skipped.
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (API_KEY) headers["X-API-Key"] = API_KEY;

      const res = await fetch(`${API_BASE}/agent/assess`, {
        method: "POST",
        headers,
        body: JSON.stringify({ company_name: company, sector_hint: sector, assessment_scope: "standard" }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          errBody?.detail?.error ?? errBody?.detail ?? `API error ${res.status}`
        );
      }

      const result = await res.json();

      // The /agent/assess endpoint returns AssessmentData directly (no job polling).
      setData(result);
      setUsedDemo(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const { company_profile: cp, risk_assessment: ra, extended_risk: er, trajectory: traj } = data;
  const baseEV  = ra.scenarios.nze.enterprise_value_usd_m;
  const rating  = ra.rating;
  const paris   = er.paris_alignment;
  const phys    = er.physical_risk;
  const itr     = paris?.implied_temperature_rise;
  const decisionTier = paris?.decision_tier ?? "";
  const decisionColor: Record<string, string> = { HOLD: "#16a34a", WATCH: "#f59e0b", REDUCE: "#ea580c", EXIT: "#dc2626" };

  // Scenario fan chart data (illustrative EV trajectories from API or computed)
  const years26 = Array.from({ length: 26 }, (_, i) => 2025 + i);
  const nzeEVs     = years26.map((_, i) => baseEV * Math.pow(1 - ra.scenarios.nze.npv_impact_pct / 100 / 25, i));
  const delayedEVs = years26.map((_, i) => baseEV * Math.pow(1 - ra.scenarios.delayed.npv_impact_pct / 100 / 25, i));
  const cpEVs      = years26.map((_, i) => baseEV * Math.pow(1 - ra.scenarios.cp.npv_impact_pct / 100 / 25, i));

  // Waterfall items
  const waterfallItems = [
    { label: "Physical Risk",     value: -(Math.abs(ra.scenarios.delayed.npv_impact_pct) * baseEV * 0.01 * 0.35) },
    { label: "Stranded Assets",   value: -(er.stranded_assets?.total_npv_impairment_usd_m ?? 0) },
    { label: "CBAM Exposure",     value: -(er.cbam?.total_cost_usd_m ?? 0) },
    { label: "Water Stress",      value: -(er.water_stress?.total_npv_drag_usd_m ?? 0) },
    { label: "Wildfire Risk",     value: -(er.wildfire_risk?.total_npv_loss_usd_m ?? 0) },
    { label: "Litigation",        value: -(er.litigation_risk?.financial_impact?.expected_usd_m ?? 0) },
  ].filter((item) => Math.abs(item.value) > 0);

  // Carbon pathway data
  const carbYears  = paris?.trajectory_years ?? years26;
  const carbScope  = paris?.trajectory_scope12_mt ?? [];
  const carb15     = paris?.trajectory_1_5_budget ?? [];
  const carb20     = paris?.trajectory_2_0_budget ?? [];
  const historical: { year: number; mt: number }[] = cp.scope1_mt_co2e
    ? [{ year: 2020, mt: (cp.scope1_mt_co2e.value ?? 0) * 1.08 },
       { year: 2021, mt: (cp.scope1_mt_co2e.value ?? 0) * 1.04 },
       { year: 2022, mt: cp.scope1_mt_co2e.value ?? 0 }]
    : [];

  // Confidence metrics
  const confidenceMetrics = [
    { label: "Scope 1 Emissions",     tier: (cp.scope1_mt_co2e?.tier ?? "MISSING") as "VERIFIED"|"REPORTED"|"ESTIMATED"|"MISSING", source: cp.scope1_mt_co2e?.source, year: 2023 },
    { label: "Scope 2 Emissions",     tier: (cp.scope2_mt_co2e?.tier ?? "MISSING") as "VERIFIED"|"REPORTED"|"ESTIMATED"|"MISSING", source: cp.scope2_mt_co2e?.source, year: 2022 },
    { label: "Scope 3 Emissions",     tier: (cp.scope3_mt_co2e?.tier ?? "ESTIMATED") as "VERIFIED"|"REPORTED"|"ESTIMATED"|"MISSING", source: cp.scope3_mt_co2e?.source },
    { label: "Revenue",               tier: (cp.revenue_usd_m?.tier ?? "REPORTED") as "VERIFIED"|"REPORTED"|"ESTIMATED"|"MISSING", source: "SEC EDGAR / Yahoo Finance", year: 2023 },
    { label: "Water Risk Score",      tier: "ESTIMATED" as const, source: "WRI Aqueduct sector avg" },
    { label: "Physical Risk Score",   tier: "ESTIMATED" as const, source: "CMIP6 / NASA POWER / JRC" },
    { label: "Litigation Exposure",   tier: "ESTIMATED" as const, source: "Grantham 2025 model" },
    { label: "ITR (°C)",              tier: "ESTIMATED" as const, source: "IPCC AR6 budget allocation" },
    ...(data.data_gaps.map((g) => ({ label: g.field, tier: "MISSING" as const, source: g.reason }))),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-gray-900">
              {cp.resolved_name}
            </h1>
            <p className="text-xs text-gray-500">
              {cp.sector} · {cp.jurisdiction}
              {usedDemo && <span className="ml-2 text-amber-600 font-medium">● Demo data</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Company name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runAssessment()}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {["steel","cement","oil_gas","utilities","mining","chemicals","aviation","agriculture","technology","financials"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={runAssessment}
              disabled={loading || !company.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
            >
              {loading ? "Running…" : "Assess"}
            </button>
            <button
              onClick={loadDemo}
              className="text-gray-500 hover:text-gray-700 text-sm border border-gray-200 px-3 py-1.5 rounded-lg"
            >
              Demo
            </button>
          </div>
        </div>
        {error && (
          <div className="max-w-7xl mx-auto mt-2">
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-1.5">{error}</p>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <KPICard
            label="CRI Rating"
            value={rating.rating ?? "—"}
            sub="Composite climate risk"
            color={
              (rating.rating ?? "")[0] === "A" ? "#16a34a" :
              (rating.rating ?? "")[0] === "B" ? "#3b82f6" :
              (rating.rating ?? "")[0] === "C" ? "#f59e0b" : "#dc2626"
            }
          />
          <KPICard
            label="Implied Temp. Rise"
            value={itr !== undefined ? `${itr.toFixed(1)}°C` : "—"}
            sub={paris?.itr_label ?? ""}
            color={itr !== undefined ? itrHex(itr) : undefined}
          />
          <KPICard
            label="Base EV"
            value={`$${(baseEV / 1000).toFixed(1)}B`}
            sub="NZE scenario"
          />
          <KPICard
            label="NZE EV Impact"
            value={`${ra.scenarios.nze.npv_impact_pct.toFixed(1)}%`}
            sub="vs. no-climate baseline"
            color={ra.scenarios.nze.npv_impact_pct < 0 ? "#dc2626" : "#16a34a"}
          />
          <KPICard
            label="CP EV Impact"
            value={`${ra.scenarios.cp.npv_impact_pct.toFixed(1)}%`}
            sub="Current Policies scenario"
            color="#dc2626"
          />
          <KPICard
            label="Revenue"
            value={cp.revenue_usd_m ? `$${(cp.revenue_usd_m.value / 1000).toFixed(1)}B` : "—"}
            sub={cp.sector}
          />
          <KPICard
            label="Paris Decision"
            value={decisionTier || "—"}
            sub={paris?.composite_risk_score !== undefined ? `Score ${paris.composite_risk_score.toFixed(0)}/100` : "Composite score"}
            color={decisionColor[decisionTier] ?? "#6b7280"}
          />
          <KPICard
            label="2030 Milestone"
            value={paris?.interim_2030_on_track !== undefined ? (paris.interim_2030_on_track ? "On Track ✓" : "Off Track ✗") : "—"}
            sub={paris?.interim_2030_gap_mt ? `Gap: ${paris.interim_2030_gap_mt.toFixed(1)} Mt Scope 1+2` : "SBTi 50% by 2030"}
            color={paris?.interim_2030_on_track ? "#16a34a" : "#dc2626"}
          />
        </div>

        {/* Row 2: Fan Chart + Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ScenarioFanChart
              title="Enterprise Value — NGFS Scenario Trajectory"
              years={years26}
              nze={nzeEVs}
              delayed={delayedEVs}
              cp={cpEVs}
              baseline={baseEV}
              yLabel="Enterprise Value (USD M)"
              unit="USD M"
            />
          </div>
          <div>
            <CRIRadarChart
              companyName={cp.resolved_name}
              scores={{
                physical:   rating.physical_pillar,
                transition: rating.transition_pillar,
                financial:  rating.financial_pillar,
                adaptive:   rating.adaptive_pillar,
              }}
              sectorMedian={{
                physical: 55, transition: 60, financial: 52, adaptive: 58,
              }}
              rating={rating.rating}
              title="CRI Pillar Scores"
            />
          </div>
        </div>

        {/* Row 3: EV Waterfall + Carbon Pathway */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EVWaterfallChart
            title="Enterprise Value Bridge (Delayed Transition)"
            baseEV={baseEV}
            items={waterfallItems}
            unit="USD M"
          />
          <CarbonPathwayChart
            title="Carbon Pathway vs. 1.5°C Requirement"
            companyName={cp.resolved_name}
            historical={historical}
            projected={carbScope.length > 0 ? { years: carbYears, values: carbScope } : undefined}
            budget1_5={carb15.length > 0 ? { years: carbYears, values: carb15 } : undefined}
            budget2_0={carb20.length > 0 ? { years: carbYears, values: carb20 } : undefined}
            itr={itr}
            unit="Mt CO₂e / yr"
          />
        </div>

        {/* Row 4: Physical Risk — EAL Uncertainty + Insurance + Tipping Point */}
        {phys && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Physical Risk — Expected Annual Loss</h2>
              {phys.insurance_withdrawal_risk_flag && (
                <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                  ⚠ Insurance Withdrawal Risk
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* EAL Uncertainty bands */}
              <div className="md:col-span-2 space-y-3">
                <p className="text-xs text-gray-500 font-medium">2050 EAL Uncertainty Bands (log-normal CMIP6 model spread)</p>
                {[
                  { label: "P90 — High", val: phys.eal_p90_usd_m ?? 0, color: "#dc2626" },
                  { label: "P50 — Central", val: phys.eal_p50_usd_m ?? 0, color: "#f59e0b" },
                  { label: "P10 — Low", val: phys.eal_p10_usd_m ?? 0, color: "#16a34a" },
                ].map(({ label, val, color }) => {
                  const max = (phys.eal_p90_usd_m ?? 1) * 1.05;
                  const pct = Math.min(100, (val / max) * 100);
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span className="font-medium">{label}</span>
                        <span className="font-mono">${val.toFixed(0)}M / yr</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-gray-50 rounded-lg p-3 text-xs">
                    <div className="text-gray-500 mb-0.5">Compound Event Uplift</div>
                    <div className="font-bold text-gray-800 text-sm">{(phys.compound_event_uplift_pct ?? 0).toFixed(1)}%</div>
                    <div className="text-gray-400 text-[10px] mt-0.5">IPCC AR6 co-occurrence matrix</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-xs">
                    <div className="text-gray-500 mb-0.5">Climate WACC Spread</div>
                    <div className="font-bold text-gray-800 text-sm">{(phys.climate_credit_spread_bps ?? 0).toFixed(0)} bps</div>
                    <div className="text-gray-400 text-[10px] mt-0.5">Adj. WACC: {((phys.climate_adjusted_wacc ?? 0) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
              {/* Right column: insurance + tipping point */}
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs space-y-2">
                  <p className="font-semibold text-amber-800 text-[11px] uppercase tracking-wide">Insurance Cover</p>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Baseline (2025)</span>
                    <span className="font-mono font-bold text-gray-800">{((phys.insured_fraction_baseline ?? 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Projected 2050</span>
                    <span className={`font-mono font-bold ${(phys.insured_fraction_2050 ?? 1) < 0.5 * (phys.insured_fraction_baseline ?? 1) ? "text-red-600" : "text-gray-800"}`}>
                      {((phys.insured_fraction_2050 ?? 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-amber-200 pt-1.5">
                    <span className="text-gray-600">Protection Gap NPV</span>
                    <span className="font-mono font-bold text-red-600">${(phys.insurance_protection_gap_usd_m ?? 0).toFixed(0)}M</span>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs space-y-2">
                  <p className="font-semibold text-red-800 text-[11px] uppercase tracking-wide">Tipping Point Stress</p>
                  <div className="flex justify-between">
                    <span className="text-gray-600">EAL (stress)</span>
                    <span className="font-mono font-bold text-red-700">${(phys.eal_tipping_point_stress_usd_m ?? 0).toFixed(0)}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">NPV (stress)</span>
                    <span className="font-mono font-bold text-red-700">${(phys.npv_tipping_point_stress_usd_m ?? 0).toFixed(0)}M</span>
                  </div>
                  <p className="text-gray-400 text-[10px]">IPCC AR6 tipping cascade · scenario multiplier</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Row 5: Paris Deep-Dive — composite score breakdown + 2030 detail */}
        {paris && paris.decision_tier && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">Paris Alignment — Decision Rationale</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Decision badge */}
              <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="text-3xl font-black mb-1" style={{ color: decisionColor[paris.decision_tier] ?? "#6b7280" }}>
                  {paris.decision_tier}
                </div>
                <div className="text-xs text-gray-500 text-center font-medium mb-2">Investor Action Signal</div>
                <div className="text-2xl font-bold text-gray-800">{(paris.composite_risk_score ?? 0).toFixed(0)}<span className="text-sm font-normal text-gray-400">/100</span></div>
                <div className="text-[10px] text-gray-400 text-center mt-1">Composite transition risk score</div>
                {paris.decision_rationale && (
                  <p className="text-[11px] text-gray-600 text-center mt-3 leading-relaxed">{paris.decision_rationale}</p>
                )}
              </div>
              {/* Score breakdown */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Score Components</p>
                {Object.entries(paris.decision_weights ?? {}).filter(([k]) => k !== "composite_score").map(([key, score]) => {
                  const label = key.replace(/ \(\d+% weight\)/, "");
                  const weight = key.match(/\((\d+)%/)?.[1] ?? "";
                  const pct = Math.min(100, score as number);
                  const col = pct >= 70 ? "#dc2626" : pct >= 45 ? "#f59e0b" : "#16a34a";
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{label} <span className="text-gray-400 text-[10px]">({weight}% wt)</span></span>
                        <span className="font-mono font-bold" style={{ color: col }}>{(score as number).toFixed(0)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: col }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* 2030 milestone detail */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3 text-xs">
                <p className="font-semibold text-gray-700 uppercase tracking-wide text-[11px]">2030 SBTi Near-Term Gate</p>
                <div className="flex justify-between">
                  <span className="text-gray-500">Target (−50% vs. base)</span>
                  <span className="font-mono font-bold text-gray-800">{(paris.interim_2030_target_mt ?? 0).toFixed(1)} Mt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Projected 2030</span>
                  <span className={`font-mono font-bold ${paris.interim_2030_on_track ? "text-green-600" : "text-red-600"}`}>
                    {(paris.interim_2030_projected_mt ?? 0).toFixed(1)} Mt
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-500">Gap</span>
                  <span className="font-mono font-bold text-red-600">{(paris.interim_2030_gap_mt ?? 0).toFixed(1)} Mt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Required reduction</span>
                  <span className="font-mono font-bold text-gray-800">{(paris.interim_2030_required_annual_reduction_pct ?? 0).toFixed(1)}%/yr</span>
                </div>
                <div className={`mt-2 text-center text-[11px] font-bold py-1.5 rounded-lg ${paris.interim_2030_on_track ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {paris.interim_2030_on_track ? "✓ On track for SBTi near-term" : "✗ Off track — engagement required"}
                </div>
                {(paris.data_gaps?.some(g => g.includes("SCOPE3_REQUIRED"))) && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[10px] text-amber-700">
                    ⚠ Scope 3 required for this sector — ITR may be understated
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Row 6: MACC Chart */}
        <MACCChart
          projects={phys?.macc_projects}
          cbamPrice={65}
          nzePrice={250}
          height={380}
        />

        {/* Row 7: Confidence Heatmap */}
        <ConfidenceHeatmap
          title="Data Quality & Provenance"
          metrics={confidenceMetrics}
        />

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center pb-4">
          ClimRisk Engine · IPCC AR6 · NGFS Phase 5 · TCFD / ISSB IFRS S2 · CSRD ESRS E1 ·
          Sources: GLEIF · SEC EDGAR · CDP · SBTi · EU EUTL · WRI Aqueduct · NASA FIRMS
        </p>
      </div>
    </div>
  );
}
