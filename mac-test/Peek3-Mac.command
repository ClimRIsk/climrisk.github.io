#!/bin/bash
O="$(cd "$(dirname "$0")" && pwd)/llm/peek3.txt"
{ date; ps aux | grep -E "[r]easoning_eval|[o]llama|[c]affeinate|Export-GGUF" | cut -c1-180; ls -la "$HOME/.climrisk/llm.lock" 2>&1; cat "$HOME/.climrisk/llm.lock/pid" 2>&1; curl -s http://127.0.0.1:11434/api/ps | head -c 600; } > "$O" 2>&1; echo done >> "$O"
