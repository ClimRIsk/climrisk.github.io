#!/bin/bash
# Refresh the engine copy the desktop app runs (~/.climrisk/engine-src) from the engine repo.
# The app cannot read ~/Documents, so setup mirrors the engine once; new engine code only reaches the app after this runs.
set -e
SRC="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
DST="$HOME/.climrisk/engine-src"
[ -f "$SRC/pyproject.toml" ] || { echo "Engine not found at $SRC"; exit 1; }
mkdir -p "$DST"
rsync -a --delete --exclude .git --exclude __pycache__ --exclude '*.egg-info' --exclude build --exclude tests "$SRC/" "$DST/"
if [ -x "$HOME/.climrisk/engine-venv/bin/python" ]; then
  "$HOME/.climrisk/engine-venv/bin/python" -m pip install -q -e "$DST[api]" 2>&1 | tail -2 || true
fi
echo "Engine synced to $DST"
ls -l "$DST/src/cri/api/asset_twin_dashboard.html" "$DST/src/cri/release_plume.py" "$DST/src/cri/api/portfolio_map_dashboard.html"
echo "Now quit and reopen ClimRisk Intelligence."
read -n 1 -s -r -p "Press any key to close"
