'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { ObservedTrend } from '@/types/index';

interface ObservedTrendChartProps {
  data: ObservedTrend;
}

export default function ObservedTrendChart({ data }: ObservedTrendChartProps) {
  const chartData = Object.entries(data.annual_mean_temp_c)
    .map(([year, temp]) => ({ year: Number(year), meanTempC: temp }))
    .sort((a, b) => a.year - b.year);

  const warming = data.warming_since_baseline_c;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">
          Observed Temperature Trend — {data.start_year}–{data.end_year}
        </h2>
        {warming !== undefined && warming !== null && (
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full border ${
              warming > 0
                ? 'text-red-400 bg-red-950 border-red-800'
                : 'text-slate-300 bg-slate-800 border-slate-700'
            }`}
          >
            {warming > 0 ? '+' : ''}
            {warming.toFixed(2)}°C vs 1991-2020 baseline
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="year" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" unit="°C" domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#fff',
            }}
            labelStyle={{ color: '#fff' }}
            formatter={(value: number) => `${value.toFixed(2)}°C`}
          />
          <ReferenceLine
            y={data.baseline_mean_temp_c}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{
              value: `WMO baseline ${data.baseline_mean_temp_c.toFixed(1)}°C`,
              fill: '#94a3b8',
              fontSize: 11,
              position: 'insideTopLeft',
            }}
          />
          <Line
            type="monotone"
            dataKey="meanTempC"
            name="Observed annual mean"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {data.temp_trend_c_per_decade !== undefined && data.temp_trend_c_per_decade !== null && (
        <p className="text-xs text-slate-400 mt-4">
          Observed trend: {data.temp_trend_c_per_decade > 0 ? '+' : ''}
          {data.temp_trend_c_per_decade.toFixed(2)}°C/decade over this window.
        </p>
      )}
      <p className="text-xs text-slate-500 mt-1">{data.source}</p>
    </div>
  );
}
