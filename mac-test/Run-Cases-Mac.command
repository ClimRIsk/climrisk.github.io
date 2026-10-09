#!/bin/bash
# One double-click. Detaches from Terminal (safe to close), keeps the Mac awake, then runs unattended:
#   1 collect real company disclosures about named climate events from SEC EDGAR (public filings, verbatim quotes, 1,000+ company-event cases)
#   2 verify the hand-curated case cards against their source pages
#   3 build dataset v3 (v1 + v2 + cases)   4 train v3   5 evaluate v3 vs v2 on held-out EVENTS (events the model never saw)
# Resumable. Log: mac-test/llm/cases.log   Marker when finished: mac-test/llm/CASES_DONE   Keep the Mac on power, lid open.
HERE="$(cd "$(dirname "$0")" && pwd)"; L="$HERE/llm"; LOG="$L/cases.log"
if [ -z "$CASES_CHILD" ]; then
  mkdir -p "$L"; rm -f "$L/CASES_DONE"
  CASES_CHILD=1 nohup caffeinate -dimsu bash "$0" >> "$LOG" 2>&1 &
  echo "Started in the background (pid $!). You can close this window. Log: $LOG"; exit 0
fi
export PATH="/opt/homebrew/bin:$PATH"
say(){ printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
PY="$HOME/.climrisk/engine-venv/bin/python"
SRC="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
export PYTHONPATH="$SRC/src"
cd "$SRC" || exit 1
say "=== cases run started ==="
pgrep -f "ollama serve" >/dev/null || (ollama serve >/dev/null 2>&1 &); sleep 3

say "1/5 collect company disclosures from SEC EDGAR (about 1 hour)"
if [ ! -f "$L/edgar/edgar_summary.json" ]; then
  "$PY" -m cri.llmtrain.edgar_cases collect "$L/edgar" --max-docs-per-event 140 || say "edgar collect reported an error"
fi
cat "$L/edgar/edgar_summary.json" 2>/dev/null

say "2/5 verify curated case cards against their sources"
[ -f "$L/cases_verified.json" ] || "$PY" -m cri.llmtrain.cases verify "$L/cases_verified.json" || say "verify failed"

say "3/5 build dataset v3"
if [ ! -f "$L/ds3/train.jsonl" ]; then
  "$PY" -m cri.llmtrain.dataset "$L" "$L/ds3" --v2 --cases "$L/cases_verified.json" --edgar "$L/edgar/edgar_cases.jsonl" || say "dataset v3 failed"
fi
"$PY" - <<PYEOF 2>&1 | tee "$L/cases_summary.json"
import json, os
L="$L"
e=json.load(open(L+"/edgar/edgar_summary.json")) if os.path.exists(L+"/edgar/edgar_summary.json") else {}
v=json.load(open(L+"/cases_verified.json")) if os.path.exists(L+"/cases_verified.json") else {}
st=[x.get("status") for k,x in v.items() if "#src" not in k]
r=json.load(open(L+"/ds3/dataset_report.json")) if os.path.exists(L+"/ds3/dataset_report.json") else {}
out={"company_event_cases_from_filings": e.get("company_event_cases"), "companies": e.get("companies"), "events": e.get("events"), "quotes": e.get("quotes"),
     "curated_cards_facts": {s: st.count(s) for s in set(st)}, "dataset_v3": r}
out["meets_1000_minimum"] = bool((e.get("company_event_cases") or 0) >= 1000)
print(json.dumps(out, indent=1))
PYEOF

say "4/5 train v3 (about 3 hours)"
if [ -f "$L/ds3/train.jsonl" ] && ! ollama list | grep -q "^climrisk-llm-v3"; then
  ITERS=1000 TAG=v3 DS="$L/ds3" NAME=climrisk-llm-v3 bash "$HERE/Train-LLM-Mac.command" || say "v3 train/import failed (see train_v3.log)"
fi

say "5/5 evaluate v3 vs v2 on held-out events"
if ollama list | grep -q "^climrisk-llm-v3"; then
  DS="$L/ds3" OUTJ="$L/eval_v3.json" MODELS="climrisk-llm-v3 climrisk-llm-v2" LIMIT=15 bash "$HERE/Eval-LLM-Mac.command" || say "eval v3 failed"
fi
echo done > "$L/CASES_DONE"; say "=== cases run finished ==="
