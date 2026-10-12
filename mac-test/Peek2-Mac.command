#!/bin/bash
O="$(cd "$(dirname "$0")" && pwd)/llm/peek2.txt"
{ ps aux | grep -E "[p]ip|[c]onvert_hf|[l]lama-quantize|[G]G_CHILD|Export-GGUF" | cut -c1-200; ls -la "$HOME/.climrisk/gguf-venv/lib/python3*/site-packages" 2>&1 | head -30; du -sh "$HOME/.climrisk/gguf-venv" "$HOME/Library/Caches/pip" 2>&1; ls -la "$HOME/ClimRisk-model-dist" 2>&1; ls "$HOME/.climrisk/llm/v6" "$HOME/.climrisk/llm/v6/fused" 2>&1 | head -20; } > "$O" 2>&1; echo done >> "$O"
