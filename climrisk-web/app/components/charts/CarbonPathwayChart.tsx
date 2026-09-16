"use client";
/**
 * CarbonPathwayChart
 * ─────────────────────────────────────────────────────────────────────────────
 * Shows a company's actual / projected Scope 1+2 trajectory vs. the required
 * 1.5°C and 2°C SDA (Sector Decarbonization Approach) pathways.
 * Shades the "overshoot zone" in amber where company exceeds its carbon budget.
 *
 * Usage:
 *   <CarbonPathwayChart
 *     companyName="ThyssenKrupp"
 *     historical={[{ year: 2020, mt: 21.4 }, { year: 2021, mt: 20.8 }, { year: 2022, mt: 19.9 }]}
 *     projected={{ years: [2023,...,2050], values: [19.2,...,6.1] }}
 *     budget1_5={{ years: [...], values: [...] }}
 *     budget2_0={{ years: [...], values: [...] }}
 *     itr={2.3}
 *   />
 */

import React from "react";

interface YearValue {
  year: number;
  mt: number;
}

interface Series {
  years: number[];
  values: number[];
}

interface Props {
  companyName?: string;
  historical?: YearValue[];         // past emissions (solid line, dark)
  projected?: Series;               // forward trajectory (dashed)
  budget1_5?: Series;               // 1.5°C required path (green)
  budget2_0?: Series;               // 2.0°C required path (blue)
  itr?: number;                     // Implied Temperature Rise to display
  unit?: string;
  title?: string;
  height?: number;
}

const W = 720, H_DEFAULT = 320;
const PAD = { top: 32, right: 140, bottom: 48, left: 72 };

