"use client";
/**
 * CRIRadarChart — Spider / Radar chart for CRI pillar scores
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders a radar chart with 4-6 axes showing the company's pillar scores
 * overlaid on the sector median. Standard executive communication format.
 *
 * Usage:
 *   <CRIRadarChart
 *     companyName="Rio Tinto"
 *     scores={{
 *       physical: 62,
 *       transition: 48,
 *       financial: 55,
 *       adaptive: 71,
 *     }}
 *     sectorMedian={{
 *       physical: 55,
 *       transition: 60,
 *       financial: 52,
 *       adaptive: 58,
 *     }}
 *     rating="B+"
 *   />
 */

import React from "react";

interface PillarScores {
  physical: number;
  transition: number;
  financial: number;
  adaptive: number;
  /** Optional extended pillars */
  water?: number;
  litigation?: number;
}

interface Props {
  companyName?: string;
  scores: PillarScores;
  sectorMedian?: PillarScores;
  rating?: string;
  title?: string;
  size?: number;
}

const AXES = [
  { key: "physical",   label: "Physical Risk" },
  { key: "transition", label: "Transition" },
  { key: "financial",  label: "Financial" },
  { key: "adaptive",   label: "Adaptive Capacity" },
  { key: "water",      label: "Water Stress" },
  { key: "litigation", label: "Litigation" },
] as const;

function polarToXY(angle: number, r: number, cx: number, cy: number): [number, number] {
  return [
    cx + r * Math.cos(angle - Math.PI / 2),
    cy + r * Math.sin(angle - Math.PI / 2),
  ];
}

function scoreToColor(score: number): string {
  if (score >= 70) return "#16a34a";
  if (score >= 50) return "#ca8a04";
  return "#dc2626";
}

function ratingColor(r?: string): string {
  if (!r) return "#6b7280";
  const first = r[0].toUpperCase();
  if (first === "A") return "#16a34a";
  if (first === "B") return "#3b82f6";
  if (first === "C") return "#f59e0b";
  return "#dc2626";
}

export default function CRIRadarChart({
  companyName = "Company",
  scores,
  sectorMedian,
  rating,
  title = "CRI Pillar Scores",
  size = 300,
}: Props) {
  const cx = size / 2, cy = size / 2;
  const maxR = size * 0.36;

  // Active axes (only include optional if score provided)
  const axes = AXES.filter((a) => scores[a.key] !== undefined);
  const n = axes.length;
  const angleStep = (2 * Math.PI) / n;

  const ringLevels = [25, 50, 75, 100];

  function getPolygonPoints(scoreMap: PillarScores): [number, number][] {
    return axes.map((a, i) => {
      const v = (scoreMap[a.key] ?? 0) / 100;
      const angle = i * angleStep;
      return polarToXY(angle, v * maxR, cx, cy);
    });
  }

  function pointsStr(pts: [number, number][]): string {
    return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  }

  const companyPts = getPolygonPoints(scores);
  const medianPts = sectorMedian ? getPolygonPoints(sectorMedian) : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{companyName}</p>
        </div>
        {rating && (
          <div
            className="px-3 py-1 rounded-lg text-white text-sm font-black"
            style={{ backgroundColor: ratingColor(rating) }}
          >
            {rating}
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-xs mx-auto block"
        style={{ fontFamily: "inherit" }}
        aria-label={title}
      >
        {/* Concentric rings */}
        {ringLevels.map((lvl) => {
          const r = (lvl / 100) * maxR;
          const pts = axes.map((_, i) => polarToXY(i * angleStep, r, cx, cy));
          return (
            <polygon
              key={lvl}
              points={pointsStr(pts)}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          );
        })}

        {/* Ring labels */}
        {ringLevels.map((lvl) => (
          <text
            key={lvl}
            x={cx + 2}
            y={cy - (lvl / 100) * maxR - 2}
            fontSize={7}
            fill="#cbd5e1"
            textAnchor="start"
          >
            {lvl}
          </text>
        ))}

        {/* Spokes */}
        {axes.map((_, i) => {
          const [x, y] = polarToXY(i * angleStep, maxR, cx, cy);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          );
        })}

        {/* Sector median polygon */}
        {medianPts && (
          <polygon
            points={pointsStr(medianPts)}
            fill="#3b82f6"
            fillOpacity={0.08}
            stroke="#3b82f6"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )}

        {/* Company polygon */}
        <polygon
          points={pointsStr(companyPts)}
          fill="#6366f1"
          fillOpacity={0.18}
          stroke="#6366f1"
          strokeWidth={2}
        />

        {/* Company dots */}
        {companyPts.map(([x, y], i) => {
          const score = scores[axes[i].key] ?? 0;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={4}
              fill={scoreToColor(score)}
              stroke="white"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Axis labels */}
        {axes.map((a, i) => {
          const [x, y] = polarToXY(i * angleStep, maxR + 18, cx, cy);
          const score = scores[a.key] ?? 0;
          return (
            <g key={i}>
              <text
                x={x}
                y={y}
                fontSize={9}
                fill="#374151"
                textAnchor="middle"
                dominantBaseline="middle"
                fontWeight="500"
              >
                {a.label}
              </text>
              <text
                x={x}
                y={y + 11}
                fontSize={9}
                fill={scoreToColor(score)}
                textAnchor="middle"
                fontWeight="700"
              >
                {score}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex gap-4 justify-center mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-0.5 bg-indigo-500 rounded" />
          <span className="text-xs text-gray-500">{companyName}</span>
        </div>
        {medianPts && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0 border-t-2 border-blue-400 border-dashed rounded" />
            <span className="text-xs text-gray-500">Sector median</span>
          </div>
        )}
      </div>
    </div>
  );
}
