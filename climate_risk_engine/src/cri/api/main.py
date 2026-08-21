"""FastAPI REST API for the Climate Risk Intelligence engine."""

from __future__ import annotations

import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import dataclasses

from ..data.companies_seed import all_seed as get_all_companies
from ..engine.orchestrator import run as run_engine
from ..engine.orchestrator import run_scoped as run_scoped_engine
from ..engine.scope import ReportScope
from ..data.schemas import (
    CarbonPricePath,
    Scenario,
    ScenarioFamily,
)
from ..scenarios import (
    CURRENT_POLICIES,
    DELAYED_TRANSITION,
    NZE_2050,
)
from .schemas import (
    AssetInput,
    CompanyResponse,
    DisclosureRequest,
    DisclosureResponse,
    HazardYearOut,
    HealthResponse,
    PhysicalHazardReportResponse,
    PhysicalReportRequest,
    PhysicalRiskOut,
    PhysicalYearOut,
    RatingRequest,
    RatingResponse,
    CustomScenarioParams,
    RunRequest,
    RunResponse,
    ScenarioResponse,
    ScopedRunRequest,
    ScopedRunResponse,
    TierInfo,
    TiersResponse,
    TransitionRiskOut,
    TransitionYearOut,
)


# Initialize FastAPI app
app = FastAPI(
    title="Climate Risk Intelligence API",
    description="REST API for climate financial risk modelling",
    version="0.3.0",
)

# Add CORS middleware (allow all origins for dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Build registries
SCENARIO_REGISTRY = {
    "nze_2050": NZE_2050,
    "delayed_transition": DELAYED_TRANSITION,
    "current_policies": CURRENT_POLICIES,
}

COMPANY_REGISTRY = get_all_companies()

# Custom scenarios created via POST /scenarios are stored here at runtime.
# Not persisted across restarts; persistence is a Phase 2 feature.
CUSTOM_SCENARIO_REGISTRY: dict[str, Scenario] = {}


def _build_custom_scenario(params: CustomScenarioParams, scenario_id: str = 'custom') -> Scenario:
    """Build a Scenario from a CustomScenarioParams request body."""
    return Scenario(
        id=scenario_id,
        name=params.name,
        family=ScenarioFamily.CUSTOM,
        horizon=(2026, 2050),
        description=params.description,
        version='0.4.0',
        carbon_prices=[CarbonPricePath(region='global', path=params.carbon_price_path)],
        commodity_curves=CURRENT_POLICIES.commodity_curves,
        risk_premium_bps=params.risk_premium_bps,
        abatement_targets=params.abatement_targets,
    )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(status="ok", version="0.3.0")


@app.get("/scenarios", response_model=list[ScenarioResponse])
def list_scenarios() -> list[ScenarioResponse]:
    """Return list of available scenarios."""
    scenarios = []
    for scenario_id, scenario in SCENARIO_REGISTRY.items():
        scenarios.append(
            ScenarioResponse(
                id=scenario_id,
                name=scenario.name,
                description=scenario.description,
                family=scenario.family.value,
                version=scenario.version,
            )
        )
    return scenarios


@app.get("/companies", response_model=list[CompanyResponse])
def list_companies() -> list[CompanyResponse]:
    """Return list of available companies."""
    companies = []
    for company_id, company in COMPANY_REGISTRY.items():
        companies.append(
            CompanyResponse(
                id=company_id,
                name=company.name,
                sector=company.sector,
                region=company.hq_region,
            )
        )
    return companies


