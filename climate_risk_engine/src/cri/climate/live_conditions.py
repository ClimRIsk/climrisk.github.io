"""
CRI Live Meteorological Conditions Layer.

Combines the Open-Meteo live connector with the existing NASA POWER
climatology and WMO baselines (met_data.py) to produce two things:

  LiveConditions  — a "right now" snapshot at an asset's coordinates, plus
                     an anomaly vs the seasonal climatological norm. Used to
                     (a) display current conditions, and (b) apply a small,
                     capped nudge to the CURRENT-YEAR heat_stress/drought
                     hazard scores in hazard_layers.py.

  ObservedTrend    — annual mean temperature/precipitation from a past year
                      up to the present, aggregated from Open-Meteo's
                      historical archive, compared against the WMO 1991-2020
                      baseline. Answers "how far have observed conditions
                      moved from the baseline so far."

Both degrade gracefully to None on any API failure — callers must handle
that (same contract as the other live connectors in this package).
"""

from __future__ import annotations

import datetime
from dataclasses import dataclass
from typing import Optional

from ..connectors import open_meteo_live
from ..connectors.nasa_power import get_baseline as _get_nasa_baseline
from .met_data import get_met_baseline

_MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
           "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]


# ---------------------------------------------------------------------------
# Live conditions ("right now")
# ---------------------------------------------------------------------------

@dataclass
class LiveConditions:
    """Live weather snapshot at an asset's coordinates, with a seasonal anomaly."""
    region: str
    lat: float
    lon: float
    observed_at: str                          # ISO timestamp of the observation
    current_temp_c: float
    precip_trailing14d_mm: float
    wind_speed_ms: float
    humidity_pct: float
    weather_code: int
    seasonal_baseline_max_c: Optional[float]  # NASA POWER monthly T2M_MAX norm
    heat_anomaly_c: Optional[float]           # today's max minus seasonal norm
    precip_deficit_flag: bool                 # trailing 14d well below seasonal norm
    source: str = "Open-Meteo Forecast API + NASA POWER seasonal baseline"


def get_live_conditions(region: str, lat: Optional[float], lon: Optional[float]) -> Optional[LiveConditions]:
    """
    Fetch a live conditions snapshot for (region, lat, lon).

    Returns None if coordinates are missing or the live API is unavailable —
    callers fall back to the static/climatological path with no change in
    behaviour.
    """
    if lat is None or lon is None:
        return None

    current = open_meteo_live.get_current_conditions(lat, lon)
    if current is None:
        return None

    # Seasonal baseline for anomaly: NASA POWER's climatological T2M_MAX for
    # the current calendar month (already fetched/cached by the CMIP6 path
    # for the same coordinate in most runs).
    seasonal_max: Optional[float] = None
    try:
        nasa = _get_nasa_baseline(lat, lon)
        if nasa is not None:
            month_key = _MONTHS[datetime.date.today().month - 1]
            seasonal_max = nasa.monthly_t2m_max.get(month_key)
    except Exception:
        seasonal_max = None

    today_max = None
    if current.daily_max_temps_c:
        today_max = list(current.daily_max_temps_c.values())[-1]

    heat_anomaly_c = None
    if today_max is not None and seasonal_max is not None:
        heat_anomaly_c = round(today_max - seasonal_max, 2)

    # Precip deficit: trailing 14-day total vs the pro-rated WMO annual norm.
    # Only flagged where the region normally receives meaningful rainfall —
    # avoids false "deficit" flags in already-arid regions (e.g. CL-02).
    met_baseline = get_met_baseline(region)
    expected_14d_precip = met_baseline.precip_mm_yr / 365.0 * 14.0
    precip_deficit_flag = (
        expected_14d_precip > 5.0
        and current.precip_trailing14d_mm < expected_14d_precip * 0.2
    )

    return LiveConditions(
        region=region,
        lat=lat,
        lon=lon,
        observed_at=current.observed_at,
        current_temp_c=current.temperature_c,
        precip_trailing14d_mm=current.precip_trailing14d_mm,
        wind_speed_ms=current.wind_speed_ms,
        humidity_pct=current.humidity_pct,
        weather_code=current.weather_code,
        seasonal_baseline_max_c=seasonal_max,
        heat_anomaly_c=heat_anomaly_c,
        precip_deficit_flag=precip_deficit_flag,
    )


