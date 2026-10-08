#!/bin/bash
HERE="$(cd "$(dirname "$0")" && pwd)"
O="$HERE/applog.txt"; : > "$O"
{
echo "== engine.log tail"; tail -60 "$HOME/.climrisk/logs/engine.log"
echo "== engine.env keys"; sed -E 's/=.*/=<redacted>/' "$HOME/.climrisk/engine.env"
echo "== procs"; ps aux | grep -E "uvicorn|ClimRisk|Electron" | grep -v grep | cut -c1-220
echo "== listening"; lsof -iTCP -sTCP:LISTEN -n -P 2>/dev/null | grep -i -E "python|climrisk|electron" 
echo "== proxy env"; env | grep -i -E "proxy" 
echo "== app log dir"; ls -la "$HOME/.climrisk" "$HOME/.climrisk/logs"
for f in "$HOME/Library/Logs/ClimRisk Intelligence"/*.log; do echo "== $f"; tail -30 "$f"; done 2>/dev/null
} >> "$O" 2>&1
echo done >> "$O"
