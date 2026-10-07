"""
ClimRisk — Storage Abstraction
================================
Unified interface for writing risk outputs.
Automatically routes to the right backend based on env vars:

  R2_ENDPOINT set  → Cloudflare R2  (zero egress, recommended for production)
  S3_BUCKET set    → Amazon S3      (legacy, egress costs apply)
  Neither set      → local /tmp dump (dev only)

Cloudflare R2 advantages over S3 for a map tile platform:
  • Zero egress fees  (S3 charges ~$0.09/GB — serving map tiles will add up)
  • Same boto3/s3fs interface — one-line endpoint change
  • Free 10GB storage + 10M Class A ops/month on free tier
"""

import os, json, logging
from datetime import datetime

log = logging.getLogger("climrisk.storage")

# R2 config
R2_ENDPOINT = os.environ.get("R2_ENDPOINT",  "")
R2_BUCKET   = os.environ.get("R2_BUCKET",    "climrisk-rasters")
R2_KEY_ID   = os.environ.get("R2_ACCESS_KEY_ID", "")
R2_SECRET   = os.environ.get("R2_SECRET_KEY", "")

# S3 fallback
S3_BUCKET   = os.environ.get("S3_BUCKET", "")


def _get_client():
    """Return a boto3 S3 client pointed at R2 or S3."""
    import boto3
    if R2_ENDPOINT and R2_KEY_ID:
        return boto3.client(
            "s3",
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_KEY_ID,
            aws_secret_access_key=R2_SECRET,
            region_name="auto",   # R2 uses 'auto'
        ), R2_BUCKET
    elif S3_BUCKET:
        return boto3.client("s3"), S3_BUCKET
    else:
        return None, None


def write_json(asset_id: str, key: str, payload: dict) -> str | None:
    """
    Write a JSON payload to R2 or S3.
    Returns the public URL (or None if local dev).

    key example: "latest"  → stored as climrisk/<asset_id>/latest.json
    """
    client, bucket = _get_client()
    if client is None:
        log.info(f"No storage configured — local dev dump for {asset_id}/{key}")
        local = f"/tmp/climrisk_{asset_id}_{key}.json"
        with open(local, "w") as f:
            json.dump(payload, f, indent=2)
        return local

    obj_key = f"climrisk/{asset_id}/{key}.json"
    client.put_object(
        Bucket=bucket, Key=obj_key,
        Body=json.dumps(payload, indent=2, default=str).encode("utf-8"),
        ContentType="application/json",
        CacheControl="public, max-age=3600",
    )
    backend = "R2" if R2_ENDPOINT else "S3"
    log.info(f"{backend} written → {bucket}/{obj_key}")
    return f"{R2_ENDPOINT or 'https://s3.amazonaws.com'}/{bucket}/{obj_key}"


def write_cog(asset_id: str, layer: str, cog_bytes: bytes) -> str | None:
    """
    Write a Cloud Optimized GeoTIFF for TiTiler serving.
    layer: "flood_rp100" | "heat_rp50" | "wind_rp100"
    """
    client, bucket = _get_client()
    if client is None:
        log.info("No storage — skipping COG write")
        return None

    obj_key = f"climrisk/rasters/{layer}.tif"
    client.put_object(
        Bucket=bucket, Key=obj_key,
        Body=cog_bytes,
        ContentType="image/tiff",
        CacheControl="public, max-age=86400",
    )
    log.info(f"COG written → {bucket}/{obj_key} ({len(cog_bytes)/1024:.0f} KB)")
    return obj_key


def public_tile_url(layer: str, titiler_base: str = "") -> str:
    """
    Construct a TiTiler tile URL for the given layer.
    Used by the FastAPI /tiles endpoint and Deck.gl TileLayer.
    """
    titiler = titiler_base or os.environ.get("TITILER_URL", "http://localhost:8080")
    if R2_ENDPOINT and R2_KEY_ID:
        cog_url = f"{R2_ENDPOINT}/{R2_BUCKET}/climrisk/rasters/{layer}.tif"
    elif S3_BUCKET:
        cog_url = f"s3://{S3_BUCKET}/climrisk/rasters/{layer}.tif"
    else:
        return ""
    return (
        f"{titiler}/cog/tiles/{{z}}/{{x}}/{{y}}.png"
        f"?url={cog_url}&resampling=bilinear&colormap_name=reds&rescale=0,1"
    )
