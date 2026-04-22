'use client';

import { useState, useEffect } from 'react';
import { RunResult } from '@/types/index';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SensitivitySliderProps {
  onPriceChange: (price: number) => void;
  initialPrice?: number;
  currentResult?: RunResult | null;
  isLoading?: boolean;
}

export default function SensitivitySlider({
  onPriceChange,
  initialPrice = 50,
  currentResult,
  isLoading = false,
}: SensitivitySliderProps) {
  const [carbonPrice, setCarbonPrice] = useState(initialPrice);

  // Update parent when carbon price changes
  useEffect(() => {
    onPriceChange(carbonPrice);
  }, [carbonPrice, onPriceChange]);

  // Get NPV impact from current result or calculate mockup
  const npvImpact = currentResult?.npv_fcf ?? (8500 - (carbonPrice / 10) * 50);

  // Generate waterfall data
  const waterfallData = [
    { name: 'Base Case', value: 8500, fill: '#22c55e' },
    { name: 'Carbon Cost', value: -carbonPrice * 5, fill: '#ef4444' },
    { name: 'Abatement Opex', value: -carbonPrice * 2, fill: '#f59e0b' },
    { name: 'Adjusted NPV', value: npvImpact, fill: '#3b82f6' },
  ];

  return (
    <div className="space-y-8">
      {/* Slider Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Carbon Price Sensitivity</h2>

        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <label htmlFor="carbonPrice" className="text-sm font-medium text-slate-300">
              Carbon Price
            </label>
            <span className="text-3xl font-bold text-green-400">
              ${carbonPrice}
              <span className="text-lg text-slate-400 ml-2">/tCO₂</span>
            </span>
          </div>

          <input
            id="carbonPrice"
            type="range"
            min="0"
            max="300"
            step="5"
            value={carbonPrice}
            onChange={(e) => setCarbonPrice(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
          />

          <div className="flex justify-between text-xs text-slate-400">
            <span>$0/tCO₂</span>
            <span>$300/tCO₂</span>
          </div>
        </div>

        <div className="mt-8 p-4 bg-slate-900 border border-slate-700 rounded-lg">
          <p className="text-xs text-slate-400 mb-2">NPV Impact</p>
          <p className="text-2xl font-bold text-blue-400">
            ${(npvImpact / 1000).toFixed(1)}B
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {npvImpact < 8500 ? '▼ Risk' : '▲ Opportunity'} vs base case
          </p>
        </div>
      </div>

      {/* Waterfall Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-6">NPV Sensitivity Waterfall</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="name" stroke="#94a3b8" angle={-15} textAnchor="end" height={80} />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value) => `$${(value as number).toFixed(0)}M`}
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-400 mt-4">
          Net Present Value sensitivity to changes in carbon price. Shows cumulative impact of
          direct costs and transition mitigation expenses.
        </p>
      </div>
    </div>
  );
}
