"use client";
/**
 * EVWaterfallChart — Enterprise Value Bridge / Waterfall
 * ─────────────────────────────────────────────────────────────────────────────
 * Standard investment banking format: walking from Base EV down to
 * climate-adjusted EV showing each risk component.
 *
 * Usage:
 *   <EVWaterfallChart
 *     baseEV={5000}
 *     items={[
 *       { label: "Physical Risk", value: -320 },
 *       { label: "Stranded Assets", value: -480 },
 *       { label: "CBAM Exposure", value: -95 },
 *       { label: "Water Stress", value: -62 },
 *       { label: "Wildfire Risk", value: -28 },
 *       { label: "Litigation Reserve", value: -45 },
 *     ]}
 *     unit="USD M"
 *   />
 */

import React from "react";

interface WaterfallItem {
  label: string;
  value: number;          // negative = loss, positive = gain
  color?: string;         // override auto-color
  tooltip?: string;
}

interface Props {
  baseEV: number;
  items: WaterfallItem[];
  unit?: string;
  title?: string;
  height?: number;
}

const W = 720, H_DEFAULT = 340;
const PAD = { top: 24, right: 40, bottom: 56, left: 80 };
const BAR_GAP = 10;

function fmt(v: number): string {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toFixed(0);
}

export default function EVWaterfallChart({
  baseEV,
  items,
  unit = "USD M",
  title = "Enterprise Value Bridge",
  height = H_DEFAULT,
}: Props) {
  const H = height;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  // Build columns: Base + each item + Final
  const columns: { label: string; start: number; end: number; color: string; isTotal?: boolean }[] = [];
  let running = baseEV;

  columns.push({ label: "Base EV", start: 0, end: baseEV, color: "#3b82f6", isTotal: true });

  for (const item of items) {
    const start = running;
    const end = running + item.value;
    running = end;
    columns.push({
      label: item.label,
      start,
      end,
      color: item.color ?? (item.value < 0 ? "#ef4444" : "#22c55e"),
    });
  }
  const finalEV = running;
  columns.push({ label: "Climate-Adj. EV", start: 0, end: finalEV, color: "#6366f1", isTotal: true });

  // Y range
  const allVals = columns.flatMap((c) => [c.start, c.end]);
  const yMin = Math.min(0, ...allVals) * 1.04;
  const yMax = Math.max(...allVals) * 1.06;

  const nCols = columns.length;
  const colW = (innerW - (nCols - 1) * BAR_GAP) / nCols;

  const xOf = (i: number) => PAD.left + i * (colW + BAR_GAP);
  const yScale = (v: number) => PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  // Connector lines between columns
  const connectors: { x1: number; x2: number; y: number }[] = [];
  for (let i = 0; i < columns.length - 1; i++) {
    const next = columns[i + 1];
    const cur = columns[i];
    if (!next.isTotal) {
      connectors.push({
        x1: xOf(i) + colW,
        x2: xOf(i + 1),
        y: yScale(cur.isTotal ? cur.end : Math.min(cur.start, cur.end)),
      });
    }
  }

  // Y ticks
  const tickCount = 5;
  const yStep = (yMax - yMin) / tickCount;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => yMin + i * yStep);

  // Zero line
  const zeroY = yScale(0);

  const pctChange = ((finalEV - baseEV) / baseEV) * 100;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            pctChange < 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}
        >
          {pctChange >= 0 ? "+" : ""}{pctChange.toFixed(1)}% climate adj.
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ fontFamily: "inherit" }}
        aria-label={title}
      >
        {/* Grid */}
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

        {/* Zero line */}
        {yMin < 0 && (
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={zeroY}
            y2={zeroY}
            stroke="#94a3b8"
            strokeWidth={1}
          />
        )}

        {/* Connector lines */}
        {connectors.map((c, i) => (
          <line
            key={i}
            x1={c.x1}
            x2={c.x2}
            y1={c.y}
            y2={c.y}
            stroke="#cbd5e1"
            strokeWidth={1}
            strokeDasharray="3 2"
          />
        ))}

        {/* Bars */}
        {columns.map((col, i) => {
          const x = xOf(i);
          const top = yScale(Math.max(col.start, col.end));
          const bot = yScale(Math.min(col.start, col.end));
          const bh = Math.max(2, bot - top);
          const value = col.end - (col.isTotal ? 0 : col.start);
          return (
            <g key={i}>
              <rect
                x={x}
                y={top}
                width={colW}
                height={bh}
                fill={col.color}
                rx={2}
                fillOpacity={col.isTotal ? 1 : 0.85}
              />
              {/* Value label above / below bar */}
              <text
                x={x + colW / 2}
                y={value >= 0 ? top - 5 : bot + 12}
                fontSize={9}
                fill={col.color}
                textAnchor="middle"
                fontWeight="600"
              >
                {value >= 0 ? "" : "−"}{fmt(Math.abs(value))}
              </text>
              {/* Column label */}
              <text
                x={x + colW / 2}
                y={H - PAD.bottom + 14}
                fontSize={9}
                fill="#374151"
                textAnchor="middle"
                transform={`rotate(-30, ${x + colW / 2}, ${H - PAD.bottom + 14})`}
              >
                {col.label}
              </text>
            </g>
          );
        })}

        {/* Y axis ticks */}
        {yTicks.map((v) => (
          <text
            key={v}
            x={PAD.left - 6}
            y={yScale(v) + 4}
            fontSize={9}
            fill="#64748b"
            textAnchor="end"
          >
            {fmt(v)}
          </text>
        ))}

        {/* Unit */}
        <text x={PAD.left} y={H - 4} fontSize={9} fill="#9ca3af">
          {unit}
        </text>
      </svg>
    </div>
  );
}
