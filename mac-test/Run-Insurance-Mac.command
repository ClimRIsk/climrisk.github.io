#!/bin/bash
# Live check: insurer view on real hazard data (six sites, terms, reinsurance, SSP2-4.5 2050) + cross-check against the Risk Analyst.
HERE="$(cd "$(dirname "$0")" && pwd)"
ENGINE="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
PY="$HOME/.climrisk/engine-venv/bin/python"
mkdir -p "$HERE/insurance"
LOG="$HERE/insurance/run.log"; : > "$LOG"; exec > >(tee -a "$LOG") 2>&1
rm -f "$HERE/insurance/DONE"
echo "== engine"; "$PY" -m pip install -q -e "$ENGINE[api]" 2>&1 | tail -1; "$PY" -c "import cri;print('engine',cri.__version__)"
export SSL_CERT_FILE="$("$PY" -c "import certifi;print(certifi.where())" 2>/dev/null)"
cd "$ENGINE"
PYTHONPATH=src "$PY" "$HERE/insurance_check.py"
date > "$HERE/insurance/DONE"; echo "== finished"
