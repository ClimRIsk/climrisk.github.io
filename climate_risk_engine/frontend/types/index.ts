export type ScenarioType = 'nze_2050' | 'delayed_transition' | 'current_policies';

export interface Scenario {
  id: string;
  name: string;
  description: string;
  family: string;
  version: string;
}

export interface Company {
  id: string;
  name: string;
  sector: string;
  region: string;
}

export interface YearResult {
  year: number;
  revenue: number;
  opex: number;
  carbon_cost: number;
  physical_loss_cost: number;
  ebitda: number;
  da: number;
  ebit: number;
  nopat: number;
  transition_capex: number;
  adaptation_capex: number;
  maintenance_capex: number;
  working_capital_change: number;
  fcf: number;
  revenue_by_commodity?: Record<string, number>;
  emissions_by_scope?: Record<string, number>;
}

export interface RunResult {
  run_id: string;
  scenario_id: string;
  company_id: string;
  model_version: string;
  years: YearResult[];
  npv_fcf: number;
  terminal_value: number;
  enterprise_value: number;
  equity_value: number;
  implied_share_price: number;
  wacc_used: number;
  baseline_npv?: number;
  npv_impact_pct?: number;
  ebitda_compression_2030_pct?: number;
  ebitda_compression_2040_pct?: number;
  exposure_score?: number;
  transition_score?: number;
  financial_score?: number;
  adaptive_score?: number;
  input_hash?: string;
  scenario_version?: string;
}

export interface EBITDABridgeData {
  year: number;
  revenue: number;
  opex: number;
  carbonCost: number;
  physicalLoss: number;
  ebitda: number;
}

export interface EmissionsData {
  year: number;
  emissions: number;
  intensity: number;
}

export interface FCFData {
  year: number;
  fcf: number;
}

export interface FanChartData {
  year: number;
  nze: number;
  delayedTransition: number;
  currentPolicies: number;
}
