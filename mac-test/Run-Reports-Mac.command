#!/bin/bash
# Collects what companies say in their OWN published climate reports (TCFD / IFRS S2 / resilience studies) about physical risk and adaptation.
# Takes a few minutes. Safe to run while the v5 training is running: it only downloads the listed documents and writes mac-test/llm/reports/.
#  - If v5 has not built its dataset yet, v5 picks the reports up automatically (stage 6).
#  - If v5 has finished, this also rebuilds the case index and refreshes the app, so the new passages are searchable right away (no retraining needed:
#    the model answers from the passages it is shown).
# To add more reports: put {"company","year","url","region"} entries in mac-test/llm/reports_extra.json and run this again.
# Log: mac-test/llm/reports.log   Result: mac-test/llm/reports/report_summary.json
HERE="$(cd "$(dirname "$0")" && pwd)"; L="$HERE/llm"; mkdir -p "$L"
exec > >(tee -a "$L/reports.log") 2>&1
export PATH="/opt/homebrew/bin:$PATH"
PY="$HOME/.climrisk/engine-venv/bin/python"
SRC="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
export PYTHONPATH="$SRC/src"; cd "$SRC" || exit 1
echo "[$(date +%H:%M:%S)] reports run started"
"$PY" -c "import pypdf" 2>/dev/null || "$PY" -m pip install --quiet pypdf || echo "could not install pypdf: PDF reports will be skipped"
EXTRA=""; [ -f "$L/reports_extra.json" ] && EXTRA="--seeds $L/reports_extra.json"
"$PY" -m cri.llmtrain.reports collect "$L/reports" $EXTRA
if [ -f "$L/WORLD_DONE" ]; then
  echo "[$(date +%H:%M:%S)] v5 is finished: rebuilding the case index with the reports and refreshing the app"
  IDX="$HOME/.climrisk/case_index.jsonl"
  MAC=""; [ -f "$L/world/macro_items.jsonl" ] && MAC="--macro $L/world/macro_items.jsonl"
  "$PY" -m cri.resident.casebase build "$L/cases_verified.json" "$L/edgar/edgar_cases.jsonl" "$IDX" --xbrl "$L/xbrl/xbrl_items.jsonl" $MAC --reports "$L/reports/report_cases.jsonl" && cp "$IDX" "$SRC/src/cri/resident/data/case_index.jsonl"
  bash "$HERE/Sync-App-Mac.command"
else
  echo "[$(date +%H:%M:%S)] v5 is still running: it will include these reports when it builds its dataset and index. Nothing else to do."
fi
echo "[$(date +%H:%M:%S)] reports run finished"; echo done > "$L/REPORTS_DONE"
