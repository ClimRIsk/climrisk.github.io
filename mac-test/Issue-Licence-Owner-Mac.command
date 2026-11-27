#!/bin/bash
# Issues a long owner licence for Shri's own Mac (about 10 years, near-unlimited runs and AI calls) and installs it.
# Needs the signing key you made earlier (~/.climrisk-signing/licence_private.pem). The key never leaves your Mac; this script only uses it locally.
HERE="$(cd "$(dirname "$0")" && pwd)"; PY="$HOME/.climrisk/engine-venv/bin/python"; SRC="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
[ -f "$HOME/.climrisk-signing/licence_private.pem" ] || { echo "Signing key not found at ~/.climrisk-signing/licence_private.pem. Run Make-Licence-Keys-Mac.command only if you have lost it for good: a new key means every licence already issued stops working and the app must be rebuilt with the new public key."; exit 1; }
OUT="$HERE/llm/owner_licence.txt"
cd "$SRC" && PYTHONPATH="$SRC/src" "$PY" -m cri.licence issue --name "Shri (owner)" --email "shrinivashdkannan@gmail.com" --days 3650 --runs 1000000 --ai 1000000 --activate-by 2036-12-31 > "$OUT" && PYTHONPATH="$SRC/src" "$PY" -m cri.licence install-file "$OUT" && PYTHONPATH="$SRC/src" "$PY" -m cri.licence status
echo; echo "Licence token saved in: $OUT"
