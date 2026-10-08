#!/bin/bash
# Live check: climate scenario applied to the 3D twin (solver re-run), 3 sites.
HERE="$(cd "$(dirname "$0")" && pwd)"
ENGINE="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
PY="$HOME/.climrisk/engine-venv/bin/python"
mkdir -p "$HERE/climate3d"
LOG="$HERE/climate3d/run.log"; : > "$LOG"; exec > >(tee -a "$LOG") 2>&1
rm -f "$HERE/climate3d/DONE"
echo "== engine"; "$PY" -m pip install -q -e "$ENGINE[api]" 2>&1 | tail -1; "$PY" -c "import cri;print('engine',cri.__version__)"
cd "$ENGINE"
PYTHONPATH=src "$PY" "$HERE/climate_twin_check.py"
date > "$HERE/climate3d/DONE"; echo "== finished"
