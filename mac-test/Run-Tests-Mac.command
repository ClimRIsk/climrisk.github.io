#!/bin/bash
# Runs the engine's full test suite with the engine venv. Result: mac-test/llm/tests_full.txt (last lines = summary), marker TESTS_DONE.
HERE="$(cd "$(dirname "$0")" && pwd)"; PY="$HOME/.climrisk/engine-venv/bin/python"; SRC="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
OUT="$HERE/llm/tests_full.txt"; : > "$OUT"
cd "$SRC" || exit 1
"$PY" -m pytest --version >> "$OUT" 2>&1 || "$PY" -m pip install -q pytest >> "$OUT" 2>&1
touch tests/__init__.py
PYTHONPATH="$SRC:$SRC/src:$SRC/tests" "$PY" -m pytest -q -p no:cacheprovider --durations=8 >> "$OUT" 2>&1
echo "exit=$?" >> "$OUT"
rm -f tests/__init__.py
echo TESTS_DONE >> "$OUT"
