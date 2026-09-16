"use client";
/**
 * ScenarioFanChart
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders a time-series fan chart (2025-2050) showing EV or FCF trajectory
 * under three NGFS scenarios: NZE (green), Delayed Transition (amber),
 * Current Policies (red). Includes uncertainty bands.
 *
 * Usage:
 *   <ScenarioFanChart
 *     title="Enterprise Value Trajectory"
 *     years={[2025, 2026, ..., 2050]}
 *     nze={[1200, 1190, ..., 900]}
 *     delayed={[1200, 1185, ..., 700]}
 *     cp={[1200, 1170, ..., 500]}
 *     baseline={1200}
 *     unit="USD M"
 *     yLabel="Enterprise Value (USD M)"
 *   />
 */

import React, { useMemo } from "react";

interface Props {
  title?: string;
  years: number[];
  nze: number[];
  delayed: number[];
  cp: number[];
  baseline?: number;
  unit?: string;
  yLabel?: string;
  /** Optional: uncertainty band (±) for NZE scenario */
  nzeBand?: number[];
  /** Optional: show vertical marker at a year (e.g. overshoot year) */
  markerYear?: number;
  markerLabel?: string;
  height?: number;
}

const W = 760, H_DEFAULT = 340;
const PAD = { top: 24, right: 140, bottom: 48, left: 72 };

function linePath(points: [number, number][]): string {
  return points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
}

function areaPath(upper: [number, number][], lower: [number, number][]): string {
  const top = upper.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const bot = [...lower].reverse().map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return `${top} ${bot} Z`;
}

export default function ScenarioFanChart({
  title = "Scenario Trajectory",
  years,
  nze,
  delayed,
  cp,
  baseline,
  unit = "USD M",
  yLabel = "Value",
  nzeBand,
  markerYear,
  markerLabel,
  height = H_DEFAULT,
}: Props) {
  const H = height;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const allVals = [...nze, ...delayed, ...cp, ...(nzeBand ? nze.map((v, i) => v + (nzeBand[i] || 0)) : [])];
  if (baseline !== undefined) allVals.push(baseline);
  const yMin = Math.min(...allVals) * 0.92;
  const yMax = Math.max(...allVals) * 1.04;

  const xScale = (i: number) => PAD.left + (i / (years.length - 1)) * innerW;
  const yScale = (v: number) => PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const nzePts  = nze.map((v, i): [number, number] => [xScale(i), yScale(v)]);
  const delPts  = delayed.map((v, i): [number, number] => [xScale(i), yScale(v)]);
  const cpPts   = cp.map((v, i): [number, number] => [xScale(i), yScale(v)]);

  // NZE uncertainty band
  const bandUpper = nzeBand ? nze.map((v, i): [number, number] => [xScale(i), yScale(v + (nzeBand[i] || 0))]) : null;
  const bandLower = nzeBand ? nze.map((v, i): [number, number] => [xScale(i), yScale(v - (nzeBand[i] || 0))]) : null;

  // Y axis ticks
  const tickCount = 5;
  const yTicks = useMemo(() => {
    const step = (yMax - yMin) / tickCount;
    return Array.from({ length: tickCount + 1 }, (_, i) => yMin + i * step);
  }, [yMin, yMax]);

  // X axis ticks — every 5 years
  const xTicks = years.filter((y) => y % 5 === 0);

  // Marker X
  const markerX = markerYear
    ? xScale(years.indexOf(markerYear))
    : null;

  // Format number
  const fmt = (v: number) =>
    Math.abs(v) >= 1000
      ? `${(v / 1000).toFixed(1)}k`
      : v.toFixed(0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      {title && (
        <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ fontFamily: "inherit" }}
        aria-label={title}
      >
        {/* Grid lines */}
        {yTicks.map((v) => (
          <line
            key={v}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={yScale(v)}
            y2={yScale(v)}
            stroke="#f0f0f0"
            strokeWidth={1}
          />
        ))}

        {/* Baseline horizontal */}
        {baseline !== undefined && (
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={yScale(baseline)}
            y2={yScale(baseline)}
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        )}

        {/* Overshoot / tipping-point marker */}
        {markerX !== null && (
          <>
            <line
              x1={markerX}
              x2={markerX}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <text
              x={markerX + 4}
              y={PAD.top + 12}
              fontSize={10}
              fill="#b45309"
            >
              {markerLabel ?? markerYear}
            </text>
          </>
        )}

        {/* NZE band */}
        {bandUpper && bandLower && (
          <path
            d={areaPath(bandUpper, bandLower)}
            fill="#16a34a"
            fillOpacity={0.08}
          />
        )}

        {/* Current Policies line */}
        <path d={linePath(cpPts)} fill="none" stroke="#dc2626" strokeWidth={2} />

        {/* Delayed Transition line */}
        <path d={linePath(delPts)} fill="none" stroke="#f59e0b" strokeWidth={2} />

        {/* NZE line */}
        <path d={linePath(nzePts)} fill="none" stroke="#16a34a" strokeWidth={2.5} />

        {/* Dots on last point */}
        {[
          { pts: nzePts, color: "#16a34a", label: `NZE: ${fmt(nze[nze.length - 1])}` },
          { pts: delPts, color: "#f59e0b", label: `Delayed: ${fmt(delayed[delayed.length - 1])}` },
          { pts: cpPts,  color: "#dc2626", label: `CP: ${fmt(cp[cp.length - 1])}` },
        ].map(({ pts, color, label }, ri) => {
          const [lx, ly] = pts[pts.length - 1];
          return (
            <g key={ri}>
              <circle cx={lx} cy={ly} r={4} fill={color} />
              <text x={lx + 8} y={ly + 4} fontSize={10} fill={color} fontWeight="600">
                {label}
              </text>
            </g>
          );
        })}

        {/* Y axis ticks + labels */}
        {yTicks.map((v) => (
          <text
            key={v}
            x={PAD.left - 6}
            y={yScale(v) + 4}
            fontSize={10}
            fill="#64748b"
            textAnchor="end"
          >
            {fmt(v)}
          </text>
        ))}

        {/* X axis ticks + labels */}
        {xTicks.map((yr) => {
          const xi = years.indexOf(yr);
          return (
            <text
              key={yr}
              x={xScale(xi)}
              y={H - PAD.bottom + 16}
              fontSize={10}
              fill="#64748b"
              textAnchor="middle"
            >
              {yr}
            </text>
          );
        })}

        {/* Y axis label */}
        <text
          x={16}
          y={PAD.top + innerH / 2}
          fontSize={10}
          fill="#94a3b8"
          textAnchor="middle"
          transform={`rotate(-90, 16, ${PAD.top + innerH / 2})`}
        >
          {yLabel}
        </text>

        {/* Legend */}
        {[
          { color: "#16a34a", label: "Net Zero (NZE)" },
          { color: "#f59e0b", label: "Delayed Transition" },
          { color: "#dc2626", label: "Current Policies" },
        ].map(({ color, label }, li) => (
          <g key={li} transform={`translate(${W - PAD.right + 8}, ${PAD.top + li * 20})`}>
            <rect width={12} height={3} y={4} rx={1} fill={color} />
            <text x={17} y={11} fontSize={10} fill="#374151">
              {label}
            </text>
          </g>
        ))}

        {/* Unit annotation */}
        <text x={PAD.left} y={H - 4} fontSize={9} fill="#9ca3af">
          {unit}
        </text>
      </svg>
    </div>
  );
}
