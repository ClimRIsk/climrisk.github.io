#!/bin/bash
# ClimRisk Model Lab: real-data end-to-end test ON THIS MAC. Log: mac-test/lab.log, results: mac-test/lab-e2e.json, reports: mac-test/out/
HERE="$(cd "$(dirname "$0")" && pwd)"
ENGINE="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
PY="$HOME/.climrisk/engine-venv/bin/python"
LOG="$HERE/lab.log"; : > "$LOG"; exec > >(tee -a "$LOG") 2>&1
rm -f "$HERE/LAB_DONE" "$HERE/lab-e2e.json"; rm -rf "$HERE/out"
echo "== engine deps"; "$PY" -m pip install -q -e "$ENGINE[api]" pytest 2>&1 | tail -2; "$PY" -c "import cri;print('engine',cri.__version__)"
curl -fsS --max-time 2 http://127.0.0.1:11434/api/tags >/dev/null 2>&1 || { O=$(command -v ollama || echo /opt/homebrew/bin/ollama); nohup "$O" serve > "$HERE/ollama.log" 2>&1 & sleep 4; }
echo "== Model Lab tests on this Mac"; cd "$ENGINE"
CRI_DATA_DIR="$HERE/data-labtests" CRI_STORY_OFFLINE=1 CRI_LLM=0 CRI_AUTOPILOT=0 "$PY" -m pytest tests/test_modellab.py tests/test_modellab_hazards.py -q -p no:cacheprovider 2>&1 | tail -6
echo "== live engine"; export CRI_DATA_DIR="$HERE/data-lab" CRI_AUTOPILOT=0; rm -rf "$CRI_DATA_DIR"
nohup "$PY" -m uvicorn cri.api.main:app --host 127.0.0.1 --port 8793 --log-level warning > "$HERE/lab-engine.log" 2>&1 &
EP=$!
for i in $(seq 1 60); do curl -fsS --max-time 2 http://127.0.0.1:8793/health >/dev/null 2>&1 && break; sleep 1; done
curl -fsS http://127.0.0.1:8793/health; echo
E2E_OUT="$HERE" "$PY" "$HERE/mac_lab_e2e.py"
kill $EP 2>/dev/null; date > "$HERE/LAB_DONE"; echo "== done"
