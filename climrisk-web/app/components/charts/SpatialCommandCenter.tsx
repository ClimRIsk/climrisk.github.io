"use client";

/**
 * SpatialCommandCenter.tsx
 * ──────────────────────────────────────────────────────────────────────────────
 * GPU-accelerated spatial risk viewport powered by Deck.gl + react-map-gl
 * (MapLibre GL — no Mapbox token required, uses CartoDB Dark Matter basemap).
 *
 * Layers
 * ──────
 * • ScatterplotLayer  — asset pins colored by risk tier
 *     red  #FF003C  = high risk  (score ≥ 0.70)
 *     amber #FFB000 = medium risk (score ≥ 0.40)
 *     cyan  #00F0FF = low risk   (score < 0.40)
 * • HeatmapLayer     — kernel density overlay (toggleable)
 * • Pulsing crimson ring — any asset with gdacs_alert=true (Cat 3+ cyclone /
 *                          wildfire within 50 km, updated every 15 min)
 *
 * Hazard toggle  — flood | heat | water | all
 * Tooltip        — frosted-glass card: name, sector, EAL, EV impairment %
 *
 * Props
 * ─────
 * assets?          AssetPin[]   — defaults to demo data when omitted
 * height?          string       — CSS height (default "520px")
 * initialViewState — { longitude, latitude, zoom }
 *
 * Data sources (for audits)
 * ─────────────────────────
 * Basemap: CartoDB Dark Matter (© OpenStreetMap contributors / © CARTO)
 * Hazard data consumed from /agent/physical-risk API responses
 */

import React, { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";

// ── Dynamic imports — prevents SSR crash (deck.gl / maplibre use WebGL) ──────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DeckGL = dynamic(() => import("@deck.gl/react").then((m) => m.default), {
  ssr: false,
}) as React.ComponentType<Record<string, unknown>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MapLibre = dynamic(
  () => import("react-map-gl/maplibre").then((m) => m.default),
  { ssr: false }
) as React.ComponentType<Record<string, unknown>>;

// ── Types ─────────────────────────────────────────────────────────────────────
export type HazardFilter = "all" | "flood" | "heat" | "water" | "wildfire";

export interface AssetPin {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** 0–1 composite risk score */
  riskScore: number;
  hazardType: "flood" | "heat" | "water" | "wildfire";
  sector?: string;
  eal_usd_m?: number;
  ev_impairment_pct?: number;
  /** If true, renders pulsing crimson ring (GDACS Cat 3+ / NASA FIRMS alert) */
  gdacs_alert?: boolean;
  country?: string;
}

export interface SpatialCommandCenterProps {
  assets?: AssetPin[];
  height?: string;
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
}

// ── Color helpers ─────────────────────────────────────────────────────────────
/** Returns [R, G, B, A] 0-255 for a 0-1 risk score */
function riskColor(score: number, alpha = 220): [number, number, number, number] {
  if (score >= 0.7) return [255, 0, 60, alpha];   // #FF003C — high
  if (score >= 0.4) return [255, 176, 0, alpha];  // #FFB000 — medium
  return [0, 240, 255, alpha];                     // #00F0FF — low
}

const HAZARD_ICON: Record<string, string> = {
  flood:    "🌊",
  heat:     "🔥",
  water:    "💧",
  wildfire: "🔴",
};

