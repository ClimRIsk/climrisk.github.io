"""
ClimRisk — Unified Client Ingestion Layer
==========================================
Consolidates asset registries from any number of corporate clients
(Nouryon, UltraTech, Heineken, Ramco Cements, …) into ONE normalised CSV.

That single file feeds the GEE vectorised compute engine, which processes
all 10,000+ assets in a single batch rather than spinning up separate runs.

Accepted input formats
───────────────────────
  • CSV / Excel   — any column layout, auto-mapped
  • JSON          — list of asset dicts
  • Address-only  — geocoded automatically via Nominatim

Usage
──────
  python ingest.py --client nouryon    --file nouryon_sites.xlsx
  python ingest.py --client heineken   --file heineken_assets.csv
  python ingest.py --flush             # write merged assets.csv and validate

Output
──────
  assets.csv (appended/merged, deduped by asset_id)
  ingestion_report.json  (per-client stats + geocoding failures)
"""

import os, re, json, logging, argparse, hashlib
from pathlib import Path
from datetime import datetime

import pandas as pd
import requests

log = logging.getLogger("climrisk.ingest")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

ASSETS_CSV    = Path("assets.csv")
REPORT_JSON   = Path("ingestion_report.json")
GEOCODE_CACHE = Path(".geocode_cache.json")

# ── Canonical column schema ───────────────────────────────────────────────────
SCHEMA = [
    "asset_id", "company", "client_id", "sector",
    "lat", "lon",
    "revenue_usd", "ev_usd", "wacc", "scenario",
    "build_year", "material", "ffe_m", "defenses", "backup_power",
    "scope1_tco2", "scope2_tco2",
    "address",        # raw address (used if lat/lon missing)
    "country_iso2",
    "ingested_at", "geocoded",
]

# ── Per-sector IPCC AR6 scenario default ──────────────────────────────────────
SECTOR_SCENARIO_DEFAULT = {
    "oil_gas":      "dt",
    "utilities":    "dt",
    "mining":       "dt",
    "default":      "cp",
}

# ── Column alias map — maps common client column names → canonical name ────────
ALIAS_MAP = {
    # company / client
    "company_name": "company", "firm": "company", "entity": "company",
    "organization": "company", "organisation": "company",
    # geography
    "latitude": "lat", "longitude": "lon", "lng": "lon",
    "long": "lon", "x": "lon", "y": "lat",
    "site_address": "address", "location_address": "address",
    "street_address": "address",
    # financials
    "annual_revenue": "revenue_usd", "revenue": "revenue_usd",
    "enterprise_value": "ev_usd", "market_cap": "ev_usd",
    "discount_rate": "wacc", "cost_of_capital": "wacc",
    # vulnerability
    "construction_year": "build_year", "year_built": "build_year",
    "building_material": "material", "construction_material": "material",
    "floor_to_ground": "ffe_m", "freeboard": "ffe_m",
    "flood_defenses": "defenses", "flood_protection": "defenses",
    "backup_generator": "backup_power", "generator": "backup_power",
    # emissions
    "scope_1": "scope1_tco2", "scope1": "scope1_tco2",
    "scope_2": "scope2_tco2", "scope2": "scope2_tco2",
    # sector
    "industry": "sector", "sub_sector": "sector", "gics_sector": "sector",
}

# ── Sector normalisation ──────────────────────────────────────────────────────
SECTOR_NORM = {
    "food & beverage": "food_beverage",
    "food and beverage": "food_beverage",
    "f&b": "food_beverage",
    "real estate": "real_estate",
    "oil & gas": "oil_gas",
    "oil and gas": "oil_gas",
    "power": "utilities",
    "energy": "utilities",
    "electric utilities": "utilities",
    "cement": "industrials",
    "construction materials": "industrials",
    "specialty chemicals": "chemicals",
}


def _norm_col(s: str) -> str:
    return re.sub(r"[\s\-/()]", "_", str(s).strip().lower())


