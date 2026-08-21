import {
  Company,
  Scenario,
  FanChartData,
  EBITDABridgeData,
  FCFData,
  EmissionsData,
  RunResult,
  YearResult,
} from '@/types/index';

export const scenarios: Scenario[] = [
  {
    id: 'nze_2050',
    name: 'NZE 2050',
    description: 'Net-Zero Emissions pathway aligned with 1.5C',
    family: 'nze_2050',
    version: '0.1.0',
  },
  {
    id: 'delayed_transition',
    name: 'Delayed Transition',
    description: 'Late climate action with stranded assets',
    family: 'delayed_transition',
    version: '0.1.0',
  },
  {
    id: 'current_policies',
    name: 'Current Policies',
    description: 'Continuation of existing climate policies',
    family: 'current_policies',
    version: '0.1.0',
  },
];

export const companies: Company[] = [
  { id: 'bhp', name: 'BHP Group Ltd', sector: 'Mining & Metals', region: 'AU' },
  { id: 'tck', name: 'Teck Resources Ltd', sector: 'Mining & Metals', region: 'CA' },
  { id: 'rds', name: 'Shell plc', sector: 'Oil & Gas', region: 'EU' },
  { id: 'cvx', name: 'Chevron Corporation', sector: 'Oil & Gas', region: 'US' },
];

export const fanChartData: FanChartData[] = [
  { year: 2024, nze: 85, delayedTransition: 82, currentPolicies: 75 },
  { year: 2025, nze: 92, delayedTransition: 85, currentPolicies: 70 },
  { year: 2026, nze: 101, delayedTransition: 88, currentPolicies: 65 },
  { year: 2027, nze: 112, delayedTransition: 92, currentPolicies: 58 },
  { year: 2028, nze: 125, delayedTransition: 96, currentPolicies: 50 },
  { year: 2029, nze: 138, delayedTransition: 101, currentPolicies: 42 },
  { year: 2030, nze: 152, delayedTransition: 107, currentPolicies: 35 },
];

export const ebitdaBridgeData: EBITDABridgeData[] = [
  { year: 2024, revenue: 1000, opex: 400, carbonCost: 50, physicalLoss: 10, ebitda: 540 },
  { year: 2025, revenue: 1050, opex: 420, carbonCost: 65, physicalLoss: 15, ebitda: 550 },
  { year: 2026, revenue: 1100, opex: 440, carbonCost: 85, physicalLoss: 22, ebitda: 553 },
  { year: 2027, revenue: 1150, opex: 460, carbonCost: 110, physicalLoss: 32, ebitda: 548 },
  { year: 2028, revenue: 1200, opex: 480, carbonCost: 140, physicalLoss: 45, ebitda: 535 },
  { year: 2029, revenue: 1250, opex: 500, carbonCost: 175, physicalLoss: 60, ebitda: 515 },
  { year: 2030, revenue: 1300, opex: 520, carbonCost: 215, physicalLoss: 80, ebitda: 485 },
];

export const fcfData: FCFData[] = [
  { year: 2024, fcf: 120 },
  { year: 2025, fcf: 130 },
  { year: 2026, fcf: 135 },
  { year: 2027, fcf: 128 },
  { year: 2028, fcf: 115 },
  { year: 2029, fcf: 95 },
  { year: 2030, fcf: 75 },
];

export const emissionsData: EmissionsData[] = [
  { year: 2024, emissions: 500, intensity: 0.5 },
  { year: 2025, emissions: 485, intensity: 0.46 },
  { year: 2026, emissions: 460, intensity: 0.42 },
  { year: 2027, emissions: 425, intensity: 0.37 },
  { year: 2028, emissions: 380, intensity: 0.32 },
  { year: 2029, emissions: 320, intensity: 0.26 },
  { year: 2030, emissions: 250, intensity: 0.19 },
];

// Helper function to generate mock years data
function generateMockYears(): YearResult[] {
  const years: YearResult[] = [];
  for (let year = 2024; year <= 2048; year++) {
    const yearOffset = year - 2024;
    years.push({
      year,
      revenue: 1000 + yearOffset * 50,
      opex: 400 + yearOffset * 15,
      carbon_cost: 50 + yearOffset * 10,
      physical_loss_cost: 10 + yearOffset * 2,
      ebitda: 540 - yearOffset * 10,
      da: 100,
      ebit: 440 - yearOffset * 10,
      nopat: 330 - yearOffset * 7.5,
      transition_capex: 50 + yearOffset * 5,
      adaptation_capex: 10 + yearOffset * 1,
      maintenance_capex: 150,
      working_capital_change: 5,
      fcf: 120 - yearOffset * 2,
      revenue_by_commodity: { 'iron_ore': 600 + yearOffset * 30, 'copper': 400 + yearOffset * 20 },
      emissions_by_scope: { 'scope_1': 400 + yearOffset * 8, 'scope_2': 100 + yearOffset * 2 },
    });
  }
  return years;
}

export const mockRunResult: RunResult = {
  run_id: 'run_mock_001',
  scenario_id: 'nze_2050',
  company_id: 'bhp',
  model_version: '0.1.0',
  years: generateMockYears(),
  npv_fcf: 8500,
  terminal_value: 3000,
  enterprise_value: 15200,
  equity_value: 12800,
  implied_share_price: 245,
  wacc_used: 0.08,
  baseline_npv: 8500,
  npv_impact_pct: 0.0,
  ebitda_compression_2030_pct: 5.0,
  ebitda_compression_2040_pct: 15.0,
  exposure_score: 7.2,
  transition_score: 6.8,
  financial_score: 7.5,
  adaptive_score: 6.5,
};
