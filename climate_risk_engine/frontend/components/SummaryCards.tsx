'use client';

import { RunResult } from '@/types/index';

interface SummaryCardsProps {
  result: RunResult;
  scenario: string;
}

export default function SummaryCards({ result, scenario }: SummaryCardsProps) {
  const waccDelta = result.wacc_used - 0.08; // Assume baseline WACC is 8%
  const npvImpactPct = result.npv_impact_pct || 0;

  const cards = [
    {
      label: 'Enterprise Value',
      value: `$${(result.enterprise_value / 1000).toFixed(1)}B`,
      subtext: 'USD billions',
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Equity Value',
      value: `$${(result.equity_value / 1000).toFixed(1)}B`,
      subtext: 'USD billions',
      color: 'from-purple-500 to-purple-600',
    },
    {
      label: 'Implied Share Price',
      value: `$${result.implied_share_price.toFixed(2)}`,
      subtext: 'per share',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      label: 'NPV Impact vs Baseline',
      value: `${npvImpactPct.toFixed(2)}%`,
      subtext: 'percentage change',
      color: npvImpactPct < 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`rounded-lg p-6 bg-gradient-to-br ${card.color} bg-opacity-10 border border-opacity-20`}
          style={{
            borderColor:
              card.color === 'from-blue-500 to-blue-600'
                ? '#3b82f6'
                : card.color === 'from-purple-500 to-purple-600'
                  ? '#a855f7'
                  : card.color === 'from-emerald-500 to-emerald-600'
                    ? '#10b981'
                    : '#10b981',
          }}
        >
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            {card.label}
          </p>
          <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
          <p className="text-xs text-slate-400">{card.subtext}</p>
        </div>
      ))}
    </div>
  );
}
