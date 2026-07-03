"""
Open-Meteo Live Weather Connector.

Queries the Open-Meteo Forecast API (current conditions) and Archive API
(observed daily history) at asset coordinates. Unlike the climatological
connectors (nasa_power.py, open_meteo_climate.py) — which cache forever
because normals rarely change — this connector caches with a short TTL via
``cache.cached_fetch``, since the whole point is to reflect current state.

APIs (both free, no API key, no signup):
  Forecast API : https://open-meteo.com/en/docs
  Archive API  : https://open-meteo.com/en/docs/historical-weather-api

Variables used:
  current.temperature_2m       — instantaneous 2m air temperature (°C)
  current.precipitation        — instantaneous precipitation rate (mm)
  current.wind_speed_10m       — instantaneous 10m wind speed (m/s... actually
                                  km/h by default; converted below)
  current.relative_humidity_2m — instantaneous relative humidity (%)
  current.weather_code         — WMO weather interpretation code
  daily.temperature_2m_max     — daily max temp, past 14 days + today (°C)
  daily.precipitation_sum      — daily precip total, past 14 days + today (mm)

  archive.daily.temperature_2m_mean — daily mean temp (°C), full date range
  archive.daily.precipitation_sum   — daily precip total (mm), full date range

Caching: TTL-based via cache.cached_fetch — 3h for current conditions
(reasonable "live" freshness without hammering the free API), 7 days for
historical archive pulls (annual aggregates don't need same-day freshness).

Source: Open-Meteo (2024). Forecast API & Historical Weather API.
        https://open-meteo.com/en/docs
"""

from __future__ import annotations

import statistics
import urllib.request
from dataclasses import dataclass, field
from typing import Optional

from .cache import cached_fetch

_FORECAST_URL = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude={lat}&longitude={lon}"
    "&current=temperature_2m,precipitation,wind_speed_10m,relative_humidity_2m,weather_code"
    "&daily=temperature_2m_max,precipitation_sum"
    "&past_days=14&forecast_days=1"
    "&wind_speed_unit=ms"
)

_ARCHIVE_URL = (
    "https://archive-api.open-meteo.com/v1/archive"
    "?latitude={lat}&longitude={lon}"
    "&start_date={start_date}&end_date={end_date}"
    "&daily=temperature_2m_mean,precipitation_sum"
)


def _round_coord(v: float) -> float:
    """Round to 0.25° grid cell, consistent with the other connectors."""
    return round(round(v / 0.25) * 0.25, 2)


def _fetch_json(url: str, timeout: int = 15) -> dict:
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        import json
        return json.loads(resp.read().decode())


@dataclass
class CurrentConditions:
    """Live/current weather snapshot at a coordinate."""
    lat: float
    lon: float
    observed_at: str                    # ISO timestamp from API ("current.time")
    temperature_c: float
    precipitation_mm: float             # instantaneous rate at observed_at
    wind_speed_ms: float
    humidity_pct: float
    weather_code: int
    daily_max_temps_c: dict             # {date_iso: temp_c} — last 14 days + today
    daily_precip_mm: dict               # {date_iso: precip_mm} — last 14 days + today
    precip_trailing14d_mm: float        # sum of daily_precip_mm
    source: str = "Open-Meteo Forecast API (current + 14-day trailing)"


def get_current_conditions(lat: float, lon: float) -> Optional[CurrentConditions]:
    """
    Fetch live current conditions + trailing 14-day daily stats for (lat, lon).

    Returns None on API failure — caller falls back to climatological data.
    """
    lat_r, lon_r = _round_coord(lat), _round_coord(lon)
    key = f"open_meteo_live_{lat_r}_{lon_r}"

    def _fetch() -> dict:
        url = _FORECAST_URL.format(lat=round(lat, 4), lon=round(lon, 4))
        return _fetch_json(url)

    try:
        raw = cached_fetch(key, _fetch, ttl_hours=3)
        current = raw["current"]
        daily = raw["daily"]

        dates = daily.get("time", [])
        tmax = daily.get("temperature_2m_max", [])
        precip = daily.get("precipitation_sum", [])

        daily_max_temps = {d: t for d, t in zip(dates, tmax) if t is not None}
        daily_precip = {d: p for d, p in zip(dates, precip) if p is not None}

        return CurrentConditions(
            lat=lat,
            lon=lon,
            observed_at=current.get("time", ""),
            temperature_c=current["temperature_2m"],
            precipitation_mm=current.get("precipitation", 0.0) or 0.0,
            wind_speed_ms=current.get("wind_speed_10m", 0.0) or 0.0,
            humidity_pct=current.get("relative_humidity_2m", 0.0) or 0.0,
            weather_code=int(current.get("weather_code", 0) or 0),
            daily_max_temps_c=daily_max_temps,
            daily_precip_mm=daily_precip,
            precip_trailing14d_mm=round(sum(daily_precip.values()), 2),
        )
    except Exception:
        return None


def get_historical_annual(
    lat: float, lon: float, start_year: int, end_year: int
) -> Optional[dict[int, dict]]:
    """
    Fetch observed daily history for (lat, lon) between start_year and
    end_year (inclusive) and aggregate to annual means.

    Returns {year: {"mean_temp_c": float, "precip_mm": float, "n_days": int}}
    on success, None on API failure. Years with no data are omitted.
    """
    lat_r, lon_r = _round_coord(lat), _round_coord(lon)
    key = f"open_meteo_archive_{lat_r}_{lon_r}_{start_year}_{end_year}"

    def _fetch() -> dict:
        url = _ARCHIVE_URL.format(
            lat=round(lat, 4), lon=round(lon, 4),
            start_date=f"{start_year}-01-01", end_date=f"{end_year}-12-31",
        )
        return _fetch_json(url, timeout=30)

    try:
        raw = cached_fetch(key, _fetch, ttl_hours=168)
        daily = raw["daily"]
        dates = daily.get("time", [])
        temps = daily.get("temperature_2m_mean", [])
        precips = daily.get("precipitation_sum", [])

        by_year: dict[int, dict] = {}
        for date_iso, t, p in zip(dates, temps, precips):
            year = int(date_iso[:4])
            bucket = by_year.setdefault(year, {"temps": [], "precips": []})
            if t is not None:
                bucket["temps"].append(t)
            if p is not None:
                bucket["precips"].append(p)

        result: dict[int, dict] = {}
        for year, bucket in by_year.items():
            if not bucket["temps"]:
                continue
            result[year] = {
                "mean_temp_c": round(statistics.mean(bucket["temps"]), 2),
                "precip_mm": round(sum(bucket["precips"]), 1),
                "n_days": len(bucket["temps"]),
            }
        return result or None
    except Exception:
        return None
