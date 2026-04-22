"""Canonical data contracts for the CRI engine.

Every Scenario, Company, Asset, Run, and Results object in the system is
modelled here. The API, engine, and data loaders all import from this
module — there is one source of truth.

These models are deliberately strict (Pydantic v2). If a field is missing
or has the wrong type, we fail loud at the edge rather than silently in
the middle of a DCF.
"""

from __future__ import annotations

from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------


class ScenarioFamily(str, Enum):
    """Canonical scenario families we support out of the box."""

    NZE_2050 = "nze_2050"
    BELOW_2C_ORDERLY = "below_2c_orderly"
    DELAYED_TRANSITION = "delayed_transition"
    CURRENT_POLICIES = "current_policies"
    CUSTOM = "custom"


class HazardType(str, Enum):
    """Physical climate hazards we model."""

    HEAT_STRESS = "heat_stress"
    WATER_STRESS = "water_stress"
    FLOOD = "flood"
    DROUGHT = "drought"
    CYCLONE = "cyclone"
    SEA_LEVEL = "sea_level"
    WILDFIRE = "wildfire"


class Commodity(str, Enum):
    """Commodity segments we support. Expand as sectors are added."""

    IRON_ORE = "iron_ore"
    COPPER = "copper"
    ALUMINIUM = "aluminium"
    COAL_THERMAL = "coal_thermal"
    COAL_METALLURGICAL = "coal_metallurgical"
    CRUDE_OIL = "crude_oil"
    NATURAL_GAS = "natural_gas"
    REFINED_PRODUCTS = "refined_products"
    CEMENT = "cement"
    ELECTRICITY = "electricity"


class EmissionsScope(str, Enum):
    SCOPE_1 = "scope_1"
    SCOPE_2 = "scope_2"
    SCOPE_3 = "scope_3"


# ---------------------------------------------------------------------------
# Scenario layer
# ---------------------------------------------------------------------------


class CarbonPricePath(BaseModel):
    """Carbon price in USD / tCO2e by year, potentially per-region."""

    region: str = "global"
    # year -> USD/tCO2e
    path: Dict[int, float]


class CommodityCurve(BaseModel):
    """Demand index (and/or price) path for one commodity under one scenario."""

    commodity: Commodity
    # year -> index, where base year == 100
    demand_index: Dict[int, float]
    # year -> USD per physical unit (e.g., USD/tonne)
    price_path: Dict[int, float]
    # Elasticity of volume to demand-index changes. Default 1.0 means
    # demand index fully translates to volume (before physical disruption).
    price_elasticity: float = 1.0


class HazardPath(BaseModel):
    """Expected hazard severity/frequency path per region."""

    hazard: HazardType
    region: str
    # year -> severity index (0..1) or expected annual production loss (fraction)
    path: Dict[int, float]


class Scenario(BaseModel):
    """A named, versioned climate scenario."""

    id: str                                    # e.g. "nze_2050_v1"
    name: str                                  # human-readable
    family: ScenarioFamily
    horizon: tuple[int, int]                   # (start_year, end_year) inclusive
    description: str = ""
    version: str = "0.1.0"

    carbon_prices: List[CarbonPricePath] = Field(default_factory=list)
    commodity_curves: List[CommodityCurve] = Field(default_factory=list)
    hazards: List[HazardPath] = Field(default_factory=list)

    # Additional risk premium (bps on WACC) applied under this scenario
    risk_premium_bps: int = 0

    @field_validator("horizon")
    @classmethod
    def _valid_horizon(cls, v: tuple[int, int]) -> tuple[int, int]:
        start, end = v
        if end <= start:
            raise ValueError("horizon end must be after start")
        return v

    # --- convenience lookups ------------------------------------------------

    def carbon_price(self, year: int, region: str = "global") -> float:
        """Carbon price in USD/tCO2e for (region, year), falling back to global."""
        for cp in self.carbon_prices:
            if cp.region == region and year in cp.path:
                return cp.path[year]
        for cp in self.carbon_prices:
            if cp.region == "global" and year in cp.path:
                return cp.path[year]
        return 0.0

    def commodity_curve(self, commodity: Commodity) -> Optional[CommodityCurve]:
        for c in self.commodity_curves:
            if c.commodity == commodity:
                return c
        return None

    def hazard(self, hazard: HazardType, region: str) -> Optional[HazardPath]:
        for h in self.hazards:
            if h.hazard == hazard and h.region == region:
                return h
        return None


# ---------------------------------------------------------------------------
# Company layer
# ---------------------------------------------------------------------------