@app.post("/runs", response_model=RunResponse)
def run_simulation(request: RunRequest) -> RunResponse:
    """Run the climate risk engine for a given company and scenario.

    Returns full RunResults including per-year trajectory and valuation metrics.
    """
    scenario_id = request.scenario_id.lower()
    company_id = request.company_id.lower()

    if company_id not in COMPANY_REGISTRY:
        raise HTTPException(
            status_code=404,
            detail=f"Company '{request.company_id}' not found. "
            f"Available: {list(COMPANY_REGISTRY.keys())}",
        )

    # Resolve scenario: named NGFS | saved custom | inline custom
    if scenario_id in SCENARIO_REGISTRY:
        scenario = SCENARIO_REGISTRY[scenario_id]
    elif scenario_id in CUSTOM_SCENARIO_REGISTRY:
        scenario = CUSTOM_SCENARIO_REGISTRY[scenario_id]
    elif scenario_id == 'custom':
        if not request.custom_scenario:
            raise HTTPException(
                status_code=422,
                detail=(
                    "scenario_id='custom' requires a 'custom_scenario' block with "
                    "at minimum a 'carbon_price_path' dict mapping years to USD/tCO2e prices."
                ),
            )
        scenario = _build_custom_scenario(request.custom_scenario)
    else:
        available = list(SCENARIO_REGISTRY.keys()) + list(CUSTOM_SCENARIO_REGISTRY.keys()) + ['custom']
        raise HTTPException(
            status_code=404,
            detail=f"Scenario '{request.scenario_id}' not found. Available: {available}",
        )

    company = COMPANY_REGISTRY[company_id]
    results = run_engine(company=company, scenario=scenario)
    return RunResponse(**results.model_dump())



@app.post("/scenarios", status_code=201)
def create_custom_scenario(params: CustomScenarioParams) -> ScenarioResponse:
    """Persist a custom scenario in the runtime registry.

    After creation the scenario can be referenced by its auto-generated id in
    subsequent POST /runs calls without re-sending the full carbon_price_path.
    Registry is in-memory and resets on server restart (Phase 2: persistence).
    """
    import re as _re
    slug = _re.sub(r"[^a-z0-9]+", "_", params.name.lower()).strip("_")
    scenario_id = f"custom_{slug}"
    if scenario_id in CUSTOM_SCENARIO_REGISTRY:
        raise HTTPException(
            status_code=409,
            detail=f"Custom scenario '{scenario_id}' already exists. Use a different name.",
        )
    scenario = _build_custom_scenario(params, scenario_id=scenario_id)
    CUSTOM_SCENARIO_REGISTRY[scenario_id] = scenario
    return ScenarioResponse(
        id=scenario_id, name=scenario.name, description=scenario.description,
        family=scenario.family.value, version=scenario.version,
    )


@app.delete("/scenarios/{scenario_id}", status_code=204)
def delete_custom_scenario(scenario_id: str) -> None:
    """Remove a custom scenario from the runtime registry."""
    if scenario_id in SCENARIO_REGISTRY:
        raise HTTPException(status_code=403, detail=f"Cannot delete built-in NGFS scenario '{scenario_id}'.")
    if scenario_id not in CUSTOM_SCENARIO_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Custom scenario '{scenario_id}' not found.")
    del CUSTOM_SCENARIO_REGISTRY[scenario_id]

# ── Scoped / modular run ─────────────────────────────────────────────────────

def _physical_to_response(p) -> PhysicalRiskOut:
    """Convert PhysicalRiskReport dataclass → PhysicalRiskOut Pydantic model."""
    def _years(lst) -> list[PhysicalYearOut]:
        return [
            PhysicalYearOut(
                year=y.year,
                physical_loss_cost=y.physical_loss_cost,
                adaptation_capex=y.adaptation_capex,
                physical_loss_by_hazard=y.physical_loss_by_hazard,
                total_loss_fraction=y.total_loss_fraction,
            )
            for y in lst
        ]
    return PhysicalRiskOut(
        company_id=p.company_id,
        company_name=p.company_name,
        run_id=p.run_id,
        model_version=p.model_version,
        physical_score=p.physical_score,
        physical_label=p.physical_label,
        peak_loss_year=p.peak_loss_year,
        peak_loss_usd=p.peak_loss_usd,
        peak_loss_hazard=p.peak_loss_hazard,
        total_adaptation_capex_nze=p.total_adaptation_capex_nze,
        total_adaptation_capex_cp=p.total_adaptation_capex_cp,
        hazard_breakdown_2035=p.hazard_breakdown_2035,
        narrative=p.narrative,
        years_nze=_years(p.years_nze),
        years_delayed=_years(p.years_delayed),
        years_cp=_years(p.years_cp),
    )