function toPath(xs: number[], ys: number[]): string {
  return xs
    .map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`)
    .join(" ");
}

export default function CarbonPathwayChart({
  companyName = "Company",
  historical = [],
  projected,
  budget1_5,
  budget2_0,
  itr,
  unit = "Mt CO₂e / yr",
  title = "Carbon Pathway",
  height = H_DEFAULT,
}: Props) {
  const H = height;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  // Gather all years + values
  const allYears = [
    ...historical.map((d) => d.year),
    ...(projected?.years ?? []),
    ...(budget1_5?.years ?? []),
    ...(budget2_0?.years ?? []),
  ];
  const yearMin = Math.min(...allYears);
  const yearMax = Math.max(...allYears);

  const allVals = [
    ...historical.map((d) => d.mt),
    ...(projected?.values ?? []),
    ...(budget1_5?.values ?? []),
    ...(budget2_0?.values ?? []),
    0,
  ];
  const yMin = 0;
  const yMax = Math.max(...allVals) * 1.1;

  const xScale = (yr: number) => PAD.left + ((yr - yearMin) / (yearMax - yearMin)) * innerW;
  const yScale = (v: number) => PAD.top + innerH - (v / yMax) * innerH;

  // Convert series to SVG coords
  const histXs = historical.map((d) => xScale(d.year));
  const histYs = historical.map((d) => yScale(d.mt));

  const projXs = projected?.years.map(xScale) ?? [];
  const projYs = projected?.values.map(yScale) ?? [];

  const b15Xs = budget1_5?.years.map(xScale) ?? [];
  const b15Ys = budget1_5?.values.map(yScale) ?? [];

  const b20Xs = budget2_0?.years.map(xScale) ?? [];
  const b20Ys = budget2_0?.values.map(yScale) ?? [];

  // Overshoot area between projected and 1.5°C pathway
  let overshootPath = "";
  if (projected && budget1_5 && projected.years.length > 0 && budget1_5.years.length > 0) {
    // Simple approach: use projected as top edge, budget1_5 as bottom
    const top = projXs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${projYs[i].toFixed(1)}`).join(" ");
    const bot = [...b15Xs].reverse().map((x, i) => `L${x.toFixed(1)},${[...b15Ys].reverse()[i].toFixed(1)}`).join(" ");
    overshootPath = `${top} ${bot} Z`;
  }

  // Y ticks
  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => (yMax / tickCount) * i);

  // X ticks — key years
  const xTickYears = [];
  for (let yr = Math.ceil(yearMin / 5) * 5; yr <= yearMax; yr += 5) xTickYears.push(yr);

  // ITR badge color
  const itrColor = itr === undefined ? "#6b7280"
    : itr <= 1.5 ? "#16a34a"
    : itr <= 2.0 ? "#ca8a04"
    : itr <= 2.5 ? "#ea580c"
    : "#dc2626";

  const fmt = (v: number) => v >= 1 ? v.toFixed(1) : v.toFixed(2);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{companyName} · Scope 1+2</p>
        </div>
        {itr !== undefined && (
          <div
            className="text-center px-3 py-1 rounded-lg text-white text-xs font-bold"
            style={{ backgroundColor: itrColor }}
          >
            ITR {itr.toFixed(1)}°C
          </div>
        )}
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

        {/* 2030 marker */}
        <line
          x1={xScale(2030)}
          x2={xScale(2030)}
          y1={PAD.top}
          y2={H - PAD.bottom}
          stroke="#94a3b8"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <text x={xScale(2030) + 3} y={PAD.top + 10} fontSize={9} fill="#64748b">2030</text>

        {/* 2050 marker */}
        <line
          x1={xScale(2050)}
          x2={xScale(2050)}
          y1={PAD.top}
          y2={H - PAD.bottom}
          stroke="#94a3b8"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <text x={xScale(2050) - 24} y={PAD.top + 10} fontSize={9} fill="#64748b">2050</text>

        {/* Overshoot fill */}
        {overshootPath && (
          <path d={overshootPath} fill="#f59e0b" fillOpacity={0.12} />
        )}

        {/* 2°C pathway */}
        {b20Xs.length > 0 && (
          <path
            d={toPath(b20Xs, b20Ys)}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={1.5}
            strokeDasharray="6 3"
          />
        )}

        {/* 1.5°C pathway */}
        {b15Xs.length > 0 && (
          <path
            d={toPath(b15Xs, b15Ys)}
            fill="none"
            stroke="#16a34a"
            strokeWidth={2}
            strokeDasharray="6 3"
          />
        )}

        {/* Historical (solid) */}
        {histXs.length > 0 && (
          <>
            <path
              d={toPath(histXs, histYs)}
              fill="none"
              stroke="#1e293b"
              strokeWidth={2.5}
            />
            {histXs.map((x, i) => (
              <circle key={i} cx={x} cy={histYs[i]} r={3} fill="#1e293b" />
            ))}
          </>
        )}

        {/* Projected (dashed) */}
        {projXs.length > 0 && (
          <path
            d={toPath(projXs, projYs)}
            fill="none"
            stroke="#1e293b"
            strokeWidth={2}
            strokeDasharray="5 4"
          />
        )}

        {/* Y axis */}
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

        {/* X axis */}
        {xTickYears.map((yr) => (
          <text
            key={yr}
            x={xScale(yr)}
            y={H - PAD.bottom + 14}
            fontSize={9}
            fill="#64748b"
            textAnchor="middle"
          >
            {yr}
          </text>
        ))}

        {/* Y label */}
        <text
          x={14}
          y={PAD.top + innerH / 2}
          fontSize={9}
          fill="#94a3b8"
          textAnchor="middle"
          transform={`rotate(-90, 14, ${PAD.top + innerH / 2})`}
        >
          {unit}
        </text>

        {/* Legend */}
        {[
          { color: "#1e293b", dash: false, label: "Actual Scope 1+2" },
          { color: "#1e293b", dash: true,  label: "Projected trajectory" },
          { color: "#16a34a", dash: true,  label: "1.5°C pathway (SBTi SDA)" },
          { color: "#3b82f6", dash: true,  label: "2°C pathway" },
        ].map(({ color, dash, label }, li) => (
          <g key={li} transform={`translate(${W - PAD.right + 8}, ${PAD.top + li * 20})`}>
            <line
              x1={0} y1={6} x2={14} y2={6}
              stroke={color}
              strokeWidth={dash ? 1.5 : 2.5}
              strokeDasharray={dash ? "5 3" : undefined}
            />
            <text x={18} y={10} fontSize={9} fill="#374151">{label}</text>
          </g>
        ))}
        {overshootPath && (
          <g transform={`translate(${W - PAD.right + 8}, ${PAD.top + 4 * 20})`}>
            <rect width={14} height={8} y={2} fill="#f59e0b" fillOpacity={0.3} rx={1} />
            <text x={18} y={10} fontSize={9} fill="#374151">Overshoot zone</text>
          </g>
        )}

        {/* Unit */}
        <text x={PAD.left} y={H - 4} fontSize={9} fill="#9ca3af">{unit}</text>
      </svg>
    </div>
  );
}
