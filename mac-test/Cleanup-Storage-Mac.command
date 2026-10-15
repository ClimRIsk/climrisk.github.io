#!/bin/bash
# Frees disk space after v7. SHOWS what it would remove and the size of each item first; nothing is deleted until you type YES in this window.
#   Step A (safe, models and data already superseded): Ollama models and training folders of versions older than v6, intermediate datasets, fused/GGUF copies.
#   Step B (optional, re-downloadable/rebuildable): raw downloaded data, app build output, node_modules. You are asked separately.
# KEPT always: climrisk-llm-v6 and v7 (models and adapters), llama3.2:3b and qwen2.5:7b (comparison baselines), the base model cache, ds7, dsx7f, dsrf, ds5f (evaluation sets), all code and results.
# Refuses to run while v7 is still training/evaluating (marker mac-test/llm/V7_DONE missing), unless you run it with FORCE=1.
HERE="$(cd "$(dirname "$0")" && pwd)"; L="$HERE/llm"; export PATH="/opt/homebrew/bin:$PATH"
ROOT="$(cd "$HERE/.." && pwd)"; ENG="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"; CR="$HOME/.climrisk"
if [ ! -f "$L/V7_DONE" ] && [ "$FORCE" != 1 ] && [ "$WHILE_TRAINING" != 1 ]; then echo "v7 has not finished (no V7_DONE). Training/evaluation still need v6 and the datasets. Run this again when it is done."; exit 1; fi
if [ -d "$HOME/.climrisk/llm.lock" ] && [ "$WHILE_TRAINING" != 1 ]; then echo "A training/evaluation job holds the lock. Try again when it has finished."; exit 1; fi
hsize(){ du -sh "$1" 2>/dev/null | cut -f1; }
ACTIVE="$(cat "$CR/active_model" 2>/dev/null | tr -d '[:space:]')"; echo "Model the app currently uses: ${ACTIVE:-none} (it is never deleted)"
A=()   # items for step A: path or "ollama:NAME"
for d in "$CR"/llm/*/; do b="$(basename "$d")"; case "$b" in v6|v7) ;; *) [ "climrisk-llm-$b" = "$ACTIVE" ] || A+=("$d");; esac; done
for sub in fused fused-dequant gguf; do for v in v6 v7; do [ -e "$CR/llm/$v/$sub" ] && A+=("$CR/llm/$v/$sub"); done; done
for n in ds ds2 ds3 ds5 dsr ds6 dsx7; do [ -d "$L/$n" ] && A+=("$L/$n"); done
for m in $(ollama list 2>/dev/null | awk 'NR>1{print $1}' | grep '^climrisk-llm'); do case "${m%%:*}" in climrisk-llm-v6|climrisk-llm-v7) ;; *) [ "${m%%:*}" = "$ACTIVE" ] || A+=("ollama:$m");; esac; done
B=("$L/xbrl/raw" "$ENG/data/backtest/raw" "$ROOT/electron/dist" "$ROOT/electron/node_modules" "$ROOT/climrisk-web/node_modules" "$ROOT/climrisk-web/.next" "$ROOT/climrisk-web/out" "$ROOT/climrisk-desktop/node_modules")
show(){ for x in "$@"; do case "$x" in ollama:*) echo "   ollama model  ${x#ollama:}   ($(ollama list | awk -v n="${x#ollama:}" '$1==n{print $3, $4}'))";; *) [ -e "$x" ] && printf '   %-8s %s\n' "$(hsize "$x")" "$x";; esac; done; }
echo; echo "Disk now:"; df -h / | tail -1; echo
echo "STEP A: superseded versions and intermediates (safe)"; show "${A[@]}"; echo
echo "STEP B: optional, re-downloadable or rebuildable"; echo "   (raw data re-downloads with the collect scripts; dist/node_modules/.next come back with npm install and electron/build-mac.sh)"; show "${B[@]}"; echo
del(){ for x in "$@"; do case "$x" in ollama:*) ollama rm "${x#ollama:}";; *) [ -e "$x" ] && rm -rf "$x" && echo "removed $x";; esac; done; }
read -r -p "Type YES to delete everything listed under STEP A: " a; if [ "$a" = "YES" ]; then del "${A[@]}"; else echo "Step A skipped."; fi
read -r -p "Type YES to delete everything listed under STEP B: " b; if [ "$b" = "YES" ]; then del "${B[@]}"; else echo "Step B skipped."; fi
echo; echo "Disk now:"; df -h / | tail -1; echo "Done."
