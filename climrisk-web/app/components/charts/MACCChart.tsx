"use client";

/**
 * MACCChart.tsx  —  Marginal Abatement Cost Curve
 * ──────────────────────────────────────────────────────────────────────────────
 * Horizontal waterfall chart sorted ascending by MAC ($/tCO₂e).
 * Bars to the LEFT of the y-axis are "negative-cost" measures (net savings).
 * Bars to the RIGHT are positive-cost measures.
 *
 * Overlay lines
 * ─────────────
 * • EU ETS / CBAM carbon price  (dashed amber)
 * • NGFS NZE 2050 carbon price  (dashed cyan)
 *
 * MAC formula (per project):
 *   MAC = (Annualised Capex − Annual Savings) / tCO₂e Mitigated
 *   Sorted ascending → cheapest measures first = MACC waterfall.
 *
 * Props
 * ─────
 * projects?    MACCProject[]   — defaults to demo set when omitted
 * cbamPrice?   number          — €/tCO₂e current CBAM price (default 65)
 * nzePrice?    number          — $/tCO₂e NGFS NZE 2050 target  (default 250)
 * height?      number          — chart height in px (default 360)
 *
 * Data sources (audit)
 * ────────────────────
 * MAC values: CRI Engine physical_risk.py assess_physical_risk() MACC projects
 * CBAM price: EU Commission ETS benchmark (current allowance price)
 * NZE price:  NGFS Phase 4 / IEA NZE 2050 — $250/tCO₂e by 2050
 */

import React, { useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface MACCProject {
  name: string;
  /** MAC $/tCO₂e — negative = net saving (goes left of axis) */
  mac_usd_per_tco2e: number;
  /** CO₂e mitigated Mt/year — determines bar width */
  co2e_mitigated_mt_pa: number;
  capex_usd_m: number;
  annual_savings_usd_m: number;
  roi_pct: number;
  category: "adaptation" | "renewables" | "efficiency" | "nature" | "carbon_capture";
}

export interface MACCChartProps {
  projects?: MACCProject[];
  cbamPrice?: number;
  nzePrice?: number;
  height?: number;
}

// ── Demo MACC projects (mirror physical_risk.py defaults) ─────────────────────
const DEMO_PROJECTS: MACCProject[] = [
  { name: "Onsite Solar (5 MW)",        mac_usd_per_tco2e: -48,  co2e_mitigated_mt_pa: 0.012, capex_usd_m: 4.2,  annual_savings_usd_m: 0.74, roi_pct: 17.6, category: "renewables"      },
  { name: "Water Recycling System",     mac_usd_per_tco2e: -22,  co2e_mitigated_mt_pa: 0.006, capex_usd_m: 1.8,  annual_savings_usd_m: 0.22, roi_pct: 12.2, category: "efficiency"       },
  { name: "NBS — 87 ha Mangrove",       mac_usd_per_tco2e: 8,    co2e_mitigated_mt_pa: 0.031, capex_usd_m: 2.6,  annual_savings_usd_m: 0.11, roi_pct: 4.2,  category: "nature"           },
  { name: "Cooling Adaptation (HVAC)",  mac_usd_per_tco2e: 34,   co2e_mitigated_mt_pa: 0.008, capex_usd_m: 3.1,  annual_savings_usd_m: 0.04, roi_pct: 1.3,  category: "adaptation"       },
  { name: "Flood Barrier (1.8 m)",      mac_usd_per_tco2e: 72,   co2e_mitigated_mt_pa: 0.000, capex_usd_m: 8.4,  annual_savings_usd_m: 0.00, roi_pct: 0.0,  category: "adaptation"       },
  { name: "CCUS Pilot (Cement)",        mac_usd_per_tco2e: 148,  co2e_mitigated_mt_pa: 0.042, capex_usd_m: 22.0, annual_savings_usd_m: 0.00, roi_pct: 0.0,  category: "carbon_capture"   },
];

// ── Colours by category ───────────────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  adaptation:     "#3B82F6",  // blue
  renewables:     "#10B981",  // emerald
  efficiency:     "#06B6D4",  // cyan
  nature:         "#84CC16",  // lime
  carbon_capture: "#8B5CF6",  // violet
};

function catColor(cat: string) {
  return CAT_COLOR[cat] ?? "#6B7280";
}

