'use client';

import { useState, useEffect } from 'react';
import SensitivitySlider from '@/components/SensitivitySlider';
import { getCompanies, postRun } from '@/lib/api';
import { Company, RunResult } from '@/types/index';

export default function SensitivityPage() {
  const [carbonPrice, setCarbonPrice] = useState(50);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('bhp');
  const [currentResult, setCurrentResult] = useState<RunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load companies on mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setError(null);
        const data = await getCompanies();
        setCompanies(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load companies';
        setError(message);
        console.error('Error loading companies:', err);
      }
    };
    loadCompanies();
  }, []);

  // Run analysis when carbon price changes
  useEffect(() => {
    const runAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await postRun(selectedCompany, 'nze_2050', carbonPrice);
        setCurrentResult(res);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to run analysis';
        setError(message);
        console.error('Error running analysis:', err);
      } finally {
        setLoading(false);
      }
    };
    runAnalysis();
  }, [selectedCompany, carbonPrice]);

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Carbon Price Sensitivity</h1>
        <p className="text-slate-400">
          Analyze NPV impact and key risk drivers as carbon prices evolve
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-8 bg-red-900 border border-red-700 rounded-lg p-4">
          <p className="text-red-200 text-sm">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Company selector */}
      <div className="mb-8">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Company
        </label>
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          disabled={loading}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-3">About this analysis</h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          Carbon price sensitivity quantifies how financial metrics respond to changes in the implicit or explicit cost of
          carbon emissions. As carbon pricing mechanisms (carbon taxes, emissions trading systems, internal shadow
          prices) intensify, companies face direct cost increases and must invest in emissions abatement. This panel
          models the cumulative financial impact across direct carbon costs, physical asset impairment, and transition
          capex.
        </p>
      </div>

      {/* Sensitivity slider and charts */}
      <SensitivitySlider
        onPriceChange={setCarbonPrice}
        initialPrice={carbonPrice}
        currentResult={currentResult}
        isLoading={loading}
      />

      {/* Footer insights */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
            Current Price Scenario
          </h3>
          <p className="text-2xl font-bold text-green-400 mb-2">${carbonPrice}/tCO₂</p>
          <p className="text-xs text-slate-400">
            Reflects global weighted average of carbon price regimes. EU ETS currently ~80 EUR/tCO₂; global harmonized
            carbon tax proposed at $100–200/tCO₂.
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
            Risk Drivers
          </h3>
          <ul className="text-xs text-slate-400 space-y-2">
            <li>• Direct compliance costs under carbon tax or ETS</li>
            <li>• Capex for emissions abatement technology</li>
            <li>• Physical asset stranding in high-carbon businesses</li>
            <li>• Cost of capital increase (investor risk premium)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
