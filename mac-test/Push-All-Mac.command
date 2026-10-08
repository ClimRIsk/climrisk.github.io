#!/bin/bash
# Pushes the engine repo and the website repo (committed work only) to GitHub with your own credentials.
HERE="$(cd "$(dirname "$0")" && pwd)"
LOG="$HERE/push.log"; : > "$LOG"; exec > >(tee -a "$LOG") 2>&1
for R in "$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine" "$HOME/Documents/Claude/Projects/Climate Financial Risk Modelling"; do
  echo "== $R"; cd "$R" || continue
  git branch --show-current; git log --oneline -3
  git push origin "$(git branch --show-current)" 2>&1 | tail -5
done
date > "$HERE/push.DONE"; echo "== finished"
