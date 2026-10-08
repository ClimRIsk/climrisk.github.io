#!/bin/bash
# Dev server for UI checks: engine on 127.0.0.1:8765, token "devtoken". Auto-stops after 45 min.
PY="$HOME/.climrisk/engine-venv/bin/python"
set -a; [ -f "$HOME/.climrisk/engine.env" ] && . "$HOME/.climrisk/engine.env"; set +a
cd "$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
export CRI_API_KEYS=devtoken CLIMRISK_LOCAL=1 CRI_CACHE_DIR="$HOME/.climrisk/cache" PYTHONPATH="$PWD/src"
( sleep 2700; pkill -f "uvicorn cri.api.main:app --host 127.0.0.1 --port 8765" ) &
exec "$PY" -m uvicorn cri.api.main:app --host 127.0.0.1 --port 8765 --log-level info