// ── Chart ─────────────────────────────────────────────────────────────────────
export default function MACCChart({
  projects = DEMO_PROJECTS,
  cbamPrice = 65,
  nzePrice = 250,
  height = 360,
}: MACCChartProps) {
  // Sort by MAC ascending (negative = cheapest / most attractive)
  const sorted = useMemo(
    () => [...projects].sort((a, b) => a.mac_usd_per_tco2e - b.mac_usd_per_tco2e),
    [projects]
  );

  // Axis extents
  const macMin = Math.min(...sorted.map((p) => p.mac_usd_per_tco2e), -20);
  const macMax = Math.max(...sorted.map((p) => p.mac_usd_per_tco2e), nzePrice + 20);
  const totalWidth = macMax - macMin;          // domain width in $/tCO₂e

  // SVG layout constants
  const PAD_L = 24;
  const PAD_R = 16;
  const PAD_T = 36;
  const PAD_B = 60;
  const W = 600;
  const H = height;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  // Convert MAC $/tCO₂e → x-pixel
  const macToX = (mac: number) =>
    PAD_L + ((mac - macMin) / totalWidth) * chartW;

  // Zero axis x-position
  const zeroX = macToX(0);

  // CBAM and NZE line x-positions
  const cbamX = macToX(cbamPrice);
  const nzeX  = macToX(nzePrice);

  // Bar layout — stack bars vertically with equal height
  const barH  = Math.max(14, Math.min(32, (chartH - (sorted.length - 1) * 4) / sorted.length));
  const gap   = 4;

  return (
    <div className="w-full rounded-xl border border-white/10 bg-[#0a0f1a] p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs font-mono text-white/40 uppercase tracking-widest mb-0.5">
            Marginal Abatement Cost Curve
          </div>
          <div className="text-[11px] text-white/30">
            Sorted by MAC $/tCO₂e · bar width = CO₂e mitigated (Mt/yr)
          </div>
        </div>
        {/* Legend lines */}
        <div className="flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-1.5">
            <svg width="20" height="2"><line x1="0" y1="1" x2="20" y2="1" stroke="#FFB000" strokeWidth="1.5" strokeDasharray="4 3"/></svg>
            <span className="text-[10px] font-mono text-[#FFB000]/80">CBAM €{cbamPrice}/t</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="20" height="2"><line x1="0" y1="1" x2="20" y2="1" stroke="#00F0FF" strokeWidth="1.5" strokeDasharray="4 3"/></svg>
            <span className="text-[10px] font-mono text-[#00F0FF]/80">NZE 2050 ${nzePrice}/t</span>
          </div>
        </div>
      </div>

      {/* SVG chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: "block", overflow: "visible" }}
        role="img"
        aria-label="Marginal Abatement Cost Curve"
      >
        {/* ── Grid lines ── */}
        {[-100, -50, 0, 50, 100, 150, 200, 250].map((v) => {
          if (v < macMin - 5 || v > macMax + 5) return null;
          const x = macToX(v);
          return (
            <g key={v}>
              <line
                x1={x} y1={PAD_T}
                x2={x} y2={PAD_T + chartH}
                stroke={v === 0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.07)"}
                strokeWidth={v === 0 ? 1.5 : 1}
              />
              <text
                x={x}
                y={PAD_T + chartH + 14}
                textAnchor="middle"
                fontSize={9}
                fill="rgba(255,255,255,0.35)"
                fontFamily="monospace"
              >
                {v > 0 ? `+${v}` : v}
              </text>
            </g>
          );
        })}

        {/* ── x-axis label ── */}
        <text
          x={W / 2}
          y={H - 8}
          textAnchor="middle"
          fontSize={9}
          fill="rgba(255,255,255,0.3)"
          fontFamily="monospace"
        >
          MAC  $/tCO₂e  ←  savings  |  cost  →
        </text>

        {/* ── CBAM price line ── */}
        {cbamX > PAD_L && cbamX < PAD_L + chartW && (
          <g>
            <line
              x1={cbamX} y1={PAD_T - 8}
              x2={cbamX} y2={PAD_T + chartH}
              stroke="#FFB000"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              opacity={0.75}
            />
            <text
              x={cbamX + 3}
              y={PAD_T - 2}
              fontSize={8}
              fill="#FFB000"
              opacity={0.85}
              fontFamily="monospace"
            >
              CBAM
            </text>
          </g>
        )}

        {/* ── NZE 2050 price line ── */}
        {nzeX > PAD_L && nzeX < PAD_L + chartW && (
          <g>
            <line
              x1={nzeX} y1={PAD_T - 8}
              x2={nzeX} y2={PAD_T + chartH}
              stroke="#00F0FF"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              opacity={0.75}
            />
            <text
              x={nzeX + 3}
              y={PAD_T - 2}
              fontSize={8}
              fill="#00F0FF"
              opacity={0.85}
              fontFamily="monospace"
            >
              NZE 2050
            </text>
          </g>
        )}

        {/* ── Bars ── */}
        {sorted.map((p, i) => {
          const y     = PAD_T + i * (barH + gap);
          const xLeft = Math.min(macToX(p.mac_usd_per_tco2e), zeroX);
          const xRight= Math.max(macToX(p.mac_usd_per_tco2e), zeroX);
          const bW    = Math.max(xRight - xLeft, 2);
          const color = catColor(p.category);
          const isCheap = p.mac_usd_per_tco2e < cbamPrice;

          return (
            <g key={p.name}>
              {/* Bar */}
              <rect
                x={xLeft}
                y={y}
                width={bW}
                height={barH}
                rx={3}
                fill={color}
                opacity={isCheap ? 0.85 : 0.55}
              />
              {/* Label inside or outside bar */}
              <text
                x={bW > 100 ? xLeft + 6 : xRight + 5}
                y={y + barH / 2 + 3.5}
                fontSize={9}
                fill={bW > 100 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.65)"}
                fontFamily="monospace"
              >
                {p.name}
              </text>
              {/* MAC value on right */}
              <text
                x={PAD_L + chartW + 4}
                y={y + barH / 2 + 3.5}
                fontSize={8}
                fill="rgba(255,255,255,0.35)"
                fontFamily="monospace"
              >
                {p.mac_usd_per_tco2e > 0 ? `+${p.mac_usd_per_tco2e}` : p.mac_usd_per_tco2e}
              </text>
            </g>
          );
        })}

        {/* ── Zero axis (bold) ── */}
        <line
          x1={zeroX} y1={PAD_T}
          x2={zeroX} y2={PAD_T + chartH}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1.5}
        />
      </svg>

      {/* Category legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {Object.entries(CAT_COLOR).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: color }} />
            <span className="text-[9px] font-mono text-white/40 capitalize">
              {cat.replace("_", " ")}
            </span>
          </div>
        ))}
      </div>

      {/* Attribution */}
      <div className="mt-1 text-[9px] font-mono text-white/20">
        MAC = (Annualised Capex − Annual Savings) / tCO₂e  ·  NGFS Phase 4 · EU ETS benchmark
      </div>
    </div>
  );
}
