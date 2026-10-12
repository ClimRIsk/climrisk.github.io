#!/bin/bash
HERE="$(cd "$(dirname "$0")" && pwd)"; O="$HERE/llm/ollama_diag2.txt"; export PATH="/opt/homebrew/bin:$PATH"
{ echo "== serve env"; ps eww -p "$(pgrep -f 'ollama serve' | head -1)" | tr ' ' '\n' | grep -i '^OLLAMA' 
  echo "== big blobs"; find "$HOME" /Volumes /opt/homebrew/var /usr/share -type f -name 'sha256-*' -size +500M 2>/dev/null | head -20
  echo "== manifests dirs"; find "$HOME" /Volumes /opt/homebrew/var /usr/share -type d -name manifests 2>/dev/null | head
  echo "== climrisk manifests"; find "$HOME" /Volumes /opt/homebrew/var /usr/share -path '*climrisk-llm*' -type f -not -path '*/Documents/*' 2>/dev/null | head -20
} > "$O" 2>&1; echo done >> "$O"
