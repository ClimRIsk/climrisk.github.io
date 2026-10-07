"""
ClimRisk — CSRD Reporting Service (ESRS E1-9)

  • Consumes climrisk.hazard.intersected from Kafka
  • Aggregates scores across all scenarios + years to compute Gross VaR
  • Formats XBRL-tagged JSON and PDF outputs to ESRS E1-9 standard
  • Stores report state in MongoDB (document-oriented, schema-flexible)
  • Publishes climrisk.report.csrd_e1_ready when report is complete
"""

from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

from .var_engine import GrossVaREngine
from .xbrl_formatter import XBRLFormatter
from .pdf_generator import PDFGenerator
from .mongodb import ReportRepository
from .kafka_handlers import CSRDKafkaHandler
from ..shared.schemas import SSPScenario, TOPICS

logger = logging.getLogger("climrisk.csrd_service")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    repo = ReportRepository(mongo_url=os.environ["MONGO_URL"])
    await repo.connect()

    var_engine = GrossVaREngine()
    xbrl = XBRLFormatter()
    pdf = PDFGenerator()

    handler = CSRDKafkaHandler(
        repo=repo, var_engine=var_engine, xbrl=xbrl, pdf=pdf,
        kafka_bootstrap=os.getenv("KAFKA_BOOTSTRAP", "kafka:29092"),
    )
    task = asyncio.create_task(handler.run())
    app.state.repo = repo
    app.state.var_engine = var_engine
    app.state.task = task
    logger.info("csrd_service.started")
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    await repo.disconnect()


app = FastAPI(
    title="ClimRisk CSRD Reporting Service",
    description="ESRS E1-9 Gross VaR computation + XBRL / PDF output",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "csrd_service"}


# ── Report endpoints ──────────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    client_id: str
    scenarios: list[SSPScenario] = [SSPScenario.SSP245, SSPScenario.SSP585]
    horizon_year: int = 2035
    reporting_framework: str = "ESRS E1-9"


@app.post("/reports", status_code=202)
async def request_report(req: ReportRequest):
    """
    Trigger a CSRD E1-9 report for a client.
    Report is generated async; poll /reports/{client_id} for status.
    """
    repo: ReportRepository = app.state.repo
    report_id = await repo.create_report_job(req.model_dump())
    return {"report_id": report_id, "status": "pending"}


@app.get("/reports/{client_id}")
async def get_reports(client_id: str):
    repo: ReportRepository = app.state.repo
    return await repo.get_reports(client_id)


@app.get("/reports/{client_id}/{report_id}/xbrl")
async def download_xbrl(client_id: str, report_id: str):
    """Return XBRL-tagged JSON for ESRS E1-9 submission."""
    repo: ReportRepository = app.state.repo
    report = await repo.get_report(client_id, report_id)
    if not report:
        raise HTTPException(404, "Report not found")
    if report.get("status") != "GENERATED":
        raise HTTPException(202, "Report not yet generated")
    return JSONResponse(content=report.get("xbrl_payload", {}))


@app.get("/reports/{client_id}/{report_id}/pdf")
async def download_pdf(client_id: str, report_id: str):
    """Return PDF report for human review."""
    repo: ReportRepository = app.state.repo
    report = await repo.get_report(client_id, report_id)
    if not report or report.get("status") != "GENERATED":
        raise HTTPException(404, "Report not available")
    pdf_path = report.get("pdf_path")
    if not pdf_path or not __import__("os").path.exists(pdf_path):
        raise HTTPException(404, "PDF not found on disk")
    return FileResponse(pdf_path, media_type="application/pdf",
                        filename=f"csrd_e1_{client_id}_{report_id}.pdf")


@app.get("/var/{client_id}")
async def get_var_summary(client_id: str):
    """Return the latest Gross VaR summary for a client across all scenarios."""
    repo: ReportRepository = app.state.repo
    return await repo.get_latest_var(client_id)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
