#!/bin/bash
HERE="$(cd "$(dirname "$0")" && pwd)"; O="$HERE/llm/probe.txt"; mkdir -p "$HERE/llm"
{
echo "chip: $(sysctl -n machdep.cpu.brand_string)"; echo "ram_gb: $(( $(sysctl -n hw.memsize) / 1073741824 ))"; sw_vers | tr '\n' ' '; echo
echo "disk free:"; df -h "$HOME" | tail -1
for p in python3.9 python3.10 python3.11 python3.12 python3.13 python3.14 python3; do command -v $p >/dev/null && echo "$p -> $(command -v $p) $($p --version 2>&1)"; done
ls /Library/Frameworks/Python.framework/Versions/ 2>/dev/null
echo "brew: $(command -v brew)"; echo "uv: $(command -v uv)"; echo "ollama: $(command -v ollama)"
(ollama list 2>&1 | head -10)
curl -s -m 3 http://127.0.0.1:11434/api/tags | head -c 400; echo
echo "arch: $(uname -m)"
} > "$O" 2>&1
echo done >> "$O"