def _transition_to_response(t) -> TransitionRiskOut:
    """Convert TransitionRiskReport dataclass → TransitionRiskOut Pydantic model."""
    def _years(lst) -> list[TransitionYearOut]:
        return [
            TransitionYearOut(
                year=y.year,
                carbon_cost=y.carbon_cost,
                carbon_cost_pct_ebitda=y.carbon_cost_pct_ebitda,
                revenue_by_commodity=y.revenue_by_commodity,
                emissions_scope1=y.emissions_scope1,
                emissions_scope2=y.emissions_scope2,
                emissions_scope3=y.emissions_scope3,
            )
            for y in lst
        ]
    return TransitionRiskOut(
        company_id=t.company_id,
        company_name=t.company_name,
        run_id=t.run_id,
        model_version=t.model_version,
        transition_score=t.transition_score,
        transition_label=t.transition_label,
        ebitda_compression_2030_nze=t.ebitda_compression_2030_nze,
        ebitda_compression_2040_nze=t.ebitda_compression_2040_nze,
        carbon_pct_ebitda_2030_nze=t.carbon_pct_ebitda_2030_nze,
        carbon_pct_ebitda_2030_cp=t.carbon_pct_ebitda_2030_cp,
        narrative=t.narrative,
        years_nze=_years(t.years_nze),
        years_delayed=_years(t.years_delayed),
        years_cp=_years(t.years_cp),
    )


@app.post("/runs/scoped", response_model=ScopedRunResponse)
def run_scoped_analysis(request: ScopedRunRequest) -> ScopedRunResponse:
    """Run only the analysis pillars selected by the firm.

    The ``scope`` field determines what is computed and returned:

    - **physical**            – Asset-level hazard + production loss.
                                No carbon pricing, no valuation.
    - **transition**          – Carbon cost trajectory, commodity demand shifts,
                                EBITDA compression under NGFS scenarios.
    - **financial**           – Full DCF enterprise valuation across all three
                                scenarios (physical + transition are computed
                                internally as inputs but not returned standalone).
    - **physical_transition** – Physical AND transition combined; no DCF.
    - **full_cri**            – All three pillars + composite CRI rating (A–E).

    Unselected pillar fields are ``null`` in the response.
    """
    if request.company_id.lower() not in COMPANY_REGISTRY:
        raise HTTPException(
            status_code=404,
            detail=f"Company '{request.company_id}' not found. "
                   f"Available: {list(COMPANY_REGISTRY.keys())}",
        )

    company = COMPANY_REGISTRY[request.company_id.lower()]
    scope   = ReportScope(request.scope)

    scoped = run_scoped_engine(company=company, scope=scope)

    # Convert physical dataclass → Pydantic response model
    physical_out = _physical_to_response(scoped.physical) if scoped.physical else None

    # Convert transition dataclass → Pydantic response model
    transition_out = _transition_to_response(scoped.transition) if scoped.transition else None

    # Valuation: RunResults are Pydantic models — serialise each scenario
    valuation_out = None
    if scoped.valuation_results:
        valuation_out = {
            label: rr.model_dump()
            for label, rr in scoped.valuation_results.items()
        }

    # Rating: convert to plain dict if present
    rating_out = None
    if scoped.rating_result:
        try:
            rating_out = dataclasses.asdict(scoped.rating_result)
        except TypeError:
            rating_out = vars(scoped.rating_result)

    return ScopedRunResponse(
        scope=scoped.scope.value,
        scope_label=scoped.scope_label,
        run_id=scoped.run_id,
        physical=physical_out,
        transition=transition_out,
        valuation_results=valuation_out,
        rating_result=rating_out,
    )


