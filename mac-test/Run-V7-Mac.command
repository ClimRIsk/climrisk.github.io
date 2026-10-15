#!/bin/bash
# Trains v7 (stress-test, scenario-list, site-profile, chat and reference-answer tasks on top of v6) and measures it on rows it never saw. One double-click; detaches from Terminal; keep the Mac on power with the lid open. Re-runnable (skips finished steps).
#   1 internet  2 build the v7 data from the engine  3 drop rows that do not fit the training window  4 mix 70% new tasks / 30% replay of the v6 data (so reasoning is not forgotten)
#   5 train v7 from the v6 adapters (NaN watchdog; retries once at a lower learning rate)  6 held-out evaluation of the new tasks: v7, v6, v5b, qwen2.5:7b, llama3.2:3b
#   7 regression: reasoning (v7 vs v6)  8 regression: general case questions (v7 vs v6)  9 promotion gate (v7 is promoted ONLY if it beats v6 on the new tasks and does not fall on the other two)  10 app sync + investor report
# Log: mac-test/llm/run_v7.log   Marker when finished: mac-test/llm/V7_DONE   Results: eval_v7_new.json, reasoning_eval_v7.json, eval_v7_general.json, gate_v7.json, investor_report_v7.md
HERE="$(cd "$(dirname "$0")" && pwd)"; L="$HERE/llm"; LOG="$L/run_v7.log"
if [ -z "$V7_CHILD" ]; then
  mkdir -p "$L"; rm -f "$L/V7_DONE"
  V7_CHILD=1 nohup caffeinate -dimsu bash "$0" >> "$LOG" 2>&1 &
  echo "Started in the background (pid $!). You can close this window. Log: $LOG"; exit 0