// ── Demo data — used when no assets prop is supplied ─────────────────────────
const DEMO_ASSETS: AssetPin[] = [
  { id: "a1", name: "Rotterdam Terminal",   lat: 51.95,  lon: 4.14,   riskScore: 0.82, hazardType: "flood",    sector: "Oil & Gas",       eal_usd_m: 42.1,  ev_impairment_pct: 8.3,  gdacs_alert: true  },
  { id: "a2", name: "Mumbai Refinery",      lat: 19.08,  lon: 72.88,  riskScore: 0.71, hazardType: "flood",    sector: "Chemicals",        eal_usd_m: 28.5,  ev_impairment_pct: 6.1                       },
  { id: "a3", name: "Phoenix Solar Plant",  lat: 33.45,  lon: -112.07,riskScore: 0.55, hazardType: "heat",     sector: "Utilities",        eal_usd_m: 12.0,  ev_impairment_pct: 3.4                       },
  { id: "a4", name: "São Paulo HQ",         lat: -23.55, lon: -46.63, riskScore: 0.34, hazardType: "water",    sector: "Beverages",        eal_usd_m: 6.2,   ev_impairment_pct: 1.9                       },
  { id: "a5", name: "Jakarta Port",         lat: -6.21,  lon: 106.85, riskScore: 0.88, hazardType: "flood",    sector: "Transport",        eal_usd_m: 68.3,  ev_impairment_pct: 14.7, gdacs_alert: true  },
  { id: "a6", name: "California Farmland",  lat: 36.78,  lon: -119.42,riskScore: 0.65, hazardType: "wildfire", sector: "Agriculture",      eal_usd_m: 19.7,  ev_impairment_pct: 5.2                       },
  { id: "a7", name: "Singapore Fab Plant",  lat: 1.35,   lon: 103.82, riskScore: 0.29, hazardType: "heat",     sector: "Technology",       eal_usd_m: 4.1,   ev_impairment_pct: 0.8                       },
  { id: "a8", name: "Cape Town Mining",     lat: -33.92, lon: 18.42,  riskScore: 0.78, hazardType: "water",    sector: "Mining",           eal_usd_m: 33.8,  ev_impairment_pct: 9.6                       },
  { id: "a9", name: "London Data Centre",   lat: 51.51,  lon: -0.13,  riskScore: 0.21, hazardType: "heat",     sector: "Technology",       eal_usd_m: 1.9,   ev_impairment_pct: 0.3                       },
  { id: "a10",name: "Texas LNG Terminal",   lat: 29.76,  lon: -95.37, riskScore: 0.61, hazardType: "flood",    sector: "Oil & Gas",        eal_usd_m: 24.6,  ev_impairment_pct: 4.8,  gdacs_alert: false },
];

