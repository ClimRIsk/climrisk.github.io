#!/bin/bash
HERE="$(cd "$(dirname "$0")" && pwd)"; mkdir -p "$HERE/llm"
PY="$HOME/.climrisk/engine-venv/bin/python"
set -a; [ -f "$HOME/.climrisk/engine.env" ] && . "$HOME/.climrisk/engine.env"; set +a
cd "$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine" && export PYTHONPATH="$PWD/src"
"$PY" -m cri.llmtrain.collect "$HERE/llm" 2>&1 | tee "$HERE/llm/collect.log"
echo done > "$HERE/llm/COLLECT_DONE"
