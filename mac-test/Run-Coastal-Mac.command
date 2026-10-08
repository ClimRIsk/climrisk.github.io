#!/bin/bash
# v0.8.0 live check: sea level, surge, fire/drought/cyclone under future climate, rain (station check).
HERE="$(cd "$(dirname "$0")" && pwd)"
ENGINE="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
PY="$HOME/.climrisk/engine-venv/bin/python"
mkdir -p "$HERE/coastal"
LOG="$HERE/coastal/run.log"; : > "$LOG"; exec > >(tee -a "$LOG") 2>&1
rm -f "$HERE/coastal/DONE"
echo "== engine"; "$PY" -m pip install -q -e "$ENGINE[api]" 2>&1 | tail -1; "$PY" -c "import cri;print('engine',cri.__version__)"
cd "$ENGINE"
PYTHONPATH=src "$PY" "$HERE/coastal_check.py"
date > "$HERE/coastal/DONE"; echo "== finished"
