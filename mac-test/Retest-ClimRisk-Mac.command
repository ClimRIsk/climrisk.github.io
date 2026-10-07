#!/bin/bash
# ClimRisk quick re-test ON THIS MAC: certificates + terrain + model-written answers. Log: mac-test/retest.log
HERE="$(cd "$(dirname "$0")" && pwd)"
ENGINE="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
PY="$HOME/.climrisk/engine-venv/bin/python"
LOG="$HERE/retest.log"; : > "$LOG"; exec > >(tee -a "$LOG") 2>&1
rm -f "$HERE/RETEST_DONE"
echo "== install latest engine deps"; "$PY" -m pip install -q -e "$ENGINE[api]" 2>&1 | tail -2
echo "== python / ssl"; "$PY" -c "import sys,ssl;print(sys.version);print(ssl.OPENSSL_VERSION)"; "$PY" -c "import truststore;print('truststore',truststore.__version__ if hasattr(truststore,'__version__') else 'ok')" 2>&1 | tail -1
echo "== proxy / cert env"; env | grep -i -E "proxy|ssl_cert|requests_ca" || echo "(none set)"; scutil --proxy 2>/dev/null | grep -E "Enable|Proxy" | head -8
cd "$ENGINE"; export CRI_DATA_DIR="$HERE/data-retest" CRI_AUTOPILOT=0; rm -rf "$CRI_DATA_DIR"
echo "== terrain in a fresh process (urllib imported BEFORE cri, the order that failed)"
"$PY" - <<'PYEOF'
import urllib.request, time
from cri.analysis.asset_intelligence import assess_asset
t=time.time(); a=assess_asset(22.2645,91.805,"Chattogram Plant",include_visuals=True)
d=(a.get("visual") or {}).get("dem") or {}
print("TERRAIN", "OK" if d.get("max_m") is not None and d["max_m"]-d["min_m"]>5 else "FAIL", d.get("min_m"), d.get("max_m"), "gaps:", a["data_gaps"], round(time.time()-t),"s")
PYEOF
echo "== model-written answers (direct call, shows why if it falls back)"
"$PY" - <<'PYEOF'
import time
from cri.resident import answer as A, knowledge as K
K.learn_seed(max_wiki=40)
for q in ["why do cyclones hit Bangladesh so hard?","what is the difference between a storm surge and river flooding?"]:
    t=time.time(); r=A.ask(q)
    print("\nQ:",q,"\nMODE:",r["mode"],"| llm_note:",r.get("llm_note"),"|",round(time.time()-t),"s\nLAST_LLM:",A.LAST_LLM["why"],"\nRAW:",A.LAST_LLM["raw"][:300].replace("\n"," "),"\nREPLY:",r["reply"][:700])
PYEOF
date > "$HERE/RETEST_DONE"; echo "== done"
