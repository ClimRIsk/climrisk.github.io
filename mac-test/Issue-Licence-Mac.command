#!/bin/bash
# Issues a signed evaluation licence. Usage: NAME="Charles Hett" EMAIL=c@example.com DAYS=14 RUNS=30 AI=100 bash Issue-Licence-Mac.command   (or double-click and answer the prompts)
HERE="$(cd "$(dirname "$0")" && pwd)"; PY="$HOME/.climrisk/engine-venv/bin/python"; SRC="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
[ -n "$NAME" ] || read -p "Licensee name: " NAME; [ -n "$EMAIL" ] || read -p "Licensee email: " EMAIL
OUTD="$HERE/../Investor_Reviewer_Pack/Licences"; mkdir -p "$OUTD"; F="$OUTD/$(echo "$NAME" | tr ' ' '_')_$(date +%Y%m%d).txt"
cd "$SRC" && PYTHONPATH="$SRC/src" "$PY" -m cri.licence issue --name "$NAME" --email "$EMAIL" --days "${DAYS:-14}" --runs "${RUNS:-30}" --ai "${AI:-100}" > "$F" && echo "Licence written to: $F" && wc -c "$F"
