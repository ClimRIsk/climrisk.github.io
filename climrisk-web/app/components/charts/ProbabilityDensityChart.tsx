"use client";

/**
 * ProbabilityDensityChart.tsx  —  Flood Return Period Probability Density
 * ──────────────────────────────────────────────────────────────────────────────
 * Dual bell-curve (Gumbel extreme-value distribution) showing how tail-risk
 * events compress from 1-in-100yr baseline to 1-in-10yr by 2050 under SSP3-7.0.
 *
 * Visual elements
 * ───────────────
 * • Cyan  curve  — Historical baseline (Gumbel μ₀, σ₀)
 * • Red   curve  — 2050 SSP3-7.0 projection (shifted μ, narrower σ → fatter right tail)
 * • Shaded tail  — P(loss > threshold) fills under both curves
 * • Vertical lines — 1-in-100yr (baseline) and 1-in-10yr (2050) return level
 * • Return period labels with arrow annotation
 *
 * Return Period Compression logic (from physical_risk.py)
 * ──────────────────────────────────────────────────────
 *   ann_prob_baseline = 1/100 = 1%
 *   ann_prob_2050     = ann_prob_baseline × CMIP6_flood_multiplier (capped 20%)
 *   → 1-in-100yr becomes ~1-in-10yr under SSP3-7.0 by 2050
 *
 * Props
 * ─────
 * baselineReturnPeriod?   number  — years (default 100)
 * proj2050ReturnPeriod?   number  — years (default 10)
 * scenario?               string  — scenario label (default "SSP3-7.0")
 * height?                 number  — SVG height (default 300)
 *
 * Data sources (audit)
 * ────────────────────
 * CMIP6 flood multipliers: NASA NEX-GDDP-CMIP6 (34 GCMs) — NGFS Phase 4
 * Gumbel parameterisation: WRI Aqueduct 4.0 / IPCC AR6 Ch.11
 * Return period compression: physical_risk.py _CMIP6_HAZARD_MULTIPLIER[flood]
 */

import React, { useMemo } from "react";

// ── Gumbel distribution helpers ───────────────────────────────────────────────
/** Gumbel PDF  f(x) = (1/β) · exp(−z − e^−z)  where z = (x−μ)/β */
function gumbelPDF(x: number, mu: number, beta: number): number {
  const z = (x - mu) / beta;
  return (1 / beta) * Math.exp(-z - Math.exp(-z));
}

/** Gumbel return level for return period T years (annual exceedance prob = 1/T) */
function gumbelReturnLevel(T: number, mu: number, beta: number): number {
  return mu - beta * Math.log(-Math.log(1 - 1 / T));
}

