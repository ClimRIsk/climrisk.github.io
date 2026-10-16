#!/bin/bash
# FINAL MODEL EXPORT. Converts ONE fine-tuned model (TAG, default: the v8 winner if the gate passed, else v6) to a portable GGUF (Q4_K_M, ~2 GB), imports THAT FILE into Ollama as a customer machine will,
# and tests the file itself (smoke test, the event/v7 held-out rows, the reasoning rows), so what ships is TESTED, not assumed.
# Output: ~/ClimRisk-model-dist/{climrisk-llm-v6-q4km.gguf, climrisk-llm-v5b-q4km.gguf, *.Modelfile.tail, model_manifest.json}   Log: mac-test/llm/gguf.log   Marker: mac-test/llm/GGUF_FINAL_DONE
HERE="$(cd "$(dirname "$0")" && pwd)"; L="$HERE/llm"; LOG="$L/gguf_final.log"
if [ -z "$GF_CHILD" ]; then mkdir -p "$L"; rm -f "$L/GGUF_FINAL_DONE"; GF_CHILD=1 nohup caffeinate -dimsu bash "$0" >> "$LOG" 2>&1 & echo "started pid $!"; exit 0; fi
export PATH="/opt/homebrew/bin:$PATH"
say(){ printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
fail(){ say "FAILED: $*"; echo "failed: $*" > "$L/GGUF_FINAL_DONE"; exit 1; }
OUT="$HOME/ClimRisk-model-final"; mkdir -p "$OUT"; GV="$HOME/.climrisk/gguf-venv"; LC="$HOME/.climrisk/llama.cpp"
PY="$HOME/.climrisk/engine-venv/bin/python"; SRC="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
say "1/6 tools"
command -v llama-quantize >/dev/null || brew install llama.cpp || fail "brew install llama.cpp"
[ -d "$LC/.git" ] || git clone --depth 1 https://github.com/ggml-org/llama.cpp "$LC" || fail "git clone llama.cpp"
if [ ! -x "$GV/bin/python" ]; then
  python3 -m venv "$GV" || fail "venv"
  "$GV/bin/pip" install -q torch --index-url https://download.pytorch.org/whl/cpu 2>&1 | tail -2 || true
  "$GV/bin/python" -c "import torch" 2>/dev/null || "$GV/bin/pip" install -q torch || fail "torch"
fi
"$GV/bin/pip" install -q -r "$LC/requirements/requirements-convert_hf_to_gguf.txt" 2>&1 | tail -3
"$GV/bin/python" -c "import torch, transformers, gguf; print('convert deps ok')" || fail "convert deps"
ollama show llama3.2:3b --modelfile | grep -v '^FROM' | grep -v '^#' > "$OUT/llama32.tail"
echo "[" > "$OUT/model_manifest.json"; FIRST=1
TAG="${TAG:-}"; [ -z "$TAG" ] && TAG="$(cat "$L/V8_WINNER" 2>/dev/null)"; [ -z "$TAG" ] && TAG=v6; say "model to export: $TAG"
for TAG in $TAG; do
  F="$HOME/.climrisk/llm/$TAG/fused"; [ -f "$F/config.json" ] || { say "skip $TAG (no fused weights at $F)"; continue; }
  say "2/6 convert $TAG to GGUF f16"
  # the MLX venv saved tokenizer_class "TokenizersBackend" (transformers 5); older converters do not know it -> convert from a copy with the standard class name
  CV="$OUT/_conv_$TAG"; rm -rf "$CV"; mkdir -p "$CV"; for f in "$F"/*; do ln -s "$f" "$CV/$(basename "$f")"; done
  rm "$CV/tokenizer_config.json"; sed 's/"TokenizersBackend"/"PreTrainedTokenizerFast"/' "$F/tokenizer_config.json" > "$CV/tokenizer_config.json"
  [ -s "$OUT/_$TAG-f16.gguf" ] || "$GV/bin/python" "$LC/convert_hf_to_gguf.py" "$CV" --outfile "$OUT/_$TAG-f16.gguf" --outtype f16 || fail "convert $TAG"
  say "3/6 quantize $TAG to Q4_K_M"
  llama-quantize "$OUT/_$TAG-f16.gguf" "$OUT/climrisk-llm-$TAG-q4km.gguf" Q4_K_M || fail "quantize $TAG"
  rm -f "$OUT/_$TAG-f16.gguf"; rm -rf "$CV"
  { echo "FROM ./climrisk-llm-$TAG-q4km.gguf"; cat "$OUT/llama32.tail"; echo "PARAMETER temperature 0.2"; } > "$OUT/climrisk-llm-$TAG.Modelfile"
  SHA="$(shasum -a 256 "$OUT/climrisk-llm-$TAG-q4km.gguf" | cut -d' ' -f1)"; SZ="$(stat -f%z "$OUT/climrisk-llm-$TAG-q4km.gguf")"
  [ $FIRST = 1 ] || echo "," >> "$OUT/model_manifest.json"; FIRST=0
  printf '{"model":"climrisk-llm-%s","file":"climrisk-llm-%s-q4km.gguf","bytes":%s,"sha256":"%s","quant":"Q4_K_M","base":"Llama-3.2-3B-Instruct"}\n' "$TAG" "$TAG" "$SZ" "$SHA" >> "$OUT/model_manifest.json"
  say "$TAG: $SZ bytes sha256 $SHA"
done
echo "]" >> "$OUT/model_manifest.json"; cp "$OUT/model_manifest.json" "$L/model_manifest.json"
say "4/6 import the GGUF into Ollama exactly as a customer machine will"
pgrep -f "ollama serve" >/dev/null || (ollama serve >/dev/null 2>&1 &); sleep 3
( cd "$OUT" && ollama create climrisk-llm-$TAG-gguf -f climrisk-llm-$TAG.Modelfile ) || fail "ollama create from GGUF"
say "5/6 smoke test"
ollama run climrisk-llm-$TAG-gguf "In one sentence: what is a covenant breach?" --keepalive 1m 2>&1 | head -5 | tee "$L/gguf_smoke.txt"
say "6/6 tests on the GGUF file itself: event and v7 held-out rows, then reasoning rows"
LOCK="$HOME/.climrisk/llm.lock"; while ! mkdir "$LOCK" 2>/dev/null; do p=$(cat "$LOCK/pid" 2>/dev/null); if [ -n "$p" ] && ! kill -0 "$p" 2>/dev/null; then rm -rf "$LOCK"; continue; fi; sleep 20; done; echo $$ > "$LOCK/pid"
[ -d "$L/dst8" ] && PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.evaluate "$L/dst8" "$L/eval_final_gguf.json" climrisk-llm-$TAG-gguf --limit 40 | tail -40
PYTHONPATH="$SRC/src" "$PY" -m cri.llmtrain.reasoning_eval "$L/dsrf" "$L/reasoning_eval_final_gguf.json" climrisk-llm-$TAG-gguf --limit 120 --seed 3 | tail -40
rm -rf "$LOCK"
echo "$TAG" > "$L/GGUF_FINAL_TAG"; echo ok > "$L/GGUF_FINAL_DONE"; say "done"; ls -la "$OUT"
