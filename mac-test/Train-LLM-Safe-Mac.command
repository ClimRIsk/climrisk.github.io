#!/bin/bash
# Same job as Train-LLM-Mac.command (QLoRA on Llama 3.2 3B Instruct -> fuse -> Ollama) with three safeguards added after the v5 run diverged to NaN:
#   - a watchdog that stops training within ~20 s of the first NaN/inf loss (no more silent hours of garbage),
#   - an optional resume from a checkpoint that was verified finite (RESUME=/path/0000300_adapters.safetensors),
#   - the adapters are checked for non-finite values before they are fused or imported.
# Env: DS, TAG, NAME, ITERS (default 900), LR (default 5e-5), RESUME (optional).   Log: mac-test/llm/train_$TAG.log, raw trainer output: raw_$TAG.log
HERE="$(cd "$(dirname "$0")" && pwd)"; L="$HERE/llm"; DS="${DS:-$L/ds}"; TAG="${TAG:-v1}"; NAME="${NAME:-climrisk-llm}"; OUT="$HOME/.climrisk/llm/$TAG"; LOG="$L/train_$TAG.log"; RAW="$L/raw_$TAG.log"
LOCK="$HOME/.climrisk/llm.lock"; mkdir -p "$HOME/.climrisk"
while ! mkdir "$LOCK" 2>/dev/null; do
  p=$(cat "$LOCK/pid" 2>/dev/null); if [ -n "$p" ] && ! kill -0 "$p" 2>/dev/null; then rm -rf "$LOCK"; continue; fi
  sleep 20
done
echo $$ > "$LOCK/pid"; trap 'rm -rf "$LOCK"; [ -n "$TL" ] && kill "$TL" 2>/dev/null' EXIT
export PATH="/opt/homebrew/bin:$PATH"; [ "${FORCE:-0}" != 1 ] && ollama list 2>/dev/null | grep -q "^$NAME" && exit 0
mkdir -p "$OUT"; exec > >(tee -a "$LOG") 2>&1
say(){ printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
rm -f "$L/TRAIN_DONE_$TAG" "$L/TRAIN_FAILED_$TAG"
fail(){ say "FAILED: $*"; echo "$*" > "$L/TRAIN_FAILED_$TAG"; exit 1; }
[ -f "$DS/train.jsonl" ] || fail "dataset missing in $DS"
V="$HOME/.climrisk/mlx-venv"
[ -x "$V/bin/python" ] || fail "MLX environment missing (run Train-LLM-Mac.command once)"
FIN='import sys, mlx.core as mx
w = mx.load(sys.argv[1]); bad = [k for k, v in w.items() if not bool(mx.all(mx.isfinite(v)).item())]
print(sys.argv[1].split("/")[-1], len(w), "tensors,", len(bad), "non-finite"); sys.exit(1 if bad else 0)'

BASE="mlx-community/Llama-3.2-3B-Instruct-4bit"; ITERS="${ITERS:-900}"; LR="${LR:-5e-5}"
if [ ! -s "$OUT/adapters/adapters.safetensors" ]; then
  pkill -f "mlx_lm lora" 2>/dev/null; sleep 1
  for m in $(ollama ps 2>/dev/null | awk 'NR>1{print $1}'); do ollama stop "$m" 2>/dev/null; done
  RES=""; if [ -n "$RESUME" ]; then "$V/bin/python" -c "$FIN" "$RESUME" && RES="--resume-adapter-file $RESUME" || say "resume checkpoint is not finite; starting from scratch"; fi
  say "2/6 QLoRA training on $BASE  ($(wc -l < "$DS/train.jsonl") examples, $ITERS iterations, lr $LR ${RES:+resuming from $RESUME})"
  : > "$RAW"
  caffeinate -dimsu "$V/bin/python" -m mlx_lm lora --model "$BASE" --train --data "$DS" --adapter-path "$OUT/adapters" \
     --iters "$ITERS" --batch-size 2 --num-layers 12 --learning-rate "$LR" --max-seq-length 1536 --seed 7 \
     --grad-checkpoint --mask-prompt --steps-per-eval 100 --save-every 100 --val-batches 15 --steps-per-report 5 $RES > "$RAW" 2>&1 &
  TP=$!; tail -n0 -F "$RAW" >> "$LOG" 2>/dev/null & TL=$!
  BAD=0
  while kill -0 "$TP" 2>/dev/null; do
    sleep 20
    if tr '\r' '\n' < "$RAW" | grep -qiE "loss:? *(nan|-?inf)"; then BAD=1; pkill -f "mlx_lm lora"; sleep 3; break; fi
  done
  wait "$TP"; RC=$?; kill "$TL" 2>/dev/null
  [ "$BAD" = 1 ] && fail "loss became NaN/inf; training stopped at once (see raw_$TAG.log). Nothing was fused or imported."
  [ "$RC" -ne 0 ] && fail "training exited with code $RC (see raw_$TAG.log)"
fi
"$V/bin/python" -c "$FIN" "$OUT/adapters/adapters.safetensors" || { mv "$OUT/adapters" "$OUT/adapters_nonfinite"; fail "trained adapters contain NaN/inf; discarded"; }

say "3/6 held-out loss"
"$V/bin/python" -m mlx_lm lora --model "$BASE" --adapter-path "$OUT/adapters" --data "$DS" --test --test-batches 25 --mask-prompt 2>&1 | tail -3

say "4/6 fuse adapters into the model"
[ -f "$OUT/fused/config.json" ] || "$V/bin/python" -m mlx_lm fuse --model "$BASE" --adapter-path "$OUT/adapters" --save-path "$OUT/fused" --dequantize || fail "fuse"

say "5/6 import into Ollama as $NAME"
pgrep -x ollama >/dev/null || pgrep -f "ollama serve" >/dev/null || (ollama serve >/dev/null 2>&1 &) ; sleep 3
ollama list | grep -q "^llama3.2:3b" || ollama pull llama3.2:3b || fail "ollama pull llama3.2:3b"
ollama show llama3.2:3b --modelfile | grep -v '^FROM' | grep -v '^#' > "$OUT/Modelfile.tail"
{ echo "FROM $OUT/fused"; cat "$OUT/Modelfile.tail"; echo "PARAMETER temperature 0.2"; } > "$OUT/Modelfile"
ollama create "$NAME" -f "$OUT/Modelfile" --quantize int4 || ollama create "$NAME" -f "$OUT/Modelfile" --quantize int8 || ollama create "$NAME" -f "$OUT/Modelfile" || fail "ollama create"
ollama list | grep -i "$NAME"

say "6/6 smoke test"
curl -s -m 120 http://127.0.0.1:11434/api/chat -d '{"model":"'"$NAME"'","stream":false,"messages":[{"role":"user","content":"In two sentences, what does a 1-in-100 loss mean?"}]}' | head -c 700; echo
echo done > "$L/TRAIN_DONE_$TAG"; say "finished"