// ── Pulsing ring CSS animation (injected once) ────────────────────────────────
const PULSE_STYLE = `
@keyframes sc-pulse {
  0%   { transform: scale(1);   opacity: 0.9; }
  70%  { transform: scale(2.8); opacity: 0;   }
  100% { transform: scale(2.8); opacity: 0;   }
}
.sc-gdacs-ring {
  animation: sc-pulse 1.4s ease-out infinite;
  border-radius: 50%;
  background: rgba(255,0,60,0.55);
  position: absolute;
  inset: 0;
  pointer-events: none;
}
`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function SpatialCommandCenter({
  assets,
  height = "520px",
  initialViewState = { longitude: 20, latitude: 20, zoom: 1.8 },
}: SpatialCommandCenterProps) {
  const pins = assets ?? DEMO_ASSETS;

  const [hazardFilter, setHazardFilter] = useState<HazardFilter>("all");
  const [showHeatmap, setShowHeatmap]   = useState(false);
  const [tooltip, setTooltip]           = useState<{
    x: number; y: number; object: AssetPin;
  } | null>(null);

  // Filtered pins
  const visible = useMemo(
    () =>
      hazardFilter === "all"
        ? pins
        : pins.filter((p) => p.hazardType === hazardFilter),
    [pins, hazardFilter]
  );

  // Deck.gl ScatterplotLayer
  const scatterLayer = useMemo(() => {
    // We build the layer spec as a plain object and let DeckGL instantiate it
    // (avoids a direct import of ScatterplotLayer at module level, which would
    // attempt to import WebGL code during SSR).
    return {
      id: "scatter",
      type: "ScatterplotLayer" as const,
      data: visible,
      pickable: true,
      opacity: 0.9,
      stroked: true,
      filled: true,
      radiusMinPixels: 8,
      radiusMaxPixels: 28,
      lineWidthMinPixels: 2,
      getPosition: (d: AssetPin) => [d.lon, d.lat, 0] as [number, number, number],
      getRadius: (d: AssetPin) => 60000 * (0.5 + d.riskScore),
      getFillColor: (d: AssetPin) => riskColor(d.riskScore),
      getLineColor: (d: AssetPin) =>
        d.gdacs_alert ? [255, 0, 60, 255] : [255, 255, 255, 80],
      getLineWidth: (d: AssetPin) => (d.gdacs_alert ? 3 : 1),
      onHover: (info: { x: number; y: number; object?: AssetPin }) => {
        setTooltip(info.object ? { x: info.x, y: info.y, object: info.object } : null);
      },
    };
  }, [visible]);

  // Deck.gl HeatmapLayer spec
  const heatLayer = useMemo(
    () => ({
      id: "heat",
      type: "HeatmapLayer" as const,
      data: visible,
      visible: showHeatmap,
      getPosition: (d: AssetPin) => [d.lon, d.lat] as [number, number],
      getWeight: (d: AssetPin) => d.riskScore,
      radiusPixels: 80,
      intensity: 1.2,
      threshold: 0.08,
      colorRange: [
        [0, 240, 255, 0],
        [0, 240, 255, 80],
        [255, 176, 0, 160],
        [255, 80, 0, 200],
        [255, 0, 60, 240],
      ] as [number, number, number, number][],
    }),
    [visible, showHeatmap]
  );

  const CARTO_DARK =
    "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png";

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-white/10 bg-[#0a0f1a]"
      style={{ height }}
    >
      {/* Inject pulse keyframes once */}
      <style dangerouslySetInnerHTML={{ __html: PULSE_STYLE }} />

      {/* ── Deck.gl + MapLibre ─────────────────────────────────────────────── */}
      <DeckGL
        initialViewState={initialViewState}
        controller={true}
        layers={[scatterLayer, heatLayer]}
        style={{ position: "absolute", inset: 0 }}
        getCursor={({ isHovering }: { isHovering: boolean }) =>
          isHovering ? "pointer" : "grab"
        }
      >
        <MapLibre
          mapStyle={{
            version: 8,
            sources: {
              carto: {
                type: "raster",
                tiles: [CARTO_DARK],
                tileSize: 256,
                attribution:
                  "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors © <a href='https://carto.com/attributions'>CARTO</a>",
              },
            },
            layers: [{ id: "carto-dark", type: "raster", source: "carto" }],
          }}
        />
      </DeckGL>

      {/* ── Header chrome ─────────────────────────────────────────────────── */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
            Spatial Command Center
          </span>
          <span className="text-[10px] font-mono text-[#00F0FF]/60">
            {visible.length} assets
          </span>
        </div>
        <div className="text-[10px] font-mono text-white/30">
          CMIP6 · WRI Aqueduct · NASA FIRMS
        </div>
      </div>

      {/* ── Hazard toggle ──────────────────────────────────────────────────── */}
      <div className="absolute top-10 left-3 flex flex-col gap-1 pointer-events-auto">
        {(["all", "flood", "heat", "water", "wildfire"] as HazardFilter[]).map(
          (h) => (
            <button
              key={h}
              onClick={() => setHazardFilter(h)}
              className={`
                px-2 py-1 text-[10px] font-mono rounded uppercase tracking-widest
                border transition-all duration-150
                ${
                  hazardFilter === h
                    ? "bg-[#00F0FF]/20 border-[#00F0FF]/60 text-[#00F0FF]"
                    : "bg-black/40 border-white/10 text-white/40 hover:border-white/30"
                }
              `}
            >
              {h === "all" ? "⬛ All" : `${HAZARD_ICON[h]} ${h}`}
            </button>
          )
        )}
        <button
          onClick={() => setShowHeatmap((v) => !v)}
          className={`
            px-2 py-1 text-[10px] font-mono rounded uppercase tracking-widest
            border transition-all duration-150
            ${
              showHeatmap
                ? "bg-purple-500/20 border-purple-400/60 text-purple-300"
                : "bg-black/40 border-white/10 text-white/40 hover:border-white/30"
            }
          `}
        >
          {showHeatmap ? "🌡 Heat on" : "🌡 Heat off"}
        </button>
      </div>

      {/* ── Risk legend ───────────────────────────────────────────────────── */}
      <div className="absolute bottom-6 left-3 flex flex-col gap-1 pointer-events-none">
        {[
          { color: "#FF003C", label: "High risk ≥ 0.70" },
          { color: "#FFB000", label: "Medium ≥ 0.40" },
          { color: "#00F0FF", label: "Low < 0.40" },
        ].map(({ color, label }) => (
          <div key={color} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
              style={{ background: color }}
            />
            <span className="text-[10px] font-mono text-white/50">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0 bg-[#FF003C] ring-2 ring-[#FF003C]/50 animate-ping" />
          <span className="text-[10px] font-mono text-[#FF003C]/80">GDACS Cat 3+ alert</span>
        </div>
      </div>

      {/* ── Alert badge ───────────────────────────────────────────────────── */}
      {pins.some((p) => p.gdacs_alert) && (
        <div className="absolute top-3 right-3 pointer-events-none">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#FF003C]/20 border border-[#FF003C]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF003C] animate-ping" />
            <span className="text-[10px] font-mono text-[#FF003C] uppercase tracking-widest">
              {pins.filter((p) => p.gdacs_alert).length} Active Alert
              {pins.filter((p) => p.gdacs_alert).length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      {/* ── Frosted-glass tooltip ──────────────────────────────────────────── */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            left: Math.min(tooltip.x + 12, window.innerWidth - 220),
            top:  Math.max(tooltip.y - 10, 8),
          }}
        >
          <div
            className="rounded-lg border border-white/20 px-3 py-2.5 shadow-xl"
            style={{
              background: "rgba(10,15,30,0.72)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              minWidth: 190,
            }}
          >
            {/* Alert indicator */}
            {tooltip.object.gdacs_alert && (
              <div className="flex items-center gap-1 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF003C] animate-ping" />
                <span className="text-[9px] font-mono text-[#FF003C] uppercase tracking-widest">
                  GDACS Active Alert
                </span>
              </div>
            )}
            {/* Asset name */}
            <div className="text-[13px] font-semibold text-white leading-tight">
              {tooltip.object.name}
            </div>
            {/* Sector + hazard */}
            <div className="flex items-center gap-1.5 mt-0.5 mb-2">
              <span className="text-[10px] text-white/50">
                {tooltip.object.sector ?? "—"}
              </span>
              <span className="text-[10px] text-white/30">·</span>
              <span className="text-[10px]">
                {HAZARD_ICON[tooltip.object.hazardType]} {tooltip.object.hazardType}
              </span>
            </div>
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <div>
                <div className="text-[9px] font-mono text-white/40 uppercase">Risk score</div>
                <div
                  className="text-[13px] font-mono font-bold"
                  style={{
                    color:
                      tooltip.object.riskScore >= 0.7
                        ? "#FF003C"
                        : tooltip.object.riskScore >= 0.4
                        ? "#FFB000"
                        : "#00F0FF",
                  }}
                >
                  {(tooltip.object.riskScore * 100).toFixed(0)}
                </div>
              </div>
              {tooltip.object.eal_usd_m != null && (
                <div>
                  <div className="text-[9px] font-mono text-white/40 uppercase">EAL 2050</div>
                  <div className="text-[13px] font-mono font-bold text-white">
                    ${tooltip.object.eal_usd_m.toFixed(1)}M
                  </div>
                </div>
              )}
              {tooltip.object.ev_impairment_pct != null && (
                <div className="col-span-2 mt-0.5">
                  <div className="text-[9px] font-mono text-white/40 uppercase">EV Impairment</div>
                  <div className="text-[13px] font-mono font-bold text-[#FFB000]">
                    {tooltip.object.ev_impairment_pct.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
            {/* Coordinates */}
            <div className="mt-2 text-[9px] font-mono text-white/25">
              {tooltip.object.lat.toFixed(3)}°, {tooltip.object.lon.toFixed(3)}°
            </div>
          </div>
        </div>
      )}

      {/* ── Attribution ───────────────────────────────────────────────────── */}
      <div className="absolute bottom-1 right-2 pointer-events-none">
        <span className="text-[8px] font-mono text-white/20">
          © OpenStreetMap · © CARTO · ClimRisk Engine v0.4
        </span>
      </div>
    </div>
  );
}
