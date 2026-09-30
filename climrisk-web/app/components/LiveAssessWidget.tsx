"use client";

import { useRef, useState } from "react";
import Link from "next/link";

const ENGINE_BASE = "https://climrisk-github-io.onrender.com";

const SECTORS = [
  { v: "technology", l: "Technology" },
  { v: "energy", l: "Energy" },
  { v: "financials", l: "Financials" },
  { v: "consumer_staples", l: "Consumer" },
  { v: "industrials", l: "Industrials" },
  { v: "materials", l: "Materials & Mining" },
  { v: "real_estate", l: "Real Estate" },
  { v: "agriculture", l: "Agriculture" },
  { v: "utilities", l: "Utilities" },
  { v: "other", l: "Other" },
];

const QUICK_TRIES = [
  { name: "Shell plc", sector: "energy" },
  { name: "BHP Group Limited", sector: "materials" },
  { name: "Tesco", sector: "consumer_staples" },
];

const RATING_COLOR: Record<string, string> = {
  A: "#10B981",
  B: "#84cc16",
  C: "#f59e0b",
  D: "#EF4444",
  E: "#dc2626",
};

const RATING_LABEL: Record<string, string> = {
  A: "Low Climate Risk",
  B: "Moderate Climate Risk",
  C: "Elevated Climate Risk",
  D: "High Climate Risk",
  E: "Critical Climate Risk",
};

function scoreColor(v: number): string {
  if (v < 20) return "#10B981";
  if (v < 40) return "#84cc16";
  if (v < 60) return "#f59e0b";
  if (v < 80) return "#EF4444";
  return "#dc2626";
}

function PillarBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-zinc-400">{label}</span>
        <span className="text-white font-mono">{value.toFixed(0)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, Math.max(2, value))}%`, background: scoreColor(value) }}
        />
      </div>
    </div>
  );
}

function TrajectoryChart({ trajectory }: { trajectory: any }) {
  const years = trajectory?.nze?.scores ? Array.from({ length: 26 }, (_, i) => 2025 + i) : [];
  if (!years.length) return null;

  const toPoints = (arr: number[]) =>
    arr.map((v, i) => `${(i / (arr.length - 1)) * 100},${100 - Math.min(100, Math.max(0, v))}`).join(" ");

  return (
    <div>
      <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">
        Predictive CRI Trajectory, 2025-2050
      </p>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-32">
        {trajectory.cp?.scores && (
          <polyline points={toPoints(trajectory.cp.scores)} fill="none" stroke="#dc2626" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        )}
        {trajectory.delayed?.scores && (
          <polyline points={toPoints(trajectory.delayed.scores)} fill="none" stroke="#f59e0b" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        )}
        {trajectory.nze?.scores && (
          <polyline points={toPoints(trajectory.nze.scores)} fill="none" stroke="#10B981" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      <div className="flex justify-between text-[0.6rem] text-zinc-600 font-mono mt-1">
        <span>2025</span>
        <span>2050</span>
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-4 text-xs">
        <span className="flex items-center gap-1.5 text-zinc-500"><span className="w-2.5 h-0.5 bg-[#10B981] inline-block" /> Net Zero 2050</span>
        <span className="flex items-center gap-1.5 text-zinc-500"><span className="w-2.5 h-0.5 bg-[#f59e0b] inline-block" /> Delayed Transition</span>
        <span className="flex items-center gap-1.5 text-zinc-500"><span className="w-2.5 h-0.5 bg-[#dc2626] inline-block" /> Current Policies</span>
      </div>
    </div>
  );
}

type Status = "idle" | "loading" | "slow" | "error" | "done";

export default function LiveAssessWidget() {
  const [company, setCompany] = useState("");
  const [sector, setSector] = useState("technology");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<any>(null);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function runAssessment(nameOverride?: string, sectorOverride?: string) {
    const name = (nameOverride ?? company).trim();
    const sec = sectorOverride ?? sector;
    if (!name) return;

    setCompany(name);
    setSector(sec);
    setStatus("loading");
    setResult(null);
    setErrorMsg("");

    if (slowTimer.current) clearTimeout(slowTimer.current);
    slowTimer.current = setTimeout(() => {
      setStatus((s) => (s === "loading" ? "slow" : s));
    }, 6000);

    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), 55000);

    try {
      const res = await fetch(`${ENGINE_BASE}/agent/assess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: name,
          sector_hint: sec,
          jurisdiction: "US",
          revenue_usd_m: 5000,
          assessment_scope: "standard",
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Engine returned HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
      setStatus("done");
    } catch (err: unknown) {
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      setErrorMsg(
        isAbort
          ? "The engine didn't respond in time. It's hosted on infrastructure that sleeps when idle, so the first request of the day can be slow. Try again in a moment."
          : "Couldn't reach the engine just now. Try again, or book a demo and we'll run it live with you."
      );
      setStatus("error");
    } finally {
      clearTimeout(abortTimer);
      if (slowTimer.current) clearTimeout(slowTimer.current);
    }
  }

  const rating = result?.risk_assessment?.rating?.rating as string | undefined;
  const isRegistry = result?.data_provenance?.source === "registry";

  return (
    <div className="panel p-6 md:p-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runAssessment();
        }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Type any company name, e.g. 'Nestle' or 'a regional cement plant'"
          className="flex-1 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-gold-200/50"
        />
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-md px-3 py-3 text-sm text-zinc-300 focus:outline-none focus:border-gold-200/50"
        >
          {SECTORS.map((s) => (
            <option key={s.v} value={s.v} className="bg-[#0A0B0E]">
              {s.l}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary justify-center whitespace-nowrap" disabled={status === "loading" || status === "slow"}>
          {status === "loading" || status === "slow" ? "Assessing..." : "Assess"}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span className="text-xs text-zinc-600">Try:</span>
        {QUICK_TRIES.map((q) => (
          <button
            key={q.name}
            onClick={() => runAssessment(q.name, q.sector)}
            className="text-xs text-zinc-400 hover:text-gold-200 border border-white/8 hover:border-gold-200/40 rounded-full px-3 py-1 transition-colors"
            type="button"
          >
            {q.name}
          </button>
        ))}
      </div>

      {status === "slow" && (
        <p className="text-xs text-zinc-500 mt-6 font-mono">
          Still running. The engine sleeps when idle and can take up to a minute to wake up on its first request.
        </p>
      )}

      {status === "error" && (
        <p className="text-xs mt-6" style={{ color: "#EF4444" }}>{errorMsg}</p>
      )}

      {status === "done" && result && (
        <div className="mt-8 pt-8 border-t border-white/8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-white font-semibold text-lg">{result.company_profile?.resolved_name}</h3>
              <p className="text-xs text-zinc-500 font-mono mt-1">
                {result.company_profile?.sector} · {result.company_profile?.jurisdiction} ·{" "}
                {isRegistry ? "Verified registry" : "Parametric estimate"}
              </p>
            </div>
            {rating && (
              <div className="flex items-center gap-3">
                <span
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-[#0A0B0E]"
                  style={{ background: RATING_COLOR[rating] ?? "#84cc16" }}
                >
                  {rating}
                </span>
                <span className="text-sm text-zinc-400">{RATING_LABEL[rating] ?? ""}</span>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            <PillarBar label="Physical Risk" value={result.risk_assessment?.rating?.physical_pillar ?? 0} />
            <PillarBar label="Transition Risk" value={result.risk_assessment?.rating?.transition_pillar ?? 0} />
            <PillarBar label="Financial Risk" value={result.risk_assessment?.rating?.financial_pillar ?? 0} />
          </div>

          <TrajectoryChart trajectory={result.trajectory} />

          {result.company_profile?.scope1_mt_co2e && (
            <p className="text-xs text-zinc-500 mt-6">
              Estimated Scope 1 / 2 / 3 emissions: {result.company_profile.scope1_mt_co2e.value} /{" "}
              {result.company_profile.scope2_mt_co2e?.value ?? "–"} /{" "}
              {result.company_profile.scope3_mt_co2e?.value ?? "–"} MtCO2e
            </p>
          )}

          <p className="text-[0.65rem] text-zinc-700 mt-6 font-mono">
            Live output from the CRI Engine. {result.data_provenance?.methodology}. Illustrative estimate, not
            investment advice or an audit-ready disclosure figure.
          </p>

          <div className="mt-6">
            <Link href="/contact" className="btn-ghost text-sm">
              Get the full audit-ready report
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
