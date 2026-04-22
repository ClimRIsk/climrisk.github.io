'use client';

import { useEffect, useState } from 'react';
import ScenarioFanChart from '@/components/ScenarioFanChart';
import SummaryCards from '@/components/SummaryCards';
import EbitdaBridge from '@/components/EbitdaBridge';
import FcfChart from '@/components/FcfChart';
import { getCompanies, getScenarios, postRun, extractEBITDABridge, extractFCF, extractEmissions } from '@/lib/api';
import { Company, RunResult, ScenarioType, FanChartData, Scenario } from '@/types/index';

export default function Dashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('bhp');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('nze_2050');
  const [results, setResults] = useState<Record<ScenarioType, RunResult | null>>({
    nze_2050: null,
    delayed_transition: null,
    current_policies: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load companies and scenarios on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        const [companiesData, scenariosData] = await Promise.all([
          getCompanies(),
          getScenarios(),
        ]);
        setCompanies(companiesData);
        setScenarios(scenariosData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load companies and scenarios';
        setError(message);
        console.error('Error loading data:', err);
      }
    };
    loadData();
  }, []);

  // Run analysis for all scenarios when company changes
  useEffect(() => {
    const runAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const scenarioIds: ScenarioType[] = ['nze_2050', 'delayed_transition', 'current_policies'];
        const newResults: Record<ScenarioType, RunResult | null> = {
          nze_2050: null,
          delayed_transition: null,
          current_policies: null,
        };

        const promises = scenarioIds.map((scenarioId) =>
          postRun(selectedCompany, scenarioId)
            .then((res) => {
              newResults[scenarioId] = res;
            })
            .catch((err) => {
              console.error(`Error running analysis for ${scenarioId}:`, err);
            })
        );

        await Promise.all(promises);
        setResults(newResults);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to run analysis';
        setError(message);
        console.error('Error running analysis:', err);
      } finally {
        setLoading(false);
      }
    };
    runAnalysis();
  }, [selectedCompany]);

  const selectedCompanyData = companies.find((c) => c.id === selectedCompany);
  const currentResult = results[selectedScenario];

  // Generate fan chart data from all scenario results
  const fanChartData: FanChartData[] = results.nze_2050?.years.map((year) => ({
    year: year.year,
    nze: results.nze_2050?.years.find((y) => y.year === year.year)?.ebitda || 0,
    delayedTransition: results.delayed_transition?.years.find((y) => y.year === year.year)?.ebitda || 0,
    currentPolicies: results.current_policies?.years.find((y) => y.year === year.year)?.ebitda || 0,
  })) || [];

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Climate Risk Dashboard</h1>
        <p className="text-slate-400">
          Integrated financial impact analysis across climate scenarios
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-8 bg-red-900 border border-red-700 rounded-lg p-4">
          <p className="text-red-200 text-sm">
            <strong>Error:</strong> {error}
          </p>
          <p className="text-red-300 text-xs mt-2">
            Make sure the FastAPI backend is running at {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-6 mb-8">
        <div>
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

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Scenario
          </label>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value as ScenarioType)}
            disabled={loading}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <option value="nze_2050">NZE 2050</option>
            <option value="delayed_transition">Delayed Transition</option>
            <option value="current_policies">Current Policies</option>
          </select>
        </div>

        {loading && (
          <div className="flex items-end gap-2 text-slate-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm">Computing...</span>
          </div>
        )}
      </div>

      {/* Main content */}
      {currentResult ? (
        <>
          {/* Summary Cards */}
          <SummaryCards result={currentResult} scenario={selectedScenario} />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="lg:col-span-2">
              <ScenarioFanChart data={fanChartData} />
            </div>

            <div className="lg:col-span-2">
              <EbitdaBridge
                data={extractEBITDABridge(currentResult)}
                companyName={selectedCompanyData?.name || 'Company'}
              />
            </div>

            <div>
              <FcfChart data={extractFCF(currentResult)} />
            </div>

            {/* Emissions trajectory */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Emissions Trajectory</h2>
              <div className="space-y-4">
                {extractEmissions(currentResult).map((item) => (
                  <div key={item.year} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{item.year}</p>
                      <div className="w-full bg-slate-700 rounded-full h-2 mt-1">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full"
                          style={{ width: `${Math.min((item.emissions / 600) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm text-slate-300">{Math.round(item.emissions)} tCO2</p>
                      <p className="text-xs text-slate-500">{item.intensity.toFixed(2)} intensity</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-4">
                GHG intensity: tonnes CO2 equivalent per unit revenue.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          {loading ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <p className="text-slate-400">Loading analysis for {selectedCompanyData?.name}...</p>
            </>
          ) : (
            <p className="text-slate-400">No data available. Please check your selection and try again.</p>
          )}
        </div>
      )}
    </div>
  );
}
