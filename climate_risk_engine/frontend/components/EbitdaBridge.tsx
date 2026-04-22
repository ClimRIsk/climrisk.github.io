'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { EBITDABridgeData } from '@/types/index';

interface EbitdaBridgeProps {
  data: EBITDABridgeData[];
  companyName?: string;
}

export default function EbitdaBridge({ data, companyName = 'Company' }: EbitdaBridgeProps) {
  // Transform data for stacked bar chart
  const transformedData = data.map((item) => ({
    year: item.year,
    Revenue: item.revenue,
    'OpEx': -item.opex,
    'Carbon Cost': -item.carbonCost,
    'Physical Loss': -item.physicalLoss,
    EBITDA: item.ebitda,
  }));

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
      <h2 className="text-lg font-semibold text-white mb-6">{companyName} — EBITDA Bridge</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={transformedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
          <Bar dataKey="Revenue" stackId="a" fill="#22c55e" />
          <Bar dataKey="OpEx" stackId="a" fill="#ef4444" />
          <Bar dataKey="Carbon Cost" stackId="a" fill="#f59e0b" />
          <Bar dataKey="Physical Loss" stackId="a" fill="#ec4899" />
          <Bar dataKey="EBITDA" fill="#60a5fa" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-400 mt-4">
        Year-on-year EBITDA impact from revenue growth, operating expenses, carbon cost exposure,
        and physical asset losses.
      </p>
    </div>
  );
}
