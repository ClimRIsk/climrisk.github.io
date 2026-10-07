"""
ClimRisk — Shared Kafka Event Schemas (Pydantic v2)

These models are the canonical "synaptic payloads" travelling over Kafka between
all microservices. Every producer serialises to these models; every consumer
validates against them. Changing a field here is a breaking change — version
the topic name (e.g. climrisk.asset.validated.v2) when schemas evolve.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator


# ── Enumerations ─────────────────────────────────────────────────────────────

class SSPScenario(str, Enum):
    SSP126 = "SSP1-2.6"
    SSP245 = "SSP2-4.5"
    SSP370 = "SSP3-7.0"
    SSP585 = "SSP5-8.5"


class HazardType(str, Enum):
    COASTAL_INUNDATION   = "Coastal Inundation"
    RIVERINE_FLOOD       = "Riverine Flood"
    FLASH_FLOOD          = "Flash Flood"
    EXTREME_HEAT         = "Extreme Heat"
    DROUGHT              = "Drought"
    WATER_STRESS         = "Water Stress"
    WILDFIRE             = "Wildfire"
    CYCLONE              = "Tropical Cyclone"
    EXTREME_WIND         = "Extreme Wind"
    LANDSLIDE            = "Landslide"
    SEA_LEVEL_RISE       = "Sea Level Rise"
    SALTWATER_INTRUSION  = "Saltwater Intrusion"
    SUBSIDENCE           = "Subsidence"
    HAILSTORM            = "Hailstorm"
    COLD_STRESS          = "Cold Stress"
    BLADE_ICING          = "Blade Icing"


class AssetType(str, Enum):
    HEAVY_MANUFACTURING  = "Heavy Manufacturing"
    LIGHT_MANUFACTURING  = "Light Manufacturing"
    MINING               = "Mining"
    OFFSHORE_PLATFORM    = "Offshore Platform"
    PORT_TERMINAL        = "Port / Terminal"
    POWER_PLANT          = "Power Plant"
    RENEWABLE_ENERGY     = "Renewable Energy"
    OFFICE               = "Office"
    DATA_CENTRE          = "Data Centre"
    AGRICULTURAL_LAND    = "Agricultural Land"
    LOGISTICS_HUB        = "Logistics Hub"
    RETAIL               = "Retail"
    RESIDENTIAL          = "Residential"
    INFRASTRUCTURE       = "Infrastructure"
    OTHER                = "Other"


class PayoutTier(str, Enum):
    TIER_1_25PCT  = "Tier 1 (25%)"
    TIER_2_50PCT  = "Tier 2 (50%)"
    TIER_3_75PCT  = "Tier 3 (75%)"
    TIER_4_TOTAL  = "Tier 4 (100%)"


# ── Base ──────────────────────────────────────────────────────────────────────

class ClimRiskEvent(BaseModel):
    """Base for all Kafka events. Provides envelope fields."""
    event_id: str = Field(default_factory=lambda: f"evt_{uuid.uuid4().hex[:12]}")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    schema_version: str = "1.0"


# ══════════════════════════════════════════════════════════════════════════════
#  TOPIC: climrisk.assets.registered
#  Fires when a client uploads a portfolio (CSV / Excel) to the Asset Service.
# ══════════════════════════════════════════════════════════════════════════════

class GeoPoint(BaseModel):
    """GeoJSON Point geometry."""
    type: Literal["Point"] = "Point"
    coordinates: Annotated[list[float], Field(min_length=2, max_length=3)]
    # coordinates = [longitude, latitude] — GeoJSON convention (lon first)

    @field_validator("coordinates")
    @classmethod
    def validate_coords(cls, v: list[float]) -> list[float]:
        lon, lat = v[0], v[1]
        if not (-180 <= lon <= 180):
            raise ValueError(f"Longitude {lon} out of range [-180, 180]")
        if not (-90 <= lat <= 90):
            raise ValueError(f"Latitude {lat} out of range [-90, 90]")
        return v

    @property
    def lon(self) -> float:
        return self.coordinates[0]

    @property
    def lat(self) -> float:
        return self.coordinates[1]


class AssetRegisteredPayload(BaseModel):
    asset_id: str
    type: AssetType
    geometry: GeoPoint
    book_value_usd: float = Field(ge=0)
    sector: str
    commodity: str | None = None
    region_code: str | None = None        # ISO 3166-2 code
    elevation_m: float | None = None
    is_coastal: bool = False
    metadata: dict[str, Any] = Field(default_factory=dict)


class AssetRegisteredEvent(ClimRiskEvent):
    """Topic: climrisk.assets.registered"""
    client_id: str
    asset_data: AssetRegisteredPayload


# ══════════════════════════════════════════════════════════════════════════════
#  TOPIC: climrisk.asset.validated
#  Fires after the Asset Service verifies coordinates are valid and on land.
#  Consumed by the Hazard Engine to begin intersection queries.
# ══════════════════════════════════════════════════════════════════════════════

class AssetValidatedEvent(ClimRiskEvent):
    """Topic: climrisk.asset.validated"""
    client_id: str
    asset_data: AssetRegisteredPayload
    validation_notes: str | None = None
    # Scenarios to run — defaults to all four
    scenarios: list[SSPScenario] = Field(
        default=[SSPScenario.SSP126, SSPScenario.SSP245,
                 SSPScenario.SSP370, SSPScenario.SSP585]
    )
    horizon_years: list[int] = Field(default=[2030, 2035, 2040, 2045, 2050])


# ══════════════════════════════════════════════════════════════════════════════
#  TOPIC: climrisk.hazard.intersected
#  Fires after the Geospatial Engine crosses asset coords with hazard layers.
#  Consumed by CSRD Service to compute VaR.
# ══════════════════════════════════════════════════════════════════════════════

class HazardExposure(BaseModel):
    hazard_type: HazardType
    severity_score: float = Field(ge=0.0, le=1.0,
        description="Normalised severity 0=no risk, 1=catastrophic")
    raw_score: float | None = Field(None,
        description="Raw 0-100 score from CRI hazard engine")
    projected_depth_meters: float | None = None    # floods / SLR
    projected_temp_delta_c: float | None = None    # heat / cold
    return_period_years: float | None = None       # probabilistic exceedance
    data_source: str | None = None


class HazardIntersectedEvent(ClimRiskEvent):
    """Topic: climrisk.hazard.intersected"""
    asset_id: str
    client_id: str
    scenario: SSPScenario
    horizon_year: int
    exposures: list[HazardExposure]
    is_material_risk: bool = False          # true if any severity_score > 0.5
    computation_ms: int | None = None       # latency instrumentation

    @model_validator(mode="after")
    def flag_material(self) -> HazardIntersectedEvent:
        if any(e.severity_score > 0.5 for e in self.exposures):
            object.__setattr__(self, "is_material_risk", True)
        return self


# ══════════════════════════════════════════════════════════════════════════════
#  TOPIC: climrisk.weather.telemetry.live
#  Ingested from NOAA / Open-Meteo / private weather stations.
#  High-volume — partitioned by asset_id for parallel consumption.
# ══════════════════════════════════════════════════════════════════════════════

class WeatherObservation(BaseModel):
    station_id: str
    parameter: str          # e.g. "Cumulative Rainfall (48h)", "Wind Speed (10m)"
    value: float
    unit: str               # mm, m/s, °C, hPa …
    quality_flag: str = "OK"  # OK | SUSPECT | BAD


class WeatherTelemetryEvent(ClimRiskEvent):
    """Topic: climrisk.weather.telemetry.live"""
    asset_id: str           # nearest asset this telemetry is linked to
    geometry: GeoPoint      # station location
    observations: list[WeatherObservation]
    oracle_source: str      # NOAA_Station_ID_8472 / Open-Meteo / …


# ══════════════════════════════════════════════════════════════════════════════
#  TOPIC: climrisk.parametric.trigger.fired
#  Fires when live telemetry breaches a parametric policy threshold.
#  Guarantees exactly-once via Kafka transactions.
# ══════════════════════════════════════════════════════════════════════════════

class TriggerCondition(BaseModel):
    parameter: str
    threshold_value: float
    threshold_unit: str
    actual_value: float
    oracle_source: str
    exceedance_pct: float   # (actual - threshold) / threshold * 100


class ParametricTriggerFiredEvent(ClimRiskEvent):
    """Topic: climrisk.parametric.trigger.fired"""
    policy_id: str
    client_id: str
    asset_id: str
    trigger_condition: TriggerCondition
    payout_tier: PayoutTier
    status: Literal["EXECUTE_PAYOUT", "PENDING_VERIFICATION", "REJECTED"]
    # Idempotency key — duplicate events must not trigger double payouts
    idempotency_key: str = Field(
        default_factory=lambda: f"idem_{uuid.uuid4().hex}"
    )


# ══════════════════════════════════════════════════════════════════════════════
#  TOPIC: climrisk.report.csrd_e1_ready
#  Fires when CSRD Service has completed an ESRS E1-9 Gross VaR assessment.
# ══════════════════════════════════════════════════════════════════════════════

class FinancialEffects(BaseModel):
    total_assets_evaluated_usd: float
    assets_at_material_risk_usd: float
    insured_percentage: float = Field(ge=0.0, le=1.0)
    gross_value_at_risk_usd: float
    expected_annual_loss_usd: float | None = None
    # ESRS E1-9 required breakdown
    physical_risk_var_usd: float | None = None
    transition_risk_var_usd: float | None = None
    stranded_asset_value_usd: float | None = None


class CSRDReportReadyEvent(ClimRiskEvent):
    """Topic: climrisk.report.csrd_e1_ready"""
    client_id: str
    report_id: str = Field(default_factory=lambda: f"rpt_{uuid.uuid4().hex[:10]}")
    reporting_framework: str = "ESRS E1-9"
    assessment_scenarios: list[SSPScenario]
    horizon_year: int
    financial_effects: FinancialEffects
    xbrl_document_uri: str | None = None   # S3 / GCS path to XBRL file
    pdf_document_uri: str | None = None
    report_status: Literal["GENERATED", "FAILED", "PENDING_REVIEW"] = "GENERATED"


# ── Topic name registry ───────────────────────────────────────────────────────
TOPICS = {
    "asset_registered":      "climrisk.assets.registered",
    "asset_validated":       "climrisk.asset.validated",
    "hazard_intersected":    "climrisk.hazard.intersected",
    "weather_telemetry":     "climrisk.weather.telemetry.live",
    "parametric_trigger":    "climrisk.parametric.trigger.fired",
    "csrd_job_complete":     "climrisk.reporting.csrd.job_complete",
    "csrd_e1_ready":         "climrisk.report.csrd_e1_ready",
    "dlq":                   "climrisk.dlq",
}
