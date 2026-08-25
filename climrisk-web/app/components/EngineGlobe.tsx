"use client";

import { useEffect, useRef, useState } from "react";

export default function EngineGlobe() {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      setStatus((s) => (s === "loading" ? "error" : s));
    }, 8000);

    function init() {
      const w = window as any;
      if (!ref.current || typeof w.Globe === "undefined") {
        if (!cancelled) setStatus("error");
        return;
      }
      const el = ref.current;
      const g = w
        .Globe()
        .width(el.offsetWidth || 480)
        .height(420)
        .backgroundColor("rgba(0,0,0,0)")
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .atmosphereColor("#D4AF37")
        .atmosphereAltitude(0.18)(el);
      g.controls().autoRotate = true;
      g.controls().autoRotateSpeed = 0.35;
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
    <div
      className="relative rounded-xl overflow-hidden border border-white/8 bg-obsidian-950"
      style={{ height: 420 }}
    >
      <div
        ref={ref}
        className={`absolute inset-0 transition-opacity duration-500 ${
          status === "ready" ? "opacity-100" : "opacity-0"
        }`}
      />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="loading-mono">INITIALISING_GEOSPATIAL_RENDER...</span>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-obsidian-500 font-mono px-6 text-center">
          Live geospatial render unavailable offline — hazard layers are computed server-side regardless.
        </div>
      )}
    </div>
  );
}
