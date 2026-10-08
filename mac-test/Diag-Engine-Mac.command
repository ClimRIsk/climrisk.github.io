#!/bin/bash
# Starts the engine the way the app does (no PYTHONPATH, cwd /), reports where cri is imported from and how long startup takes.
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/diag.txt"; : > "$OUT"
PY="$HOME/.climrisk/engine-venv/bin/python"
PORT=61998
{
cd /
echo "== where cri comes from (no PYTHONPATH)"; ( time "$PY" -c "import cri,sys;print(cri.__file__, cri.__version__)" ) 2>&1 | tail -6
echo "== import main"; ( time "$PY" -c "import cri.api.main as m;print('ok')" ) 2>&1 | tail -12
set -a; [ -f "$HOME/.climrisk/engine.env" ] && . "$HOME/.climrisk/engine.env"; set +a
START=$(date +%s)
CRI_API_KEYS=diagtoken PYTHONUNBUFFERED=1 CLIMRISK_LOCAL=1 "$PY" -m uvicorn cri.api.main:app --host 127.0.0.1 --port $PORT --workers 1 --log-level info > "$HERE/diag-uvicorn.txt" 2>&1 &
PID=$!
for i in $(seq 1 100); do
  if curl -s -m 2 "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; then echo "healthy after $(( $(date +%s) - START )) s"; break; fi
  sleep 1
done
echo "== uvicorn log"; tail -25 "$HERE/diag-uvicorn.txt"
kill $PID 2>/dev/null
echo "== pip show"; "$PY" -m pip show -f climate-risk-intelligence 2>/dev/null | head -12; "$PY" -m pip list 2>/dev/null | grep -i -E "cri|climate|uvicorn|fastapi|numpy"
} >> "$OUT" 2>&1
echo done >> "$OUT"