/** Sample the Gumbel PDF across [xMin, xMax] at n points */
function sampleGumbel(
  mu: number,
  beta: number,
  xMin: number,
  xMax: number,
  n = 400
): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const x = xMin + (i / n) * (xMax - xMin);
    pts.push([x, gumbelPDF(x, mu, beta)]);
  }
  return pts;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ProbabilityDensityChartProps {
  baselineReturnPeriod?: number;
  proj2050ReturnPeriod?: number;
  scenario?: string;
  height?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ProbabilityDensityChart({
  baselineReturnPeriod = 100,
  proj2050ReturnPeriod = 10,
  scenario = "SSP3-7.0",
  height = 300,
}: ProbabilityDensityChartProps) {

  // Gumbel parameters
  // Baseline: μ₀ = 0 (normalised loss / flood depth units), β₀ = 1
  // 2050: distribution shifts right (higher mean damage) and fattens right tail
  //   μ₁ > μ₀ means more frequent moderate events
  //   β₁ > β₀ means wider spread / fatter tail
  const MU0   = 0.0;   const BETA0 = 1.0;
  const MU1   = 1.8;   const BETA1 = 1.4;   // SSP3-7.0 2050 shift

  // x-domain (flood loss index, normalised units)
  const X_MIN = -2.5;
  const X_MAX = 10.0;

  const baselinePts = useMemo(() => sampleGumbel(MU0, BETA0, X_MIN, X_MAX), []);
  const proj2050Pts = useMemo(() => sampleGumbel(MU1, BETA1, X_MIN, X_MAX), []);

  // Return levels for the two curves
  const rl_baseline = gumbelReturnLevel(baselineReturnPeriod, MU0, BETA0);
  const rl_2050     = gumbelReturnLevel(proj2050ReturnPeriod, MU1, BETA1);

  // Max PDF value (for y-scaling)
  const yMax = Math.max(
    ...baselinePts.map(([, y]) => y),
    ...proj2050Pts.map(([, y]) => y)
  ) * 1.12;

  // SVG layout
  const PAD_L = 36;
  const PAD_R = 12;
  const PAD_T = 40;
  const PAD_B = 44;
  const W     = 600;
  const H     = height;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  // Coordinate helpers
  const xScale = (v: number) => PAD_L + ((v - X_MIN) / (X_MAX - X_MIN)) * chartW;
  const yScale = (v: number) => PAD_T + chartH - (v / yMax) * chartH;

  // Build SVG path string from samples
  function toPath(pts: Array<[number, number]>): string {
    return pts
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${xScale(x).toFixed(1)},${yScale(y).toFixed(1)}`)
      .join(" ");
  }

  // Tail fill: all points where x >= threshold, closed to baseline
  function tailFillPath(
    pts: Array<[number, number]>,
    threshold: number,
    color: string,
    id: string
  ) {
    const above = pts.filter(([x]) => x >= threshold);
    if (above.length < 2) return null;
    const line = above.map(([x, y], i) =>
      `${i === 0 ? "M" : "L"}${xScale(x).toFixed(1)},${yScale(y).toFixed(1)}`
    ).join(" ");
    // Close to x-axis
    const close = `L${xScale(above[above.length - 1][0]).toFixed(1)},${yScale(0).toFixed(1)} L${xScale(above[0][0]).toFixed(1)},${yScale(0).toFixed(1)} Z`;
    return (
      <path
        key={id}
        d={`${line} ${close}`}
        fill={color}
        opacity={0.18}
      />
    );
  }

  // x-axis tick values
  const xTicks = [-2, 0, 2, 4, 6, 8, 10];
  // y-axis ticks
  const yTicks = [0, 0.05, 0.10, 0.15, 0.20];

  const baselinePath = toPath(baselinePts);
  const proj2050Path = toPath(proj2050Pts);

  return (
    <div className="w-full rounded-xl border border-white/10 bg-[#0a0f1a] p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-xs font-mono text-white/40 uppercase tracking-widest mb-0.5">
            Flood Tail-Risk Shift
          </div>
          <div className="text-[11px] text-white/30">
            Return period compression · Historical → 2050 ({scenario})
          </div>
        </div>
        {/* Scenario badge */}
        <div className="px-2 py-0.5 rounded-full bg-[#FF003C]/15 border border-[#FF003C]/30">
          <span className="text-[10px] font-mono text-[#FF003C]/80">{scenario}</span>
        </div>
      </div>

      {/* Key callout */}
      <div className="flex gap-3 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#00F0FF] inline-block" />
          <span className="text-[10px] font-mono text-white/50">
            Historical  1-in-{baselineReturnPeriod}yr
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#FF003C] inline-block" />
          <span className="text-[10px] font-mono text-white/50">
            2050 proj.  1-in-{proj2050ReturnPeriod}yr
          </span>
        </div>
      </div>

      {/* SVG */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: "block", overflow: "visible" }}
        role="img"
        aria-label="Probability density chart — flood return period compression"
      >
        {/* ── Definitions ── */}
        <defs>
          <linearGradient id="gradCyan" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="gradRed" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#FF003C" stopOpacity="0.40" />
            <stop offset="100%" stopColor="#FF003C" stopOpacity="0.02" />
          </linearGradient>
          <clipPath id="chartClip">
            <rect x={PAD_L} y={PAD_T} width={chartW} height={chartH} />
          </clipPath>
        </defs>

        {/* ── Grid ── */}
        {yTicks.map((v) => {
          const y = yScale(v);
          return (
            <g key={v}>
              <line x1={PAD_L} y1={y} x2={PAD_L + chartW} y2={y}
                stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <text x={PAD_L - 4} y={y + 3.5} textAnchor="end"
                fontSize={8} fill="rgba(255,255,255,0.3)" fontFamily="monospace">
                {v.toFixed(2)}
              </text>
            </g>
          );
        })}
        {xTicks.map((v) => {
          const x = xScale(v);
          return (
            <g key={v}>
              <line x1={x} y1={PAD_T} x2={x} y2={PAD_T + chartH}
                stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <text x={x} y={PAD_T + chartH + 13} textAnchor="middle"
                fontSize={8} fill="rgba(255,255,255,0.3)" fontFamily="monospace">
                {v}
              </text>
            </g>
          );
        })}

        {/* ── Axis labels ── */}
        <text x={W / 2} y={H - 4} textAnchor="middle"
          fontSize={9} fill="rgba(255,255,255,0.3)" fontFamily="monospace">
          Normalised flood loss index
        </text>
        <text
          x={12} y={PAD_T + chartH / 2}
          textAnchor="middle" fontSize={9}
          fill="rgba(255,255,255,0.3)" fontFamily="monospace"
          transform={`rotate(-90 12 ${PAD_T + chartH / 2})`}
        >
          Probability density
        </text>

        {/* ── Clipped chart area ── */}
        <g clipPath="url(#chartClip)">
          {/* Baseline area fill */}
          <path
            d={`${baselinePath} L${xScale(X_MAX).toFixed(1)},${yScale(0).toFixed(1)} L${xScale(X_MIN).toFixed(1)},${yScale(0).toFixed(1)} Z`}
            fill="url(#gradCyan)"
          />
          {/* 2050 area fill */}
          <path
            d={`${proj2050Path} L${xScale(X_MAX).toFixed(1)},${yScale(0).toFixed(1)} L${xScale(X_MIN).toFixed(1)},${yScale(0).toFixed(1)} Z`}
            fill="url(#gradRed)"
          />

          {/* Tail shading — baseline tail (1-in-T_base exceedance) */}
          {tailFillPath(baselinePts, rl_baseline, "#00F0FF", "tail-base")}
          {/* Tail shading — 2050 tail at same threshold */}
          {tailFillPath(proj2050Pts, rl_baseline, "#FF003C", "tail-2050")}

          {/* Baseline PDF curve */}
          <path d={baselinePath} fill="none" stroke="#00F0FF" strokeWidth={2} opacity={0.9} />
          {/* 2050 PDF curve */}
          <path d={proj2050Path} fill="none" stroke="#FF003C" strokeWidth={2} opacity={0.9} />

          {/* Return level lines */}
          {/* Baseline return level */}
          <line
            x1={xScale(rl_baseline)} y1={PAD_T}
            x2={xScale(rl_baseline)} y2={PAD_T + chartH}
            stroke="#00F0FF" strokeWidth={1.5} strokeDasharray="5 4" opacity={0.7}
          />
          {/* 2050 return level */}
          <line
            x1={xScale(rl_2050)} y1={PAD_T}
            x2={xScale(rl_2050)} y2={PAD_T + chartH}
            stroke="#FF003C" strokeWidth={1.5} strokeDasharray="5 4" opacity={0.7}
          />
        </g>

        {/* Return period labels (above clip) */}
        <text
          x={xScale(rl_baseline)}
          y={PAD_T - 18}
          textAnchor="middle"
          fontSize={9}
          fill="#00F0FF"
          fontFamily="monospace"
          opacity={0.85}
        >
          1-in-{baselineReturnPeriod}yr
        </text>
        <text
          x={xScale(rl_baseline)}
          y={PAD_T - 7}
          textAnchor="middle"
          fontSize={8}
          fill="#00F0FF"
          fontFamily="monospace"
          opacity={0.6}
        >
          (historical)
        </text>

        <text
          x={xScale(rl_2050)}
          y={PAD_T - 18}
          textAnchor="middle"
          fontSize={9}
          fill="#FF003C"
          fontFamily="monospace"
          opacity={0.85}
        >
          1-in-{proj2050ReturnPeriod}yr
        </text>
        <text
          x={xScale(rl_2050)}
          y={PAD_T - 7}
          textAnchor="middle"
          fontSize={8}
          fill="#FF003C"
          fontFamily="monospace"
          opacity={0.6}
        >
          (2050)
        </text>

        {/* Arrow: compression annotation */}
        {xScale(rl_2050) + 8 < xScale(rl_baseline) - 8 && (
          <g opacity={0.55}>
            <line
              x1={xScale(rl_2050) + 6}  y1={PAD_T - 13}
              x2={xScale(rl_baseline) - 6} y2={PAD_T - 13}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth={1}
              markerEnd="url(#arrowRight)"
              markerStart="url(#arrowLeft)"
            />
            <text
              x={(xScale(rl_2050) + xScale(rl_baseline)) / 2}
              y={PAD_T - 18}
              textAnchor="middle"
              fontSize={8}
              fill="rgba(255,255,255,0.4)"
              fontFamily="monospace"
            >
              compression ×{Math.round(baselineReturnPeriod / proj2050ReturnPeriod)}
            </text>
            {/* Arrow heads */}
            <defs>
              <marker id="arrowRight" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                <path d="M0,0 L4,2 L0,4" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
              </marker>
              <marker id="arrowLeft" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto-start-reverse">
                <path d="M0,0 L4,2 L0,4" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
              </marker>
            </defs>
          </g>
        )}

        {/* x-axis baseline */}
        <line
          x1={PAD_L} y1={PAD_T + chartH}
          x2={PAD_L + chartW} y2={PAD_T + chartH}
          stroke="rgba(255,255,255,0.2)" strokeWidth={1}
        />
      </svg>

      {/* Annotation box */}
      <div className="mt-2 px-3 py-2 rounded-lg bg-[#FF003C]/10 border border-[#FF003C]/20">
        <div className="text-[10px] font-mono text-[#FF003C]/80">
          ⚠ Return period compression: a 1-in-{baselineReturnPeriod}yr flood event
          becomes ~1-in-{proj2050ReturnPeriod}yr by 2050 under {scenario}
          (CMIP6 flood multiplier ×{(baselineReturnPeriod / proj2050ReturnPeriod).toFixed(0)}).
          Annual exceedance probability: {(100 / baselineReturnPeriod).toFixed(1)}% → {(100 / proj2050ReturnPeriod).toFixed(0)}%.
        </div>
      </div>

      {/* Attribution */}
      <div className="mt-1 text-[9px] font-mono text-white/20">
        Gumbel EVD · CMIP6 (34 GCMs) · NGFS Phase 4 · WRI Aqueduct 4.0 · IPCC AR6 Ch.11
      </div>
    </div>
  );
}
