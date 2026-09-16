"use client";

import { useState } from "react";

const HAZARD_COLORS = ["#00F0FF", "#FF003C", "#FFB000"]; // flood, heat, wildfire

const TABS = [
  {
    id: "hazard",
    title: "High-Resolution Hazard Mapping",
    body: "Isolate physical climate threats across 26 hazard types. Drill down to a 0.1° resolution grid to quantify exposure for any global asset coordinate.",
    accent: "#00F0FF",
  },
  {
    id: "adaptation",
    title: "Adaptation ROI Simulation",
    body: "Model dynamic capital expenditure against physical risk. Adjust resilience investments to calculate the immediate net reduction in Value at Risk.",
    accent: "#D4AF37",
  },
  {
    id: "export",
    title: "Unified Portfolio Export",
    body: "Generate complete, audit-ready disclosures. Export your entire global asset portfolio into a single, consolidated CSV file for seamless downstream integration.",
    accent: "#F8FAFC",
  },
];

const ASSET_ROWS = [
  { id: "409-Alpha-Terminal", sector: "Maritime", loc: "14.59°N, 120.98°E", hazard: "Coastal Inundation", var: "$14.2M" },
  { id: "812-Delta-Facility", sector: "Light Manufacturing", loc: "45.42°N, 11.83°E", hazard: "Heat Stress", var: "$8.7M" },
  { id: "905-Echo-Grid", sector: "Energy Infrastructure", loc: "33.44°N, 112.07°W", hazard: "Wildfire", var: "$22.1M" },
];

const PINS = [
  { label: "409-Alpha", top: "28%", left: "22%" },
  { label: "812-Delta", top: "58%", left: "62%" },
  { label: "905-Echo", top: "40%", left: "78%" },
];

export default function IsometricShowcase() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  return (
    <div className="iso-showcase">
      <div className="iso-tabs">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(i)}
            className={`iso-tab ${i === active ? "active" : ""}`}
            style={{ "--accent": t.accent } as React.CSSProperties}
          >
            <span className="iso-tab-num">0{i + 1}</span>
            <p className="iso-tab-title">{t.title}</p>
            <p className="iso-tab-body">{t.body}</p>
          </button>
        ))}
      </div>

      <div className="iso-stage">
        <div className="iso-ground">
          <div className="iso-layer iso-layer-topo">
            {PINS.map((p) => (
              <span
                key={p.label}
                className="iso-asset-pin"
                style={{ top: p.top, left: p.left }}
                title={p.label}
              />
            ))}
          </div>
          <div className={`iso-layer iso-layer-hex ${active === 0 ? "is-lit" : ""}`}>
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="iso-hex"
                style={{
                  background: HAZARD_COLORS[i % 3],
                  color: HAZARD_COLORS[i % 3],
                  marginTop: i % 6 >= 3 ? "9px" : "0px",
                }}
              />
            ))}
          </div>
        </div>

        <div key={tab.id} className="iso-card">
          {active === 0 && (
            <>
              <p className="iso-card-label">0.1° Grid · 26 Hazard Types</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.78rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 9999, background: "#00F0FF", boxShadow: "0 0 6px #00F0FF" }} />
                  <span className="iso-card-muted">Flood, 1-in-100yr inundation: <span className="iso-card-ink">62%</span></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.78rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 9999, background: "#FF003C", boxShadow: "0 0 6px #FF003C" }} />
                  <span className="iso-card-muted">Heat stress, days over 35°C by 2050: <span className="iso-card-ink">41</span></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.78rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 9999, background: "#FFB000", boxShadow: "0 0 6px #FFB000" }} />
                  <span className="iso-card-muted">Wildfire exposure index: <span className="iso-card-ink">Elevated</span></span>
                </div>
              </div>
            </>
          )}

          {active === 1 && (
            <>
              <p className="iso-card-label">Resilience Capex Modeled: $3.8M / 5yr</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: 4 }}>
                    <span className="iso-card-muted">Baseline VaR</span>
                    <span className="iso-card-ink">$22.1M</span>
                  </div>
                  <div className="iso-vbar-track">
                    <div className="iso-vbar-fill" style={{ width: "100%", background: "rgba(148,163,184,0.6)" }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: 4 }}>
                    <span className="iso-card-muted">With resilience capex</span>
                    <span className="iso-card-ink">$14.6M</span>
                  </div>
                  <div className="iso-vbar-track">
                    <div className="iso-vbar-fill" style={{ width: "66%", background: "#D4AF37" }} />
                  </div>
                </div>
                <p style={{ fontSize: "0.72rem", color: "#D4AF37", fontWeight: 600 }}>−34% net reduction in Value at Risk</p>
              </div>
            </>
          )}

          {active === 2 && (
            <>
              <p className="iso-card-label">portfolio_disclosure_2026.csv</p>
              <table className="iso-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Hazard</th>
                    <th>VaR</th>
                  </tr>
                </thead>
                <tbody>
                  {ASSET_ROWS.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.hazard}</td>
                      <td>{r.var}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: "0.68rem", color: "#94A3B8", marginTop: 10 }}>
                One consolidated file. Every asset, every hazard, every currency.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
