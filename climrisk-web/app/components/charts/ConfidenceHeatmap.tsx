"use client";
/**
 * ConfidenceHeatmap
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders a data-quality heatmap showing confidence tier per metric.
 * Key differentiator of the ClimRisk engine — makes provenance visible.
 *
 * ConfidenceTier colours:
 *   VERIFIED  → green  (EU ETS / EDGAR / GLEIF)
 *   REPORTED  → blue   (CDP / SBTi)
 *   ESTIMATED → amber  (sector benchmark)
 *   MISSING   → red
 *
 * Usage:
 *   <ConfidenceHeatmap
 *     metrics={[
 *       { label: "Scope 1 Emissions", tier: "VERIFIED", source: "EUTL 2023", year: 2023 },
 *       { label: "Scope 2 Emissions", tier: "REPORTED", source: "CDP 2023", year: 2022 },
 *       { label: "Scope 3 Emissions", tier: "ESTIMATED", source: "EEIO sector model" },
 *       { label: "Revenue", tier: "VERIFIED", source: "SEC EDGAR", year: 2023 },
 *       { label: "Facility Location", tier: "REPORTED", source: "Geocoder API" },
 *       { label: "Water Risk Score", tier: "ESTIMATED", source: "WRI Aqueduct sector avg" },
 *       { label: "Biodiversity Exposure", tier: "MISSING" },
 *     ]}
 *   />
 */

import React from "react";

type Tier = "VERIFIED" | "REPORTED" | "ESTIMATED" | "MISSING";

interface MetricRow {
  label: string;
  tier: Tier;
  source?: string;
  year?: number;
}

interface Props {
  metrics: MetricRow[];
  title?: string;
}

const TIER_CONFIG: Record<Tier, { color: string; bg: string; label: string; icon: string }> = {
  VERIFIED:  { color: "#15803d", bg: "#f0fdf4", label: "Verified",  icon: "✓" },
  REPORTED:  { color: "#1d4ed8", bg: "#eff6ff", label: "Reported",  icon: "⊕" },
  ESTIMATED: { color: "#b45309", bg: "#fffbeb", label: "Estimated", icon: "~" },
  MISSING:   { color: "#b91c1c", bg: "#fef2f2", label: "Missing",   icon: "✗" },
};

export default function ConfidenceHeatmap({ metrics, title = "Data Quality & Provenance" }: Props) {
  const tierCounts = Object.fromEntries(
    (["VERIFIED", "REPORTED", "ESTIMATED", "MISSING"] as Tier[]).map((t) => [
      t,
      metrics.filter((m) => m.tier === t).length,
    ])
  ) as Record<Tier, number>;

  const coveragePct = Math.round(
    ((tierCounts.VERIFIED + tierCounts.REPORTED) / metrics.length) * 100
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center gap-1.5">
          <div
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: coveragePct >= 80 ? "#f0fdf4" : coveragePct >= 60 ? "#fffbeb" : "#fef2f2",
              color: coveragePct >= 80 ? "#15803d" : coveragePct >= 60 ? "#b45309" : "#b91c1c",
            }}
          >
            {coveragePct}% quality coverage
          </div>
        </div>
      </div>

      {/* Tier summary bar */}
      <div className="flex gap-3 mb-4">
        {(["VERIFIED", "REPORTED", "ESTIMATED", "MISSING"] as Tier[]).map((t) => {
          const cfg = TIER_CONFIG[t];
          return (
            <div key={t} className="flex items-center gap-1">
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded text-xs font-bold"
                style={{ color: cfg.color, backgroundColor: cfg.bg }}
              >
                {cfg.icon}
              </span>
              <span className="text-xs text-gray-600">
                {cfg.label}: <span className="font-semibold">{tierCounts[t]}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-3 py-2 text-gray-500 font-medium">Metric</th>
              <th className="text-center px-2 py-2 text-gray-500 font-medium">Tier</th>
              <th className="text-left px-3 py-2 text-gray-500 font-medium">Source</th>
              <th className="text-center px-2 py-2 text-gray-500 font-medium">Year</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, i) => {
              const cfg = TIER_CONFIG[m.tier];
              return (
                <tr
                  key={i}
                  className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
                >
                  <td className="px-3 py-2 text-gray-700 font-medium">{m.label}</td>
                  <td className="px-2 py-2 text-center">
                    <span
                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ color: cfg.color, backgroundColor: cfg.bg }}
                    >
                      <span>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {m.source ?? <span className="text-red-400 italic">No source</span>}
                  </td>
                  <td className="px-2 py-2 text-center text-gray-400">
                    {m.year ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend footer */}
      <p className="mt-3 text-xs text-gray-400">
        Confidence tiers: <span className="font-medium text-green-700">Verified</span> (EU ETS/EDGAR/GLEIF) ·{" "}
        <span className="font-medium text-blue-700">Reported</span> (CDP/SBTi/company) ·{" "}
        <span className="font-medium text-amber-700">Estimated</span> (sector model) ·{" "}
        <span className="font-medium text-red-700">Missing</span> (not available)
      </p>
    </div>
  );
}
