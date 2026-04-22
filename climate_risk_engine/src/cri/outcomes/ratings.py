"""
CRI Climate Risk Rating Engine.

Produces a composite A–E climate risk rating from multi-scenario RunResults.
This is the FREE-TIER output: the letter grade and sub-scores are visible to
all users; the underlying numbers and full trajectory are behind the paywall.

Methodology
-----------
Three pillar scores (0–100, higher = worse risk) feed into the composite:

  Physical Risk Score (P)
    - Average annual physical loss cost as % of baseline revenue, across
      all three scenarios, weighted by scenario likelihood.
    - Normalised against sector benchmarks.

  Transition Risk Score (T)
    - EBITDA compression by 2035 under NZE_2050 (most demanding scenario).
    - Carbon cost as % of EBITDA by 2030 under NZE_2050.
    - Carbon intensity trajectory vs. net-zero pathway.

  Financial Impact Score (F)
    - NPV impact % from Current Policies → NZE_2050 (downside delta).
    - WACC uplift from scenario risk premium.
    - Equity value at risk under tail scenario.

Composite = 0.30 × P + 0.40 × T + 0.30 × F  (weights reflect TCFD emphasis)

Rating scale:
  A  → composite ≤ 20   (Low risk, well-aligned or minimal exposure)
  B  → composite ≤ 40   (Moderate risk, manageable transition pathway)
  C  → composite ≤ 60   (Elevated risk, material action required)
  D  → composite ≤ 80   (High risk, significant financial exposure)
  E  → composite  > 80   (Critical risk, near-term financial impact likely)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from ..data.schemas import RunResults


# ---------------------------------------------------------------------------
# Rating output types
# ---------------------------------------------------------------------------


class ClimateRating(str):
    """A letter rating A–E. Subclasses str so it serialises cleanly."""
    VALID = ("A", "B", "C", "D", "E")

    def __new__(cls, value: str) -> "ClimateRating":
        v = str(value).upper()
        if v not in cls.VALID:
            raise ValueError(f"ClimateRating must be one of {cls.VALID}, got {v!r}")
        return super().__new__(cls, v)


@dataclass
class PillarScore:
    name: str
    score: float          # 0–100, higher = more risk
    label: str            # "Low" / "Moderate" / "Elevated" / "High" / "Critical"
    drivers: list[str] = field(default_factory=list)   # top 3 driver strings


@dataclass
class RatingResult:
    """Full rating output — free tier shows rating + pillar labels only."""

    # Composite
    composite_score: float          # 0–100
    rating: ClimateRating
    rating_label: str               # e.g. "Moderate Climate Risk"
    confidence: str                 # "High" / "Medium" / "Low" (driven by data quality)

    # Pillars (sub-scores — shown in paid tier, pillar *labels* shown in free)
    physical: PillarScore
    transition: PillarScore
    financial: PillarScore

    # Scenario used for worst-case calculation
    stress_scenario: str

    # Peer context
    sector_avg_composite: Optional[float] = None
    sector_rank: Optional[str] = None      # e.g. "Top 30%"

    # Summary narrative (1–2 sentences, free tier)
    summary: str = ""

    def as_free_tier(self) -> dict:
        """Return only what a free-tier user should see."""
        return {
            "rating": str(self.rating),
            "rating_label": self.rating_label,
            "confidence": self.confidence,
            "summary": self.summary,
            "pillars": {
                "physical_risk": self.physical.label,
                "transition_risk": self.transition.label,
                "financial_impact": self.financial.label,
            },
            "sector_rank": self.sector_rank,
            "upgrade_prompt": (
                "Unlock full scores, asset-level breakdown, scenario trajectories, "
                "and TCFD / ISSB S2 disclosure reports with CRI Professional."
            ),
        }

    def as_paid_tier(self) -> dict:
        """Return the full rating detail for paid subscribers."""
        return {
            "rating": str(self.rating),
            "rating_label": self.rating_label,
            "composite_score": round(self.composite_score, 1),
            "confidence": self.confidence,
            "summary": self.summary,
            "stress_scenario": self.stress_scenario,
            "sector_avg_composite": self.sector_avg_composite,
            "sector_rank": self.sector_rank,
            "pillars": {
                "physical_risk": {
                    "score": round(self.physical.score, 1),
                    "label": self.physical.label,
                    "key_drivers": self.physical.drivers,
                },
                "transition_risk": {
                    "score": round(self.transition.score, 1),
                    "label": self.transition.label,
                    "key_drivers": self.transition.drivers,
                },
                "financial_impact": {
                    "score": round(self.financial.score, 1),
                    "label": self.financial.label,
                    "key_drivers": self.financial.drivers,
                },
            },
        }


# ---------------------------------------------------------------------------
# Sector benchmarks (simplified — replace with live peer data in production)
# ---------------------------------------------------------------------------

_SECTOR_BENCHMARKS: dict[str, dict] = {
    "oil_gas":        {"avg_composite": 68, "stdev": 12},
    "mining":         {"avg_composite": 52, "stdev": 15},
    "utilities":      {"avg_composite": 58, "stdev": 14},
    "steel":          {"avg_composite": 55, "stdev": 13},
    "cement":         {"avg_composite": 60, "stdev": 11},
    "diversified":    {"avg_composite": 50, "stdev": 13},
    "default":        {"avg_composite": 55, "stdev": 13},
}


def _sector_key(sector: str) -> str:
    s = sector.lower()
    if any(k in s for k in ["oil", "gas", "energy", "petro"]):
        return "oil_gas"
    if any(k in s for k in ["mine", "mining", "iron", "copper", "nickel"]):
        return "mining"
    if "util" in s or "power" in s or "electric" in s:
        return "utilities"
    if "steel" in s or "metal" in s:
        return "steel"
    if "cement" in s or "concrete" in s:
        return "cement"
    return "default"


# ---------------------------------------------------------------------------
# Score helpers
# ---------------------------------------------------------------------------


def _score_label(score: float) -> str:
    if score <= 20:
        return "Low"
    if score <= 40:
        return "Moderate"
    if score <= 60:
        return "Elevated"
    if score <= 80:
        return "High"
    return "Critical"


def _rating_label(rating: ClimateRating) -> str:
    return {
        "A": "Low Climate Risk",
        "B": "Moderate Climate Risk",
        "C": "Elevated Climate Risk",
        "D": "High Climate Risk",
        "E": "Critical Climate Risk",
    }[str(rating)]


def _letter(composite: float) -> ClimateRating:
    if composite <= 20:
        return ClimateRating("A")
    if composite <= 40:
        return ClimateRating("B")
    if composite <= 60:
        return ClimateRating("C")
    if composite <= 80:
        return ClimateRating("D")
    return ClimateRating("E")


# ---------------------------------------------------------------------------
# Physical risk score
# ---------------------------------------------------------------------------


def _physical_score(
    nze: RunResults,
    dt: RunResults,
    cp: RunResults,
) -> PillarScore:
    """
    Physical risk score based on the expected annual physical loss cost
    as a share of baseline revenue, stress-tested across scenarios.
    """
    def avg_physical_pct(r: RunResults) -> float:
        """Average physical loss cost / revenue across 2026–2050."""
        if not r.years:
            return 0.0
        ratios = [
            y.physical_loss_cost / max(y.revenue, 1e-9)
            for y in r.years
            if y.revenue > 0
        ]
        return sum(ratios) / len(ratios) if ratios else 0.0

    # Weighted average: NZE (0.30), DT (0.40), CP (0.30)
    # NZE tends to have lower physical risk (faster transition slows warming)
    # CP tends to have highest physical risk by 2050
    p_nze = avg_physical_pct(nze)
    p_dt  = avg_physical_pct(dt)
    p_cp  = avg_physical_pct(cp)
    weighted_avg = 0.30 * p_nze + 0.40 * p_dt + 0.30 * p_cp

    # Normalise: 0% loss → score 5; ≥8% loss → score 100
    raw_score = min(100.0, max(0.0, (weighted_avg / 0.08) * 100.0))

    # Identify top drivers
    drivers: list[str] = []
    if p_cp > 0.04:
        drivers.append(f"Physical loss under Current Policies: {p_cp*100:.1f}% of revenue p.a.")
    if p_dt > 0.03:
        drivers.append(f"Physical loss under Delayed Transition: {p_dt*100:.1f}% of revenue p.a.")
    # Check heat + water stress peaks
    for r, sc in [(nze, "NZE"), (dt, "DT"), (cp, "CP")]:
        peak = max((y.physical_loss_cost for y in r.years), default=0.0)
        peak_rev = max((y.revenue for y in r.years), default=1.0)
        if peak / max(peak_rev, 1e-9) > 0.05:
            drivers.append(f"Peak physical loss {sc} 2050: {peak/peak_rev*100:.1f}% of revenue")
            break
    if not drivers:
        drivers.append("Physical hazard exposure within manageable range")

    return PillarScore(
        name="Physical Risk",
        score=raw_score,
        label=_score_label(raw_score),
        drivers=drivers[:3],
    )


# ---------------------------------------------------------------------------
# Transition risk score
# ---------------------------------------------------------------------------


def _transition_score(nze: RunResults, dt: RunResults) -> PillarScore:
    """
    Transition risk based on EBITDA compression and carbon cost burden
    under the most demanding (NZE 2050) scenario.
    """
    # EBITDA in 2030 vs 2026 under NZE
    def yr(r: RunResults, year: int):
        return next((y for y in r.years if y.year == year), None)

    base_ebitda = yr(nze, 2026)
    nze_2030    = yr(nze, 2030)
    nze_2035    = yr(nze, 2035)

    # Carbon cost as % of EBITDA by 2030
    carbon_pct_2030 = 0.0
    if nze_2030 and nze_2030.ebitda > 0:
        carbon_pct_2030 = nze_2030.carbon_cost / nze_2030.ebitda

    # EBITDA compression 2026 → 2035
    compression = 0.0
    if base_ebitda and base_ebitda.ebitda > 0 and nze_2035:
        compression = max(0.0, (base_ebitda.ebitda - nze_2035.ebitda) / base_ebitda.ebitda)

    # Revenue trajectory: slope of revenue 2026→2040 under NZE
    rev_decline = 0.0
    y_2040 = yr(nze, 2040)
    if base_ebitda and y_2040 and base_ebitda.revenue > 0:
        rev_decline = max(0.0, (base_ebitda.revenue - y_2040.revenue) / base_ebitda.revenue)

    # Combine: carbon_pct_2030 (0→50%+) maps 0→50 on score;
    #          compression (0→80%+) maps 0→40; rev_decline 0→10
    score = (
        min(50.0, carbon_pct_2030 * 100.0) +
        min(40.0, compression * 50.0) +
        min(10.0, rev_decline * 20.0)
    )
    score = min(100.0, score)

    drivers: list[str] = []
    if carbon_pct_2030 > 0.2:
        drivers.append(f"Carbon cost {carbon_pct_2030*100:.0f}% of EBITDA by 2030 (NZE)")
    if compression > 0.15:
        drivers.append(f"EBITDA compression {compression*100:.0f}% by 2035 under NZE")
    if rev_decline > 0.10:
        drivers.append(f"Revenue decline {rev_decline*100:.0f}% by 2040 under NZE")
    if not drivers:
        drivers.append("Transition exposure contained; low carbon cost burden")

    return PillarScore(
        name="Transition Risk",
        score=score,
        label=_score_label(score),
        drivers=drivers[:3],
    )


# ---------------------------------------------------------------------------
# Financial impact score
# ---------------------------------------------------------------------------


def _financial_score(nze: RunResults, cp: RunResults) -> PillarScore:
    """
    Financial impact score from the NPV delta between NZE and Current Policies.
    Current Policies = baseline (no transition action); NZE = stress case.
    """
    # NPV impact (positive = NZE is *worse* than CP, i.e. stranded assets)
    if cp.enterprise_value > 0:
        ev_delta_pct = (cp.enterprise_value - nze.enterprise_value) / cp.enterprise_value
    else:
        ev_delta_pct = 0.0
    ev_delta_pct = max(0.0, ev_delta_pct)   # clamp: we only count downside here

    # WACC uplift
    wacc_delta = max(0.0, nze.wacc_used - cp.wacc_used)

    # Equity value at risk %
    if cp.equity_value > 0:
        equity_var = max(0.0, (cp.equity_value - nze.equity_value) / cp.equity_value)
    else:
        equity_var = 0.0

    # Scoring
    # ev_delta_pct ≥ 60% → ~50 pts; wacc_delta ≥ 3% → ~30 pts; equity_var → 20 pts
    score = (
        min(50.0, ev_delta_pct * 83.3) +
        min(30.0, wacc_delta * 1000.0) +
        min(20.0, equity_var * 33.3)
    )
    score = min(100.0, score)

    drivers: list[str] = []
    if ev_delta_pct > 0.10:
        drivers.append(f"Enterprise value at risk: {ev_delta_pct*100:.0f}% (NZE vs Current Policies)")
    if wacc_delta > 0.005:
        drivers.append(f"WACC uplift {wacc_delta*100:.1f}pp under NZE scenario")
    if equity_var > 0.15:
        drivers.append(f"Equity value at risk: {equity_var*100:.0f}% under NZE stress")
    if not drivers:
        drivers.append("Financial exposure to transition is moderate and priced in")

    return PillarScore(
        name="Financial Impact",
        score=score,
        label=_score_label(score),
        drivers=drivers[:3],
    )


# ---------------------------------------------------------------------------
# Summary narrative
# ---------------------------------------------------------------------------


def _summary(
    company_name: str,
    rating: ClimateRating,
    physical: PillarScore,
    transition: PillarScore,
    financial: PillarScore,
) -> str:
    r = str(rating)
    p, t, f = physical.label, transition.label, financial.label
    sector_phrase = {
        "A": "well positioned for the net-zero transition",
        "B": "broadly manageable climate exposure with targeted action required",
        "C": "material climate-related financial risks requiring active management",
        "D": "significant near-term financial exposure to both physical and transition risks",
        "E": "critical climate-related risks with potential for near-term asset impairment",
    }[r]
    return (
        f"{company_name} receives a CRI Rating of {r} ({_rating_label(ClimateRating(r))}), "
        f"reflecting {sector_phrase}. "
        f"Physical hazard exposure is {p.lower()}, transition risk is {t.lower()}, "
        f"and financial impact is {f.lower()} across modelled scenarios."
    )


# ---------------------------------------------------------------------------
# Main engine
# ---------------------------------------------------------------------------


class RatingEngine:
    """
    Compute a CRI Climate Risk Rating from multi-scenario RunResults.

    Usage:
        engine = RatingEngine()
        result = engine.rate(
            company_name="BHP Group",
            sector="Mining",
            nze_results=nze,
            dt_results=dt,
            cp_results=cp,
        )
    """

    # Pillar weights: Physical 30%, Transition 40%, Financial 30%
    W_PHYSICAL    = 0.30
    W_TRANSITION  = 0.40
    W_FINANCIAL   = 0.30

    def rate(
        self,
        company_name: str,
        sector: str,
        nze_results: RunResults,
        dt_results:  RunResults,
        cp_results:  RunResults,
        data_quality: str = "medium",
    ) -> RatingResult:
        """
        Compute a full RatingResult.

        Args:
            company_name: Display name for narratives.
            sector: Sector string used for peer benchmarking.
            nze_results: RunResults under NZE 2050 scenario.
            dt_results: RunResults under Delayed Transition scenario.
            cp_results: RunResults under Current Policies scenario.
            data_quality: "low" | "medium" | "high" — controls confidence label.
        """
        physical   = _physical_score(nze_results, dt_results, cp_results)
        transition = _transition_score(nze_results, dt_results)
        financial  = _financial_score(nze_results, cp_results)

        composite = (
            self.W_PHYSICAL   * physical.score +
            self.W_TRANSITION * transition.score +
            self.W_FINANCIAL  * financial.score
        )

        rating = _letter(composite)

        # Confidence from data quality
        confidence = {"low": "Low", "medium": "Medium", "high": "High"}.get(
            data_quality.lower(), "Medium"
        )

        # Sector context
        sk = _sector_key(sector)
        bench = _SECTOR_BENCHMARKS.get(sk, _SECTOR_BENCHMARKS["default"])
        sector_avg = bench["avg_composite"]
        if composite < sector_avg - bench["stdev"]:
            sector_rank = "Top 15% of sector peers"
        elif composite < sector_avg:
            sector_rank = "Above-average vs. sector peers"
        elif composite < sector_avg + bench["stdev"]:
            sector_rank = "Average vs. sector peers"
        else:
            sector_rank = "Below-average vs. sector peers"

        summary = _summary(company_name, rating, physical, transition, financial)

        return RatingResult(
            composite_score=composite,
            rating=rating,
            rating_label=_rating_label(rating),
            confidence=confidence,
            physical=physical,
            transition=transition,
            financial=financial,
            stress_scenario="NZE 2050",
            sector_avg_composite=float(sector_avg),
            sector_rank=sector_rank,
            summary=summary,
        )
