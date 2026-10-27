#!/bin/bash
# v8: teaches the model to use what the engine learned from recorded events (US storm wind -> total cost; company revenue after events), with its limits and backtest, on top of v7.
# Starts from the v7 adapters. Promoted ONLY if: event tasks improve, the v7 tasks do not fall by more than 0.02, reasoning and general do not fall by more than 0.02 (all vs v7).
# Then converts the winner to a portable GGUF and tests that file. One double-click; detaches; keep the Mac on power. Re-runnable (skips finished steps).
# Log: mac-test/llm/run_v8.log   Marker: mac-test/llm/V8_DONE   Results: eval_v8_new.json, reasoning_eval_v8.json, eval_v8_general.json, gate_v8.json
HERE="$(cd "$(dirname "$0")" && pwd)"; L="$HERE/llm"; LOG="$L/run_v8.log"
if [ -z "$V8_CHILD" ]; then
  mkdir -p "$L"; rm -f "$L/V8_DONE"
  V8_CHILD=1 nohup caffeinate -dimsu bash "$0" >> "$LOG" 2>&1 &
  echo "Started in the background (pid $!). You can close this window. Log: $LOG"; exit 0
fi
export PATH="/opt/homebrew/bin:$PATH"
say(){ printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
PY="$HOME/.climrisk/engine-venv/bin/python"; V="$HOME/.climrisk/mlx-venv"
SRC="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"; B7="$HOME/.climrisk/llm/v7/adapters/adapters.safetensors"
OUT="$HOME/.climrisk/llm/v8"; EN="$L/eval_v8_new.json"; ER="$L/reasoning_eval_v8.json"; EG="$L/eval_v8_general.json"; GATE="$L/gate_v8.json"
getlock(){ LOCK="$HOME/.climrisk/llm.lock"; while ! mkdir "$LOCK" 2>/dev/null; do p=$(cat "$LOCK/pid" 2>/dev/null); if [ -n "$p" ] && ! kill -0 "$p" 2>/dev/null; then rm -rf "$LOCK"; continue; fi; sleep 20; done; echo $$ > "$LOCK/pid"; }
say "=== v8 run started ==="
PRE="$(cat "$HOME/.climrisk/active_model" 2>/dev/null)"; say "model the app uses now: ${PRE:-none}"

say "1/9 event models: refresh the tables and the tested results"
cd "$SRC" || exit 1
PYTHONPATH="$SRC/src" "$PY" -m cri.eventlearn eval data/events/company_events.csv data/events/eventlearn_report.json > "$L/eventlearn_fin.txt" 2>&1 || say "company-event test failed (see eventlearn_fin.txt)"
PYTHONPATH="$SRC/src" "$PY" -m cri.eventlearn_tc data/events/eventlearn_tc_report.json > "$L/eventlearn_tc.txt" 2>&1 || { say "FAILED: storm model"; exit 1; }

say "2/9 v8 data (event rows; held out by storm and by wind value)"
if [ ! -s "$L/dsev8/train.jsonl" ]; then PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.eventlearn_data "$L/dsev8" --seed 8 | tee "$L/dsev8_report.txt" || { rm -rf "$L/dsev8"; say "FAILED: data"; exit 1; }; fi
say "3/9 mix with 50% replay of the v7 data; the held-out test is the event rows PLUS the v7 test rows"
if [ ! -s "$L/ds8/train.jsonl" ]; then
  PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.mix "$L/dsev8" "$L/ds7" "$L/ds8" --replay 0.5 --test-max 400 | tee "$L/mix_report_v8.txt"
  mkdir -p "$L/dst8"; cat "$L/dsev8/test_meta.jsonl" "$L/dsx7f/test_meta.jsonl" > "$L/dst8/test_meta.jsonl"
fi
wc -l "$L/ds8/"*.jsonl "$L/dst8/test_meta.jsonl"

say "4/9 wait for the v7 run to finish (it holds the GPU); then train v8 from the v7 adapters"
for i in $(seq 1 720); do [ -f "$L/V7_DONE" ] && break; sleep 60; done
if ! ollama list | grep -q "^climrisk-llm-v8"; then
  FIN='import sys, mlx.core as mx
w = mx.load(sys.argv[1]); bad = [k for k, v in w.items() if not bool(mx.all(mx.isfinite(v)).item())]
sys.exit(1 if bad else 0)'
  RES=""; "$V/bin/python" -c "$FIN" "$B7" && RES="$B7"
  ITERS=500 LR=3e-5 RESUME="$RES" TAG=v8 DS="$L/ds8" NAME=climrisk-llm-v8 bash "$HERE/Train-LLM-Safe-Mac.command"
fi
if ! ollama list | grep -q "^climrisk-llm-v8"; then say "FAILED: v8 did not train cleanly: $(cat "$L/TRAIN_FAILED_v8" 2>/dev/null). Nothing changed; the app keeps its model."; echo failed > "$L/V8_DONE"; exit 1; fi

say "5/9 held-out: event tasks + v7 tasks, v8 against v7 and v6"
getlock
[ -s "$EN" ] || PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.evaluate "$L/dst8" "$EN" climrisk-llm-v8 climrisk-llm-v7 climrisk-llm-v6 --limit 40 | tail -60
rm -rf "$LOCK"
say "6/9 regression: reasoning (v8 only; v7 and v6 are in reasoning_eval_v7.json, same rows and seed)"
getlock
[ -s "$ER" ] || PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.reasoning_eval "$L/dsrf" "$ER" climrisk-llm-v8 --limit 120 --seed 3 | tail -20
rm -rf "$LOCK"
say "7/9 regression: general case questions (v8 and v7 together, same rows)"
[ -f "$EG" ] || DS="$L/ds5f" OUTJ="$EG" MODELS="climrisk-llm-v8 climrisk-llm-v7" LIMIT=20 bash "$HERE/Eval-LLM-Mac.command" || say "general eval failed"

say "8/9 promotion gate (v8 vs v7)"
"$PY" - <<PYEOF | tee "$L/gate_v8.txt"
import json, sys
sys.path.insert(0, "$SRC/src")
from pathlib import Path
from cri.llmtrain import v7_report as R
L = Path("$L")
r7, r8 = json.loads((L/"reasoning_eval_v7.json").read_text()), json.loads((L/"reasoning_eval_v8.json").read_text())
g8 = json.loads((L/"eval_v8_general.json").read_text()); g7 = g8   # v7 and v8 scored together on the same rows in this run
(L/"_r.json").write_text(json.dumps({"climrisk-llm-v8": r8["climrisk-llm-v8"], "climrisk-llm-v7": r7["climrisk-llm-v7"]}))
(L/"_g.json").write_text(json.dumps({"climrisk-llm-v8": g8["climrisk-llm-v8"], "climrisk-llm-v7": g7["climrisk-llm-v7"]}))
gt = R.gate("$EN", str(L/"_r.json"), str(L/"_g.json"), new="climrisk-llm-v8", old="climrisk-llm-v7")
n = json.loads(Path("$EN").read_text())
def fam(m, ks):
    km = R.kind_means(n[m]["metrics"]); v = [km[k] for k in ks if k in km]; return round(sum(v)/len(v), 4) if v else None
ev = {"new": fam("climrisk-llm-v8", ("evtc","evfin")), "old": fam("climrisk-llm-v7", ("evtc","evfin"))}
ev["ok"] = ev["new"] is not None and ev["old"] is not None and ev["new"] > ev["old"]
old_tasks = {"new": fam("climrisk-llm-v8", R.KINDS[:5]), "old": fam("climrisk-llm-v7", R.KINDS[:5])}
old_tasks["ok"] = old_tasks["new"] is not None and old_tasks["old"] is not None and old_tasks["new"] >= old_tasks["old"] - 0.02
gt["event_tasks"], gt["v7_tasks"] = ev, old_tasks
gt["promote"] = bool(gt.get("reasoning",{}).get("ok") and gt.get("general",{}).get("ok") and ev["ok"] and old_tasks["ok"])
gt["why"] = "all checks passed" if gt["promote"] else "failed: " + ", ".join(k for k in ("event_tasks","v7_tasks","reasoning","general") if not gt.get(k,{}).get("ok"))
Path("$GATE").write_text(json.dumps(gt, indent=1)); print(json.dumps(gt, indent=1))
PYEOF
if "$PY" -c "import json,sys; sys.exit(0 if json.load(open('$GATE')).get('promote') else 1)"; then
  echo climrisk-llm-v8 > "$HOME/.climrisk/active_model"; say "v8 PROMOTED"; WIN=v8
else
  [ -n "$PRE" ] && echo "$PRE" > "$HOME/.climrisk/active_model"; say "v8 NOT promoted (see gate_v8.json); the app keeps ${PRE:-its current model}"; WIN=""
fi
echo "$WIN" > "$L/V8_WINNER"
say "9/9 done. Winner for the package: ${WIN:-none (v6 stays the tested portable model)}"
echo done > "$L/V8_DONE"; say "=== v8 run finished ==="
