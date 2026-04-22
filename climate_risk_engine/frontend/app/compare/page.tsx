'use client';

import { useEffect, useState } from 'react';
import CompanyComparisonChart, {
  ComparisonData,
} from '@/components/CompanyComparisonChart';
import { getCompanies, postRun } from '@/lib/api';
import { Company, RunResult, ScenarioType } from '@/types/index';

export default function ComparePage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyA, setCompanyA] = useState<string>('1'); // BHP equivalent
  const [companyB, setCompanyB] = useState<string>('2'); // Shell equivalent
  const [selectedScenario, setSelectedScenario] = useState<string>('nze_2050');
  const [resultsA, setResultsA] = useState<Record<string, RunResult | null>>({
    nze_2050: null,
    delayed_transition: null,
    current_policies: null,
  });
  const [resultsB, setResultsB] = useState<Record<string, RunResult | null>>({
    nze_2050: null,
    delayed_transition: null,
    current_policies: null,
  });
  const [loading, setLoading] = useState(false);

  // Load companies on mount
  useEffect(() => {
    const loadCompanies = async () => {
      const data = await getCompanies();
      setCompanies(data);
    };
    loadCompanies();
  }, []);

  // Run analyses for both companies across all scenarios
  useEffect(() => {
    const runComparison = async () => {
      setLoading(true);
      try {
        const scenarios: ScenarioType[] = ['nze_2050', 'delayed_transition', 'current_policies'];

        // Fetch all scenarios for Company A
        const resultsAData: Record<string, RunResult | null> = {
          nze_2050: null,
          delayed_transition: null,
          current_policies: null,
        };
        for (const scenario of scenarios) {
          const res = await postRun(companyA, scenario);
          resultsAData[scenario] = res;
        }
        setResultsA(resultsAData);

        // Fetch all scenarios for Company B
        const resultsBData: Record<string, RunResult | null> = {
          nze_2050: null,
          delayed_transition: null,
          current_policies: null,
        };
        for (const scenario of scenarios) {
          const res = await postRun(companyB, scenario);
          resultsBData[scenario] = res;
        }
        setResultsB(resultsBData);
      } catch (error) {
        console.error('Error running comparison:', error);
      } finally {
        setLoading(false);
      }
    };
    runComparison();
  }, [companyA, companyB]);

  const companyAData = companies.find((c) => c.id === companyA);
  const companyBData = companies.find((c) => c.id === companyB);

  // Build comparison chart data
  const chartData: ComparisonData[] = [
    {
      scenario: 'NZE',
      companyA: resultsA.nze_2050?.enterprise_value || 0,
      companyB: resultsB.nze_2050?.enterprise_value || 0,
    },
    {
      scenario: 'Delayed',
      companyA: resultsA.delayed_transition?.enterprise_value || 0,
      companyB: resultsB.delayed_transition?.enterprise_value || 0,
    },
    {
      scenario: 'Current Policies',
      companyA: resultsA.current_policies?.enterprise_value || 0,
      companyB: resultsB.current_policies?.enterprise_value || 0,
    },
  ];

  // Calculate metrics for delta table
  const evA_NZE = resultsA.nze_2050?.enterprise_value || 0;
  const evA_CP = resultsA.current_policies?.enterprise_value || 0;
  const evB_NZE = resultsB.nze_2050?.enterprise_value || 0;
  const evB_CP = resultsB.current_policies?.enterprise_value || 0;

  const deltaA = evA_CP !== 0 ? ((evA_NZE - evA_CP) / evA_CP) * 100 : 0;
  const deltaB = evB_CP !== 0 ? ((evB_NZE - evB_CP) / evB_CP) * 100 : 0;

  const companyAResilience = deltaA;
  const companyBResilience = deltaB;
  const winner =
    companyAResilience > companyBResilience ? companyAData?.name : companyBData?.name;
  const riskDifference = Math.abs(companyAResilience - companyBResilience);

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Company Comparison</h1>
        <p className="text-slate-400">
          Head-to-head climate risk analysis across scenarios
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Company A
          </label>
          <select
            value={companyA}
            onChange={(e) => setCompanyA(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors"
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
            Company B
          </label>
          <select
            value={companyB}
            onChange={(e) => setCompanyB(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors"
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
            Scenario Detail
          </label>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            <option value="nze_2050">NZE 2050</option>
            <option value="delayed_transition">Delayed Transition</option>
            <option value="current_policies">Current Policies</option>
          </select>
        </div>

        {loading && (
          <div className="flex items-end gap-2 text-slate-400 col-span-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm">Comparing companies...</span>
          </div>
        )}
      </div>

      {/* Section 1: EV by Scenario Chart */}
      <div className="mb-8">
        <CompanyComparisonChart
          data={chartData}
          companyAName={companyAData?.name || 'Company A'}
          companyBName={companyBData?.name || 'Company B'}
        />
      </div>

      {/* Section 2: Climate Impact Delta Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-6">
          Climate Impact Delta Analysis
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 font-semibold text-slate-300">
                  Scenario
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-300">
                  {companyAData?.name} EV
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-300">
                  {companyBData?.name} EV
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-300">
                  A vs CP
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-300">
                  B vs CP
                </th>
                <th className="text-center py-3 px-4 font-semibold text-slate-300">
                  Winner
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-700 hover:bg-slate-700 hover:bg-opacity-30 transition-colors">
                <td className="py-3 px-4 text-slate-300">NZE</td>
                <td className="text-right py-3 px-4 text-white">
                  ${(resultsA.nze_2050?.enterprise_value || 0).toFixed(1)}B
                </td>
                <td className="text-right py-3 px-4 text-white">
                  ${(resultsB.nze_2050?.enterprise_value || 0).toFixed(1)}B
                </td>
                <td className={`text-right py-3 px-4 ${deltaA > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {deltaA > 0 ? '+' : ''}{deltaA.toFixed(1)}%
                </td>
                <td className={`text-right py-3 px-4 ${deltaB > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {deltaB > 0 ? '+' : ''}{deltaB.toFixed(1)}%
                </td>
                <td className="text-center py-3 px-4">
                  <span className="bg-blue-500 bg-opacity-20 text-blue-300 px-2 py-1 rounded text-xs font-medium">
                    {companyAResilience > companyBResilience ? companyAData?.name : companyBData?.name}
                  </span>
                </td>
              </tr>
              <tr className="border-b border-slate-700 hover:bg-slate-700 hover:bg-opacity-30 transition-colors">
                <td className="py-3 px-4 text-slate-300">Delayed Transition</td>
                <td className="text-right py-3 px-4 text-white">
                  ${(resultsA.delayed_transition?.enterprise_value || 0).toFixed(1)}B
                </td>
                <td className="text-right py-3 px-4 text-white">
                  ${(resultsB.delayed_transition?.enterprise_value || 0).toFixed(1)}B
                </td>
                <td className="text-right py-3 px-4 text-slate-400">—</td>
                <td className="text-right py-3 px-4 text-slate-400">—</td>
                <td className="text-center py-3 px-4">—</td>
              </tr>
              <tr className="hover:bg-slate-700 hover:bg-opacity-30 transition-colors">
                <td className="py-3 px-4 text-slate-300">Current Policies</td>
                <td className="text-right py-3 px-4 text-white">
                  ${(resultsA.current_policies?.enterprise_value || 0).toFixed(1)}B
                </td>
                <td className="text-right py-3 px-4 text-white">
                  ${(resultsB.current_policies?.enterprise_value || 0).toFixed(1)}B
                </td>
                <td className="text-right py-3 px-4 text-slate-400">—</td>
                <td className="text-right py-3 px-4 text-slate-400">—</td>
                <td className="text-center py-3 px-4">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Summary Verdict Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-8">
        <h2 className="text-lg font-semibold text-white mb-4">Climate Resilience Verdict</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company A Card */}
            <div className="bg-slate-700 bg-opacity-50 rounded-lg p-4 border border-blue-500 border-opacity-30">
              <p className="text-sm text-slate-400 mb-1">Company A</p>
              <p className="text-xl font-bold text-white mb-2">
                {companyAData?.name}
              </p>
              <p className="text-sm text-slate-300 mb-3">
                EV change (NZE vs CP):{' '}
                <span
                  className={`font-semibold ${deltaA > 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {deltaA > 0 ? '+' : ''}{deltaA.toFixed(1)}%
                </span>
              </p>
              <p className="text-xs text-slate-400">
                {deltaA > 0
                  ? 'Benefits from climate transition'
                  : 'Risks from climate transition'}
              </p>
            </div>

            {/* Company B Card */}
            <div className="bg-slate-700 bg-opacity-50 rounded-lg p-4 border border-purple-500 border-opacity-30">
              <p className="text-sm text-slate-400 mb-1">Company B</p>
              <p className="text-xl font-bold text-white mb-2">
                {companyBData?.name}
              </p>
              <p className="text-sm text-slate-300 mb-3">
                EV change (NZE vs CP):{' '}
                <span
                  className={`font-semibold ${deltaB > 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {deltaB > 0 ? '+' : ''}{deltaB.toFixed(1)}%
                </span>
              </p>
              <p className="text-xs text-slate-400">
                {deltaB > 0
                  ? 'Benefits from climate transition'
                  : 'Risks from climate transition'}
              </p>
            </div>
          </div>

          {/* Verdict Box */}
          <div className="bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 rounded-lg p-4 mt-6">
            <p className="text-sm text-green-300 font-semibold mb-2">Verdict</p>
            <p className="text-white font-semibold text-lg">
              {winner} is{' '}
              <span className="text-green-400">
                {riskDifference.toFixed(1)}% more climate-resilient
              </span>{' '}
              under NZE transition
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Resilience measured by relative EV preservation from Current Policies to NZE
              scenario
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
