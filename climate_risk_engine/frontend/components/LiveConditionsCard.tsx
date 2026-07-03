'use client';

import { LiveConditions } from '@/types/index';

interface LiveConditionsCardProps {
  data: LiveConditions;
  assetName: string;
}

export default function LiveConditionsCard({ data, assetName }: LiveConditionsCardProps) {
  const anomaly = data.heat_anomaly_c;
  const hasAnomaly = anomaly !== undefined && anomaly !== null;
  const anomalyColor =
    hasAnomaly && anomaly > 2
      ? 'text-red-400 bg-red-950 border-red-800'
      : hasAnomaly && anomaly > 0
      ? 'text-amber-400 bg-amber-950 border-amber-800'
      : 'text-slate-300 bg-slate-800 border-slate-700';

  const observedDate = new Date(data.observed_at);
  const observedLabel = Number.isNaN(observedDate.getTime())
    ? data.observed_at
    : observedDate.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Live Conditions</h2>
          <p className="text-xs text-slate-500 mt-1">{assetName}</p>
        </div>
        <span className="text-xs text-slate-500">as of {observedLabel}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
            Temperature
          </p>
          <p className="text-2xl font-bold text-white">{data.current_temp_c.toFixed(1)}°C</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
            14-Day Precip
          </p>
          <p className="text-2xl font-bold text-white">
            {data.precip_trailing14d_mm.toFixed(0)}mm
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Wind</p>
          <p className="text-2xl font-bold text-white">{data.wind_speed_ms.toFixed(1)} m/s</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
            Humidity
          </p>
          <p className="text-2xl font-bold text-white">{data.humidity_pct.toFixed(0)}%</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {hasAnomaly && (
          <span className={`text-xs font-medium px-3 py-1 rounded-full border ${anomalyColor}`}>
            {anomaly > 0 ? '+' : ''}
            {anomaly.toFixed(1)}°C vs seasonal norm
          </span>
        )}
        {data.precip_deficit_flag && (
          <span className="text-xs font-medium px-3 py-1 rounded-full border text-amber-400 bg-amber-950 border-amber-800">
            Precipitation deficit flagged
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500 mt-4">{data.source}</p>
    </div>
  );
}
