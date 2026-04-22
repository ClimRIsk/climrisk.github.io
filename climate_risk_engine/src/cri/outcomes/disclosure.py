"""
CRI Financial Disclosure Report Generator (PAID TIER — Professional+).

Generates structured outputs aligned to three major climate disclosure frameworks:

  1. TCFD  — Task Force on Climate-related Financial Disclosures (4 pillars)
  2. ISSB S2 — IFRS Sustainability Standard S2 (Climate-related Disclosures)
  3. EU CSRD E1 — European Sustainability Reporting Standards, Climate topic

Each report is produced as a structured dict which can be:
  - Serialised to JSON for API consumers
  - Rendered to PDF/Word via the reporting layer
  - Embedded in the Next.js dashboard

Framework references:
  - TCFD Final Report (2017), updated Guidance (2021)
  - IFRS S2 (June 2023), issued by ISSB
  - ESRS E1 (EU Commission Delegated Regulation 2023/2772)
"""

from __future__ import annotations

import datetime
from dataclasses import dataclass, field
from typing import Any, Optional

from ..data.schemas import Company, RunResults, ScenarioFamily


# ---------------------------------------------------------------------------
# Shared base
# ---------------------------------------------------------------------------


@dataclass
class DisclosureReport:
    """Base class for all disclosure report types."""

    framework: str
    framework_version: str
    generated_at: str
    company_id: str
    company_name: str
    reporting_year: int
    data_sources: list[str]
    caveats: list[str]
    sections: dict[str, Any]   # framework-specific content

    def to_dict(self) -> dict:
        return {
            "framework": self.framework,
            "framework_version": self.framework_version,
            "generated_at": self.generated_at,
            "company_id": self.company_id,
            "company_name": self.company_name,
            "reporting_year": self.reporting_year,
            "data_sources": self.data_sources,
            "caveats": self.caveats,
            "sections": self.sections,
        }


# ---------------------------------------------------------------------------
# TCFD Report
# ---------------------------------------------------------------------------


@dataclass
class TCFDReport(DisclosureReport):
    """
    TCFD-aligned climate risk disclosure across four pillars:
      1. Governance
      2. Strategy
      3. Risk Management
      4. Metrics & Targets
    """
    pass


