#!/bin/bash
# Checks the retrieval layer inside the app's own Python: is fastembed installed, is the embedding model found, does a paraphrase route to the case library? Log: mac-test/diag_rag.log
HERE="$(cd "$(dirname "$0")" && pwd)"; exec > >(tee "$HERE/diag_rag.log") 2>&1
bash "$HERE/../Sync-Engine-Mac.command" </dev/null | tail -2
PY="$HOME/.climrisk/engine-venv/bin/python"; SRC="$HOME/.climrisk/engine-src/src"
echo "python: $PY"; ls -d "$HOME/.climrisk/models/embed"/* 2>&1 | head -3
"$PY" -m pip list 2>/dev/null | grep -i -E "fastembed|onnxruntime|scikit"
shasum -a 256 "$HOME/.climrisk/case_index.jsonl" "$SRC/cri/resident/data/case_index.jsonl" 2>&1 | cut -c1-70
echo "--- running engine env:"; ps eww -o pid,command -p "$(pgrep -f 'uvicorn cri.api.main' | head -1)" 2>/dev/null | tr ' ' '\n' | grep -E "CRI_EMBED_DIR|CLIMRISK_LOCAL" | head -3
ls "/Applications/ClimRisk Intelligence.app/Contents/Resources/model/embed" 2>&1 | head -2
CRI_EMBED_DIR="/Applications/ClimRisk Intelligence.app/Contents/Resources/model/embed" PYTHONPATH="$SRC" "$PY" - <<'PY'
import os
from cri.resident import semantic as S, casebase as CB
print("model_dir:", S.model_dir(), os.path.exists(S.model_dir()))
v = S.embed_texts(["test"], query=True); print("embed works:", v is not None)
print("index_path:", CB.index_path(), "| PACKAGED:", CB.PACKAGED, "| same:", CB.index_path()==CB.PACKAGED)
import pathlib
np_=CB.PACKAGED.parent/"case_embeddings.npy"; print("npy exists:", np_.exists(), np_.stat().st_size if np_.exists() else None)
ix = CB._load(); print("dense loaded:", ix.get("sem") is not None, "items:", len(ix["items"]))
for q in ["Why can damages from fires started by electrical equipment wipe out a grid operator's equity?", "What is the weather today?"]:
    print(round(CB.semantic_best(q),3), CB.is_case_question(q), q)
PY
echo "DIAG_DONE"
