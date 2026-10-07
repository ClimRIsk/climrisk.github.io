#!/bin/bash
# ClimRisk: build the local language model and test everything ON THIS MAC.
# Double-click to run. Everything is logged to mac-test/run.log next to this file; results go to mac-test/e2e.json.
HERE="$(cd "$(dirname "$0")" && pwd)"
ENGINE="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
VENV="$HOME/.climrisk/engine-venv"
PY="$VENV/bin/python"
LOG="$HERE/run.log"
: > "$LOG"
exec > >(tee -a "$LOG") 2>&1
step() { printf '\n\033[1;36m▸ %s\033[0m  [%s]\n' "$*" "$(date +%H:%M:%S)"; }
rm -f "$HERE/DONE" "$HERE/e2e.json"

step "0. This Mac"
sw_vers; uname -m
MEM_GB=$(( $(sysctl -n hw.memsize) / 1073741824 )); echo "RAM: ${MEM_GB} GB"; df -h "$HOME" | tail -1
if [ "$MEM_GB" -ge 16 ]; then MODEL="qwen2.5:7b"; else MODEL="llama3.2:3b"; fi
echo "Model chosen for this Mac: $MODEL"

step "1. Engine environment (update to the latest engine code and dependencies)"
if [ ! -x "$PY" ]; then echo "Engine venv missing — creating it"; bash "$HERE/../electron/setup-local-engine.sh" || echo "setup-local-engine failed"; fi
"$PY" -m pip install -q -e "$ENGINE[api]" pytest 2>&1 | tail -3
"$PY" -c "import cri, certifi; print('engine', cri.__version__, '| certifi', certifi.where())"

step "2. Ollama (the local language model runtime)"
OLLAMA=""
for c in "$(command -v ollama 2>/dev/null)" /opt/homebrew/bin/ollama /usr/local/bin/ollama /Applications/Ollama.app/Contents/Resources/ollama; do
  [ -n "$c" ] && [ -x "$c" ] && OLLAMA="$c" && break
done
if [ -z "$OLLAMA" ]; then
  if command -v brew >/dev/null 2>&1; then echo "Installing with Homebrew"; brew install ollama 2>&1 | tail -5; OLLAMA="$(command -v ollama)"; fi
fi
if [ -z "$OLLAMA" ]; then
  echo "No Homebrew — downloading the Ollama app"
  TMP="$(mktemp -d)"; curl -fL --progress-bar -o "$TMP/o.zip" https://ollama.com/download/Ollama-darwin.zip && unzip -q "$TMP/o.zip" -d "$TMP" && rm -rf /Applications/Ollama.app && mv "$TMP/Ollama.app" /Applications/ && xattr -dr com.apple.quarantine /Applications/Ollama.app 2>/dev/null
  OLLAMA=/Applications/Ollama.app/Contents/Resources/ollama
fi
echo "ollama binary: $OLLAMA"; [ -x "$OLLAMA" ] && "$OLLAMA" --version

step "3. Start the Ollama service"
if ! curl -fsS --max-time 2 http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  nohup "$OLLAMA" serve > "$HERE/ollama.log" 2>&1 &
  for i in $(seq 1 40); do curl -fsS --max-time 2 http://127.0.0.1:11434/api/tags >/dev/null 2>&1 && break; sleep 1; done
fi
curl -fsS --max-time 3 http://127.0.0.1:11434/api/tags >/dev/null 2>&1 && echo "service is up" || echo "SERVICE DID NOT START (see ollama.log)"

step "4. Download the model $MODEL (one time)"
"$OLLAMA" pull "$MODEL" 2>&1 | tr '\r' '\n' | awk 'NR%25==1 || /success|error/'
"$OLLAMA" list

step "5. The model answers a grounded test question (speed check)"
T0=$(date +%s)
curl -fsS --max-time 240 http://127.0.0.1:11434/api/chat -d "{\"model\":\"$MODEL\",\"stream\":false,\"messages\":[{\"role\":\"user\",\"content\":\"In two sentences: what is a storm surge?\"}]}" | "$PY" -c "import sys,json; print(json.load(sys.stdin)['message']['content'])"
echo "took $(( $(date +%s) - T0 )) s"

step "6. Engine tests ON THIS MAC (new code)"
cd "$ENGINE"
export CRI_DATA_DIR="$HERE/data-tests" CRI_STORY_OFFLINE=1 CRI_AUTOPILOT=0 CRI_LLM=0
rm -rf "$CRI_DATA_DIR"
"$PY" -m pytest tests/test_knowledge_chat.py tests/test_keyless_brief.py tests/test_autopilot.py -q -p no:cacheprovider 2>&1 | tail -15
unset CRI_STORY_OFFLINE CRI_LLM CRI_AUTOPILOT

step "7. Live engine + end-to-end chat on this Mac"
export CRI_DATA_DIR="$HERE/data-live" CRI_AUTOPILOT=0
rm -rf "$CRI_DATA_DIR"
nohup "$PY" -m uvicorn cri.api.main:app --host 127.0.0.1 --port 8791 --log-level warning > "$HERE/engine.log" 2>&1 &
EP=$!
for i in $(seq 1 60); do curl -fsS --max-time 2 http://127.0.0.1:8791/health >/dev/null 2>&1 && break; sleep 1; done
curl -fsS http://127.0.0.1:8791/health; echo
E2E_OUT="$HERE" ENGINE_SRC="$ENGINE/src" "$PY" "$HERE/mac_e2e.py"
kill $EP 2>/dev/null

step "Finished"
date > "$HERE/DONE"
echo "Results: $HERE/e2e.json   Log: $LOG"
echo "You can close this window."
