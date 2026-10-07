"""
ClimRisk — PDF Report Generator (ESRS E1-9)
Produces a human-readable PDF using WeasyPrint (HTML→PDF pipeline).
"""

from __future__ import annotations

import logging
import os
import tempfile
from typing import Any

logger = logging.getLogger("climrisk.csrd.pdf")


class PDFGenerator:
    def generate(
        self,
        client_id: str,
        report_id: str,
        var_results: list[dict],
        xbrl_payload: dict,
        output_dir: str = "/tmp/climrisk_reports",
    ) -> str:
        """
        Render an ESRS E1-9 PDF report.
        Returns the path to the generated PDF file.
        """
        os.makedirs(output_dir, exist_ok=True)
        out_path = os.path.join(output_dir, f"{client_id}_{report_id}.pdf")

        try:
            from weasyprint import HTML
            html_content = self._render_html(client_id, report_id, var_results, xbrl_payload)
            HTML(string=html_content).write_pdf(out_path)
            logger.info("pdf.generated path=%s", out_path)
        except ImportError:
            logger.warning("weasyprint not installed — writing HTML fallback")
            out_path = out_path.replace(".pdf", ".html")
            html_content = self._render_html(client_id, report_id, var_results, xbrl_payload)
            with open(out_path, "w") as f:
                f.write(html_content)

        return out_path

    def _render_html(
        self, client_id: str, report_id: str, var_results: list[dict], xbrl: dict
    ) -> str:
        import datetime
        effects = xbrl.get("esrs:E1-9-FinancialEffects", {})
        worst_var = effects.get("esrs:GrossValueAtRisk", {}).get("value", 0)
        eal = effects.get("esrs:ExpectedAnnualLoss", {}).get("value", 0)
        total = effects.get("esrs:TotalAssetsEvaluated", {}).get("value", 0)
        material = effects.get("esrs:AssetsAtMaterialRisk", {}).get("value", 0)
        currency = xbrl.get("reportMetadata", {}).get("currency", "USD")

        rows = "".join(
            f"<tr><td>{r['scenario']}</td><td>{r['horizon_year']}</td>"
            f"<td>${r.get('gross_value_at_risk_usd',0):,.0f}</td>"
            f"<td>${r.get('expected_annual_loss_usd',0):,.0f}</td>"
            f"<td>{r.get('assets_at_material_risk_usd',0)/max(r.get('total_assets_evaluated_usd',1),1)*100:.1f}%</td>"
            "</tr>"
            for r in sorted(var_results, key=lambda x: (x.get("scenario",""), x.get("horizon_year",0)))
        )

        return f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body {{ font-family: Arial, sans-serif; font-size: 11px; color: #1a1a2e; margin: 40px; }}
  h1   {{ font-size: 20px; color: #1d3557; border-bottom: 2px solid #1d3557; padding-bottom: 8px; }}
  h2   {{ font-size: 14px; color: #457b9d; margin-top: 24px; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
  th   {{ background: #1d3557; color: white; padding: 6px 10px; text-align: left; font-size: 10px; }}
  td   {{ border: 1px solid #e0e0e0; padding: 5px 10px; }}
  tr:nth-child(even) {{ background: #f5f8ff; }}
  .kpi {{ display: inline-block; background: #f0f4ff; border: 1px solid #c5d5f0;
          border-radius: 6px; padding: 10px 16px; margin: 6px; min-width: 140px; }}
  .kpi-val {{ font-size: 18px; font-weight: bold; color: #1d3557; }}
  .kpi-lbl {{ font-size: 9px; color: #666; }}
  .warn {{ color: #b91c1c; font-weight: bold; }}
  footer {{ margin-top: 40px; font-size: 9px; color: #888; border-top: 1px solid #ddd; padding-top: 8px; }}
</style>
</head><body>
  <h1>ClimRisk.io — ESRS E1-9 Physical Climate Risk Report</h1>
  <p><strong>Client:</strong> {client_id} &nbsp;|&nbsp;
     <strong>Report ID:</strong> {report_id} &nbsp;|&nbsp;
     <strong>Generated:</strong> {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</p>

  <h2>Key Financial Effects (ESRS E1-9 §73)</h2>
  <div>
    <div class="kpi"><div class="kpi-val">{currency} {total/1e6:.1f}M</div><div class="kpi-lbl">Total Assets Evaluated</div></div>
    <div class="kpi"><div class="kpi-val warn">{currency} {worst_var/1e6:.1f}M</div><div class="kpi-lbl">Gross Value at Risk (worst-case)</div></div>
    <div class="kpi"><div class="kpi-val">{currency} {eal/1e6:.1f}M</div><div class="kpi-lbl">Expected Annual Loss</div></div>
    <div class="kpi"><div class="kpi-val">{currency} {material/1e6:.1f}M</div><div class="kpi-lbl">Assets at Material Risk</div></div>
  </div>

  <h2>Scenario Analysis (ESRS E1-9 §76)</h2>
  <table>
    <thead><tr><th>Scenario</th><th>Horizon Year</th><th>Gross VaR ({currency})</th>
    <th>Expected Annual Loss ({currency})</th><th>% Portfolio at Material Risk</th></tr></thead>
    <tbody>{rows}</tbody>
  </table>

  <h2>Methodology Disclosure (ESRS E1-9 §82)</h2>
  <ul>
    <li><strong>Hazard model:</strong> IPCC AR6 WGI + WRI Aqueduct 4.0 + ClimRisk 25-hazard engine</li>
    <li><strong>Scenarios:</strong> SSP1-2.6 (Net Zero), SSP2-4.5 (Stated Policies), SSP3-7.0, SSP5-8.5 (BAU)</li>
    <li><strong>Financial translation:</strong> NGFS Phase 4 (2023) sector damage functions</li>
    <li><strong>Gross VaR:</strong> Expected Annual Loss × 25-year exceedance period</li>
    <li><strong>Uncertainty:</strong> P50 ensemble; ±30-50% deviation depending on local adaptation</li>
  </ul>

  <footer>
    This report was generated by ClimRisk.io and conforms to EFRAG ESRS E1 Final Standard (July 2023).
    It does not constitute financial advice. Figures should be independently verified before regulatory submission.
    XBRL-tagged machine-readable version available via /reports/{client_id}/{report_id}/xbrl
  </footer>
</body></html>"""
