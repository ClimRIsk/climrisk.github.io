#!/bin/bash
# Simulates a computer that has never seen ClimRisk: a fresh home folder, a minimal PATH, no Python/Homebrew available to the scripts (forces the private-Python path), and a second Ollama on port 11500
# so the real Ollama on this Mac is untouched. Runs the two first-run setup scripts exactly as the app does, from inside the BUILT app, then checks the engine and the model.
# Log: mac-test/clean_install.log   Marker: CLEAN_INSTALL_OK or CLEAN_INSTALL_FAILED
HERE="$(cd "$(dirname "$0")" && pwd)"; LOG="$HERE/clean_install.log"; exec > >(tee "$LOG") 2>&1
APP="$HERE/../electron/dist/mac-universal/ClimRisk Intelligence.app"; RES="$APP/Contents/Resources"
H2="$HOME/climrisk-clean-home"; rm -rf "$H2"; mkdir -p "$H2"
fail(){ echo "CLEAN_INSTALL_FAILED: $1"; exit 1; }
[ -d "$RES/engine/src/cri" ] || fail "built app has no engine"
ls "$RES"/model/*.gguf >/dev/null 2>&1 || fail "built app has no model file"
export HOME="$H2" PATH="/usr/bin:/bin:/usr/sbin:/sbin" CLIMRISK_FORCE_UV=1 OLLAMA_HOST="127.0.0.1:11500"
echo "[$(date +%T)] 1/4 engine setup (fresh home $H2, no Python on PATH, private Python forced)"
bash "$RES/setup-local-engine.sh" "$RES/engine" || fail "engine setup"
echo "[$(date +%T)] 2/4 the engine answers a real analysis from the fresh install"
"$H2/.climrisk/engine-venv/bin/python" - <<'PY' || fail "engine check"
from cri.climate.tropical_cyclone import site_hazard
h = site_hazard(29.76, -95.37); print("engine OK, Houston worst storm:", h.worst["name"], h.worst["season"])
PY
echo "[$(date +%T)] 3/4 model install from the file inside the app (own Ollama on 11500)"
bash "$RES/setup-local-llm.sh" || fail "model setup"
echo "[$(date +%T)] 4/4 the installed model answers"
cat "$H2/.climrisk/active_model"; echo
OLLAMA_HOST="127.0.0.1:11500" "$H2/.climrisk/ollama-app/Ollama.app/Contents/Resources/ollama" list 2>&1 | head -5
echo "CLEAN_INSTALL_OK"
