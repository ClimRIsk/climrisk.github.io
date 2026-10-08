#!/bin/bash
# Held-out comparison: fine-tuned climrisk-llm vs base llama3.2:3b vs qwen2.5:7b (what the app used before).
HERE="$(cd "$(dirname "$0")" && pwd)"; L="$HERE/llm"; DS="${DS:-$L/ds}"; OUTJ="${OUTJ:-$L/eval_v1.json}"
LOCK="$HOME/.climrisk/llm.lock"; mkdir -p "$HOME/.climrisk"   # one training/eval job at a time (16 GB RAM)
while ! mkdir "$LOCK" 2>/dev/null; do
  p=$(cat "$LOCK/pid" 2>/dev/null); if [ -n "$p" ] && ! kill -0 "$p" 2>/dev/null; then rm -rf "$LOCK"; continue; fi
  sleep 20
done
echo $$ > "$LOCK/pid"; trap 'rm -rf "$LOCK"' EXIT
[ -f "$OUTJ" ] && [ "${FORCE:-0}" != 1 ] && exit 0   # already evaluated
rm -f "$L/EVAL_DONE"; exec > >(tee "$L/eval_$(basename "$OUTJ" .json).log") 2>&1
PY="$HOME/.climrisk/engine-venv/bin/python"
cd "$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine" && export PYTHONPATH="$PWD/src"
pgrep -f "ollama serve" >/dev/null || (ollama serve >/dev/null 2>&1 &); sleep 3
caffeinate -dimsu "$PY" -m cri.llmtrain.evaluate "$DS" "$OUTJ" ${MODELS:-climrisk-llm llama3.2:3b qwen2.5:7b} --limit ${LIMIT:-12}
echo done > "$L/EVAL_DONE"
