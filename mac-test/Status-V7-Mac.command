#!/bin/bash
O="$(cd "$(dirname "$0")" && pwd)/llm/status_v7.txt"
{ date; echo "--- processes"; ps aux | grep -E "run_v7|Run-V7|evaluate|llmtrain|reasoning|ollama|mlx" | grep -v grep | cut -c1-200; echo "--- uptime"; uptime; pmset -g batt | head -2; echo "--- recent files"; ls -lt "$(dirname "$O")" | head -8; echo "--- log tail"; tail -5 "$(dirname "$O")/run_v7.log"; } > "$O" 2>&1
