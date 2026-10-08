#!/bin/bash
# Part 2 of the global sweep (run after the free ERA5 daily allowance resets, i.e. the next day): fills in drought and river, redoes any errors, and re-runs rain/wind/heat/fire on ERA5 to cross-check NASA POWER.
HERE="$(cd "$(dirname "$0")" && pwd)"
ENGINE="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
PY="$HOME/.climrisk/engine-venv/bin/python"
LOG="$HERE/sweep2.log"; : > "$LOG"; exec > >(tee -a "$LOG") 2>&1
rm -f "$HERE/SWEEP2_DONE"; mkdir -p "$HERE/sweep" "$HERE/sweep-era5"
echo "== engine"; "$PY" -m pip install -q -e "$ENGINE[api]" 2>&1 | tail -1; "$PY" -c "import cri;print('engine',cri.__version__)"
cd "$ENGINE"
# drop earlier errors so they are retried
"$PY" - "$HERE/sweep/sweep.jsonl" <<'PYEOF'
import json, sys
p = sys.argv[1]
try:
    L = [json.loads(l) for l in open(p)]
    open(p, "w").write("".join(json.dumps(d) + "\n" for d in L if d.get("status") != "ERROR" and not (d["hazard"] == "fire" and d["site"] == "Riyadh")))
except FileNotFoundError:
    pass
PYEOF
echo "== part A: drought, river (+ anything missing) into sweep/"
for s in 0 1 2 3; do PYTHONPATH=src "$PY" tools/global_sweep.py "$HERE/sweep" all $s 4 > "$HERE/sweep/shardB$s.log" 2>&1 & done
wait
echo "== part B: ERA5 cross-check of rain, wind, heat, fire into sweep-era5/"
for s in 0 1 2 3; do CRI_DATA_PROVIDER=auto PYTHONPATH=src "$PY" tools/global_sweep.py "$HERE/sweep-era5" rain,wind,heat,fire $s 4 > "$HERE/sweep-era5/shard$s.log" 2>&1 & done
wait
"$PY" tools/sweep_report.py "$HERE/sweep/sweep.jsonl" > "$HERE/sweep/report.md"
"$PY" tools/sweep_report.py "$HERE/sweep-era5/sweep.jsonl" > "$HERE/sweep-era5/report.md"
"$PY" tools/sweep_compare.py "$HERE/sweep/sweep.jsonl" "$HERE/sweep-era5/sweep.jsonl" > "$HERE/sweep/compare.md"
cat "$HERE/sweep/report.md"; cat "$HERE/sweep/compare.md"
date > "$HERE/SWEEP2_DONE"; echo "== done"
