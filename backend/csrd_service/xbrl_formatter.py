"""
ClimRisk — XBRL / ESRS E1-9 Formatter

Produces XBRL-tagged JSON conforming to EFRAG ESRS E1 taxonomy (2024).
The output can be submitted to EU regulators directly or converted to
iXBRL via standard XBRL tooling.

ESRS E1-9 mandatory disclosures covered:
  E1-9-1: Financial effects of physical climate risks on asset values
  E1-9-2: Gross VaR breakdown by hazard type and scenario
  E1-9-3: Time horizon analysis (2030 / 2040 / 2050)
  E1-9-4: Uninsurable / hard-to-insure asset identification

Reference: EFRAG ESRS E1 Final Standard July 2023 §73-82
"""

from __future__ import annotations

import datetime
from typing import Any


# EFRAG ESRS E1 taxonomy namespace
_ESRS_NS = "https://xbrl.efrag.org/taxonomy/esrs/e1"
_ESRS_VERSION = "2024-01-01"


class XBRLFormatter:
    """
    Converts VaR engine output to XBRL-tagged JSON (ESRS E1-9 structure).
    The JSON schema mirrors the iXBRL data model for easy ingestion
    by reporting tools (Workiva, Certent, Diligent).
    """

    def format(
        self,
        client_id: str,
        report_id: str,
        var_results: list[dict],   # one entry per scenario × horizon_year
        reporting_period: str = "",
        company_name: str = "",
        currency: str = "USD",
    ) -> dict[str, Any]:
        """
        Produce the ESRS E1-9 XBRL-tagged JSON payload.
        """
        if not reporting_period:
            reporting_period = f"{datetime.date.today().year - 1}-12-31"

        # Aggregate across scenarios to find worst-case for primary disclosure
        worst = self._worst_case(var_results)

        payload = {
            "@context": {
                "esrs": _ESRS_NS,
                "xbrli": "http://www.xbrl.org/2003/instance",
            },
            "documentType": "ESRS-E1-9-Financial-Effects",
            "taxonomyVersion": _ESRS_VERSION,
            "reportMetadata": {
                "entityIdentifier": client_id,
                "reportId": report_id,
                "reportingPeriodEnd": reporting_period,
                "currency": currency,
                "companyName": company_name,
                "generatedAt": datetime.datetime.utcnow().isoformat() + "Z",
                "generatedBy": "ClimRisk.io CSRD Reporting Service v1.0",
            },

            # E1-9-1: Primary financial effects disclosure
            "esrs:E1-9-FinancialEffects": {
                "esrs:TotalAssetsEvaluated": {
                    "value": worst.get("total_assets_evaluated_usd", 0),
                    "decimals": -3,
                    "unit": currency,
                    "xbrli:periodType": "instant",
                },
                "esrs:AssetsAtMaterialRisk": {
                    "value": worst.get("assets_at_material_risk_usd", 0),
                    "decimals": -3,
                    "unit": currency,
                },
                "esrs:GrossValueAtRisk": {
                    "value": worst.get("gross_value_at_risk_usd", 0),
                    "decimals": -3,
                    "unit": currency,
                    "esrs:scenario": worst.get("scenario"),
                    "esrs:horizonYear": worst.get("horizon_year"),
                },
                "esrs:ExpectedAnnualLoss": {
                    "value": worst.get("expected_annual_loss_usd", 0),
                    "decimals": -3,
                    "unit": currency,
                },
                "esrs:PhysicalRiskVaR": {
                    "value": worst.get("physical_risk_var_usd", 0),
                    "decimals": -3,
                    "unit": currency,
                },
                "esrs:TransitionRiskVaR": {
                    "value": worst.get("transition_risk_var_usd", 0),
                    "decimals": -3,
                    "unit": currency,
                },
                "esrs:StrandedAssetValue": {
                    "value": worst.get("stranded_asset_value_usd", 0),
                    "decimals": -3,
                    "unit": currency,
                },
                "esrs:InsuredPercentage": {
                    "value": round(worst.get("insured_percentage", 0) * 100, 1),
                    "unit": "percent",
                },
            },

            # E1-9-2: Scenario breakdown
            "esrs:E1-9-ScenarioAnalysis": [
                {
                    "esrs:ClimateScenario": r["scenario"],
                    "esrs:HorizonYear": r["horizon_year"],
                    "esrs:GrossValueAtRisk": r.get("gross_value_at_risk_usd", 0),
                    "esrs:ExpectedAnnualLoss": r.get("expected_annual_loss_usd", 0),
                    "esrs:MaterialRiskPercentage": round(
                        r.get("assets_at_material_risk_usd", 0) /
                        max(r.get("total_assets_evaluated_usd", 1), 1) * 100, 1
                    ),
                }
                for r in var_results
            ],

            # E1-9-4: Uninsurable assets
            "esrs:E1-9-UninsurableAssets": {
                "esrs:UninsurableAssetValue": worst.get("stranded_asset_value_usd", 0),
                "esrs:UninsurableAssetCount": sum(
                    1 for a in worst.get("asset_breakdown", []) if a.get("is_uninsurable")
                ),
                "esrs:AssetsAtCriticalRisk": [
                    {
                        "esrs:AssetId": a["asset_id"],
                        "esrs:BookValue": a["book_value_usd"],
                        "esrs:VaRTier": a["var_tier"],
                        "esrs:DominantHazard": a["dominant_hazard"],
                        "esrs:MaxSeverityScore": a["max_severity"],
                    }
                    for a in worst.get("asset_breakdown", [])
                    if a.get("var_tier") in ("high", "critical")
                ],
            },

            # Methodology disclosure (ESRS E1-9 §82)
            "esrs:MethodologyDisclosure": {
                "physicalHazardModel": "IPCC AR6 WGI + WRI Aqueduct 4.0 + CRI 25-hazard engine",
                "scenariosApplied": list({r["scenario"] for r in var_results}),
                "financialTranslation": "NGFS Phase 4 2023 sector damage functions",
                "grossVaRMethodology": "Expected Annual Loss × 25-year exceedance period",
                "insureabilityClassification": "Swiss Re Sigma 2023 — severity threshold 0.65",
                "uncertaintyNote": (
                    "Physical risk projections represent ensemble medians (P50). "
                    "Actual outcomes may deviate ±30-50% depending on adaptation measures "
                    "and local microclimate variability."
                ),
            },
        }

        return payload

    @staticmethod
    def _worst_case(var_results: list[dict]) -> dict:
        """Return the scenario × year with highest gross VaR (worst case for ESRS primary disclosure)."""
        if not var_results:
            return {}
        return max(var_results, key=lambda r: r.get("gross_value_at_risk_usd", 0))
