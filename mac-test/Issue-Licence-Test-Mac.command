#!/bin/bash
# Issues a short test licence for Shri's own Mac (written to mac-test/llm/test_licence.txt, not into the reviewer package).
HERE="$(cd "$(dirname "$0")" && pwd)"; PY="$HOME/.climrisk/engine-venv/bin/python"; SRC="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
cd "$SRC" && PYTHONPATH="$SRC/src" "$PY" -m cri.licence issue --name "Shri (test)" --email "shrinivashdkannan@gmail.com" --days 3 --runs 30 --ai 100 > "$HERE/llm/test_licence.txt" 2>"$HERE/llm/test_licence.err"; wc -c "$HERE/llm/test_licence.txt"
