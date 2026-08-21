import { Company, RunResult, Scenario, ScenarioType, EBITDABridgeData, FCFData, EmissionsData, LiveConditions, ObservedTrend, Intersection } from '@/types/index';
import { companies, scenarios, mockRunResult } from './mockData';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const USE_MOCK = false; // Set to true to use mock data, false for real API

/**
 * Fetches all available climate scenarios.
 * Makes a real API call to GET /scenarios if USE_MOCK is false.
 */
export async function getScenarios(): Promise<Scenario[]> {
  if (USE_MOCK) {
    // Simulated API delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    return scenarios;
  }

  const response = await fetch(`${API_BASE}/scenarios`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches all companies available for analysis.
 * Makes a real API call to GET /companies if USE_MOCK is false.
 */
export async function getCompanies(): Promise<Company[]> {
  if (USE_MOCK) {
    // Simulated API delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    return companies;
  }

  const response = await fetch(`${API_BASE}/companies`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Runs a climate scenario analysis for a company.
 * Makes a real API call to POST /runs if USE_MOCK is false.
 *
 * @param companyId - Company identifier (e.g., "bhp", "tck")
 * @param scenarioId - Climate scenario (nze_2050, delayed_transition, current_policies)
 * @param carbonPriceOverride - Optional carbon price override in $/tCO₂
 */
export async function postRun(
  companyId: string,
  scenarioId: ScenarioType,
  carbonPriceOverride?: number
): Promise<RunResult> {
  if (USE_MOCK) {
    // Simulated API delay
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Mock response based on scenario
    const scenarioMultipliers: Record<ScenarioType, number> = {
      nze_2050: 1.2,
      delayed_transition: 0.9,
      current_policies: 0.6,
    };

    const multiplier = scenarioMultipliers[scenarioId];

    return {
      ...mockRunResult,
      company_id: companyId,
      scenario_id: scenarioId,
      enterprise_value: mockRunResult.enterprise_value * multiplier,
      equity_value: mockRunResult.equity_value * multiplier,
      implied_share_price: mockRunResult.implied_share_price * multiplier,
      npv_fcf: mockRunResult.npv_fcf * multiplier,
    };
  }

  const body: Record<string, unknown> = {
    company_id: companyId,
    scenario_id: scenarioId,
  };

  if (carbonPriceOverride !== undefined) {
    body.carbon_price_override = carbonPriceOverride;
  }

  const response = await fetch(`${API_BASE}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches live current weather conditions at an asset's coordinates.
 * Makes a real API call to GET /climate/live-conditions.
 */
export async function getLiveConditions(
  region: string,
  lat: number,
  lon: number
): Promise<LiveConditions> {
  const params = new URLSearchParams({ region, lat: String(lat), lon: String(lon) });
  const response = await fetch(`${API_BASE}/climate/live-conditions?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches the observed annual temperature/precipitation trend vs the WMO
 * baseline at an asset's coordinates. Makes a real API call to
 * GET /climate/observed-trend.
 */
export async function getObservedTrend(
  region: string,
  lat: number,
  lon: number,
  startYear: number = 2015
): Promise<ObservedTrend> {
  const params = new URLSearchParams({
    region,
    lat: String(lat),
    lon: String(lon),
    start_year: String(startYear),
  });
  const response = await fetch(`${API_BASE}/climate/observed-trend?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches the GIS profile + live conditions + compound risk flags at an
 * asset's coordinates. Makes a real API call to GET /climate/intersection.
 */
export async function getIntersection(
  region: string,
  lat: number,
  lon: number,
  equipmentType?: string
): Promise<Intersection> {
  const params = new URLSearchParams({ region, lat: String(lat), lon: String(lon) });
  if (equipmentType) {
    params.set('equipment_type', equipmentType);
  }
  const response = await fetch(`${API_BASE}/climate/intersection?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Extracts EBITDA bridge data from RunResult for charting.
 */
export function extractEBITDABridge(result: RunResult): EBITDABridgeData[] {
  return result.years.map((year) => ({
    year: year.year,
    revenue: year.revenue,
    opex: year.opex,
    carbonCost: year.carbon_cost,
    physicalLoss: year.physical_loss_cost,
    ebitda: year.ebitda,
  }));
}

/**
 * Extracts FCF data from RunResult for charting.
 */
export function extractFCF(result: RunResult): FCFData[] {
  return result.years.map((year) => ({
    year: year.year,
    fcf: year.fcf,
  }));
}

/**
 * Extracts emissions data from RunResult for charting.
 */
export function extractEmissions(result: RunResult): EmissionsData[] {
  return result.years.map((year) => {
    const totalEmissions = Object.values(year.emissions_by_scope || {}).reduce((a, b) => a + b, 0);
    const revenue = year.revenue || 1;
    return {
      year: year.year,
      emissions: totalEmissions,
      intensity: revenue > 0 ? totalEmissions / revenue : 0,
    };
  });
}
