#!/bin/bash
# Fine-tune Llama 3.2 3B Instruct with LoRA (MLX, on this Mac), fuse, import into Ollama as "climrisk-llm".
# Resumable: each stage is skipped if its output exists. Progress -> mac-test/llm/train.log
HERE="$(cd "$(dirname "$0")" && pwd)"; L="$HERE/llm"; DS="$L/ds"; OUT="$HOME/.climrisk/llm"; LOG="$L/train.log"
mkdir -p "$OUT"; exec > >(tee -a "$LOG") 2>&1
say(){ printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
rm -f "$L/TRAIN_DONE" "$L/TRAIN_FAILED"
fail(){ say "FAILED: $*"; echo "$*" > "$L/TRAIN_FAILED"; exit 1; }
[ -f "$DS/train.jsonl" ] || fail "dataset missing in $DS"
export PATH="/opt/homebrew/bin:$PATH"

say "1/6 Python 3.12 + MLX environment"
PY312="$(command -v python3.12)"
if [ -z "$PY312" ]; then brew install python@3.12 >> "$LOG" 2>&1; PY312="$(command -v python3.12)"; fi
[ -n "$PY312" ] || fail "python3.12 unavailable (brew install python@3.12)"
V="$HOME/.climrisk/mlx-venv"
[ -x "$V/bin/python" ] || "$PY312" -m venv "$V" || fail "venv"
"$V/bin/python" -m pip install -q --upgrade pip >/dev/null 2>&1
"$V/bin/python" -c "import mlx_lm" 2>/dev/null || "$V/bin/python" -m pip install -q mlx-lm || fail "pip install mlx-lm"
"$V/bin/python" -c "import mlx_lm,mlx.core as mx;print('mlx_lm',mlx_lm.__version__,'metal',mx.metal.is_available())"

# 16 GB Mac: free memory first (a resident Ollama model + the app were making a bf16 run swap at ~13 tok/s), train on the 4-bit base (QLoRA).
pkill -f "mlx_lm lora" 2>/dev/null; sleep 1
for m in $(ollama ps 2>/dev/null | awk 'NR>1{print $1}'); do ollama stop "$m" 2>/dev/null; done
rm -rf "$OUT/adapters"
BASE="mlx-community/Llama-3.2-3B-Instruct-4bit"
say "2/6 QLoRA training on $BASE  ($(wc -l < "$DS/train.jsonl") examples)  — checkpoints every 100 iterations"
ITERS="${ITERS:-500}"
if [ ! -f "$OUT/adapters/adapters.safetensors" ]; then
  caffeinate -dimsu "$V/bin/python" -m mlx_lm lora --model "$BASE" --train --data "$DS" --adapter-path "$OUT/adapters" \
     --iters "$ITERS" --batch-size 2 --num-layers 12 --learning-rate 1e-4 --max-seq-length 1536 \
     --grad-checkpoint --mask-prompt --steps-per-eval 100 --save-every 100 --val-batches 15 --steps-per-report 5 || fail "training"
fi
say "3/6 held-out loss"
"$V/bin/python" -m mlx_lm lora --model "$BASE" --adapter-path "$OUT/adapters" --data "$DS" --test --test-batches 25 2>&1 | tail -3

say "4/6 fuse adapters into the model"
[ -f "$OUT/fused/config.json" ] || "$V/bin/python" -m mlx_lm fuse --model "$BASE" --adapter-path "$OUT/adapters" --save-path "$OUT/fused" --dequantize || fail "fuse"

say "5/6 import into Ollama as climrisk-llm"
pgrep -x ollama >/dev/null || pgrep -f "ollama serve" >/dev/null || (ollama serve >/dev/null 2>&1 &) ; sleep 3
ollama list | grep -q "^llama3.2:3b" || ollama pull llama3.2:3b || fail "ollama pull llama3.2:3b"
ollama show llama3.2:3b --modelfile | grep -v '^FROM' | grep -v '^#' > "$OUT/Modelfile.tail"
{ echo "FROM $OUT/fused"; cat "$OUT/Modelfile.tail"; echo "PARAMETER temperature 0.2"; } > "$OUT/Modelfile"
ollama create climrisk-llm -f "$OUT/Modelfile" --quantize q4_K_M || fail "ollama create"
ollama list | grep climrisk

say "6/6 smoke test"
curl -s -m 120 http://127.0.0.1:11434/api/chat -d '{"model":"climrisk-llm","stream":false,"messages":[{"role":"user","content":"In two sentences, what does a 1-in-100 loss mean?"}]}' | head -c 700; echo
echo done > "$L/TRAIN_DONE"; say "finished"
