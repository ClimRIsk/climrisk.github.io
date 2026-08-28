"use client";

import { useEffect, useRef } from "react";

// Risk-hotspot markers and cross-border exposure arcs, colored to the
// Obsidian/Gold palette (crimson = highest risk, gold = elevated,
// terminal green = moderate, blue = lower / reference markers).
const RISK_POINTS = [
  { lat: -6.21, lng: 106.84, color: "#EF4444", size: 0.65 },
  { lat: 23.72, lng: 90.4, color: "#EF4444", size: 0.58 },
  { lat: 25.77, lng: -80.19, color: "#EF4444", size: 0.5 },
  { lat: 18.96, lng: 72.82, color: "#EF4444", size: 0.5 },
  { lat: 6.45, lng: 3.39, color: "#D4AF37", size: 0.45 },
  { lat: 31.23, lng: 121.47, color: "#D4AF37", size: 0.45 },
  { lat: 29.76, lng: -95.37, color: "#D4AF37", size: 0.44 },
  { lat: 25.2, lng: 55.27, color: "#D4AF37", size: 0.42 },
  { lat: 30.05, lng: 31.23, color: "#D4AF37", size: 0.4 },
  { lat: 40.71, lng: -74.01, color: "#10B981", size: 0.38 },
  { lat: 51.92, lng: 4.47, color: "#10B981", size: 0.36 },
  { lat: 35.68, lng: 139.69, color: "#10B981", size: 0.36 },
  { lat: 1.35, lng: 103.82, color: "#10B981", size: 0.34 },
  { lat: -33.87, lng: 151.21, color: "#10B981", size: 0.34 },
  { lat: 51.51, lng: -0.12, color: "#3B82F6", size: 0.32 },
  { lat: 48.86, lng: 2.35, color: "#3B82F6", size: 0.3 },
  { lat: 37.77, lng: -122.41, color: "#3B82F6", size: 0.3 },
  { lat: 19.07, lng: -99.14, color: "#D4AF37", size: 0.4 },
  { lat: 55.75, lng: 37.62, color: "#10B981", size: 0.34 },
  { lat: -34.61, lng: -58.38, color: "#10B981", size: 0.36 },
];

const RISK_ARCS = [
  { startLat: 25.77, startLng: -80.19, endLat: 51.51, endLng: -0.12, color: "rgba(239,68,68,0.7)" },
  { startLat: -6.21, startLng: 106.84, endLat: 1.35, endLng: 103.82, color: "rgba(212,175,55,0.6)" },
  { startLat: 18.96, startLng: 72.82, endLat: 25.2, endLng: 55.27, color: "rgba(239,68,68,0.6)" },
  { startLat: 40.71, startLng: -74.01, endLat: 48.86, endLng: 2.35, color: "rgba(59,130,246,0.55)" },
  { startLat: 29.76, startLng: -95.37, endLat: 37.77, endLng: -122.41, color: "rgba(239,68,68,0.5)" },
  { startLat: 23.72, startLng: 90.4, endLat: 18.96, endLng: 72.82, color: "rgba(239,68,68,0.55)" },
  { startLat: 6.45, startLng: 3.39, endLat: 30.05, endLng: 31.23, color: "rgba(212,175,55,0.5)" },
  { startLat: 51.92, startLng: 4.47, endLat: 51.51, endLng: -0.12, color: "rgba(59,130,246,0.45)" },
];

/**
 * Decorative rotating globe confined to the hero section it's mounted
 * inside (absolute + inset-0, not viewport-fixed) so it scrolls away
 * with the hero instead of bleeding into the sections below.
 *
 * Shares the same globe.gl script (id="globe-gl-script", jsdelivr,
 * pinned version) as EngineGlobe.tsx on /engine so the library is
 * never fetched or parsed twice.
 */
export default function GlobeBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let resizeHandler: (() => void) | null = null;

    function init() {
      const w = window as any;
      if (!ref.current || typeof w.Globe === "undefined") return;
      const el = ref.current;

      const g = w
        .Globe()(el)
        .width(window.innerWidth)
        .height(window.innerHeight)
        .backgroundColor("rgba(0,0,0,0)")
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .atmosphereColor("#D4AF37")
        .atmosphereAltitude(0.2)
        .pointsData(RISK_POINTS)
        .pointLat("lat")
        .pointLng("lng")
        .pointColor("color")
        .pointRadius("size")
        .pointAltitude(0.015)
        .arcsData(RISK_ARCS)
        .arcStartLat("startLat")
        .arcStartLng("startLng")
        .arcEndLat("endLat")
        .arcEndLng("endLng")
        .arcColor("color")
        .arcAltitude(0.22)
        .arcDashLength(0.38)
        .arcDashGap(0.18)
        .arcDashAnimateTime(2800);

      g.controls().autoRotate = true;
      g.controls().autoRotateSpeed = 0.28;
      g.controls().enableZoom = false;
      g.controls().enablePan = false;
      g.pointOfView({ lat: 15, lng: 35, altitude: 2.1 });

      resizeHandler = () => g.width(window.innerWidth).height(window.innerHeight);
      window.addEventListener("resize", resizeHandler);
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
    }

    return () => {
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}
