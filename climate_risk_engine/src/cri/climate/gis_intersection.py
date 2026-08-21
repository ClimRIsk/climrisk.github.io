"""
GIS × Live-Conditions Intersection Layer.

The GIS resolver (climate/gis/resolver.py) produces STATIC spatial context
for an asset — is it in a cyclone belt, a permafrost zone, an arid zone, a
floodplain. The live-conditions layer (climate/live_conditions.py) produces
what's happening RIGHT NOW at that coordinate.

Neither is very interesting on its own for near-term risk: "in a cyclone
belt" is true 365 days a year, and "windy today" happens everywhere. What
matters is the INTERSECTION — a static hazard-prone zone currently showing
a live signal consistent with that hazard. This module computes that
intersection as a small set of CompoundRiskFlags, used to:
  1. Surface a human-readable warning in the API/frontend.
  2. Apply a small, further-capped nudge to the matching hazard's
     near-term (current calendar year only) severity/probability, on top
     of the live_conditions nudge already applied in hazard_layers.py.
"""

from __future__ import annotations

from dataclasses import dataclass

from .gis.resolver import AssetGISAttributes
from .live_conditions import LiveConditions

# Wind threshold for the cyclone-belt flag: ~12 m/s is "strong breeze" /
# near-gale on the Beaufort scale — high enough to be a meaningful signal,
# not just an ordinary breezy day.
_CYCLONE_WIND_THRESHOLD_MS = 12.0

# Heat anomaly threshold for the permafrost flag: 2C above the NASA POWER
# seasonal norm is a clear warm anomaly, not daily noise.
_PERMAFROST_HEAT_ANOMALY_C = 2.0

# 14-day trailing precipitation threshold for the floodplain flag: ~100mm
# over 14 days (~7mm/day sustained) is a globally reasonable "heavy rain"
# bar for a low-lying/floodplain asset.
_FLOODPLAIN_PRECIP_THRESHOLD_MM = 100.0


@dataclass
class CompoundRiskFlag:
    """A static GIS hazard zone currently showing a matching live signal."""
    id: str
    label: str
    description: str
    severity: str        # "info" | "warning" | "critical"
    hazard: str           # HazardScore.hazard this flag should nudge
    severity_delta: float
    prob_multiplier: float


def compute_compound_flags(
    gis: AssetGISAttributes | None,
    live: LiveConditions | None,
) -> list[CompoundRiskFlag]:
    """
    Compute the intersection of static GIS zones and live conditions.

    Returns an empty list if either input is missing, or if no rule fires.
    Year-agnostic — caller (hazard_layers.py) only invokes this for the
    current calendar year, same contract as live_severity_nudge().
    """
    if gis is None or live is None:
        return []

    flags: list[CompoundRiskFlag] = []

    if gis.is_arid and live.precip_deficit_flag:
        flags.append(CompoundRiskFlag(
            id="arid_precip_deficit",
            label="Drought compounding",
            description=(
                f"Arid/dryland Köppen zone ({gis.koppen_zone}) currently showing a "
                f"14-day precipitation deficit ({live.precip_trailing14d_mm:.1f}mm trailing)."
            ),
            severity="warning",
            hazard="drought",
            severity_delta=0.25,
            prob_multiplier=1.10,
        ))

    if gis.is_cyclone_belt and live.wind_speed_ms > _CYCLONE_WIND_THRESHOLD_MS:
        flags.append(CompoundRiskFlag(
            id="cyclone_belt_wind",
            label="Elevated wind in cyclone belt",
            description=(
                f"Tropical-cyclone-prone belt currently showing wind speed "
                f"{live.wind_speed_ms:.1f} m/s (above the {_CYCLONE_WIND_THRESHOLD_MS:.0f} m/s watch threshold)."
            ),
            severity="warning",
            hazard="cyclone",
            severity_delta=0.25,
            prob_multiplier=1.10,
        ))

    if gis.is_permafrost and live.heat_anomaly_c is not None and live.heat_anomaly_c > _PERMAFROST_HEAT_ANOMALY_C:
        flags.append(CompoundRiskFlag(
            id="permafrost_heat_anomaly",
            label="Permafrost zone warm anomaly",
            description=(
                f"Mapped permafrost extent currently {live.heat_anomaly_c:+.1f}°C above the "
                f"seasonal norm — accelerates active-layer thaw."
            ),
            severity="warning",
            hazard="permafrost_thaw",
            severity_delta=0.30,
            prob_multiplier=1.15,
        ))

    if gis.is_floodplain and live.precip_trailing14d_mm > _FLOODPLAIN_PRECIP_THRESHOLD_MM:
        flags.append(CompoundRiskFlag(
            id="floodplain_heavy_precip",
            label="Floodplain heavy rainfall",
            description=(
                f"Low-elevation floodplain asset with {live.precip_trailing14d_mm:.0f}mm "
                f"trailing 14-day rainfall (above the {_FLOODPLAIN_PRECIP_THRESHOLD_MM:.0f}mm watch threshold)."
            ),
            severity="warning",
            hazard="flood_riverine",
            severity_delta=0.30,
            prob_multiplier=1.15,
        ))

    return flags
