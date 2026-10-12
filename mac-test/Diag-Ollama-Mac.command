#!/bin/bash
HERE="$(cd "$(dirname "$0")" && pwd)"; O="$HERE/llm/ollama_diag.txt"; export PATH="/opt/homebrew/bin:$PATH"
{ echo "== ps"; ps aux | grep -i "[o]llama" | cut -c1-250
  echo "== ls ~/.ollama"; ls -la "$HOME/.ollama" 2>&1 | head -20
  echo "== find manifests"; find "$HOME" /Volumes /usr/share/ollama /opt/homebrew/var -maxdepth 8 -type d -name manifests 2>/dev/null | head
  echo "== ollama list"; ollama list
  echo "== modelfile v6"; ollama show --modelfile climrisk-llm-v6 | head -12
  echo "== env"; env | grep -i ollama; launchctl print-disabled "gui/$(id -u)" 2>/dev/null | grep -i ollama
  echo "== du"; du -sh "$HOME/.ollama" 2>&1
} > "$O" 2>&1
