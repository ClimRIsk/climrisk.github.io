#!/bin/bash
# The desktop app's engine process is blocked by macOS from reading ~/Documents (the editable install
# points there), so Python hangs at start-up. Mirror the engine to ~/.climrisk/engine-src and install from there.
HERE="$(cd "$(dirname "$0")" && pwd)"
O="$HERE/relocate.txt"; : > "$O"
SRC="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
DST="$HOME/.climrisk/engine-src"
PY="$HOME/.climrisk/engine-venv/bin/python"
{
mkdir -p "$DST"
rsync -a --delete --exclude .git --exclude __pycache__ --exclude '*.egg-info' --exclude build --exclude tests "$SRC/" "$DST/"
echo "synced: $(du -sh "$DST" | cut -f1)"
"$PY" -m pip install -e "$DST" --no-deps -q 2>&1 | tail -5
cd /
"$PY" -c "import cri,sys;print('cri from',cri.__file__)"
( time "$PY" -c "import cri.api.main;print('main ok')" ) 2>&1 | tail -5
} >> "$O" 2>&1
echo done >> "$O"
