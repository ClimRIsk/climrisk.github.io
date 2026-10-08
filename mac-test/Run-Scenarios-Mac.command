#!/bin/bash
# v0.7.0 live check: climate scenarios to 2099 + projection backtest + evidence grade (6 sites), portfolio screening, generated validation pack.
HERE="$(cd "$(dirname "$0")" && pwd)"
ENGINE="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
PY="$HOME/.climrisk/engine-venv/bin/python"
mkdir -p "$HERE/scenario"
LOG="$HERE/scenario/run.log"; : > "$LOG"; exec > >(tee -a "$LOG") 2>&1
rm -f "$HERE/scenario/DONE"
echo "== engine"; "$PY" -m pip install -q -e "$ENGINE[api]" 2>&1 | tail -1; "$PY" -c "import cri;print('engine',cri.__version__)"
cd "$ENGINE"
PYTHONPATH=src "$PY" "$HERE/scenario_check.py"
date > "$HERE/scenario/DONE"; echo "== finished"
