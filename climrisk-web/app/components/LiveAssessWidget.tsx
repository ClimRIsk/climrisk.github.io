"use client";

import { useRef, useState } from "react";
import Link from "next/link";

const ENGINE_BASE = "https://climrisk-github-io.onrender.com";

const QUICK_TRIES = ["Shell", "BHP", "Tata Steel", "Holcim"];

const SCEN_ORDER = ["Net Zero 2050", "Below 2°C", "Delayed transition", "NDCs", "Fragmented World", "Current Policies"];

function usd(v?: number | null): string {
  if (v == null || !isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a >= 1e9) return `$${(v / 1e9).toFixed(1)}bn`;
  if (a >= 1e6) return `$${(v / 1e6).toFixed(0)}m`;
  return `$${Math.round(v).toLocaleString()}`;
}

type Status = "idle" | "loading" | "slow" | "error" | "done";

export default function LiveAssessWidget() {
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<any>(null);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function run(nameOverride?: string) {
    const name = (nameOverride ?? company).trim();
    if (name.length < 3) return;
    setCompany(name);
    setStatus("loading");
    setResult(null);
    setErrorMsg("");
    if (slowTimer.current) clearTimeout(slowTimer.current);
    slowTimer.current = setTimeout(() => setStatus((s) => (s === "loading" ? "slow" : s)), 6000);
    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), 90000);
    try {
      const res = await fetch(`${ENGINE_BASE}/public/company-risk?q=${encodeURIComponent(name)}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`Engine returned HTTP ${res.status}`);
      setResult(await res.json());
      setStatus("done");
    } catch (err: unknown) {
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      setErrorMsg(
        isAbort
          ? "The engine didn't respond in time. It sleeps when idle, so the first request can be slow. Try again in a moment."
          : "Couldn't reach the engine just now. Try again, or book a demo and we'll run it live with you."
      );
      setStatus("error");
    } finally {
      clearTimeout(abortTimer);
      if (slowTimer.current) clearTimeout(slowTimer.current);
    }
  }

  const scen = result?.scenarios_pv_loss_2026_2050_usd as Record<string, any> | undefined;
  const maxLoss = scen ? Math.max(1, ...Object.values(scen).map((s: any) => s.p95 || 0)) : 1;

  return (
    <div className="panel panel-live p-6 md:p-8">
      <div className="hero-drift inline-flex items-center gap-2 text-xs font-mono text-gold-200 border border-white/8 rounded-full px-3 py-1.5 mb-5">
        <span className="w-1.5 h-1.5 rounded-full bg-terminal" style={{ animation: "pulseMono 1.4s ease-in-out infinite" }} />
        LIVE ENGINE · NOT A SAMPLE FILE
      </div>
      <form onSubmit={(e) => { e.preventDefault(); run(); }} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company name, e.g. 'Holcim' or 'Tata Steel'"
          className="flex-1 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-gold-200/50"
        />
        <button type="submit" className="btn-primary justify-center whitespace-nowrap" disabled={status === "loading" || status === "slow"}>
          {status === "loading" || status === "slow" ? "Analysing..." : "Analyse"}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span className="text-xs text-zinc-600">Try:</span>
        {QUICK_TRIES.map((q) => (
          <button key={q} onClick={() => run(q)} type="button"
            className="text-xs text-zinc-400 hover:text-gold-200 border border-white/8 hover:border-gold-200/40 rounded-full px-3 py-1 transition-colors">
            {q}
          </button>
        ))}
      </div>

      {status === "slow" && (
        <p className="text-xs text-zinc-500 mt-6 font-mono">
          Reading flood maps and cyclone tracks for the company&apos;s largest sites. This takes 20–60 seconds the first time.
        </p>
      )}
      {status === "error" && <p className="text-xs mt-6" style={{ color: "#EF4444" }}>{errorMsg}</p>}

      {status === "done" && result && !result.found && (
        <div className="mt-8 pt-6 border-t border-white/8 text-sm text-zinc-400 leading-relaxed">
          <p className="text-white mb-2">No mapped sites for &ldquo;{result.query}&rdquo;.</p>
          <p>{result.note}</p>
          <p className="mt-3">
            For other companies we run the analysis on your own asset list —{" "}
            <Link
              href={`/contact?company=${encodeURIComponent(result.query)}&notes=${encodeURIComponent(`Ran the live homepage tool for "${result.query}" — no mapped sites found there. Would like this run on our own asset list instead.`)}`}
              className="text-gold-200"
            >
              book a run
            </Link>
            .
          </p>
        </div>
      )}

      {status === "done" && result?.found && (
        <div className="mt-8 pt-8 border-t border-white/8">
          <h3 className="text-white font-semibold text-lg">{result.matched}</h3>
          <p className="text-xs text-zinc-500 font-mono mt-1 mb-6">
            {result.n_assets} mapped sites · largest {result.flood_assessed_assets} read against flood maps · {result.elapsed_s}s
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div><div className="text-2xl font-bold text-white font-mono">{usd(result.portfolio_value_usd)}</div><div className="text-xs text-zinc-500 mt-1">estimated replacement value of mapped sites</div></div>
            <div><div className="text-2xl font-bold text-white font-mono">{result.physical_aal_pct != null ? result.physical_aal_pct.toFixed(2) + "%" : "—"}</div><div className="text-xs text-zinc-500 mt-1">average annual physical damage ({usd(result.physical_aal_usd)}/yr)</div></div>
            <div><div className="text-2xl font-bold text-white font-mono">{result.assets_under_carbon_price} / {result.n_assets}</div><div className="text-xs text-zinc-500 mt-1">sites under a carbon price today</div></div>
          </div>
          {scen && (
            <div className="mb-6">
              <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">Present value of climate loss 2026–2050 · mean and 1-in-20</p>
              {SCEN_ORDER.filter((k) => scen[k]).map((k) => (
                <div key={k} className="flex items-center gap-3 text-xs mb-2">
                  <span className="w-36 text-zinc-400 shrink-0">{k}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded relative">
                    <div className="absolute h-2 rounded bg-gold-200/30" style={{ width: `${(scen[k].p95 / maxLoss) * 100}%` }} />
                    <div className="absolute h-2 rounded bg-gold-200" style={{ width: `${(scen[k].mean / maxLoss) * 100}%` }} />
                  </div>
                  <span className="w-32 text-right font-mono text-white shrink-0">{usd(scen[k].mean)} · {usd(scen[k].p95)}</span>
                </div>
              ))}
            </div>
          )}
          <table className="w-full text-xs mb-4">
            <thead><tr className="text-zinc-600 text-left"><th className="py-1">Largest sites</th><th>Country</th><th>Flood / cyclone</th><th className="text-right">Carbon price</th></tr></thead>
            <tbody>
              {result.top_assets.map((a: any) => (
                <tr key={a.name} className="border-t border-white/5 text-zinc-400">
                  <td className="py-1.5 text-zinc-300">{a.name}</td><td>{a.country}</td>
                  <td>{[a.river, a.coast, a.cyclone].filter((x: string) => x && x !== "NEGLIGIBLE").join(" / ") || "negligible"}</td>
                  <td className="text-right font-mono">{a.carbon_price_now ? `$${Math.round(a.carbon_price_now)}/t` : "none"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[0.65rem] text-zinc-600 mt-4 font-mono leading-relaxed">
            Live output from the CRI Engine Risk Analyst: {result.sources?.join(" · ")}. {result.value_note} Screening
            estimate — not investment advice or an audit-ready figure.
          </p>
          <div className="mt-6">
            <Link
              href={`/contact?company=${encodeURIComponent(result.matched)}&notes=${encodeURIComponent(`Just ran the live homepage tool for ${result.matched}: ${usd(result.portfolio_value_usd)} mapped replacement value, ${result.physical_aal_pct != null ? result.physical_aal_pct.toFixed(2) + "%" : "—"} average annual physical damage. Want to see this run on our full asset list.`)}`}
              className="btn-ghost text-sm"
            >
              Run it on your own asset list
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
