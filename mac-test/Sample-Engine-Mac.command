#!/bin/bash
HERE="$(cd "$(dirname "$0")" && pwd)"
O="$HERE/sample.txt"; : > "$O"
{
sleep 15
PID=$(pgrep -f "uvicorn cri.api.main:app" | head -1)
echo "pid=$PID"; ps -o pid,ppid,stat,etime,%cpu,command -p "$PID" | cut -c1-250
echo "== env of proc (keys)"; ps eww -p "$PID" | tr ' ' '\n' | grep -E "^(CRI_|CLIMRISK|SSL_|REQUESTS_|PYTHON|PATH=)" | sed -E 's/(CRI_API_KEYS)=.*/\1=<redacted>/'
echo "== lsof"; lsof -p "$PID" 2>/dev/null | grep -v -E "\.dylib|\.so|\.pyc|framework" | tail -30
echo "== sample"; sample "$PID" 3 -file /dev/stdout 2>&1 | head -60
echo "== log tail"; tail -5 "$HOME/.climrisk/logs/engine.log"
} >> "$O" 2>&1
echo done >> "$O"
