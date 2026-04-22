"""API response models and request contracts for the CRI FastAPI."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel

from ..data.schemas import RunResults, YearResult


class ScenarioResponse(BaseModel):
    """Scenario metadata for GET /scenarios."""

    id: str
    name: str
    description: str
    family: str
    version: str


class CompanyResponse(BaseModel):
    """Company metadata for GET /companies."""

    id: str
    name: str
    sector: str
    region: str


class RunRequest(BaseModel):
    """Request body for POST /runs."""

    company_id: str
    scenario_id: str
    carbon_price_override: Optional[float] = None


class HealthResponse(BaseModel):
    """Response for GET /health."""

    status: str
    version: str


class RunResponse(RunResults):
    """Full run results (inherits from RunResults)."""

    pass


# ── Ratings ─────────────────────────────────────────────────────────────────

class RatingRequest(BaseModel):
    """Request body for POST /ratings."""

    company_id: str
    tier: str = "free"   # "free" | "analyst" | "professional" | "enterprise"


class PillarSummary(BaseModel):
    label: str
    score: Optional[float] = None
    key_drivers: Optional[List[str]] = None


class RatingResponse(BaseModel):
    """Rating response — content varies by tier."""

    company_id: str
    company_name: str
    rating: str                           # A–E
    rating_label: str
    confidence: str
    summary: str
    sector_rank: Optional[str] = None

    # Free tier: pillar labels only
    physical_risk_label: str
    transition_risk_label: str
    financial_impact_label: str

    # Paid tier fields (None for free)
    composite_score: Optional[float] = None
    physical_risk_score: Optional[float] = None
    transition_risk_score: Optional[float] = None
    financial_impact_score: Optional[float] = None
    physical_drivers: Optional[List[str]] = None
    transition_drivers: Optional[List[str]] = None
    financial_drivers: Optional[List[str]] = None

    tier: str
    locked_features: List[str]
    upgrade_prompt: Optional[str] = None


# ── Disclosure reports ───────────────────────────────────────────────────────

class DisclosureRequest(BaseModel):
    """Request body for POST /reports/{framework}."""

    company_id: str
    reporting_year: Optional[int] = None
    tier: str = "professional"


class DisclosureResponse(BaseModel):
    """Wrapper for any disclosure report."""

    framework: str
    framework_version: str
    generated_at: str
    company_id: str
    company_name: str
    reporting_year: int
    data_sources: List[str]
    caveats: List[str]
    sections: Dict[str, Any]


# ── Tiers ────────────────────────────────────────────────────────────────────

class TierInfo(BaseModel):
    tier: str
    label: str
    price: str
    cta: str
    description: str
    features: Dict[str, Any]


class TiersResponse(BaseModel):
    tiers: List[TierInfo]
