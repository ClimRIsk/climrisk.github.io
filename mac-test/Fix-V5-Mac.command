#!/bin/bash
# Recovers the v5 run after the training diverged to NaN (iteration ~330). One double-click; detaches from Terminal; resumable.
#   1 stop the diverged run   2 keep its last finite checkpoint, set the rest aside   3 drop training rows that cannot fit the window with their answer (ds5 -> ds5f)
#   4 train again with a NaN watchdog (resumes from the finite checkpoint, lower learning rate)   5 evaluate v5 vs v4/v3/v2 on the same held-out events
#   6 promote only if not worse   7 install into the app + investor-demo check   8 validation pack
# Log: mac-test/llm/fix_v5.log    Marker when finished: mac-test/llm/WORLD_DONE (same marker as Run-World)
HERE="$(cd "$(dirname "$0")" && pwd)"; L="$HERE/llm"; LOG="$L/fix_v5.log"
if [ -z "$FIX_CHILD" ]; then
  mkdir -p "$L"; rm -f "$L/WORLD_DONE"
  FIX_CHILD=1 nohup caffeinate -dimsu bash "$0" >> "$LOG" 2>&1 &
  echo "Started in the background (pid $!). You can close this window. Log: $LOG"; exit 0
fi
export PATH="/opt/homebrew/bin:$PATH"
say(){ printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
PY="$HOME/.climrisk/engine-venv/bin/python"; V="$HOME/.climrisk/mlx-venv"
SRC="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"; export PYTHONPATH="$SRC/src"; cd "$SRC" || exit 1
OUT="$HOME/.climrisk/llm/v5"
say "=== v5 recovery started ==="

say "1/8 stop the diverged run"
pkill -f "Run-World-Mac.command" 2>/dev/null; pkill -f "Train-LLM-Mac.command" 2>/dev/null; sleep 1; pkill -f "mlx_lm" 2>/dev/null; sleep 6
rm -rf "$HOME/.climrisk/llm.lock" 2>/dev/null

say "2/8 keep the last finite checkpoint, set the diverged adapters aside"
FIN='import sys, mlx.core as mx
w = mx.load(sys.argv[1]); bad = [k for k, v in w.items() if not bool(mx.all(mx.isfinite(v)).item())]
print(sys.argv[1].split("/")[-1], len(w), "tensors,", len(bad), "non-finite"); sys.exit(1 if bad else 0)'
RESUME=""
for n in 0000300 0000200 0000100; do          # a copy kept by an earlier attempt of this script wins; otherwise take it from the diverged adapters
  for f in "$OUT/keep/clean_${n}.safetensors" "$OUT/adapters/${n}_adapters.safetensors" "$OUT/adapters_diverged/${n}_adapters.safetensors"; do
    if [ -f "$f" ] && "$V/bin/python" -c "$FIN" "$f"; then mkdir -p "$OUT/keep"; [ "$f" = "$OUT/keep/clean_${n}.safetensors" ] || cp "$f" "$OUT/keep/clean_${n}.safetensors"; RESUME="$OUT/keep/clean_${n}.safetensors"; break 2; fi
  done
done
if [ -d "$OUT/adapters" ]; then rm -rf "$OUT/adapters_diverged"; mv "$OUT/adapters" "$OUT/adapters_diverged"; fi   # (the finite copy is already in keep/)
[ -f "$L/train_v5.log" ] && mv "$L/train_v5.log" "$L/train_v5_diverged.log"
rm -f "$L/TRAIN_FAILED_v5" "$L/TRAIN_DONE_v5"
say "resume checkpoint: ${RESUME:-none (training from scratch)}"

say "3/8 length filter: keep only rows whose whole answer fits the training window"
if [ ! -s "$L/ds5f/train.jsonl" ] || [ ! -s "$L/ds5f/valid.jsonl" ]; then
  rm -rf "$L/ds5f"
  "$V/bin/python" "$SRC/src/cri/llmtrain/lengthfilter.py" "$L/ds5" "$L/ds5f" 2>&1 | tee "$L/length_report.txt"
  [ "${PIPESTATUS[0]}" -eq 0 ] || rm -rf "$L/ds5f"
fi
[ -s "$L/ds5f/train.jsonl" ] || { say "FAILED: length filter produced no data"; exit 1; }
wc -l "$L/ds5f/"*.jsonl

say "4/8 train v5 on the filtered data (watchdog stops it at the first NaN)"
if ! ollama list | grep -q "^climrisk-llm-v5"; then
  ITERS=900 LR=5e-5 RESUME="$RESUME" TAG=v5 DS="$L/ds5f" NAME=climrisk-llm-v5 bash "$HERE/Train-LLM-Safe-Mac.command"
  if [ -f "$L/TRAIN_FAILED_v5" ] && [ -n "$RESUME" ]; then
    say "resumed run failed ($(cat "$L/TRAIN_FAILED_v5")); retrying once from scratch at lr 5e-5"
    rm -rf "$OUT/adapters" "$OUT/adapters_nonfinite"
    ITERS=1200 LR=5e-5 RESUME="" TAG=v5 DS="$L/ds5f" NAME=climrisk-llm-v5 bash "$HERE/Train-LLM-Safe-Mac.command"
  fi
fi
if ! ollama list | grep -q "^climrisk-llm-v5"; then say "FAILED: v5 did not train cleanly: $(cat "$L/TRAIN_FAILED_v5" 2>/dev/null). Nothing was promoted."; exit 1; fi

say "5/8 evaluate v5 against the earlier models on the same held-out events"
M="climrisk-llm-v5"; for p in v4 v3; do ollama list | grep -q "^climrisk-llm-$p" && M="$M climrisk-llm-$p"; done; M="$M climrisk-llm-v2"
DS="$L/ds5f" OUTJ="$L/eval_v5.json" MODELS="$M" LIMIT=20 bash "$HERE/Eval-LLM-Mac.command" || say "eval v5 failed"

say "6/8 promote the best model for the app (never a worse one)"
[ -f "$L/eval_v5.json" ] && "$PY" -m cri.llmtrain.pick "$L/eval_v5.json" | tee "$L/pick_v5.json"

say "7/8 install into the app and run the investor-demo check on the app's own copy"
bash "$HERE/Sync-App-Mac.command" || say "app sync reported an error"
cd "$SRC" && "$PY" -m cri.resident.demo_check "$L/demo_v5.json" --n 36 | tee "$L/demo_v5.txt" || say "demo check failed"

say "8/8 write the model validation pack from the real results"
"$PY" - <<PYEOF
import os, json
from pathlib import Path
from cri import riskmgmt as RM
L="$L"
p=RM.validation_pack(L+"/demo_v5.json", L+"/eval_v5.json", None, {"world_summary": json.load(open(L+"/world_summary.json")) if os.path.exists(L+"/world_summary.json") else None,
                                                                 "training_note": "v5 first diverged to NaN at iteration ~330 on unfiltered data; retrained on length-filtered data (ds5f) with a NaN watchdog. See length_report.txt."})
Path(L+"/validation_pack_v5.md").write_text(p["markdown"]); print("wrote", L+"/validation_pack_v5.md", {k: v for k, v in p.items() if k != "markdown"})
PYEOF
echo done > "$L/WORLD_DONE"; say "=== v5 recovery finished ==="
