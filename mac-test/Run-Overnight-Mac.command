#!/bin/bash
# One double-click. Detaches from Terminal (safe to close it), keeps the Mac awake, and runs unattended:
#   1 import v1 into Ollama   2 eval v1 vs base models   3 build v2 dataset   4 train v2   5 import v2   6 eval v2 vs v1
# Everything is resumable; progress -> mac-test/llm/overnight.log ; finished marker -> mac-test/llm/OVERNIGHT_DONE
# Leave the Mac on power with the lid OPEN (the screen may lock or dim). Don't quit Ollama.
HERE="$(cd "$(dirname "$0")" && pwd)"; L="$HERE/llm"; LOG="$L/overnight.log"
if [ -z "$OVERNIGHT_CHILD" ]; then
  mkdir -p "$L"; rm -f "$L/OVERNIGHT_DONE"
  OVERNIGHT_CHILD=1 nohup caffeinate -dimsu bash "$0" >> "$LOG" 2>&1 &
  echo "Started in the background (pid $!). You can close this window. Log: $LOG"
  exit 0
fi
export PATH="/opt/homebrew/bin:$PATH"
say(){ printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
PY="$HOME/.climrisk/engine-venv/bin/python"
SRC="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
say "=== overnight run started ==="
pgrep -f "ollama serve" >/dev/null || (ollama serve >/dev/null 2>&1 &); sleep 4

say "1/6 import v1"
if ollama list | grep -q "^climrisk-llm"; then say "climrisk-llm already imported"; else
  TAG=v1 NAME=climrisk-llm bash "$HERE/Train-LLM-Mac.command" || say "v1 import failed (see train_v1.log)"
fi

say "2/6 eval v1 vs base models"
if [ ! -f "$L/eval_v1.json" ] && ollama list | grep -q "^climrisk-llm"; then
  DS="$L/ds" OUTJ="$L/eval_v1.json" MODELS="climrisk-llm llama3.2:3b qwen2.5:7b" LIMIT=12 bash "$HERE/Eval-LLM-Mac.command" || say "eval v1 failed"
fi
for m in $(ollama ps 2>/dev/null | awk 'NR>1{print $1}'); do ollama stop "$m" 2>/dev/null; done

say "3/6 build v2 dataset"
if [ ! -f "$L/ds2/train.jsonl" ]; then
  ( cd "$SRC" && PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.dataset "$L" "$L/ds2" --v2 ) || say "v2 dataset failed"
fi

say "4-5/6 train + import v2 (about 90-100 min)"
if [ -f "$L/ds2/train.jsonl" ] && ! ollama list | grep -q "^climrisk-llm-v2"; then
  ITERS=500 TAG=v2 DS="$L/ds2" NAME=climrisk-llm-v2 bash "$HERE/Train-LLM-Mac.command" || say "v2 train/import failed (see train_v2.log)"
fi

say "6/6 eval v2 vs v1"
if ollama list | grep -q "^climrisk-llm-v2"; then
  DS="$L/ds2" OUTJ="$L/eval_v2.json" MODELS="climrisk-llm-v2 climrisk-llm" LIMIT=12 bash "$HERE/Eval-LLM-Mac.command" || say "eval v2 failed"
fi
echo done > "$L/OVERNIGHT_DONE"; say "=== overnight run finished ==="