fi
export PATH="/opt/homebrew/bin:$PATH"
say(){ printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
PY="$HOME/.climrisk/engine-venv/bin/python"; V="$HOME/.climrisk/mlx-venv"
SRC="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"; B6="$HOME/.climrisk/llm/v6/adapters/adapters.safetensors"
OUT="$HOME/.climrisk/llm/v7"; EN="$L/eval_v7_new.json"; ER="$L/reasoning_eval_v7.json"; EG="$L/eval_v7_general.json"; GATE="$L/gate_v7.json"
say "=== v7 run started ==="
PRE="$(cat "$HOME/.climrisk/active_model" 2>/dev/null)"; say "model the app uses now: ${PRE:-none}"
pgrep -f "ollama serve" >/dev/null || (ollama serve >/dev/null 2>&1 &); sleep 3
FIN='import sys, mlx.core as mx
w = mx.load(sys.argv[1]); bad = [k for k, v in w.items() if not bool(mx.all(mx.isfinite(v)).item())]
print(sys.argv[1].split("/")[-1], len(w), "tensors,", len(bad), "non-finite"); sys.exit(1 if bad else 0)'
getlock(){ LOCK="$HOME/.climrisk/llm.lock"; while ! mkdir "$LOCK" 2>/dev/null; do p=$(cat "$LOCK/pid" 2>/dev/null); if [ -n "$p" ] && ! kill -0 "$p" 2>/dev/null; then rm -rf "$LOCK"; continue; fi; sleep 20; done; echo $$ > "$LOCK/pid"; }

say "1/10 internet check (the app sync needs it)"
ONLINE=0; for i in $(seq 1 40); do if curl -sI -m 8 https://pypi.org >/dev/null 2>&1; then ONLINE=1; break; fi; [ "$i" = 1 ] && say "offline; waiting up to 20 minutes"; sleep 30; done; say "online: $ONLINE"

say "2/10 v7 data from the engine (stress runs, scenario list, site profiles, chat, reference answers)"
if [ ! -s "$L/dsx7/train.jsonl" ]; then
  PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.v7_data "$L/dsx7" --stress 900 --seed 7 | tee "$L/dsx7_report.txt" || { rm -rf "$L/dsx7"; say "FAILED: data build"; exit 1; }
fi
cp "$L/dsx7/v7_report.json" "$L/v7_data_report.json" 2>/dev/null; wc -l "$L/dsx7/"*.jsonl

say "3/10 length filter"
if [ ! -s "$L/dsx7f/train.jsonl" ]; then
  "$V/bin/python" "$SRC/src/cri/llmtrain/lengthfilter.py" "$L/dsx7" "$L/dsx7f" 2>&1 | tee "$L/length_report_v7.txt"
  [ "${PIPESTATUS[0]}" -eq 0 ] || { rm -rf "$L/dsx7f"; say "FAILED: length filter dropped too many rows (see length_report_v7.txt)"; exit 1; }
fi
wc -l "$L/dsx7f/"*.jsonl

say "4/10 mix: new tasks + 30% replay of the v6 data (reasoning and earlier tasks)"
[ -s "$L/ds7/train.jsonl" ] || PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.mix "$L/dsx7f" "$L/ds6" "$L/ds7" --replay 0.3 --test-max 400 | tee "$L/mix_report_v7.txt"
wc -l "$L/ds7/"*.jsonl

say "5/10 train v7 (starts from the v6 adapters; stops at the first NaN)"
if ! ollama list | grep -q "^climrisk-llm-v7"; then
  RES=""; "$V/bin/python" -c "$FIN" "$B6" && RES="$B6"
  ITERS=1200 LR=5e-5 RESUME="$RES" TAG=v7 DS="$L/ds7" NAME=climrisk-llm-v7 bash "$HERE/Train-LLM-Safe-Mac.command"
  if [ -f "$L/TRAIN_FAILED_v7" ] && grep -qiE "loss became|non-finite|NaN|discarded" "$L/TRAIN_FAILED_v7"; then
    say "first attempt failed ($(cat "$L/TRAIN_FAILED_v7")); retrying once at lr 2.5e-5"
    rm -rf "$OUT/adapters" "$OUT/adapters_nonfinite"
    ITERS=1200 LR=2.5e-5 RESUME="$RES" TAG=v7 DS="$L/ds7" NAME=climrisk-llm-v7 bash "$HERE/Train-LLM-Safe-Mac.command"
  fi
fi
if ! ollama list | grep -q "^climrisk-llm-v7"; then say "FAILED: v7 did not train cleanly: $(cat "$L/TRAIN_FAILED_v7" 2>/dev/null). Nothing was promoted; the app keeps its current model."; echo failed > "$L/V7_DONE"; exit 1; fi

say "6/10 held-out evaluation of the new tasks (same rows for every model)"
M="climrisk-llm-v7 climrisk-llm-v6"; for p in climrisk-llm-v5b qwen2.5:7b llama3.2:3b; do ollama list | grep -q "^$p" && M="$M $p"; done
getlock
[ -s "$EN" ] || PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.evaluate "$L/dsx7f" "$EN" $M --limit 40 | tail -80
rm -rf "$LOCK"

say "7/10 regression: reasoning on held-out precedent events, v7 against v6"
getlock
[ -s "$ER" ] || PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.reasoning_eval "$L/dsrf" "$ER" climrisk-llm-v7 climrisk-llm-v6 --limit 120 --seed 3 | tail -30
rm -rf "$LOCK"

say "8/10 regression: ordinary case questions, v7 against v6"
[ -f "$EG" ] || DS="$L/ds5f" OUTJ="$EG" MODELS="climrisk-llm-v7 climrisk-llm-v6" LIMIT=20 bash "$HERE/Eval-LLM-Mac.command" || say "general eval failed"

say "9/10 promotion gate"
PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.v7_report gate "$EN" "$ER" "$EG" "$GATE" --new climrisk-llm-v7 --old climrisk-llm-v6 | tee "$L/gate_v7.txt"
if "$PY" -c "import json,sys; sys.exit(0 if json.load(open('$GATE')).get('promote') else 1)"; then
  echo climrisk-llm-v7 > "$HOME/.climrisk/active_model"; say "v7 PROMOTED: the app now uses climrisk-llm-v7"
else
  [ -n "$PRE" ] && echo "$PRE" > "$HOME/.climrisk/active_model"; say "v7 NOT promoted (see gate_v7.json); the app keeps ${PRE:-its current model}"
fi

say "10/10 app sync and investor report"
if [ "$ONLINE" = 1 ]; then bash "$HERE/Sync-App-Mac.command" || say "app sync reported an error (see sync_app.log)"; else say "SKIPPED app sync: offline. Run Sync-App-Mac.command later."; fi
cd "$SRC" && PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.v7_report report "$EN" "$ER" "$EG" "$GATE" "$L/investor_report_v7.md" --data-report "$L/v7_data_report.json"
echo done > "$L/V7_DONE"; say "=== v7 run finished ==="
