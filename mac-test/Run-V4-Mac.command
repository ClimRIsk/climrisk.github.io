#!/bin/bash
# One double-click. Detaches from Terminal (safe to close), keeps the Mac awake, then runs unattended. Everything is resumable.
#   1 collect MORE company disclosures from SEC EDGAR (50 extra events + retries of the ones that failed) -> 1,000+ company-event cases
#   2 verify the hand-curated case cards against their source pages (retries; refuses to record a network outage as a result)
#   3 collect company financials around each event from the SEC's structured data (XBRL)
#   4 build dataset v4   5 build the case index the app searches (installed into ~/.climrisk and into the engine package)
#   6 train v4 (waits for any running training/eval to finish first)   7 evaluate v4 against the earlier models on held-out events
#   8 promote the best model for the app (never promotes a worse one)   9 run the investor-demo check and record speed and honesty
# Log: mac-test/llm/v4.log   Marker when finished: mac-test/llm/V4_DONE   Keep the Mac on power, lid open.
HERE="$(cd "$(dirname "$0")" && pwd)"; L="$HERE/llm"; LOG="$L/v4.log"
if [ -z "$V4_CHILD" ]; then
  mkdir -p "$L"; rm -f "$L/V4_DONE"
  V4_CHILD=1 nohup caffeinate -dimsu bash "$0" >> "$LOG" 2>&1 &
  echo "Started in the background (pid $!). You can close this window. Log: $LOG"; exit 0
fi
export PATH="/opt/homebrew/bin:$PATH"
say(){ printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
PY="$HOME/.climrisk/engine-venv/bin/python"
SRC="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
export PYTHONPATH="$SRC/src"
cd "$SRC" || exit 1
say "=== v4 run started ==="
pgrep -f "ollama serve" >/dev/null || (ollama serve >/dev/null 2>&1 &); sleep 3

say "0/9 v3 is superseded: it trained on only 4 of the 26 case cards (the source check ran while the network was down). Stopping it so v4 gets the whole machine."
pkill -f "Run-Cases-Mac.command" 2>/dev/null; pkill -f "Train-LLM-Mac.command" 2>/dev/null; sleep 2; pkill -f "mlx_lm" 2>/dev/null; sleep 5
rm -rf "$HOME/.climrisk/llm.lock" 2>/dev/null

say "1/9 collect more company disclosures (extra events and retries)"
if [ ! -f "$L/edgar/MERGE_DONE" ]; then
  "$PY" -m cri.llmtrain.edgar_cases collect "$L/edgar" --max-docs-per-event 140 --merge && date > "$L/edgar/MERGE_DONE" || say "edgar merge reported an error (will retry on the next run)"
fi
cat "$L/edgar/edgar_summary.json" 2>/dev/null

say "2/9 verify curated case cards against their sources"
# a verification file made while the network was down marks every fact 'unfetchable'; throw that one away
"$PY" - <<PYEOF
import json, os
f="$L/cases_verified.json"
if os.path.exists(f):
    v=json.load(open(f)); st=[x.get("status") for k,x in v.items() if "#src" not in k]
    if st and st.count("verified")==0 and st.count("unfetchable") > 0.5*len(st):
        os.rename(f, f+".bad"); print("discarded a verification file made while sources were unreachable")
PYEOF
for i in 1 2 3; do
  [ -f "$L/cases_verified.json" ] && break
  "$PY" -m cri.llmtrain.cases verify "$L/cases_verified.json" || { say "verify attempt $i failed; waiting 2 minutes"; sleep 120; }
done

say "3/9 company financials from SEC XBRL"
"$PY" -m cri.llmtrain.xbrl_fin collect "$L/edgar/edgar_cases.jsonl" "$L/xbrl" || say "xbrl collect reported an error"

say "4/9 build dataset v4"
rm -rf "$L/ds4"
"$PY" -m cri.llmtrain.dataset "$L" "$L/ds4" --v2 --cases "$L/cases_verified.json" --edgar "$L/edgar/edgar_cases.jsonl" || say "dataset v4 failed"

say "5/9 build the case index for the app"
IDX="$HOME/.climrisk/case_index.jsonl"; mkdir -p "$HOME/.climrisk"
"$PY" -m cri.resident.casebase build "$L/cases_verified.json" "$L/edgar/edgar_cases.jsonl" "$IDX" --xbrl "$L/xbrl/xbrl_items.jsonl" || say "case index build failed"
cp "$IDX" "$SRC/src/cri/resident/data/case_index.jsonl" 2>/dev/null || { mkdir -p "$SRC/src/cri/resident/data" && cp "$IDX" "$SRC/src/cri/resident/data/case_index.jsonl"; }
"$PY" - <<PYEOF 2>&1 | tee "$L/v4_summary.json"
import json, os
os.environ["CRI_CASE_INDEX"]="$IDX"
from cri.resident import casebase as CB
L="$L"
st=CB.stats()
v=json.load(open(L+"/cases_verified.json")) if os.path.exists(L+"/cases_verified.json") else {}
s=[x.get("status") for k,x in v.items() if "#src" not in k]
r=json.load(open(L+"/ds4/dataset_report.json")) if os.path.exists(L+"/ds4/dataset_report.json") else {}
out={"index": st, "curated_fact_status": {k: s.count(k) for k in set(s)}, "dataset_v4": r,
     "company_event_cases_total": st["company_event_cases"], "meets_1000_minimum": st["company_event_cases"] >= 1000}
print(json.dumps(out, indent=1))
PYEOF

say "6/9 train v4 (about 4 hours; waits for any running job)"
if [ -f "$L/ds4/train.jsonl" ] && ! ollama list | grep -q "^climrisk-llm-v4"; then
  ITERS=1200 TAG=v4 DS="$L/ds4" NAME=climrisk-llm-v4 bash "$HERE/Train-LLM-Mac.command" || say "v4 train/import failed (see train_v4.log)"
fi

say "7/9 evaluate v4 against the earlier models on held-out events"
if ollama list | grep -q "^climrisk-llm-v4"; then
  M="climrisk-llm-v4"; ollama list | grep -q "^climrisk-llm-v3" && M="$M climrisk-llm-v3"; M="$M climrisk-llm-v2"
  DS="$L/ds4" OUTJ="$L/eval_v4.json" MODELS="$M" LIMIT=20 bash "$HERE/Eval-LLM-Mac.command" || say "eval v4 failed"
fi

say "8/9 promote the best model for the app"
[ -f "$L/eval_v4.json" ] && "$PY" -m cri.llmtrain.pick "$L/eval_v4.json" | tee "$L/pick_v4.json"

say "9/9 investor-demo check (speed and honesty on this Mac)"
"$PY" -m cri.resident.demo_check "$L/demo_v4.json" --n 36 | tee "$L/demo_v4.txt" || say "demo check failed"
echo done > "$L/V4_DONE"; say "=== v4 run finished ==="
