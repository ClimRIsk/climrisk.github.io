'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import EbitdaBridge from '@/components/EbitdaBridge';
import FcfChart from '@/components/FcfChart';
import { getCompanies, postRun, extractEBITDABridge, extractFCF } from '@/lib/api';
import { Company, RunResult, ScenarioType } from '@/types/index';

export default function CompanyDrillDown() {
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('nze_2050');
  const [result, setResult] = useState<RunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load company data
  useEffect(() => {
    const loadCompany = async () => {
      try {
        setError(null);
        const companies = await getCompanies();
        const found = companies.find((c) => c.id === companyId);
        setCompany(found || null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load company';
        setError(message);
        console.error('Error loading company:', err);
      }
    };
    loadCompany();
  }, [companyId]);

  // Run analysis when scenario changes
  useEffect(() => {
    const runAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await postRun(companyId, selectedScenario);
        setResult(res);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to run analysis';
        setError(message);
        console.error('Error running analysis:', err);
      } finally {
        setLoading(false);
      }
    };
    runAnalysis();
  }, [companyId, selectedScenario]);

  if (!company) {
    return (
      <div className="p-8">
        {error ? (
          <>
            <p className="text-red-400 font-semibold">Error: {error}</p>
            <p className="text-slate-400 text-sm mt-2">Failed to load company data.</p>
          </>
        ) : (
          <p className="text-slate-400">Loading company data...</p>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">{company.name}</h1>
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold text-green-400">{company.id.toUpperCase()}</span>
          <span className="text-sm text-slate-400">{company.sector}</span>
          <span className="text-sm text-slate-500">{company.region}</span>
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="mb-8 bg-red-900 border border-red-700 rounded-lg p-4">
          <p className="text-red-200 text-sm">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Scenario selector */}
      <div className="mb-8">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Climate Scenario
        </label>
        <div className="flex gap-3">
          {(['nze_2050', 'delayed_transition', 'current_policies'] as ScenarioType[]).map((scenario) => (
            <button
              key={scenario}
              onClick={() => setSelectedScenario(scenario)}
              disabled={loading}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${
                selectedScenario === scenario
                  ? 'bg-green-500 text-slate-900'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {scenario === 'nze_2050' ? 'NZE 2050' : scenario === 'delayed_transition' ? 'Delayed Transition' : 'Current Policies'}
            </button>
          ))}
        </div>
        {loading && (
          <div className="mt-4 flex items-center gap-2 text-slate-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm">Computing...</span>
          </div>
        )}
      </div>

      {/* Key metrics */}
      {result && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Enterprise Value
              </p>
              <p className="text-3xl font-bold text-green-400">
                ${(result.enterprise_value / 1000).toFixed(1)}B
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                NPV
              </p>
              <p className="text-3xl font-bold text-blue-400">
                ${(result.npv_fcf / 1000).toFixed(1)}B
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                WACC Used
              </p>
              <p className="text-3xl font-bold text-purple-400">
                {(result.wacc_used * 100).toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-8">
            <EbitdaBridge data={extractEBITDABridge(result)} companyName={company.name} />
            <FcfChart data={extractFCF(result)} />
          </div>
        </>
      )}
    </div>
  );
}