def _map_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Rename client columns to canonical schema names."""
    renamed = {}
    for col in df.columns:
        norm = _norm_col(col)
        if norm in ALIAS_MAP:
            renamed[col] = ALIAS_MAP[norm]
        elif norm in SCHEMA:
            renamed[col] = norm
    df = df.rename(columns=renamed)
    return df


def _norm_sector(s: str | None) -> str:
    if not s:
        return "default"
    sl = str(s).strip().lower()
    return SECTOR_NORM.get(sl, sl.replace(" ", "_").replace("-", "_"))


def _make_asset_id(company: str, lat: float, lon: float) -> str:
    slug = re.sub(r"[^a-z0-9]", "_", company.lower())[:24]
    geo  = hashlib.md5(f"{lat:.4f},{lon:.4f}".encode()).hexdigest()[:6]
    return f"{slug}_{geo}"


# ═══════════════════════════════════════════════════════════════════════════════
# GEOCODING (with local disk cache to avoid re-hitting Nominatim)
# ═══════════════════════════════════════════════════════════════════════════════

def _load_cache() -> dict:
    if GEOCODE_CACHE.exists():
        return json.loads(GEOCODE_CACHE.read_text())
    return {}

def _save_cache(cache: dict):
    GEOCODE_CACHE.write_text(json.dumps(cache, indent=2))

def geocode_address(address: str, cache: dict) -> tuple[float, float] | None:
    if address in cache:
        return tuple(cache[address])
    try:
        r = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": address, "format": "json", "limit": 1},
            headers={"User-Agent": "ClimRisk/1.0 (climrisk.io)"},
            timeout=10,
        )
        results = r.json()
        if results:
            lat, lon = float(results[0]["lat"]), float(results[0]["lon"])
            cache[address] = [lat, lon]
            _save_cache(cache)
            return lat, lon
    except Exception as e:
        log.warning(f"Geocode failed for '{address}': {e}")
    return None


# ═══════════════════════════════════════════════════════════════════════════════
# INGESTION CORE
# ═══════════════════════════════════════════════════════════════════════════════

def load_client_file(path: str | Path) -> pd.DataFrame:
    """Load CSV or Excel regardless of extension."""
    p = Path(path)
    if p.suffix.lower() in (".xlsx", ".xls", ".xlsm"):
        df = pd.read_excel(p, dtype=str)
    else:
        df = pd.read_csv(p, dtype=str)
    log.info(f"Loaded {len(df)} rows from {p.name}")
    return df


def normalise(df: pd.DataFrame, client_id: str, company_default: str | None = None) -> pd.DataFrame:
    """
    Map client columns → canonical schema, fill defaults, geocode missing coords.
    Returns a DataFrame with exactly the SCHEMA columns (missing ones = NaN).
    """
    df = _map_columns(df.copy())
    cache = _load_cache()
    geocoded_count = 0
    failures = []

    # Fill company from argument if column missing
    if "company" not in df.columns and company_default:
        df["company"] = company_default

    df["client_id"] = client_id
    df["ingested_at"] = datetime.utcnow().isoformat() + "Z"
    df["geocoded"] = False

    # Sector normalisation
    if "sector" in df.columns:
        df["sector"] = df["sector"].apply(_norm_sector)
    else:
        df["sector"] = "default"

    # Scenario default
    if "scenario" not in df.columns:
        df["scenario"] = df["sector"].apply(
            lambda s: SECTOR_SCENARIO_DEFAULT.get(s, SECTOR_SCENARIO_DEFAULT["default"])
        )

    # Convert lat/lon to float
    for col in ("lat", "lon"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Geocode rows missing lat/lon
    for idx, row in df.iterrows():
        lat_ok = pd.notna(df.at[idx, "lat"]) if "lat" in df.columns else False
        lon_ok = pd.notna(df.at[idx, "lon"]) if "lon" in df.columns else False
        if not (lat_ok and lon_ok):
            addr = row.get("address") or row.get("company", "")
            if addr:
                coords = geocode_address(str(addr), cache)
                if coords:
                    df.at[idx, "lat"] = coords[0]
                    df.at[idx, "lon"] = coords[1]
                    df.at[idx, "geocoded"] = True
                    geocoded_count += 1
                else:
                    failures.append(str(addr))

    # Generate asset_id
    df["asset_id"] = df.apply(
        lambda r: _make_asset_id(
            str(r.get("company", "unknown")),
            float(r.get("lat") or 0),
            float(r.get("lon") or 0),
        ),
        axis=1,
    )

    # Ensure all schema columns exist
    for col in SCHEMA:
        if col not in df.columns:
            df[col] = None

    log.info(f"  {client_id}: {len(df)} assets, {geocoded_count} geocoded, {len(failures)} failures")
    if failures:
        log.warning(f"  Geocoding failures: {failures}")
    return df[SCHEMA]


def ingest_client(client_id: str, file_path: str, company: str | None = None) -> pd.DataFrame:
    raw = load_client_file(file_path)
    return normalise(raw, client_id=client_id, company_default=company)


# ═══════════════════════════════════════════════════════════════════════════════
# MERGE & DEDUP → assets.csv
# ═══════════════════════════════════════════════════════════════════════════════

def flush_to_assets_csv(new_rows: pd.DataFrame | None = None) -> pd.DataFrame:
    """
    Merge new_rows into assets.csv, dedup on asset_id (latest wins).
    Returns the final merged DataFrame.
    """
    existing = pd.read_csv(ASSETS_CSV, dtype=str) if ASSETS_CSV.exists() else pd.DataFrame(columns=SCHEMA)

    if new_rows is not None and len(new_rows) > 0:
        combined = pd.concat([existing, new_rows], ignore_index=True)
        # Keep latest ingested row per asset_id
        combined = (
            combined.sort_values("ingested_at", ascending=False)
            .drop_duplicates(subset=["asset_id"], keep="first")
            .reset_index(drop=True)
        )
    else:
        combined = existing

    # Validation
    missing_coords = combined[pd.to_numeric(combined["lat"], errors="coerce").isna()].shape[0]
    if missing_coords > 0:
        log.warning(f"{missing_coords} assets still missing lat/lon — they will be skipped by the pipeline")

    combined.to_csv(ASSETS_CSV, index=False)
    log.info(f"assets.csv written: {len(combined)} total assets ({missing_coords} missing coords)")

    # Write ingestion report
    report = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "total_assets": len(combined),
        "missing_coordinates": int(missing_coords),
        "clients": combined["client_id"].value_counts().to_dict(),
        "sectors": combined["sector"].value_counts().to_dict(),
    }
    REPORT_JSON.write_text(json.dumps(report, indent=2))
    log.info(f"Report: {report}")
    return combined


# ═══════════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ClimRisk unified client ingestion")
    parser.add_argument("--client",  type=str, help="Client ID (e.g. heineken, nouryon)")
    parser.add_argument("--company", type=str, help="Company name (if not in file)")
    parser.add_argument("--file",    type=str, help="Path to client asset CSV / Excel")
    parser.add_argument("--flush",   action="store_true",
                        help="Dedup and rewrite assets.csv without adding new data")
    args = parser.parse_args()

    if args.file and args.client:
        rows = ingest_client(args.client, args.file, company=args.company)
        flush_to_assets_csv(rows)
    elif args.flush:
        flush_to_assets_csv()
    else:
        parser.print_help()
