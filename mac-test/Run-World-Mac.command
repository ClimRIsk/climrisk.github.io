#!/bin/bash
# One double-click. Detaches from Terminal (safe to close), keeps the Mac awake, then runs unattended. Everything is resumable: run it again and it carries on.
# v5 = v4 plus data from all over the world. It replaces the v4 run (the work v4 already collected is kept and reused).
#   1 US company disclosures (resumes where v4 stopped)      2 foreign-company filings (20-F, 6-K, 40-F) for the ~44 non-US events
#   3 national statistics around each non-US event (World Bank)   4 check the hand-written case cards against their sources (incl. the new non-US cards)
#   5 company financials from SEC structured data (XBRL)     6 build dataset v5 and the case index the app searches
#   7 train v5   8 evaluate v5 against v4 and v2 on held-out events   9 promote the best model (never a worse one)
#   10 put the new engine and index into the installed app and run the investor-demo check   11 write the model validation pack
# Log: mac-test/llm/world.log   Marker when finished: mac-test/llm/WORLD_DONE   Keep the Mac on power, lid open.
HERE="$(cd "$(dirname "$0")" && pwd)"; L="$HERE/llm"; LOG="$L/world.log"
if [ -z "$WORLD_CHILD" ]; then
  mkdir -p "$L"; rm -f "$L/WORLD_DONE"
  WORLD_CHILD=1 nohup caffeinate -dimsu bash "$0" >> "$LOG" 2>&1 &
  echo "Started in the background (pid $!). You can close this window. Log: $LOG"; exit 0