def generate_tcfd(
    company: Company,
    nze: RunResults,
    dt: RunResults,
    cp: RunResults,
    reporting_year: int | None = None,
) -> TCFDReport:
    """
    Generate a TCFD-aligned disclosure report from multi-scenario RunResults.

    The output is structured per TCFD's recommended disclosures (2021 Guidance)
    and maps directly to IFRS S2's climate-related disclosures cross-reference table.
    """
    reporting_year = reporting_year or datetime.date.today().year
    now_str = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    def yr(r: RunResults, year: int):
        return next((y for y in r.years if y.year == year), None)

    # ── Governance ──────────────────────────────────────────────────────────
    governance = {
        "board_oversight": {
            "description": (
                "The Board of Directors retains ultimate oversight of climate-related "
                "risks and opportunities. Climate risk is a standing agenda item at "
                "quarterly board meetings. The CRI model outputs are reviewed at least "
                "annually by the Audit & Risk Committee."
            ),
            "recommended_actions": [
                "Embed CRI scenario outputs into Board risk reporting pack",
                "Assign climate KPIs to executive remuneration framework",
                "Establish a dedicated Climate Risk sub-committee at Board level",
            ],
        },
        "management_role": {
            "description": (
                "The Chief Risk Officer (CRO) is responsible for day-to-day management "
                "of climate-related risks. The CRI engine is operated by the Strategy & "
                "Sustainability team and results are escalated to the Executive Committee."
            ),
        },
    }

    # ── Strategy ─────────────────────────────────────────────────────────────
    nze_2026 = yr(nze, 2026)
    nze_2030 = yr(nze, 2030)
    nze_2040 = yr(nze, 2040)
    cp_2026  = yr(cp,  2026)
    cp_2040  = yr(cp,  2040)

    # Revenue trajectory
    def safe_rev(r):
        return round(r.revenue / 1e6, 1) if r else None

    # EV delta
    ev_nze_bn = round(nze.enterprise_value / 1e3, 1)
    ev_dt_bn  = round(dt.enterprise_value / 1e3, 1)
    ev_cp_bn  = round(cp.enterprise_value / 1e3, 1)

    strategy = {
        "scenarios_used": [
            {
                "name": "Net Zero 2050 (NZE)",
                "alignment": "NGFS Phase 4 / IEA NZE 2050",
                "carbon_price_2030_usd_tco2": 130,
                "carbon_price_2050_usd_tco2": 250,
                "temperature_outcome": "~1.5°C by 2100",
                "description": (
                    "Orderly transition: rapid decarbonisation, high carbon price, "
                    "significant demand shift away from fossil fuels."
                ),
            },
            {
                "name": "Delayed Transition",
                "alignment": "NGFS Phase 4 Delayed Transition",
                "carbon_price_2030_usd_tco2": 30,
                "carbon_price_2050_usd_tco2": 180,
                "temperature_outcome": "~1.8–2.0°C by 2100",
                "description": (
                    "Policy action delayed to 2030s, then accelerated; higher physical risk "
                    "accumulates before transition occurs."
                ),
            },
            {
                "name": "Current Policies",
                "alignment": "NGFS Phase 4 Current Policies",
                "carbon_price_2030_usd_tco2": 15,
                "carbon_price_2050_usd_tco2": 35,
                "temperature_outcome": "~3.0–3.5°C by 2100",
                "description": (
                    "No additional climate policy; highest physical risk by mid-century, "
                    "lowest transition cost."
                ),
            },
        ],
        "financial_impacts": {
            "enterprise_value_by_scenario_usd_bn": {
                "nze_2050": ev_nze_bn,
                "delayed_transition": ev_dt_bn,
                "current_policies": ev_cp_bn,
            },
            "ev_at_risk_nze_vs_cp_pct": round(
                (ev_cp_bn - ev_nze_bn) / max(ev_cp_bn, 0.001) * 100, 1
            ) if ev_cp_bn > 0 else None,
            "revenue_2030_usd_m": {
                "nze_2050": safe_rev(nze_2030),
                "current_policies": safe_rev(yr(cp, 2030)),
            },
            "revenue_2040_usd_m": {
                "nze_2050": safe_rev(nze_2040),
                "current_policies": safe_rev(cp_2040),
            },
        },
        "strategic_response": {
            "short_term_2026_2030": [
                "Commission detailed asset-level physical risk audit for highest-exposure sites",
                "Begin MACC (Marginal Abatement Cost Curve) analysis to identify low-cost abatement",
                "Set science-based interim emissions target (SBTi Corporate Standard)",
                "Engage lenders and investors on climate transition plan",
            ],
            "medium_term_2031_2040": [
                "Divest or wind down high-carbon assets with remaining life > 15 years",
                "Capital allocation: redirect maintenance capex toward green alternatives",
                "Achieve at minimum 40% Scope 1+2 reduction vs 2025 baseline",
                "Publish annual TCFD-aligned report with CRI model outputs",
            ],
            "long_term_2041_2050": [
                "Achieve net-zero Scope 1+2 by 2050 (Paris-aligned)",
                "Report Scope 3 reduction trajectory and engagement with supply chain",
                "Maintain physical risk adaptation capex ≥ 1.5% of annual revenue",
            ],
        },
    }

    # ── Risk Management ──────────────────────────────────────────────────────
    # EBITDA compression under NZE
    ebitda_2026 = nze_2026.ebitda if nze_2026 else None
    ebitda_2030 = nze_2030.ebitda if nze_2030 else None
    compression_2030_pct = None
    if ebitda_2026 and ebitda_2030 and ebitda_2026 > 0:
        compression_2030_pct = round((ebitda_2026 - ebitda_2030) / ebitda_2026 * 100, 1)

    carbon_cost_2030_m = round(nze_2030.carbon_cost / 1e6, 1) if nze_2030 else None
    physical_loss_2030_m = round(nze_2030.physical_loss_cost / 1e6, 1) if nze_2030 else None

    risk_management = {
        "identification_process": (
            "Climate-related risks are identified annually through the CRI engine, "
            "which integrates open-source data from WRI Aqueduct (water/flood/drought), "
            "NASA NEX-GDDP (heat stress), NGFS Phase 4 (transition/carbon prices), "
            "and IEA/OWID demand indices. Asset-level physical risk is assessed against "
            "21 major producing regions."
        ),
        "assessment_methodology": {
            "physical_risk": "WRI Aqueduct 4.0 + NASA NEX-GDDP CMIP6 regional proxies; joint hazard aggregation",
            "transition_risk": "NGFS Phase 4 carbon price paths + IEA WEO demand scenarios",
            "financial_risk": "Climate-adjusted DCF with scenario risk premium on WACC",
            "horizon": "2026–2050 (annual)",
        },
        "quantified_risks": {
            "carbon_cost_2030_usd_m_nze": carbon_cost_2030_m,
            "physical_loss_cost_2030_usd_m_nze": physical_loss_2030_m,
            "ebitda_compression_2030_pct_nze": compression_2030_pct,
            "wacc_uplift_nze_vs_cp_pp": round((nze.wacc_used - cp.wacc_used) * 100, 2),
        },
        "integration": (
            "CRI outputs are integrated into the enterprise risk register, "
            "capital planning processes, and lender/investor communications. "
            "Material risks above the $50M threshold are escalated to the Board."
        ),
    }

    # ── Metrics & Targets ───────────────────────────────────────────────────
    # Emission totals from year results
    def emission_sum(r: RunResults, year: int, scope: str) -> Optional[float]:
        y = yr(r, year)
        if y is None:
            return None
        scope_key = {"scope1": "scope_1", "scope2": "scope_2", "scope3": "scope_3"}.get(scope, scope)
        return round(y.emissions_by_scope.get(scope_key, 0.0), 0)

    metrics = {
        "emissions": {
            "description": "tCO2e, derived from CRI engine using asset-level intensity factors",
            "scope_1_2026": emission_sum(cp, 2026, "scope1"),
            "scope_2_2026": emission_sum(cp, 2026, "scope2"),
            "scope_3_2026": emission_sum(cp, 2026, "scope3"),
            "scope_1_2030_nze": emission_sum(nze, 2030, "scope1"),
            "scope_1_2030_cp":  emission_sum(cp,  2030, "scope1"),
        },
        "carbon_intensity": {
            "description": "tCO2e per USD million revenue",
            "baseline_2026": None,   # to be populated from company data
        },
        "targets": [
            {
                "target": "Net-zero Scope 1+2 by 2050",
                "interim_2030": "30% reduction vs 2025 baseline",
                "interim_2035": "50% reduction vs 2025 baseline",
                "framework": "SBTi / Paris-aligned",
                "status": "To be validated against SBTi Corporate Standard",
            },
        ],
        "climate_related_opportunities": [
            "Low-carbon product lines (copper, lithium, nickel for EV supply chain)",
            "Carbon capture and storage (CCS) investment opportunities",
            "Green hydrogen partnerships in existing energy infrastructure",
            "Renewable energy self-supply to reduce Scope 2 exposure",
        ],
    }

    sections = {
        "governance": governance,
        "strategy": strategy,
        "risk_management": risk_management,
        "metrics_and_targets": metrics,
    }

    caveats = [
        "This report is generated by the CRI Climate Risk Intelligence engine using open-source data proxies. "
        "It should be reviewed by qualified climate risk professionals before use in regulatory filings.",
        "Emission intensities are based on asset-level estimates and should be verified against company GHG inventory.",
        "Scenario outputs represent modelled projections and are subject to model uncertainty.",
        "NGFS scenarios represent illustrative pathways; actual outcomes will differ.",
    ]

    return TCFDReport(
        framework="TCFD",
        framework_version="2021 Guidance",
        generated_at=now_str,
        company_id=company.id,
        company_name=company.name,
        reporting_year=reporting_year,
        data_sources=[
            "WRI Aqueduct 4.0",
            "NGFS Phase 4 (2023)",
            "NASA NEX-GDDP / IPCC AR6",
            "IEA World Energy Outlook 2023 (via OWID)",
            "Company-provided financial data",
        ],
        caveats=caveats,
        sections=sections,
    )


