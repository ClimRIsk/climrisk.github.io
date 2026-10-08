#!/bin/bash
HERE="$(cd "$(dirname "$0")" && pwd)"; O="$HERE/llm/peek.txt"
{ date; ps aux | grep -E "mlx_lm|huggingface|python.*lora" | grep -v grep | cut -c1-200
du -sh "$HOME/.cache/huggingface" 2>/dev/null; find "$HOME/.cache/huggingface" -name "*.incomplete" -exec ls -la {} \; 2>/dev/null | cut -c1-200
ls -la "$HOME/.climrisk/llm" 2>/dev/null; vm_stat | head -4; } > "$O" 2>&1
