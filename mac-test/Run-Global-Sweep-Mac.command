#!/bin/bash
# ClimRisk global sweep ON THIS MAC: every hazard at 36 sites across the world's climate zones. Log: mac-test/sweep.log, data: mac-test/sweep/sweep.jsonl, summary: mac-test/sweep/report.md
HERE="$(cd "$(dirname "$0")" && pwd)"
ENGINE="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
PY="$HOME/.climrisk/engine-venv/bin/python"
LOG="$HERE/sweep.log"; : > "$LOG"; exec > >(tee -a "$LOG") 2>&1
rm -f "$HERE/SWEEP_DONE"; rm -rf "$HERE/sweep"; mkdir -p "$HERE/sweep"
echo "== engine"; "$PY" -m pip install -q -e "$ENGINE[api]" pytest 2>&1 | tail -1; "$PY" -c "import cri;print('engine',cri.__version__)"
cd "$ENGINE"
echo "== tests"; CRI_DATA_DIR="$HERE/data-sweeptests" CRI_STORY_OFFLINE=1 CRI_LLM=0 CRI_AUTOPILOT=0 CRI_NO_RETRY_SLEEP=1 "$PY" -m pytest tests/test_modellab_hazards.py -q -p no:cacheprovider 2>&1 | tail -3
echo "== sweep (4 parallel shards; this takes 10-25 minutes)"
for s in 0 1 2 3; do PYTHONPATH=src "$PY" tools/global_sweep.py "$HERE/sweep" all $s 4 > "$HERE/sweep/shard$s.log" 2>&1 & done
wait
"$PY" tools/sweep_report.py "$HERE/sweep/sweep.jsonl" > "$HERE/sweep/report.md"
cat "$HERE/sweep/report.md"
date > "$HERE/SWEEP_DONE"; echo "== done"
