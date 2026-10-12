#!/bin/bash
# Trains the reasoning model (v6) and tests whether it actually reasons. One double-click; detaches from Terminal; keep the Mac on power with the lid open. Re-runnable (skips finished steps).
#   1 wait for the internet   2 build the reasoning data from the engine + the full case index   3 drop rows that do not fit the training window   4 mix 70% reasoning / 30% v5 replay
#   5 train v6 from the v5b adapters (NaN watchdog; retries once at a lower learning rate)   6 reasoning evaluation: v6, v5b, v5, v2, qwen2.5:7b vs the baselines   7 promote the best reasoning model (never a worse one)
#   8 general-answer regression (v6 vs v5b)   9 app sync + investor-demo check   10 report + blind review sheet
# Log: mac-test/llm/run_v6.log     Marker when finished: mac-test/llm/V6_DONE     Results: reasoning_eval_v6.json, reasoning_report_v6.md, review_sheet_v6.md
HERE="$(cd "$(dirname "$0")" && pwd)"; L="$HERE/llm"; LOG="$L/run_v6.log"
if [ -z "$V6_CHILD" ]; then
  mkdir -p "$L"; rm -f "$L/V6_DONE"
  V6_CHILD=1 nohup caffeinate -dimsu bash "$0" >> "$LOG" 2>&1 &
  echo "Started in the background (pid $!). You can close this window. Log: $LOG"; exit 0