# ── File upload endpoint ────────────────────────────────────────────────────

class FileRunSummaryRow(BaseModel):
    company: str
    scenario: str
    ev_bn: float
    equity_bn: float
    share_price: float
    wacc_pct: float
    npv_impact_pct: float | None
    warnings: int


class FileRunResponse(BaseModel):
    source_file: str
    companies_processed: int
    scenarios_run: list[str]
    total_duration_s: float
    errors: list[str]
    results: list[FileRunSummaryRow]


@app.post("/runs/file", response_model=FileRunResponse)
async def run_from_file(
    file: UploadFile = File(..., description="Client intake Excel (.xlsx)"),
    scenarios: str = Form(
        default="Net Zero 2050,Delayed Transition,Current Policies",
        description="Comma-separated scenario names",
    ),
) -> FileRunResponse:
    """
    Upload a client intake Excel file and run the full pipeline.

    The file must match the CRI intake template (download via GET /template).
    Returns valuation results for every company × scenario combination.
    """
    from ..engine.pipeline import Pipeline

    if not file.filename or not file.filename.endswith(".xlsx"):
        raise HTTPException(
            status_code=400,
            detail="File must be a .xlsx Excel file. Download the template from GET /template.",
        )

    scenario_list = [s.strip() for s in scenarios.split(",") if s.strip()]

    # Save upload to temp file
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = Path(tmp.name)

    try:
        pipeline = Pipeline()
        report = pipeline.run_file(tmp_path, scenario_names=scenario_list)
    finally:
        tmp_path.unlink(missing_ok=True)

    return FileRunResponse(
        source_file=file.filename,
        companies_processed=report.companies_processed,
        scenarios_run=report.scenarios_run,
        total_duration_s=round(report.total_duration_s, 2),
        errors=report.errors,
        results=[FileRunSummaryRow(**row) for row in report.summary_table()],
    )


@app.get("/template")
def download_template():
    """Download the blank client intake Excel template."""
    from fastapi.responses import FileResponse
    from ..intake.template import generate_template

    template_path = Path(__file__).parent.parent.parent.parent / "data" / "client_template.xlsx"
    if not template_path.exists():
        generate_template(str(template_path))

    return FileResponse(
        path=str(template_path),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename="CRI_Client_Intake_Template.xlsx",
    )


@app.get("/tiers", response_model=TiersResponse)
def list_tiers() -> TiersResponse:
    """Return all CRI subscription tiers with pricing and feature matrix."""
    from ..outcomes.tiers import TIER_FEATURES, TIER_PRICING, Tier
    import dataclasses

    tiers = []
    for tier in [Tier.FREE, Tier.ANALYST, Tier.PROFESSIONAL, Tier.ENTERPRISE]:
        pricing = TIER_PRICING[tier]
        features = dataclasses.asdict(TIER_FEATURES[tier])
        tiers.append(TierInfo(
            tier=tier.value,
            label=pricing["label"],
            price=pricing["price"],
            cta=pricing["cta"],
            description=pricing["description"],
            features=features,
        ))
    return TiersResponse(tiers=tiers)


