"use client";

import { useMemo, useState } from "react";
import AnimatedNumber from "./AnimatedNumber";

type Scenario = {
  key: "net-zero" | "delayed" | "current-policies";
  label: string;
  color: string;
  end: number;
  exp: number;
};

const SCENARIOS: Scenario[] = [
  { key: "net-zero", label: "Net Zero 2050", color: "#10B981", end: 0.08, exp: 1.15 },
  { key: "delayed", label: "Delayed Transition", color: "#D4AF37", end: 0.258, exp: 1.8 },
  { key: "current-policies", label: "Current Policies", color: "#EF4444", end: 0.34, exp: 2.3 },
];

const START_YEAR = 2026;
const END_YEAR = 2050;
const START_PCT = 0.01;
// Same illustrative $500M refinery asset cited in the Story Reports sample
// on /platform ("$128.8m / 25.8% ... delayed transition"), so this widget's
// anchor point matches already-published copy rather than inventing a new
// number. The 2.7x tail multiplier is that sample's own $347.4m / $128.8m
// ratio, applied across all three scenarios for a consistent illustration.
const ASSET_VALUE = 500_000_000;
const TAIL_MULTIPLIER = 2.7;
const CHART_W = 560;
const CHART_H = 170;
const MAX_PCT = 0.38;

function lossPct(year: number, scenario: Scenario) {
  const t = Math.max(0, Math.min(1, (year - START_YEAR) / (END_YEAR - START_YEAR)));
  const shaped = Math.pow(t, scenario.exp);
  return START_PCT + shaped * (scenario.end - START_PCT);
}

function buildPath(scenario: Scenario) {
  const pts: string[] = [];
  for (let year = START_YEAR; year <= END_YEAR; year++) {
    const x = ((year - START_YEAR) / (END_YEAR - START_YEAR)) * CHART_W;
    const y = CHART_H - (lossPct(year, scenario) / MAX_PCT) * CHART_H;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return "M" + pts.join(" L");
}

export default function ScenarioExplorer() {
  const [scenarioKey, setScenarioKey] = useState<Scenario["key"]>("delayed");
  const [year, setYear] = useState(2050);

  const scenario = SCENARIOS.find((s) => s.key === scenarioKey) as Scenario;
  const pct = lossPct(year, scenario);
  const meanLoss = pct * ASSET_VALUE;
  const tailLoss = meanLoss * TAIL_MULTIPLIER;

  const paths = useMemo(() => SCENARIOS.map((s) => ({ s, d: buildPath(s) })), []);

  const markerX = ((year - START_YEAR) / (END_YEAR - START_YEAR)) * CHART_W;
  const markerY = CHART_H - (pct / MAX_PCT) * CHART_H;
  const sliderPct = ((year - START_YEAR) / (END_YEAR - START_YEAR)) * 100;

  return (
    <div className="panel p-6 md:p-8" style={{ "--scenario-color": scenario.color } as React.CSSProperties}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setScenarioKey(s.key)}
              className={`scenario-toggle ${s.key === scenarioKey ? "active" : ""}`}
              style={{ "--scenario-color": s.color } as React.CSSProperties}
            >
              {s.label}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-zinc-600 whitespace-nowrap">NGFS-style pathways · illustrative</span>
      </div>

      <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H + 24}`}
          className="w-full h-auto"
          role="img"
          aria-label={`Expected loss by year under three illustrative scenarios, currently showing ${scenario.label} in ${year}`}
        >
          {[0, 0.1, 0.2, 0.3].map((g) => (
            <line
              key={g}
              x1={0}
              x2={CHART_W}
              y1={CHART_H - (g / MAX_PCT) * CHART_H}
              y2={CHART_H - (g / MAX_PCT) * CHART_H}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
          ))}
          {paths.map(({ s, d }) => (
            <path
              key={s.key}
              d={d}
              className={`scenario-curve ${s.key === scenarioKey ? "scenario-curve-active" : ""}`}
              stroke={s.key === scenarioKey ? s.color : "rgba(255,255,255,0.18)"}
            />
          ))}
          <line
            x1={markerX}
            x2={markerX}
            y1={0}
            y2={CHART_H}
            stroke={scenario.color}
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.5}
          />
          <circle cx={markerX} cy={markerY} r={5} fill={scenario.color} stroke="#0A0B0E" strokeWidth={2} />
          <text x={2} y={CHART_H + 18} fill="#52525b" fontSize="10" fontFamily="JetBrains Mono, monospace">
            {START_YEAR}
          </text>
          <text x={CHART_W - 28} y={CHART_H + 18} fill="#52525b" fontSize="10" fontFamily="JetBrains Mono, monospace">
            {END_YEAR}
          </text>
        </svg>

        <div className="min-w-[200px]">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-wide mb-1">Expected loss, {year}</p>
          <p className="heading-md mb-1" style={{ color: scenario.color }}>
            <AnimatedNumber value={pct * 100} decimals={1} suffix="%" />
          </p>
          <p className="text-sm text-zinc-400 mb-4">
            <AnimatedNumber value={meanLoss / 1_000_000} decimals={1} prefix="$" suffix="M of a $500M asset" />
          </p>
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-wide mb-1">1-in-20 outcome</p>
          <p className="text-sm text-zinc-300">
            <AnimatedNumber value={tailLoss / 1_000_000} decimals={1} prefix="$" suffix="M" />
          </p>
        </div>
      </div>

      <div className="mt-6">
        <input
          type="range"
          min={START_YEAR}
          max={END_YEAR}
          step={1}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="scenario-slider"
          style={{ "--scenario-color": scenario.color, "--slider-pct": `${sliderPct}%` } as React.CSSProperties}
          aria-label="Year"
        />
        <div className="flex justify-between text-xs font-mono text-zinc-600 mt-2">
          <span>{START_YEAR}</span>
          <span className="text-white">{year}</span>
          <span>{END_YEAR}</span>
        </div>
      </div>

      <p className="text-[11px] font-mono text-zinc-700 mt-6 leading-relaxed">
        Illustrative sample output on a $500M refinery asset (the same sample behind the Story Reports example on{" "}
        /platform), not a live client portfolio. A real run prices your own assets against mapped hazards and the
        carbon policy actually in force where they sit.
      </p>
    </div>
  );
}
