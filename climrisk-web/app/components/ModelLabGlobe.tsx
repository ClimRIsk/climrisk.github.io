"use client";

import { useEffect, useRef, useState } from "react";
import { MODEL_LAB_SITES, HAZARD_LABEL, STATUS_LABEL } from "../data/modelLabSweep";

const HAZ_ORDER = ["rain", "wind", "fire", "heat", "cyclone", "earthquake"] as const;

function siteLabel(s: (typeof MODEL_LAB_SITES)[number]): string {
  const rows = HAZ_ORDER.filter((h) => s.hazards[h]).map((h) => {
    const st = s.hazards[h]!;
    const ok = st === "validated" || st === "validated_drift" || st === "validated_diag";
    const dot = ok ? "#C5A059" : st === "no_model" || st === "insufficient_history" ? "#52525b" : "#f87171";
    return `<div style="display:flex;justify-content:space-between;gap:14px;padding:1.5px 0"><span style="color:#a1a1aa">${HAZARD_LABEL[h]}</span><span style="color:${dot};white-space:nowrap">${STATUS_LABEL[st]}</span></div>`;
  }).join("");
  return `<div style="background:#0F1013;border:1px solid rgba(212,175,55,0.25);border-radius:10px;padding:10px 14px;font-family:'JetBrains Mono',monospace;font-size:11px;min-width:220px;box-shadow:0 12px 32px rgba(0,0,0,0.6)">
    <div style="color:#fff;font-weight:700;font-size:12.5px;margin-bottom:2px">${s.name}</div>
    <div style="color:#71717a;font-size:10px;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em">${s.zone}</div>
    ${rows}
  </div>`;
}

export default function ModelLabGlobe() {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      setStatus((s) => (s === "loading" ? "error" : s));
    }, 9000);

    function init() {
      const w = window as any;
      if (!ref.current || typeof w.Globe === "undefined") {
        if (!cancelled) setStatus("error");
        return;
      }
      const el = ref.current;
      const points = MODEL_LAB_SITES.map((s) => ({
        ...s,
        color: s.overall === "strong" ? "#D4AF37" : "#f59e0b",
      }));
      const g = w
        .Globe()
        .width(el.offsetWidth || 480)
        .height(480)
        .backgroundColor("rgba(0,0,0,0)")
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .atmosphereColor("#D4AF37")
        .atmosphereAltitude(0.18)
        .pointsData(points)
        .pointLat("lat")
        .pointLng("lon")
        .pointColor("color")
        .pointAltitude(0.012)
        .pointRadius(0.45)
        .pointLabel(siteLabel)(el);
      g.controls().autoRotate = true;
      g.controls().autoRotateSpeed = 0.3;
      g.controls().enableZoom = false;
      if (!cancelled) setStatus("ready");
    }

    const w = window as any;
    if (w.Globe) {
      init();
    } else {
      let script = document.getElementById("globe-gl-script") as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = "globe-gl-script";
        script.src = "https://cdn.jsdelivr.net/npm/globe.gl@2.30.0/dist/globe.gl.min.js";
        document.head.appendChild(script);
      }
      script.addEventListener("load", init);
      script.addEventListener("error", () => {
        if (!cancelled) setStatus("error");
      });
    }

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="relative">
      <div ref={ref} className="w-full flex justify-center" style={{ minHeight: status === "error" ? 0 : 480 }} />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-600 font-mono">
          Loading the sweep…
        </div>
      )}
      {status === "error" && (
        <div className="py-10 text-center text-xs text-zinc-600 font-mono border border-white/8 rounded-xl">
          Globe renderer unavailable — see the table below for the same 37 sites.
        </div>
      )}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs font-mono text-zinc-500">
        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full inline-block" style={{ background: "#D4AF37" }} /> Strong — most hazards validated</span>
        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full inline-block" style={{ background: "#f59e0b" }} /> Mixed — at least one hindcast failure</span>
      </div>
    </div>
  );
}