@app.post("/ratings", response_model=RatingResponse)
def rate_company(request: RatingRequest) -> RatingResponse:
    """
    Compute a climate risk rating for a company.

    Free tier: returns A–E rating, pillar labels, and summary narrative.
    Paid tiers: returns full numeric scores, key drivers, and peer context.

    Runs the company under all three canonical scenarios internally.
    """
    from ..outcomes.ratings import RatingEngine, WeightProfile
    from ..outcomes.tiers import Tier, TierGate

    if request.company_id.lower() not in COMPANY_REGISTRY:
        raise HTTPException(
            status_code=404,
            detail=f"Company '{request.company_id}' not found.",
        )

    # Validate weight_profile
    try:
        wp = WeightProfile(request.weight_profile.lower())
    except ValueError:
        valid = [p.value for p in WeightProfile]
        raise HTTPException(
            status_code=422,
            detail=f"Invalid weight_profile '{request.weight_profile}'. "
                   f"Choose from: {valid}",
        )

    # Validate custom_weights when CUSTOM profile selected
    custom_weights_tuple = None
    if wp == WeightProfile.CUSTOM:
        if not request.custom_weights or len(request.custom_weights) != 3:
            raise HTTPException(
                status_code=422,
                detail="custom_weights must be a list of 3 floats [physical, transition, financial] "
                       "summing to 1.0 when weight_profile='custom'.",
            )
        w = request.custom_weights
        if abs(sum(w) - 1.0) > 1e-4:
            raise HTTPException(
                status_code=422,
                detail=f"custom_weights must sum to 1.0, got {sum(w):.4f}.",
            )
        custom_weights_tuple = (w[0], w[1], w[2])

    company = COMPANY_REGISTRY[request.company_id.lower()]
    tier = Tier.from_str(request.tier)

    # Run all three scenarios
    nze_results = run_engine(company=company, scenario=SCENARIO_REGISTRY["nze_2050"])
    dt_results  = run_engine(company=company, scenario=SCENARIO_REGISTRY["delayed_transition"])
    cp_results  = run_engine(company=company, scenario=SCENARIO_REGISTRY["current_policies"])

    engine = RatingEngine()
    rating_result = engine.rate(
        company_name=company.name,
        sector=company.sector,
        nze_results=nze_results,
        dt_results=dt_results,
        cp_results=cp_results,
        data_quality=company.data_quality,
        weight_profile=wp,
        custom_weights=custom_weights_tuple,
    )

    # Determine actual weights applied (for transparency in response)
    from ..outcomes.ratings import _PROFILE_WEIGHTS
    if wp == WeightProfile.CUSTOM and custom_weights_tuple:
        w_p, w_t, w_f = custom_weights_tuple
    else:
        w_p, w_t, w_f = _PROFILE_WEIGHTS[wp]
    weights_applied = {
        "physical":   round(w_p, 4),
        "transition": round(w_t, 4),
        "financial":  round(w_f, 4),
    }

    gate = TierGate(tier)
    show_scores = gate.features.pillar_scores
    show_drivers = gate.features.pillar_scores  # drivers visible from Analyst up

    return RatingResponse(
        company_id=company.id,
        company_name=company.name,
        rating=str(rating_result.rating),
        rating_label=rating_result.rating_label,
        confidence=rating_result.confidence,
        summary=rating_result.summary,
        sector_rank=rating_result.sector_rank,
        physical_risk_label=rating_result.physical.label,
        transition_risk_label=rating_result.transition.label,
        financial_impact_label=rating_result.financial.label,
        composite_score=round(rating_result.composite_score, 1) if show_scores else None,
        physical_risk_score=round(rating_result.physical.score, 1) if show_scores else None,
        transition_risk_score=round(rating_result.transition.score, 1) if show_scores else None,
        financial_impact_score=round(rating_result.financial.score, 1) if show_scores else None,
        physical_drivers=rating_result.physical.drivers if show_drivers else None,
        transition_drivers=rating_result.transition.drivers if show_drivers else None,
        financial_drivers=rating_result.financial.drivers if show_drivers else None,
        tier=tier.value,
        locked_features=gate._locked_list(),
        upgrade_prompt=(
            None if tier != Tier.FREE else
            "Unlock full scores, asset-level breakdown, and TCFD/ISSB S2 reports "
            "with CRI Analyst or Professional."
        ),
        weight_profile_used=wp.value,
        weights_applied=weights_applied,
    )


