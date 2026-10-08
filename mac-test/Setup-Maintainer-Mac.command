#!/bin/bash
# One-time: set the PIN that lets the resident agent push your repos (private to this Mac; not in the commercial build).
ENGINE="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
PY="$HOME/.climrisk/engine-venv/bin/python"
"$PY" -m pip install -q -e "$ENGINE[api]" 2>&1 | tail -1
cd "$ENGINE" && PYTHONPATH=src "$PY" -m cri.maintainer.setup
echo; echo "Done. Restart ClimRisk, then say in the chat: push my changes to GitHub"
read -p "Press Return to close" _