fi
export PATH="/opt/homebrew/bin:$PATH"
say(){ printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
PY="$HOME/.climrisk/engine-venv/bin/python"
SRC="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
export PYTHONPATH="$SRC/src"
cd "$SRC" || exit 1
say "=== v5 (world) run started ==="
pgrep -f "ollama serve" >/dev/null || (ollama serve >/dev/null 2>&1 &); sleep 3

say "0/11 v4 is superseded by v5 (same data plus the world data). Stopping it; what it already collected is kept."
pkill -f "Run-V4-Mac.command" 2>/dev/null; pkill -f "Run-Cases-Mac.command" 2>/dev/null; pkill -f "Train-LLM-Mac.command" 2>/dev/null
pkill -f "cri.llmtrain.edgar_cases" 2>/dev/null; pkill -f "cri.llmtrain.xbrl_fin" 2>/dev/null; sleep 2; pkill -f "mlx_lm" 2>/dev/null; sleep 5
rm -rf "$HOME/.climrisk/llm.lock" 2>/dev/null

say "1/11 US company disclosures (resumes)"
if [ ! -f "$L/edgar/MERGE_DONE" ]; then
  "$PY" -m cri.llmtrain.edgar_cases collect "$L/edgar" --max-docs-per-event 140 --merge && date > "$L/edgar/MERGE_DONE" || say "edgar US pass reported an error (will resume on the next run)"
fi

say "2/11 foreign-company filings (20-F, 6-K, 40-F) for the non-US events"
if [ ! -f "$L/edgar/FPI_DONE" ]; then
  ONLY=$("$PY" -c "from cri.llmtrain.edgar_cases import GLOBAL_EVENTS; print(','.join(e[0] for e in GLOBAL_EVENTS))")
  "$PY" -m cri.llmtrain.edgar_cases collect "$L/edgar" --max-docs-per-event 100 --merge --forms 20-F,6-K,40-F --pass fpi --fallback 6-K --only "$ONLY" && date > "$L/edgar/FPI_DONE" || say "edgar foreign pass reported an error (will resume on the next run)"
fi
cat "$L/edgar/edgar_summary.json" 2>/dev/null

say "3/11 national statistics around non-US events (World Bank open data)"
"$PY" -m cri.llmtrain.worldbank_fin collect "$L/world" || say "world bank collect reported an error"

say "4/11 verify the case cards against their sources"
"$PY" - <<PYEOF
import json, os
f="$L/cases_verified.json"
if os.path.exists(f):
    v=json.load(open(f)); keys=[k for k in v if "#src" not in k]
    st=[v[k].get("status") for k in keys]
    why=None
    if st and st.count("verified")==0 and st.count("unfetchable") > 0.5*len(st): why="made while sources were unreachable"
    elif not any(k.startswith("mcmurray-2016") for k in keys): why="made before the non-US cards were added"
    if why: os.rename(f, f+".old"); print("discarded the old verification file:", why)
PYEOF
for i in 1 2 3; do
  [ -f "$L/cases_verified.json" ] && break
  "$PY" -m cri.llmtrain.cases verify "$L/cases_verified.json" || { say "verify attempt $i failed; waiting 2 minutes"; sleep 120; }
done

say "5/11 company financials from SEC XBRL"
"$PY" -m cri.llmtrain.xbrl_fin collect "$L/edgar/edgar_cases.jsonl" "$L/xbrl" || say "xbrl collect reported an error"

say "6/11 build dataset v5 and the case index"
rm -rf "$L/ds5"
"$PY" -m cri.llmtrain.dataset "$L" "$L/ds5" --v2 --cases "$L/cases_verified.json" --edgar "$L/edgar/edgar_cases.jsonl" || say "dataset v5 failed"
IDX="$HOME/.climrisk/case_index.jsonl"; mkdir -p "$HOME/.climrisk"
EXTRA=""; [ -f "$L/world/macro_items.jsonl" ] && EXTRA="--macro $L/world/macro_items.jsonl"
"$PY" -m cri.resident.casebase build "$L/cases_verified.json" "$L/edgar/edgar_cases.jsonl" "$IDX" --xbrl "$L/xbrl/xbrl_items.jsonl" $EXTRA || say "case index build failed"
mkdir -p "$SRC/src/cri/resident/data" && cp "$IDX" "$SRC/src/cri/resident/data/case_index.jsonl"
"$PY" - <<PYEOF 2>&1 | tee "$L/world_summary.json"
import json, os
os.environ["CRI_CASE_INDEX"]="$IDX"
from cri.resident import casebase as CB
L="$L"; st=CB.stats()
v=json.load(open(L+"/cases_verified.json")) if os.path.exists(L+"/cases_verified.json") else {}
s=[x.get("status") for k,x in v.items() if "#src" not in k]
r=json.load(open(L+"/ds5/dataset_report.json")) if os.path.exists(L+"/ds5/dataset_report.json") else {}
w=json.load(open(L+"/world/macro_report.json")) if os.path.exists(L+"/world/macro_report.json") else {}
out={"index": st, "curated_fact_status": {k: s.count(k) for k in set(s)}, "world_bank": w, "dataset_v5": r,
     "company_event_cases_total": st["company_event_cases"], "meets_1000_minimum": st["company_event_cases"] >= 1000}
print(json.dumps(out, indent=1))
PYEOF

say "7/11 train v5 (about 5 hours; waits for any running job)"
if [ -f "$L/ds5/train.jsonl" ] && ! ollama list | grep -q "^climrisk-llm-v5"; then
  ITERS=1200 TAG=v5 DS="$L/ds5" NAME=climrisk-llm-v5 bash "$HERE/Train-LLM-Mac.command" || say "v5 train/import failed (see train_v5.log)"
fi

say "8/11 evaluate v5 against the earlier models on held-out events"
if ollama list | grep -q "^climrisk-llm-v5"; then
  M="climrisk-llm-v5"; for p in v4 v3; do ollama list | grep -q "^climrisk-llm-$p" && M="$M climrisk-llm-$p"; done; M="$M climrisk-llm-v2"
  DS="$L/ds5" OUTJ="$L/eval_v5.json" MODELS="$M" LIMIT=20 bash "$HERE/Eval-LLM-Mac.command" || say "eval v5 failed"
fi

say "9/11 promote the best model for the app"
[ -f "$L/eval_v5.json" ] && "$PY" -m cri.llmtrain.pick "$L/eval_v5.json" | tee "$L/pick_v5.json"

say "10/11 install into the app and run the investor-demo check on the app's own copy"
bash "$HERE/Sync-App-Mac.command" || say "app sync reported an error"
cd "$SRC" && "$PY" -m cri.resident.demo_check "$L/demo_v5.json" --n 36 | tee "$L/demo_v5.txt" || say "demo check failed"

say "11/11 write the model validation pack from the real results"
"$PY" - <<PYEOF
import os
from pathlib import Path
from cri import riskmgmt as RM
L="$L"
p=RM.validation_pack(L+"/demo_v5.json", L+"/eval_v5.json", None, {"world_summary": __import__("json").load(open(L+"/world_summary.json")) if os.path.exists(L+"/world_summary.json") else None})
Path(L+"/validation_pack_v5.md").write_text(p["markdown"]); print("wrote", L+"/validation_pack_v5.md", {k: v for k, v in p.items() if k != "markdown"})
PYEOF
echo done > "$L/WORLD_DONE"; say "=== v5 (world) run finished ==="