@app.post("/reports/tcfd", response_model=DisclosureResponse)
def generate_tcfd_report(request: DisclosureRequest) -> DisclosureResponse:
    """
    Generate a TCFD-aligned climate risk disclosure report.
    Requires Professional tier or above.
    """
    from ..outcomes.tiers import Tier, TierGate
    from ..outcomes.disclosure import generate_tcfd

    tier = Tier.from_str(request.tier)
    gate = TierGate(tier)
    if not gate.features.disclosure_tcfd:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "TCFD reports require Professional or Enterprise tier.",
                **TierGate.upgrade_prompt("disclosure_tcfd"),
            },
        )

    if request.company_id.lower() not in COMPANY_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Company '{request.company_id}' not found.")

    company = COMPANY_REGISTRY[request.company_id.lower()]
    nze = run_engine(company=company, scenario=SCENARIO_REGISTRY["nze_2050"])
    dt  = run_engine(company=company, scenario=SCENARIO_REGISTRY["delayed_transition"])
    cp  = run_engine(company=company, scenario=SCENARIO_REGISTRY["current_policies"])

    report = generate_tcfd(company, nze, dt, cp, reporting_year=request.reporting_year)
    return DisclosureResponse(**report.to_dict())


@app.post("/reports/issb", response_model=DisclosureResponse)
def generate_issb_report(request: DisclosureRequest) -> DisclosureResponse:
    """
    Generate an IFRS S2 (ISSB) climate disclosure metrics report.
    Requires Professional tier or above.
    """
    from ..outcomes.tiers import Tier, TierGate
    from ..outcomes.disclosure import generate_issb

    tier = Tier.from_str(request.tier)
    gate = TierGate(tier)
    if not gate.features.disclosure_issb:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "ISSB S2 reports require Professional or Enterprise tier.",
                **TierGate.upgrade_prompt("disclosure_issb"),
            },
        )

    if request.company_id.lower() not in COMPANY_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Company '{request.company_id}' not found.")

    company = COMPANY_REGISTRY[request.company_id.lower()]
    nze = run_engine(company=company, scenario=SCENARIO_REGISTRY["nze_2050"])
    dt  = run_engine(company=company, scenario=SCENARIO_REGISTRY["delayed_transition"])
    cp  = run_engine(company=company, scenario=SCENARIO_REGISTRY["current_policies"])

    report = generate_issb(company, nze, dt, cp, reporting_year=request.reporting_year)
    return DisclosureResponse(**report.to_dict())


@app.post("/reports/csrd", response_model=DisclosureResponse)
def generate_csrd_report(request: DisclosureRequest) -> DisclosureResponse:
    """
    Generate an EU CSRD ESRS E1 climate disclosure data point report.
    Requires Professional tier or above.
    """
    from ..outcomes.tiers import Tier, TierGate
    from ..outcomes.disclosure import generate_csrd

    tier = Tier.from_str(request.tier)
    gate = TierGate(tier)
    if not gate.features.disclosure_csrd:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "EU CSRD reports require Professional or Enterprise tier.",
                **TierGate.upgrade_prompt("disclosure_csrd"),
            },
        )

    if request.company_id.lower() not in COMPANY_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Company '{request.company_id}' not found.")

    company = COMPANY_REGISTRY[request.company_id.lower()]
    nze = run_engine(company=company, scenario=SCENARIO_REGISTRY["nze_2050"])
    dt  = run_engine(company=company, scenario=SCENARIO_REGISTRY["delayed_transition"])
    cp  = run_engine(company=company, scenario=SCENARIO_REGISTRY["current_policies"])

    report = generate_csrd(company, nze, dt, cp, reporting_year=request.reporting_year)
    return DisclosureResponse(**report.to_dict())