# ---------------------------------------------------------------------------
# ISSB S2 Report
# ---------------------------------------------------------------------------


@dataclass
class ISSBReport(DisclosureReport):
    """IFRS S2 Climate-related Disclosures (ISSB, June 2023)."""
    pass


def generate_issb(
    company: Company,
    nze: RunResults,
    dt: RunResults,
    cp: RunResults,
    reporting_year: int | None = None,
) -> ISSBReport:
    """
    Generate IFRS S2-aligned disclosure metrics.

    IFRS S2 requires disclosures across:
      - Governance (paragraphs 6–9)
      - Strategy (paragraphs 10–25)
      - Risk Management (paragraphs 26–28)
      - Metrics & Targets (paragraphs 29–37, including cross-industry metrics)
    """
    reporting_year = reporting_year or datetime.date.today().year
    now_str = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    def yr(r: RunResults, year: int):
        return next((y for y in r.years if y.year == year), None)

    cp_2026 = yr(cp, 2026)
    nze_2030 = yr(nze, 2030)

    # Cross-industry climate-related metric categories (IFRS S2 App B)
    cross_industry_metrics = {
        "GHG_emissions": {
            "standard_ref": "IFRS S2 B14–B25",
            "scope_1_tco2e": round(cp_2026.emissions_by_scope.get("scope_1", 0), 0) if cp_2026 else None,
            "scope_2_location_tco2e": round(cp_2026.emissions_by_scope.get("scope_2", 0), 0) if cp_2026 else None,
            "scope_3_tco2e": round(cp_2026.emissions_by_scope.get("scope_3", 0), 0) if cp_2026 else None,
            "ghg_protocol_alignment": "GHG Protocol Corporate Accounting and Reporting Standard",
            "methodology_notes": "Asset-level intensity factors applied to production volumes",
        },
        "transition_risks": {
            "standard_ref": "IFRS S2 B26–B27",
            "carbon_price_exposure_2030_usd_m": round(nze_2030.carbon_cost / 1e6, 1) if nze_2030 else None,
            "revenue_from_high_carbon_products_pct": _revenue_carbon_intensity(company, nze),
            "capex_in_low_carbon_usd_m": round(
                sum(y.transition_capex for y in nze.years[:5]) / 1e6, 1
            ),
        },
        "physical_risks": {
            "standard_ref": "IFRS S2 B28–B29",
            "assets_in_high_risk_regions_pct": _assets_in_high_risk(company),
            "annual_physical_loss_cost_2030_usd_m": round(
                nze_2030.physical_loss_cost / 1e6, 1
            ) if nze_2030 else None,
            "adaptation_capex_planned_usd_m": round(
                sum(y.adaptation_capex for y in nze.years[:5]) / 1e6, 1
            ),
        },
        "climate_related_opportunities": {
            "standard_ref": "IFRS S2 B30",
            "revenue_from_low_carbon_products_usd_m": None,  # requires company data
            "description": "Low-carbon commodity exposure (copper, nickel, lithium) identified in asset mix",
        },
        "capital_deployment": {
            "standard_ref": "IFRS S2 B31",
            "climate_related_capex_usd_m": round(
                sum(y.adaptation_capex + y.transition_capex for y in nze.years[:5]) / 1e6, 1
            ),
            "climate_related_opex_usd_m": round(
                sum(y.carbon_cost for y in nze.years[:5]) / 1e6, 1
            ),
        },
        "internal_carbon_price": {
            "standard_ref": "IFRS S2 B32",
            "price_usd_tco2e": None,   # requires company confirmation
            "description": "Recommend adopting a shadow carbon price ≥ $80/tCO2e for investment decisions",
        },
        "remuneration": {
            "standard_ref": "IFRS S2 B33",
            "climate_linked_remuneration": False,   # company to confirm
            "description": "CRI recommends linking 15–20% of executive incentives to climate KPIs",
        },
    }

    # Financial effects
    ev_nze = round(nze.enterprise_value / 1e3, 1)
    ev_cp  = round(cp.enterprise_value / 1e3, 1)

    financial_effects = {
        "standard_ref": "IFRS S2 10–25",
        "scenario_analysis": {
            "scenarios_used": ["Net Zero 2050", "Delayed Transition", "Current Policies"],
            "alignment": "NGFS Phase 4 (2023)",
            "enterprise_value_nze_usd_bn": ev_nze,
            "enterprise_value_cp_usd_bn": ev_cp,
            "ev_sensitivity_range_pct": round(
                abs(ev_cp - ev_nze) / max(ev_cp, 0.001) * 100, 1
            ),
            "wacc_nze": round(nze.wacc_used * 100, 2),
            "wacc_cp":  round(cp.wacc_used * 100, 2),
        },
        "time_horizons": {
            "short_term": "2026–2030",
            "medium_term": "2031–2040",
            "long_term": "2041–2050",
        },
    }

    sections = {
        "cross_industry_metrics": cross_industry_metrics,
        "financial_effects": financial_effects,
        "industry_specific_metrics": {
            "note": (
                "Industry-specific metrics (e.g., mining: ore grade, water intensity; "
                "oil & gas: reserve replacement ratio under IEA scenarios) should be "
                "added based on applicable IFRS S2 industry guidance."
            ),
        },
    }

    caveats = [
        "IFRS S2 is effective for annual reporting periods beginning on or after 1 January 2024.",
        "Certain jurisdictions have adopted with modifications — verify local requirements.",
        "Scope 3 emissions are estimated using sector-average intensity factors; company-specific inventory required.",
        "This output assists disclosure preparation and is not a substitute for professional assurance.",
    ]

    return ISSBReport(
        framework="IFRS S2",
        framework_version="June 2023",
        generated_at=now_str,
        company_id=company.id,
        company_name=company.name,
        reporting_year=reporting_year,
        data_sources=[
            "WRI Aqueduct 4.0", "NGFS Phase 4", "NASA NEX-GDDP",
            "IEA WEO 2023", "GHG Protocol",
        ],
        caveats=caveats,
        sections=sections,
    )


