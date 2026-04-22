'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface ComparisonData {
  scenario: string;
  companyA: number; // EV in billions
  companyB: number;
}

interface Props {
  data: ComparisonData[];
  companyAName: string;
  companyBName: string;
}

export default function CompanyComparisonChart({
  data,
  companyAName,
  companyBName,
}: Props) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-6">
        Enterprise Value by Scenario
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="scenario" stroke="#94a3b8" />
          <YAxis label={{ value: 'Enterprise Value ($B)', angle: -90, position: 'insideLeft' }} stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '0.5rem',
            }}
            formatter={(value) => {
              if (typeof value === 'number') {
                return `$${value.toFixed(1)}B`;
              }
              return value;
            }}
          />
          <Legend />
          <Bar
            dataKey="companyA"
            fill="#3b82f6"
            name={companyAName}
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="companyB"
            fill="#a855f7"
            name={companyBName}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
