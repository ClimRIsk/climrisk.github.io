#!/bin/bash
# Closes the three open problems left after v5 trained. One double-click; detaches from Terminal; keep the Mac on power with the lid open.
#   1 wait for the internet (the app sync needs it)        2 build and test the iteration-600 checkpoint (validation loss was lowest there) as climrisk-llm-v5b
#   3 evaluate v5b on the same held-out events, then promote the best of v5b / v5 / v2 (never a worse one)
#   4 install the new engine (hard 60 s limit on every model call) and the case index into the app, check the app's own copy
#   5 full investor-demo check with a per-question timing breakdown   6 rewrite the validation pack
# Log: mac-test/llm/finish_v5.log     Marker when finished: mac-test/llm/FINISH_DONE
HERE="$(cd "$(dirname "$0")" && pwd)"; L="$HERE/llm"; LOG="$L/finish_v5.log"
if [ -z "$FINISH_CHILD" ]; then
  mkdir -p "$L"; rm -f "$L/FINISH_DONE"
  FINISH_CHILD=1 nohup caffeinate -dimsu bash "$0" >> "$LOG" 2>&1 &
  echo "Started in the background (pid $!). You can close this window. Log: $LOG"; exit 0
fi
export PATH="/opt/homebrew/bin:$PATH"
say(){ printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
PY="$HOME/.climrisk/engine-venv/bin/python"; V="$HOME/.climrisk/mlx-venv"
SRC="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
A="$HOME/.climrisk/llm/v5/adapters"; B="$HOME/.climrisk/llm/v5b"
say "=== v5 finish run started ==="
pgrep -f "ollama serve" >/dev/null || (ollama serve >/dev/null 2>&1 &); sleep 3

say "1/6 internet check"
ONLINE=0
for i in $(seq 1 80); do
  if curl -sI -m 8 https://pypi.org >/dev/null 2>&1; then ONLINE=1; break; fi
  [ "$i" = 1 ] && say "the Mac cannot reach the internet; waiting up to 40 minutes (check Wi-Fi)"
  sleep 30
done
say "online: $ONLINE"

say "2/6 iteration-600 checkpoint as climrisk-llm-v5b"
FIN='import sys, mlx.core as mx
w = mx.load(sys.argv[1]); bad = [k for k, v in w.items() if not bool(mx.all(mx.isfinite(v)).item())]
print(sys.argv[1].split("/")[-1], len(w), "tensors,", len(bad), "non-finite"); sys.exit(1 if bad else 0)'
CK=""
for n in 0000600 0000500; do f="$A/${n}_adapters.safetensors"; [ -f "$f" ] && "$V/bin/python" -c "$FIN" "$f" && CK="$f" && break; done
if [ -n "$CK" ] && ! ollama list | grep -q "^climrisk-llm-v5b"; then
  mkdir -p "$B/adapters"; cp "$A/adapter_config.json" "$B/adapters/" 2>/dev/null || cp "$HOME/.climrisk/llm/v5/adapters_diverged/adapter_config.json" "$B/adapters/"
  cp "$CK" "$B/adapters/adapters.safetensors"
  TAG=v5b DS="$L/ds5f" NAME=climrisk-llm-v5b bash "$HERE/Train-LLM-Safe-Mac.command"
else
  say "no checkpoint 600/500 found, or v5b already imported: ${CK:-none}"
fi

say "3/6 evaluate v5b on the same held-out events and choose the best model"
if ollama list | grep -q "^climrisk-llm-v5b" && [ ! -f "$L/eval_v5b.json" ]; then
  DS="$L/ds5f" OUTJ="$L/eval_v5b.json" MODELS="climrisk-llm-v5b" LIMIT=20 bash "$HERE/Eval-LLM-Mac.command" || say "eval v5b failed"
fi
export PYTHONPATH="$SRC/src"
"$PY" - <<PYEOF
import json, os
L="$L"; d=json.load(open(L+"/eval_v5.json"))
if os.path.exists(L+"/eval_v5b.json"): d.update(json.load(open(L+"/eval_v5b.json")))
json.dump(d, open(L+"/eval_v5_all.json","w"), indent=1); print("models in the comparison:", list(d))
PYEOF
"$PY" -m cri.llmtrain.pick "$L/eval_v5_all.json" | tee "$L/pick_v5_final.json"
unset PYTHONPATH

say "4/6 install the new engine and case index into the app (needs the internet)"
if [ "$ONLINE" = 1 ]; then
  bash "$HERE/Sync-App-Mac.command" || say "app sync reported an error (see sync_app.log)"
else
  say "SKIPPED: no internet. Run Sync-App-Mac.command when the Mac is online."
fi

say "5/6 full investor-demo check on the app's own engine copy, with timing"
ollama ps; memory_pressure 2>/dev/null | tail -2
cd "$HOME/.climrisk" || exit 1
env -u PYTHONPATH "$PY" -c "import cri; print('engine copy in use:', cri.__file__)"
env -u PYTHONPATH "$PY" -m cri.resident.demo_check "$L/demo_final.json" --n 36 | tee "$L/demo_final.txt"
ollama ps; memory_pressure 2>/dev/null | tail -2

say "6/6 rewrite the validation pack"
cd "$SRC" && PYTHONPATH="$SRC/src" "$PY" - <<PYEOF
import os, json
from pathlib import Path
from cri import riskmgmt as RM
L="$L"
p=RM.validation_pack(L+"/demo_final.json", L+"/eval_v5_all.json", None, {"world_summary": json.load(open(L+"/world_summary.json")) if os.path.exists(L+"/world_summary.json") else None,
    "training_note": "v5 first diverged to NaN at iteration ~330; retrained on length-filtered data with a NaN watchdog, resuming from the clean iteration-300 checkpoint at lr 5e-5. The iteration-600 checkpoint (lowest validation loss) was also built as v5b and evaluated; the model with the best held-out score was promoted (pick_v5_final.json).",
    "latency_note": "The first demo run had 5 of 30 answers taking 70 s to 15 minutes. Every model call now has a hard 60 s total deadline, after which the answer is assembled from the cited passages; Ollama's own load/prompt/generation timings are recorded per question in demo_final.json."})
Path(L+"/validation_pack_v5.md").write_text(p["markdown"]); print("wrote validation_pack_v5.md")
PYEOF
echo done > "$L/FINISH_DONE"; say "=== v5 finish run finished ==="