# ---------------------------------------------------------------------------
# EU CSRD E1 Report
# ---------------------------------------------------------------------------


@dataclass
class CSRDReport(DisclosureReport):
    """
    EU CSRD ESRS E1 — Climate Change disclosure.

    Covers ESRS E1 mandatory data points (Commission Delegated Regulation 2023/2772):
      E1-1  Transition plan
      E1-2  Physical & transition risk policies
      E1-3  Actions and resources
      E1-4  Targets
      E1-5  Energy consumption and mix
      E1-6  Gross GHG emissions (Scope 1, 2, 3)
      E1-7  GHG removals and carbon credits
      E1-8  Internal carbon price
      E1-9  Financial effects of climate-related risks and opportunities
    """
    pass


def generate_csrd(
    company: Company,
    nze: RunResults,
    dt: RunResults,
    cp: RunResults,
    reporting_year: int | None = None,
) -> CSRDReport:
    """Generate an ESRS E1-aligned CSRD climate disclosure."""
    reporting_year = reporting_year or datetime.date.today().year
    now_str = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    def yr(r: RunResults, year: int):
        return next((y for y in r.years if y.year == year), None)

    cp_2026 = yr(cp, 2026)
    nze_2030 = yr(nze, 2030)
    nze_2035 = yr(nze, 2035)

    def emissions_2026(scope_key: str) -> Optional[float]:
        if cp_2026:
            return round(cp_2026.emissions_by_scope.get(scope_key, 0.0), 0)
        return None

    sections = {
        "E1-1_transition_plan": {
            "esrs_ref": "ESRS E1-1",
            "has_transition_plan": False,   # company to confirm
            "target_net_zero": "2050",
            "interim_targets": [
                {"year": 2030, "reduction_pct": 30, "vs_baseline": 2025},
                {"year": 2035, "reduction_pct": 50, "vs_baseline": 2025},
            ],
            "decarbonisation_levers": [
                "Asset-level energy efficiency investments",
                "Renewable energy procurement (Scope 2 reduction)",
                "Supply chain engagement (Scope 3)",
                "Transition capex allocation toward low-carbon commodities",
            ],
            "locked_in_emissions_note": (
                "Remaining asset life analysis required to identify locked-in emissions "
                "from existing infrastructure. CRI model provides carrying value by asset."
            ),
        },
        "E1-2_policies": {
            "esrs_ref": "ESRS E1-2",
            "climate_policy_exists": False,  # company to confirm
            "recommended_policies": [
                "Board-level climate risk policy",
                "Shadow carbon price for investment decisions (≥$80/tCO2e)",
                "Asset retirement policy triggered by 1.5°C-incompatibility",
                "Water use reduction policy for high water-stress assets",
            ],
        },
        "E1-3_actions": {
            "esrs_ref": "ESRS E1-3",
            "planned_adaptation_capex_5yr_usd_m": round(
                sum(y.adaptation_capex for y in nze.years[:5]) / 1e6, 1
            ),
            "planned_transition_capex_5yr_usd_m": round(
                sum(y.transition_capex for y in nze.years[:5]) / 1e6, 1
            ),
        },
        "E1-4_targets": {
            "esrs_ref": "ESRS E1-4",
            "ghg_targets": [
                {
                    "scope": "Scope 1+2",
                    "target_year": 2035,
                    "reduction_pct_vs_2025": 50,
                    "framework": "SBTi / 1.5°C pathway",
                    "validation_status": "Pending SBTi validation",
                },
                {
                    "scope": "Scope 1+2",
                    "target_year": 2050,
                    "reduction_pct_vs_2025": 100,
                    "framework": "Net Zero",
                    "validation_status": "Committed",
                },
            ],
        },
        "E1-5_energy": {
            "esrs_ref": "ESRS E1-5",
            "note": (
                "Energy consumption data (MWh) requires company ERP / metering data. "
                "CRI model provides carbon cost and emission proxies; energy mix detail "
                "should be sourced from company energy management system."
            ),
        },
        "E1-6_ghg_emissions": {
            "esrs_ref": "ESRS E1-6",
            "base_year": reporting_year,
            "scope_1_gross_tco2e": emissions_2026("scope_1"),
            "scope_2_location_tco2e": emissions_2026("scope_2"),
            "scope_2_market_tco2e": None,   # requires RECs / PPA data
            "scope_3_total_tco2e": emissions_2026("scope_3"),
            "scope_3_categories_note": (
                "Scope 3 covers Category 1 (purchased goods/services) and "
                "Category 11 (use of sold products). Other categories require "
                "supply chain data collection."
            ),
            "ghg_protocol_alignment": True,
        },
        "E1-7_removals_credits": {
            "esrs_ref": "ESRS E1-7",
            "ghg_removals_tco2e": None,
            "carbon_credits_retired": None,
            "note": "Carbon credit usage should be reported separately from operational emission reductions.",
        },
        "E1-8_internal_carbon_price": {
            "esrs_ref": "ESRS E1-8",
            "uses_internal_price": False,
            "recommended_price_usd_tco2e": 80,
            "recommended_price_rationale": (
                "Aligned with IEA APS shadow price for advanced economies; "
                "covers investment horizon to 2035."
            ),
        },
        "E1-9_financial_effects": {
            "esrs_ref": "ESRS E1-9",
            "transition_risks": {
                "carbon_cost_2030_usd_m_nze": round(nze_2030.carbon_cost / 1e6, 1) if nze_2030 else None,
                "revenue_at_risk_nze_2030_usd_m": round(
                    (yr(cp, 2030).revenue - nze_2030.revenue) / 1e6, 1
                ) if (yr(cp, 2030) and nze_2030) else None,
            },
            "physical_risks": {
                "physical_loss_2030_usd_m_nze": round(nze_2030.physical_loss_cost / 1e6, 1) if nze_2030 else None,
                "adaptation_capex_5yr_usd_m": round(
                    sum(y.adaptation_capex for y in nze.years[:5]) / 1e6, 1
                ),
            },
            "ev_sensitivity_usd_bn": {
                "nze_2050": round(nze.enterprise_value / 1e3, 1),
                "delayed_transition": round(dt.enterprise_value / 1e3, 1),
                "current_policies": round(cp.enterprise_value / 1e3, 1),
            },
            "anticipates_material_financial_effects": True,
            "materiality_note": (
                "Based on CRI model outputs, climate-related risks are assessed as "
                "financially material. The company should perform a formal double "
                "materiality assessment per ESRS 1 paragraphs 43–67."
            ),
        },
    }

    caveats = [
        "ESRS E1 applies to companies in scope of EU CSRD (large PIEs from FY2024, others phased).",
        "This output is a model-based disclosure template and requires company validation of all data points.",
        "Double materiality assessment (impact + financial) must be performed per ESRS 1 before filing.",
        "Energy consumption data (E1-5) must be sourced from company systems — not modelled here.",
    ]

    return CSRDReport(
        framework="EU CSRD ESRS E1",
        framework_version="Commission Delegated Regulation 2023/2772",
        generated_at=now_str,
        company_id=company.id,
        company_name=company.name,
        reporting_year=reporting_year,
        data_sources=[
            "WRI Aqueduct 4.0", "NGFS Phase 4", "NASA NEX-GDDP",
            "IEA WEO 2023", "GHG Protocol", "ESRS E1 Framework",
        ],
        caveats=caveats,
        sections=sections,
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _revenue_carbon_intensity(company: Company, r: RunResults) -> Optional[float]:
    """
    Estimate % of revenue from high-carbon products (coal, oil, gas).
    Returns as a percentage (0–100).
    """
    from ..data.schemas import Commodity
    high_carbon = {Commodity.COAL_THERMAL, Commodity.COAL_METALLURGICAL,
                   Commodity.CRUDE_OIL, Commodity.NATURAL_GAS, Commodity.REFINED_PRODUCTS}
    if not r.years:
        return None
    y0 = r.years[0]
    total_rev = sum(y0.revenue_by_commodity.values())
    if total_rev <= 0:
        return None
    hc_rev = sum(
        v for k, v in y0.revenue_by_commodity.items()
        if any(hc.value in k.lower() for hc in high_carbon)
    )
    return round(hc_rev / total_rev * 100, 1)


def _assets_in_high_risk(company: Company) -> Optional[float]:
    """
    Estimate % of assets (by carrying value) in high physical-risk regions.
    High-risk: AU-WA, AU-QLD, CL-02, ZA, IN-MH (from WRI Aqueduct benchmarks).
    """
    HIGH_RISK_REGIONS = {"AU-WA", "AU-QLD", "CL-02", "ZA", "IN-MH", "CN-NM", "MN"}
    total_cv = sum(a.carrying_value for a in company.assets)
    if total_cv <= 0:
        return None
    hr_cv = sum(a.carrying_value for a in company.assets if a.region in HIGH_RISK_REGIONS)
    return round(hr_cv / total_cv * 100, 1)
