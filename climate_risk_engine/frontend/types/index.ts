export type ScenarioType = 'nze_2050' | 'delayed_transition' | 'current_policies';

export interface Scenario {
  id: string;
  name: string;
  description: string;
  family: string;
  version: string;
}

export interface AssetSummary {
  id: string;
  name: string;
  region: string;
  lat?: number;
  lon?: number;
}

export interface Company {
  id: string;
  name: string;
  sector: string;
  region: string;
  assets: AssetSummary[];
}

export interface LiveConditions {
  region: string;
  lat: number;
  lon: number;
  observed_at: string;
  current_temp_c: number;
  precip_trailing14d_mm: number;
  wind_speed_ms: number;
  humidity_pct: number;
  weather_code: number;
  seasonal_baseline_max_c?: number;
  heat_anomaly_c?: number;
  precip_deficit_flag: boolean;
  source: string;
}

export interface MatchedZone {
  type: string;
  label: string;
  bounds: [[number, number], [number, number]];
}

export interface GISAttributes {
  lat: number;
  lon: number;
  elevation_m: number;
  coastal_km: number;
  koppen_zone: string;
  is_arid: boolean;
  is_permafrost: boolean;
  is_cyclone_belt: boolean;
  is_floodplain: boolean;
  mean_winter_temp: number;
  equipment_sensitivity: Record<string, number>;
  matched_zones: MatchedZone[];
  source: string;
}

export interface CompoundRiskFlag {
  id: string;
  label: string;
  description: string;
  severity: string;
  hazard: string;
  severity_delta: number;
  prob_multiplier: number;
}

export interface Intersection {
  region: string;
  lat: number;
  lon: number;
  gis: GISAttributes;
  live: LiveConditions | null;
  compound_flags: CompoundRiskFlag[];
}

export interface ObservedTrend {
  region: string;
  lat: number;
  lon: number;
  start_year: number;
  end_year: number;
  annual_mean_temp_c: Record<string, number>;
  annual_precip_mm: Record<string, number>;
  baseline_mean_temp_c: number;
  baseline_precip_mm_yr: number;
  temp_trend_c_per_decade?: number;
  warming_since_baseline_c?: number;
  source: string;
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
