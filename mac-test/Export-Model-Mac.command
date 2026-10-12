#!/bin/bash
# Exports the trained models from Ollama as portable files (GGUF + Modelfile tail + checksum) that any Windows or Mac machine can import with `ollama create`.
# Output folder (outside every git repository): ~/ClimRisk-model-dist     Summary: mac-test/llm/model_export.json
HERE="$(cd "$(dirname "$0")" && pwd)"; L="$HERE/llm"; OUT="$HOME/ClimRisk-model-dist"; mkdir -p "$OUT" "$L"
export PATH="/opt/homebrew/bin:$PATH"; pgrep -f "ollama serve" >/dev/null || (ollama serve >/dev/null 2>&1 &); sleep 3
echo "[" > "$L/model_export.json"; FIRST=1
for M in climrisk-llm-v6 climrisk-llm-v5b; do
  ollama list | grep -q "^$M" || { echo "skip $M (not installed)"; continue; }
  MF="$(ollama show --modelfile "$M")"
  ls -la "$HOME/.ollama" >> "$L/model_export_debug.txt" 2>&1; echo "OLLAMA_MODELS=$OLLAMA_MODELS | launchctl: $(launchctl getenv OLLAMA_MODELS)" >> "$L/model_export_debug.txt"
  ROOT="${OLLAMA_MODELS:-$HOME/.ollama/models}"
  find "$ROOT/manifests" -type f > "$L/model_export_manifests.txt" 2>&1
  MAN="$(grep "/$M/latest$" "$L/model_export_manifests.txt" | head -1)"
  echo "manifest for $M: ${MAN:-NOT FOUND}" | tee -a "$L/model_export_debug.txt"
  BLOB="$("$HOME/.climrisk/engine-venv/bin/python" -c "
import json,sys,os
m=json.load(open(sys.argv[1]))
d=[l['digest'] for l in m['layers'] if l['mediaType'].endswith('image.model')][0]
print(os.path.join(os.environ.get('OLLAMA_MODELS') or os.path.expanduser('~/.ollama/models'),'blobs')+'/'+d.replace(':','-'))" "$MAN" 2>>"$L/model_export_debug.txt")"
  [ -f "$BLOB" ] || { echo "blob for $M not found: $BLOB"; continue; }
  cp "$BLOB" "$OUT/$M.gguf"
  echo "$MF" | grep -v '^FROM ' | grep -v '^#' > "$OUT/$M.Modelfile.tail"
  SHA="$(shasum -a 256 "$OUT/$M.gguf" | cut -d' ' -f1)"; SZ="$(stat -f%z "$OUT/$M.gguf")"
  [ $FIRST = 1 ] || echo "," >> "$L/model_export.json"; FIRST=0
  printf '{"model":"%s","file":"%s.gguf","bytes":%s,"sha256":"%s","modelfile_lines":%s}\n' "$M" "$M" "$SZ" "$SHA" "$(wc -l < "$OUT/$M.Modelfile.tail" | tr -d ' ')" >> "$L/model_export.json"
  echo "$M: $SZ bytes sha256 $SHA"
done
echo "]" >> "$L/model_export.json"
cat "$OUT/climrisk-llm-v6.Modelfile.tail" 2>/dev/null | head -30 > "$L/model_export_modelfile_v6.txt"
echo done > "$L/EXPORT_DONE"; echo "Files in $OUT:"; ls -la "$OUT"