fi
export PATH="/opt/homebrew/bin:$PATH"
say(){ printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
PY="$HOME/.climrisk/engine-venv/bin/python"; V="$HOME/.climrisk/mlx-venv"
SRC="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"; B5="$HOME/.climrisk/llm/v5b/adapters/adapters.safetensors"
IDX="$HOME/.climrisk/case_index.jsonl"; OUT="$HOME/.climrisk/llm/v6"; E="$L/reasoning_eval_v6.json"
say "=== v6 reasoning run started ==="
pgrep -f "ollama serve" >/dev/null || (ollama serve >/dev/null 2>&1 &); sleep 3
FIN='import sys, mlx.core as mx
w = mx.load(sys.argv[1]); bad = [k for k, v in w.items() if not bool(mx.all(mx.isfinite(v)).item())]
print(sys.argv[1].split("/")[-1], len(w), "tensors,", len(bad), "non-finite"); sys.exit(1 if bad else 0)'

say "1/10 internet check (the app sync needs it)"
ONLINE=0; for i in $(seq 1 40); do if curl -sI -m 8 https://pypi.org >/dev/null 2>&1; then ONLINE=1; break; fi; [ "$i" = 1 ] && say "offline; waiting up to 20 minutes"; sleep 30; done; say "online: $ONLINE"

say "2/10 reasoning data from the engine and the full case index ($(wc -l < "$IDX" 2>/dev/null) items)"
[ -s "$IDX" ] || { say "FAILED: case index missing at $IDX"; exit 1; }
if [ ! -s "$L/dsr/train.jsonl" ]; then
  PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.reasoning_data "$L/dsr" --n 4000 --seed 5 --index "$IDX" | tee "$L/dsr_report.txt" || { rm -rf "$L/dsr"; say "FAILED: data build"; exit 1; }
fi
wc -l "$L/dsr/"*.jsonl

say "3/10 length filter (rows must fit the 1536-token window with the whole answer)"
if [ ! -s "$L/dsrf/train.jsonl" ]; then
  "$V/bin/python" "$SRC/src/cri/llmtrain/lengthfilter.py" "$L/dsr" "$L/dsrf" 2>&1 | tee "$L/length_report_v6.txt"
  [ "${PIPESTATUS[0]}" -eq 0 ] || { rm -rf "$L/dsrf"; say "FAILED: length filter dropped too many rows (see length_report_v6.txt)"; exit 1; }
fi
wc -l "$L/dsrf/"*.jsonl

say "4/10 mix: reasoning rows + 30% replay of the v5 data"
[ -s "$L/ds6/train.jsonl" ] || PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.mix "$L/dsrf" "$L/ds5f" "$L/ds6" --replay 0.3 --test-max 300 | tee "$L/mix_report_v6.txt"
wc -l "$L/ds6/"*.jsonl

say "5/10 train v6 (starts from the v5b adapters; stops at the first NaN)"
if ! ollama list | grep -q "^climrisk-llm-v6"; then
  RES=""; "$V/bin/python" -c "$FIN" "$B5" && RES="$B5"
  ITERS=900 LR=1e-4 RESUME="$RES" TAG=v6 DS="$L/ds6" NAME=climrisk-llm-v6 bash "$HERE/Train-LLM-Safe-Mac.command"
  if [ -f "$L/TRAIN_FAILED_v6" ]; then
    say "first attempt failed ($(cat "$L/TRAIN_FAILED_v6")); retrying once at lr 5e-5"
    rm -rf "$OUT/adapters" "$OUT/adapters_nonfinite"
    ITERS=900 LR=5e-5 RESUME="$RES" TAG=v6 DS="$L/ds6" NAME=climrisk-llm-v6 bash "$HERE/Train-LLM-Safe-Mac.command"
  fi
fi
if ! ollama list | grep -q "^climrisk-llm-v6"; then say "FAILED: v6 did not train cleanly: $(cat "$L/TRAIN_FAILED_v6" 2>/dev/null). Nothing was promoted; the app keeps its current models."; echo failed > "$L/V6_DONE"; exit 1; fi

say "6/10 reasoning evaluation on held-out precedent events (same rows for every model)"
M="climrisk-llm-v6"; for p in climrisk-llm-v5b climrisk-llm-v5 climrisk-llm-v2 qwen2.5:7b; do ollama list | grep -q "^$p" && M="$M $p"; done
LOCK="$HOME/.climrisk/llm.lock"; while ! mkdir "$LOCK" 2>/dev/null; do p=$(cat "$LOCK/pid" 2>/dev/null); if [ -n "$p" ] && ! kill -0 "$p" 2>/dev/null; then rm -rf "$LOCK"; continue; fi; sleep 20; done; echo $$ > "$LOCK/pid"
[ -s "$E" ] || PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.reasoning_eval "$L/dsrf" "$E" $M --limit 120 --seed 3 | tail -60
rm -rf "$LOCK"

say "7/10 promote the best reasoning model (never a worse one)"
PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.reasoning_eval pick "$E" | tee "$L/pick_reasoning_v6.json"

say "8/10 regression: does v6 still answer ordinary case questions as well as v5b?"
if [ ! -f "$L/eval_v6_general.json" ]; then DS="$L/ds5f" OUTJ="$L/eval_v6_general.json" MODELS="climrisk-llm-v6 climrisk-llm-v5b" LIMIT=20 bash "$HERE/Eval-LLM-Mac.command" || say "general eval failed"; fi
PYTHONPATH="$SRC/src" "$PY" - <<PYEOF
import json
L="$L"; d={}
try: d.update(json.load(open(L+"/eval_v5_all.json")))
except Exception: pass
try: d.update(json.load(open(L+"/eval_v6_general.json")))
except Exception: pass
json.dump(d, open(L+"/eval_v6_all.json","w"), indent=1); print("general models compared:", [k for k in d if not k.startswith("_")])
PYEOF
PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.pick "$L/eval_v6_all.json" | tee "$L/pick_v6_general.json"

say "9/10 app sync and investor-demo check"
if [ "$ONLINE" = 1 ]; then bash "$HERE/Sync-App-Mac.command" || say "app sync reported an error (see sync_app.log)"; else say "SKIPPED app sync: offline. Run Sync-App-Mac.command later."; fi
cd "$HOME/.climrisk" && env -u PYTHONPATH "$PY" -m cri.resident.demo_check "$L/demo_v6.json" --n 36 | tee "$L/demo_v6.txt"
say "live check of /reason on the app's own engine copy"
env -u PYTHONPATH "$PY" - <<PYEOF | tee "$L/reason_live_v6.txt"
import json, time
from cri.resident import answer as AN
sc={"name":"Harbor Chemicals","hazard":"flood","assets":"a chemical plant on a river","fin":{"revenue":1200,"ebitda":240,"net_debt":600,"interest_expense":40,"equity":500,"total_assets":1500},
    "loss":{"asset_damage":300,"insured_recovery":120,"bi_revenue_lost":200,"extra_costs":10},"cov":{"max_net_debt_to_ebitda":3.5,"min_interest_cover":4.0}}
t=time.time(); r=AN.ask_reasoned(sc)
print(r["mode"], "| verdict:", r["verdict"], "| checks ok:", r["checks_ok"], "|", round(time.time()-t,1), "s | note:", r.get("llm_note")); print(r["reply"])
PYEOF

say "10/10 report and blind review sheet"
cd "$SRC" && PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.reasoning_eval report "$E" "$L/reasoning_report_v6.md" >/dev/null
PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.reasoning_eval sheet "$E" "$L/review_sheet_v6.md" --n 12 >/dev/null
echo done > "$L/V6_DONE"; say "=== v6 reasoning run finished ==="
