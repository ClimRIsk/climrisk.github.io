'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FanChartData } from '@/types/index';

interface ScenarioFanChartProps {
  data: FanChartData[];
  title?: string;
}

export default function ScenarioFanChart({ data, title = 'Enterprise Value Trajectory' }: ScenarioFanChartProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
      <h2 className="text-lg font-semibold text-white mb-6">{title}</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="year" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#fff',
            }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line
            type="monotone"
            dataKey="nze"
            stroke="#22c55e"
            strokeWidth={3}
            name="NZE"
            dot={{ fill: '#22c55e', r: 5 }}
            activeDot={{ r: 7 }}
          />
          <Line
            type="monotone"
            dataKey="delayedTransition"
            stroke="#f59e0b"
            strokeWidth={3}
            name="Delayed Transition"
            dot={{ fill: '#f59e0b', r: 5 }}
            activeDot={{ r: 7 }}
          />
          <Line
            type="monotone"
            dataKey="currentPolicies"
            stroke="#ef4444"
            strokeWidth={3}
            name="Current Policies"
            dot={{ fill: '#ef4444', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-400 mt-4">
        Values in USD billions. The fan chart illustrates divergent enterprise value outcomes across
        climate scenarios.
      </p>
    </div>
  );
}
