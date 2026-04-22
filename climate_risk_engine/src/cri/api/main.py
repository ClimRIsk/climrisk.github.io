"""FastAPI REST API for the Climate Risk Intelligence engine."""

from __future__ import annotations

import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ..data.companies_seed import all_seed as get_all_companies
from ..engine.orchestrator import run as run_engine
from ..scenarios import (
    CURRENT_POLICIES,
    DELAYED_TRANSITION,
    NZE_2050,
)
from .schemas import (
    CompanyResponse,
    DisclosureRequest,
    DisclosureResponse,
    HealthResponse,
    RatingRequest,
    RatingResponse,
    RunRequest,
    RunResponse,
    ScenarioResponse,
    TierInfo,
    TiersResponse,
)


# Initialize FastAPI app
app = FastAPI(
    title="Climate Risk Intelligence API",
    description="REST API for climate financial risk modelling",
    version="0.1.0",
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


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(status="ok", version="0.1.0")


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
    # Validate company_id
    if request.company_id.lower() not in COMPANY_REGISTRY:
        raise HTTPException(
            status_code=404,
            detail=f"Company '{request.company_id}' not found. "
            f"Available: {list(COMPANY_REGISTRY.keys())}",
        )

    # Validate scenario_id
    if request.scenario_id.lower() not in SCENARIO_REGISTRY:
        raise HTTPException(
            status_code=404,
            detail=f"Scenario '{request.scenario_id}' not found. "
            f"Available: {list(SCENARIO_REGISTRY.keys())}",
        )

    # Get company and scenario
    company = COMPANY_REGISTRY[request.company_id.lower()]
    scenario = SCENARIO_REGISTRY[request.scenario_id.lower()]

    # Run the engine
    results = run_engine(company=company, scenario=scenario)

    return RunResponse(**results.model_dump())


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
    from ..outcomes.ratings import RatingEngine
    from ..outcomes.tiers import Tier, TierGate

    if request.company_id.lower() not in COMPANY_REGISTRY:
        raise HTTPException(
            status_code=404,
            detail=f"Company '{request.company_id}' not found.",
        )

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
    )

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