class EmissionsProfile(BaseModel):
    """Emissions intensity at the company or asset level."""

    # tCO2e per physical unit of production (e.g., per tonne of ore)
    scope1_intensity: float = 0.0
    scope2_intensity: float = 0.0
    scope3_intensity: float = 0.0

    # Share of emissions actually subject to a carbon price in a given region.
    # Starts simple: a single global fraction. Can be refined to by-region later.
    carbon_price_coverage: float = 1.0

    # Free allowance fraction (EU ETS style)
    free_allocation: float = 0.0


class Asset(BaseModel):
    """A production unit (mine, refinery, mill, power plant)."""

    id: str
    name: str
    commodity: Commodity
    region: str                                     # e.g., "AU-WA", "CL-02", "global"
    baseline_production: float                      # units / year, at start year
    # For mines: often tonnes; for refineries: barrels; etc. Stored free-text.
    production_unit: str = "tonnes"
    emissions: EmissionsProfile = EmissionsProfile()
    carrying_value: float = 0.0                     # USD, used for stranded-asset writedowns
    remaining_life_years: Optional[int] = None
    # Unit operating cost at baseline year (USD per production unit)
    baseline_unit_cost: float = 0.0
    # Fraction of unit cost attributable to energy (proxy for carbon exposure)
    energy_cost_share: float = 0.3


class SegmentBaseline(BaseModel):
    """Per-commodity baseline used when we don't yet have asset-level data."""

    commodity: Commodity
    revenue_baseline: float                          # USD
    volume_baseline: float                           # physical units
    ebitda_margin_baseline: float                    # 0..1
    emissions: EmissionsProfile = EmissionsProfile()


class Financials(BaseModel):
    """Company-wide baseline financials (most-recent fiscal year)."""

    revenue: float
    ebitda: float
    capex: float
    maintenance_capex_share: float = 0.6             # share of capex that is maintenance
    tax_rate: float = 0.25
    wacc_base: float = 0.08
    net_debt: float = 0.0
    shares_outstanding: float = 1.0
    market_cap: Optional[float] = None


class Company(BaseModel):
    """A company we can run the engine on."""

    id: str                                          # ticker or slug
    name: str
    sector: str                                      # free-text for now
    hq_region: str = "global"
    financials: Financials
    segments: List[SegmentBaseline] = Field(default_factory=list)
    assets: List[Asset] = Field(default_factory=list)
    # Multi-pillar exposure weights (from V1 methodology, kept as reporting lens)
    exposure_weight: float = 0.3
    transition_weight: float = 0.3
    # Data-quality flag influences a confidence multiplier in reporting
    data_quality: str = "medium"                    # "low" | "medium" | "high"


# ---------------------------------------------------------------------------
# Run + Results layer
# ---------------------------------------------------------------------------


class RunRequest(BaseModel):
    """A single engine invocation."""

    scenario_id: str
    company_id: str
    # Optional per-run overrides (e.g., user slides carbon price)
    overrides: Dict[str, float] = Field(default_factory=dict)
    model_version: str = "0.1.0"


class YearResult(BaseModel):
    """Single-year output row."""

    year: int
    revenue: float
    opex: float
    carbon_cost: float
    physical_loss_cost: float
    ebitda: float
    da: float
    ebit: float
    nopat: float
    transition_capex: float
    adaptation_capex: float
    maintenance_capex: float
    working_capital_change: float
    fcf: float
    # Breakdowns for transparency
    revenue_by_commodity: Dict[str, float] = Field(default_factory=dict)
    emissions_by_scope: Dict[str, float] = Field(default_factory=dict)


class RunResults(BaseModel):
    """Full results of one engine invocation."""

    run_id: str
    scenario_id: str
    company_id: str
    model_version: str

    # Per-year trajectory
    years: List[YearResult]

    # Valuation
    npv_fcf: float
    terminal_value: float
    enterprise_value: float
    equity_value: float
    implied_share_price: float
    wacc_used: float

    # Headline comparisons vs. baseline scenario (populated if provided)
    baseline_npv: Optional[float] = None
    npv_impact_pct: Optional[float] = None
    ebitda_compression_2030_pct: Optional[float] = None
    ebitda_compression_2040_pct: Optional[float] = None

    # Pillar scores (V1 lens retained for reporting)
    exposure_score: Optional[float] = None
    transition_score: Optional[float] = None
    financial_score: Optional[float] = None
    adaptive_score: Optional[float] = None

    # Provenance
    input_hash: str = ""
    scenario_version: str = ""
