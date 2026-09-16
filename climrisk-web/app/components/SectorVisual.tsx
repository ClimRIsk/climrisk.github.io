type Mode = "line-comparison" | "accumulation" | "waterfall" | "table-overlay" | "before-after";

function CardShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="panel p-6 h-full flex flex-col">
      <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-5">{label}</p>
      <div className="flex-1 flex flex-col justify-center">{children}</div>
      <p className="text-[0.65rem] text-zinc-700 mt-6 font-mono">Illustrative sample output, not a live client portfolio.</p>
    </div>
  );
}

function LineComparison() {
  // Two illustrative curves: baseline expected loss vs climate-adjusted, 2026-2050.
  const baseline = [8, 9, 10, 11, 12, 13];
  const adjusted = [8, 12, 18, 27, 38, 52];
  const years = ["2026", "2030", "2035", "2040", "2045", "2050"];
  const max = 55;
  const toPoints = (arr: number[]) =>
    arr.map((v, i) => `${(i / (arr.length - 1)) * 100},${100 - (v / max) * 100}`).join(" ");

  return (
    <CardShell label="Baseline vs Climate-Adjusted Expected Loss">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-40">
        <polyline points={toPoints(baseline)} fill="none" stroke="#71717a" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <polyline points={toPoints(adjusted)} fill="none" stroke="#D4AF37" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between text-[0.6rem] text-zinc-600 font-mono mt-1">
        {years.map((y) => <span key={y}>{y}</span>)}
      </div>
      <div className="flex items-center gap-5 mt-4 text-xs">
        <span className="flex items-center gap-1.5 text-zinc-500"><span className="w-2.5 h-0.5 bg-zinc-500 inline-block" /> Baseline</span>
        <span className="flex items-center gap-1.5 text-gold-200"><span className="w-2.5 h-0.5 bg-gold-200 inline-block" /> Climate-adjusted (SSP3-7.0)</span>
      </div>
    </CardShell>
  );
}

function Accumulation() {
  const zones = [
    { label: "Zone A", pct: 88, tier: "critical" },
    { label: "Zone B", pct: 64, tier: "high" },
    { label: "Zone C", pct: 41, tier: "elevated" },
    { label: "Zone D", pct: 19, tier: "moderate" },
  ];
  const color: Record<string, string> = {
    critical: "#dc2626",
    high: "#EF4444",
    elevated: "#f59e0b",
    moderate: "#84cc16",
  };
  return (
    <CardShell label="Physical Exposure Concentration by Underwriting Zone">
      <div className="space-y-4">
        {zones.map((z) => (
          <div key={z.label}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-zinc-400">{z.label}</span>
              <span className="text-white font-mono">{z.pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${z.pct}%`, background: color[z.tier] }} />
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function Waterfall() {
  const steps = [
    { label: "Baseline EV", value: 100, color: "#71717a" },
    { label: "Hazard impairment", value: -22, color: "#EF4444" },
    { label: "Adaptation capex recovery", value: 9, color: "#D4AF37" },
  ];
  const final = steps.reduce((s, x) => s + x.value, 0);
  return (
    <CardShell label="Climate-Adjusted Enterprise Value">
      <div className="flex items-end gap-3 h-32">
        {steps.map((s) => (
          <div key={s.label} className="flex-1 flex flex-col items-center justify-end h-full">
            <span className="text-[0.65rem] text-zinc-500 mb-1">{s.value > 0 ? "+" : ""}{s.value}</span>
            <div
              className="w-full rounded-t"
              style={{ height: `${Math.abs(s.value) * 1.1}px`, background: s.color, opacity: s.value < 0 ? 0.85 : 1 }}
            />
          </div>
        ))}
        <div className="flex-1 flex flex-col items-center justify-end h-full">
          <span className="text-[0.65rem] text-gold-200 mb-1 font-semibold">{final}</span>
          <div className="w-full rounded-t bg-gold-300" style={{ height: `${final * 1.1}px` }} />
        </div>
      </div>
      <div className="flex justify-between mt-3 text-[0.6rem] text-zinc-600 font-mono">
        <span>Baseline</span><span>Hazard</span><span>Adaptation</span><span className="text-gold-200">Adjusted EV</span>
      </div>
    </CardShell>
  );
}

function TableOverlay() {
  const rows = [
    { id: "FAC-114", hazard: "Water Stress", prob: "34%", ebitda: "-2.1%" },
    { id: "FAC-208", hazard: "Extreme Heat", prob: "51%", ebitda: "-3.8%" },
    { id: "FAC-337", hazard: "Wildfire", prob: "12%", ebitda: "-0.6%" },
  ];
  return (
    <CardShell label="multi_facility_export.csv">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-zinc-600 text-left">
            <th className="font-normal pb-2">Facility</th>
            <th className="font-normal pb-2">Hazard</th>
            <th className="font-normal pb-2">Interruption</th>
            <th className="font-normal pb-2">EBITDA Impact</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-white/8">
              <td className="py-2 text-zinc-300 font-mono">{r.id}</td>
              <td className="py-2 text-zinc-400">{r.hazard}</td>
              <td className="py-2 text-zinc-400">{r.prob}</td>
              <td className="py-2 text-red-400">{r.ebitda}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CardShell>
  );
}

function BeforeAfter() {
  return (
    <CardShell label="After Green Infrastructure Investment">
      <div className="space-y-6">
        <div>
          <p className="text-xs text-zinc-500 mb-2">Heat Stress Score</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-zinc-500">71</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="3"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            <span className="text-2xl font-bold text-white">38</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-2">20yr Stressed NPV</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-zinc-500">−$4.2M</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="3"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            <span className="text-2xl font-bold text-white">−$1.1M</span>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

export default function SectorVisual({ mode }: { mode: Mode }) {
  if (mode === "line-comparison") return <LineComparison />;
  if (mode === "accumulation") return <Accumulation />;
  if (mode === "waterfall") return <Waterfall />;
  if (mode === "table-overlay") return <TableOverlay />;
  return <BeforeAfter />;
}
