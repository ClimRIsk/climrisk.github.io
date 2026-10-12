#!/bin/bash
# One-time: creates the licence signing key pair. The PRIVATE key stays in ~/.climrisk-signing (outside every repository); the PUBLIC key is written into the engine so builds can verify licences.
# Back the private key up somewhere offline (password manager). Anyone holding it can issue licences. Re-running refuses to overwrite an existing key.
HERE="$(cd "$(dirname "$0")" && pwd)"; L="$HERE/llm"; mkdir -p "$L"
PY="$HOME/.climrisk/engine-venv/bin/python"; SRC="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
"$PY" -m pip install --quiet "cryptography>=42"
cd "$SRC" && PYTHONPATH="$SRC/src" "$PY" -m cri.licence keygen 2>&1 | tee "$L/licence_keygen.txt"
ls -la "$HOME/.climrisk-signing" "$SRC/src/cri/data/licence_public.pem" 2>&1 | tee -a "$L/licence_keygen.txt"
echo done > "$L/KEYGEN_DONE"
