#!/bin/bash
# Gives the installed ClimRisk app the new engine code and the case library, then proves the app's own copy works.
#   1 mirror the engine into ~/.climrisk/engine-src and reinstall it (the app cannot read ~/Documents)
#   2 check the case index the app searches (built by Run-V4-Mac.command)
#   3 run the investor-demo check against the APP's copy of the engine, not the project folder
# After it finishes, quit and reopen ClimRisk. Output: mac-test/llm/sync_app.log
HERE="$(cd "$(dirname "$0")" && pwd)"; L="$HERE/llm"; mkdir -p "$L"
exec > >(tee "$L/sync_app.log") 2>&1
export PATH="/opt/homebrew/bin:$PATH"
echo "[$(date +%H:%M:%S)] 1/3 mirroring the engine"
bash "$HERE/../electron/setup-local-engine.sh" || { echo "engine sync failed"; exit 1; }
PY="$HOME/.climrisk/engine-venv/bin/python"
echo "[$(date +%H:%M:%S)] 2/3 case index"
cd "$HOME/.climrisk" || exit 1
"$PY" - <<'PYEOF'
import json
from cri.resident import casebase as CB
print(json.dumps(CB.stats(), indent=1) if CB.available() else "NO CASE INDEX FOUND: run Run-V4-Mac.command first")
import cri; print("engine copy in use:", cri.__file__)
PYEOF
echo "[$(date +%H:%M:%S)] 3/3 demo check on the app's copy"
pgrep -f "ollama serve" >/dev/null || (ollama serve >/dev/null 2>&1 &); sleep 3
"$PY" -m cri.resident.demo_check "$L/demo_app.json" --n 24
echo "[$(date +%H:%M:%S)] done. Quit and reopen ClimRisk."
