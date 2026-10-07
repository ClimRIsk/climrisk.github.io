#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# ClimRisk — Container Entrypoint
# Handles GEE service account auth, then starts FastAPI on port 7860
# ─────────────────────────────────────────────────────────────────────────────
set -e

# Decode and write GEE service account JSON from HF Secret
if [ -n "$GEE_SERVICE_ACCOUNT_JSON" ]; then
  mkdir -p /root/.config/earthengine
  echo "$GEE_SERVICE_ACCOUNT_JSON" | base64 -d > /root/.config/earthengine/credentials.json
  echo "GEE credentials written from secret"
fi

# Supabase schema init (idempotent — safe to run every restart)
if [ -n "$DATABASE_URL" ]; then
  python -c "
import asyncio
from api.db import init_schema, get_pool, close_pool
async def run():
    await init_schema()
    await close_pool()
asyncio.run(run())
" && echo "Supabase schema initialised" || echo "Schema init skipped (DB not ready yet)"
fi

# Start FastAPI on 7860 (HF Spaces required port)
exec uvicorn api.main:app --host 0.0.0.0 --port 7860 --workers 2