@app.post("/reports/physical", response_model=PhysicalHazardReportResponse)
def generate_physical_report(request: PhysicalReportRequest) -> PhysicalHazardReportResponse:
    """
    Generate a standalone Physical Climate Hazard Report.

    This endpoint requires **no financial data** (no EBITDA, WACC, or net debt).
    It is designed for clients who need asset-level physical climate risk assessment
    without a full transition or valuation analysis — e.g. real estate lenders,
    infrastructure operators, insurers, or due-diligence teams assessing a single site.

    Accepts EITHER:
    - `company_id` — runs against a registered seed company.
    - `asset`      — accepts a single inline asset definition (any region, any commodity).

    Returns:
    - Physical risk score (0–100) and label (Low → Critical)
    - 25-year production loss trajectory under NZE, Delayed Transition, and Current Policies
    - Per-hazard loss breakdown at 2035
    - Adaptation capex requirement (cumulative, 25-year)
    - TCFD-aligned narrative summary
    - Data sources and methodology caveats

    No carbon pricing. No DCF. No transition risk. Pure physical hazard output.
    Available from the Analyst tier and above.
    """
    from datetime import datetime, timezone
    from ..data.schemas import (
        Asset, Commodity, Company, EmissionsProfile, Financials,
    )
    from ..outcomes.physical_report import build_physical_report
    from ..operations.company import simulate

    # ── 1. Resolve company ────────────────────────────────────────────────────
    if request.company_id:
        # Use registered company
        cid = request.company_id.lower()
        if cid not in COMPANY_REGISTRY:
            raise HTTPException(
                status_code=404,
                detail=f"Company '{request.company_id}' not found. "
                       f"Available: {list(COMPANY_REGISTRY)}. "
                       f"To run on a custom asset, omit company_id and supply an 'asset' object."
            )
        company = COMPANY_REGISTRY[cid]

    elif request.asset:
        # Build a minimal Company wrapper around the inline asset
        a = request.asset
        try:
            commodity = Commodity(a.commodity.lower())
        except ValueError:
            valid = [c.value for c in Commodity]
            raise HTTPException(
                status_code=422,
                detail=f"Unknown commodity '{a.commodity}'. Valid values: {valid}"
            )

        company = Company(
            id=a.id,
            name=request.company_name or a.name,
            sector="Custom",
            hq_region=a.region,
            financials=Financials(
                # Physical report only — use production × unit cost as proxy revenue
                # Financial fields not used in physical calculations.
                revenue=a.baseline_production * a.baseline_unit_cost,
                ebitda=a.baseline_production * a.baseline_unit_cost * 0.40,
                capex=a.baseline_production * a.baseline_unit_cost * 0.10,
                maintenance_capex_share=0.60,
                tax_rate=0.28,
                wacc_base=0.08,
                net_debt=0.0,
                shares_outstanding=100.0,
                market_cap=a.carrying_value * 3.0,
            ),
            assets=[Asset(
                id=a.id,
                name=a.name,
                commodity=commodity,
                region=a.region,
                baseline_production=a.baseline_production,
                production_unit=a.production_unit,
                baseline_unit_cost=a.baseline_unit_cost,
                energy_cost_share=a.energy_cost_share,
                carrying_value=a.carrying_value,
                remaining_life_years=a.remaining_life_years,
                emissions=EmissionsProfile(
                    # Emissions not required for physical-only report
                    scope1_intensity=0.0,
                    scope2_intensity=0.0,
                    scope3_intensity=0.0,
                    carbon_price_coverage=0.0,
                    free_allocation=0.0,
                ),
            )],
            exposure_weight=0.5,
            transition_weight=0.5,
            data_quality="medium",
        )
    else:
        raise HTTPException(
            status_code=422,
            detail="Supply either 'company_id' (registered company) or "
                   "'asset' (inline asset definition). Both are absent."
        )

    # ── 2. Run physical simulation for all three scenarios ────────────────────
    ops_nze = simulate(company, NZE_2050)
    ops_dly = simulate(company, DELAYED_TRANSITION)
    ops_cp  = simulate(company, CURRENT_POLICIES)

    # ── 3. Build report ───────────────────────────────────────────────────────
    report = build_physical_report(
        company=company,
        ops_nze=ops_nze,
        ops_delayed=ops_dly,
        ops_cp=ops_cp,
    )

    # ── 4. Convert to response ────────────────────────────────────────────────
    def _years(year_list) -> list[HazardYearOut]:
        return [
            HazardYearOut(
                year=y.year,
                physical_loss_cost=y.physical_loss_cost,
                adaptation_capex=y.adaptation_capex,
                physical_loss_by_hazard=y.physical_loss_by_hazard,
                total_loss_fraction=y.total_loss_fraction,
            )
            for y in year_list
        ]

    return PhysicalHazardReportResponse(
        company_id=company.id,
        company_name=company.name,
        run_id=report.run_id,
        model_version=report.model_version,
        generated_at=datetime.now(timezone.utc).isoformat(),
        physical_score=report.physical_score,
        physical_label=report.physical_label,
        peak_loss_year=report.peak_loss_year,
        peak_loss_usd=report.peak_loss_usd,
        peak_loss_hazard=report.peak_loss_hazard,
        total_adaptation_capex_nze=report.total_adaptation_capex_nze,
        total_adaptation_capex_cp=report.total_adaptation_capex_cp,
        hazard_breakdown_2035=report.hazard_breakdown_2035,
        narrative=report.narrative,
        years_nze=_years(report.years_nze),
        years_delayed=_years(report.years_delayed),
        years_cp=_years(report.years_cp),
        data_sources=[
            "IPCC AR6 (2021) — warming trajectories and hazard intensity projections",
            "WRI Aqueduct 4.0 (methodology) — water stress and flood risk regional baselines",
            "NGFS Phase 4 (2023) — climate scenario pathways (NZE, Delayed Transition, Current Policies)",
            "ERA5 / Copernicus Climate Data Store — temperature and precipitation baselines",
            "CRI Engine v0.3.0 — asset-level hazard simulation",
        ],
        caveats=[
            "Physical loss costs are in USD millions, consistent with asset carrying values.",
            "Hazard paths are parameterised regional estimates; they do not incorporate "
            "site-specific GPS-resolved data unless a premium connector is active.",
            "This report does not constitute a financial valuation or insurance assessment.",
            "Adaptation capex estimates are indicative; actual costs depend on asset design "
            "and local engineering factors.",
            "Emissions data is not required for this report. Transition and carbon cost "
            "analysis is excluded. For full CRI assessment use POST /runs/scoped?scope=full_cri.",
        ],
        scenario_set="NGFS Phase 4",
    )


