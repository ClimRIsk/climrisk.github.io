#!/bin/bash
HERE="$(cd "$(dirname "$0")" && pwd)"; O="$HERE/llm/ollama_diag3.txt"; export PATH="/opt/homebrew/bin:$PATH"
P="$(pgrep -f 'ollama serve' | head -1)"
{ echo "== pid $P"; echo "== lsof cwd/txt/dirs"; lsof -nP -p "$P" 2>&1 | grep -v -E 'dylib|\.so|PIPE|KQUEUE|unix|IPv|/dev/' | cut -c1-220 | head -40
  echo "== curl tags"; curl -s http://127.0.0.1:11434/api/tags | head -c 1500
  echo; echo "== ollama --version"; ollama --version 2>&1
  echo "== home dirs"; ls -la /Users 2>&1; echo "== whoami"; whoami; echo "== OLLAMA_HOST=$OLLAMA_HOST"
  echo "== spotlight"; mdfind -name climrisk-llm 2>/dev/null | head
  echo "== plist"; ls /Library/LaunchDaemons /Library/LaunchAgents ~/Library/LaunchAgents /opt/homebrew/opt/ollama 2>&1 | grep -i ollama; cat ~/Library/LaunchAgents/*ollama* 2>/dev/null | head -30; cat /opt/homebrew/Cellar/ollama/*/homebrew.mxcl.ollama.plist 2>/dev/null | head -30
} > "$O" 2>&1; echo done >> "$O"