def live_severity_nudge(hazard: str, live: LiveConditions) -> tuple[float, float]:
    """
    Return a hard-capped (severity_delta, probability_multiplier) nudge for
    a hazard given a live conditions snapshot.

    Only "heat_stress" and "drought" are nudged; all other hazards return
    (0.0, 1.0) — a no-op.

    This function is year-agnostic. The caller (hazard_layers.py) must only
    invoke it when assessing the CURRENT calendar year — applying a live
    anomaly to a 2030/2050 projection would be meaningless and would break
    the trend calibration.
    """
    if hazard == "heat_stress" and live.heat_anomaly_c is not None:
        severity_delta = max(-0.4, min(0.4, live.heat_anomaly_c * 0.08))
        prob_mult = max(0.85, min(1.25, 1.0 + live.heat_anomaly_c * 0.02))
        return severity_delta, prob_mult

    if hazard == "drought" and live.precip_deficit_flag:
        return 0.3, 1.15

    return 0.0, 1.0


# ---------------------------------------------------------------------------
# Observed trend (baseline → today)
# ---------------------------------------------------------------------------

@dataclass
class ObservedTrend:
    """Annual observed temperature/precipitation trend vs the WMO baseline."""
    region: str
    lat: float
    lon: float
    start_year: int
    end_year: int
    annual_mean_temp_c: dict            # {year: mean_temp_c}
    annual_precip_mm: dict              # {year: precip_mm}
    baseline_mean_temp_c: float         # WMO 1991-2020 normal
    baseline_precip_mm_yr: float        # WMO 1991-2020 normal
    temp_trend_c_per_decade: Optional[float]
    warming_since_baseline_c: Optional[float]  # latest observed year vs baseline
    source: str = "Open-Meteo Historical Weather API (ERA5-based) vs WMO 1991-2020 normal"


def _linear_slope(xs: list[float], ys: list[float]) -> Optional[float]:
    """Simple least-squares slope (dy/dx). No numpy dependency."""
    n = len(xs)
    if n < 2:
        return None
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    num = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    den = sum((x - mean_x) ** 2 for x in xs)
    if den == 0:
        return None
    return num / den


def get_observed_trend(
    region: str,
    lat: Optional[float],
    lon: Optional[float],
    start_year: int = 2015,
    end_year: Optional[int] = None,
) -> Optional[ObservedTrend]:
    """
    Fetch the observed annual temperature/precipitation trend for (region,
    lat, lon) from start_year to end_year (defaults to last calendar year),
    and compare the most recent observed year against the WMO 1991-2020
    baseline for this region.

    Returns None if coordinates are missing or the archive API is unavailable.
    """
    if lat is None or lon is None:
        return None

    end_year = end_year or (datetime.date.today().year - 1)
    if end_year <= start_year:
        end_year = start_year + 1

    annual = open_meteo_live.get_historical_annual(lat, lon, start_year, end_year)
    if not annual:
        return None

    years = sorted(annual.keys())
    annual_mean_temp_c = {y: annual[y]["mean_temp_c"] for y in years}
    annual_precip_mm = {y: annual[y]["precip_mm"] for y in years}

    met_baseline = get_met_baseline(region)

    temps = [annual_mean_temp_c[y] for y in years]
    slope_per_year = _linear_slope([float(y) for y in years], temps)
    temp_trend_c_per_decade = round(slope_per_year * 10, 3) if slope_per_year is not None else None

    latest_year = years[-1]
    warming_since_baseline_c = round(annual_mean_temp_c[latest_year] - met_baseline.mean_temp_c, 2)

    return ObservedTrend(
        region=region,
        lat=lat,
        lon=lon,
        start_year=years[0],
        end_year=years[-1],
        annual_mean_temp_c=annual_mean_temp_c,
        annual_precip_mm=annual_precip_mm,
        baseline_mean_temp_c=met_baseline.mean_temp_c,
        baseline_precip_mm_yr=met_baseline.precip_mm_yr,
        temp_trend_c_per_decade=temp_trend_c_per_decade,
        warming_since_baseline_c=warming_since_baseline_c,
    )