@app.get("/connectors/status")
def connector_status() -> dict:
    """Return the status and data sources available for enrichment."""
    from ..connectors.wri_aqueduct import WRIAqueductConnector
    from ..connectors.ngfs import NGFSConnector
    from ..connectors.owid import OWIDConnector

    ngfs = NGFSConnector()
    return {
        "wri_aqueduct": {
            "status": "active",
            "source": "WRI Aqueduct 4.0",
            "url": "https://aqueduct.wri.org",
            "coverage": "21 major mining/energy regions + lat/lon API",
            "hazards": ["water_stress", "flood_risk", "drought_risk"],
        },
        "ngfs_scenarios": {
            "status": "active",
            "source": "NGFS Phase 4 (2023)",
            "url": "https://www.ngfs.net",
            "scenarios": ngfs.list_scenarios(),
            "carbon_price_range": "$12–$250/tCO2e",
        },
        "nasa_gddp": {
            "status": "active",
            "source": "NASA NEX-GDDP / IPCC AR6 regional proxy",
            "url": "https://www.nccs.nasa.gov/services/data-collections/land-based-products/nex-gddp-cmip6",
            "coverage": "34 regions, 2026–2050",
            "hazards": ["heat_stress"],
        },
        "owid_energy": {
            "status": "active",
            "source": "Our World in Data / IEA WEO 2023-aligned",
            "url": "https://ourworldindata.org/energy",
            "coverage": "9 commodities × 4 scenarios",
            "hazards": ["demand_shift"],
        },
    }
