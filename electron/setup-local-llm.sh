#!/usr/bin/env bash
# ClimRisk Intelligence — install the fine-tuned local AI model (macOS / Linux).
# Installs Ollama if missing, gets the ClimRisk model file (GGUF, ~2 GB), checks its SHA-256 against the manifest shipped with the app,
# imports it into Ollama as "climrisk-llm-v6" and tells the engine to use it. Everything runs on this computer afterwards (no cloud, no API key).
# Usage:  bash setup-local-llm.sh [--file /path/climrisk-llm-v6-q4km.gguf] [--url https://...] [--token xxx]
#   --file: a model file you were given (USB / shared folder)    --url/--token: download it (private link; token sent as a Bearer header)
set -euo pipefail
say() { printf '\033[1;36m▸ %s\033[0m\n' "$*"; }
die() { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

FILE=""; URL="${CLIMRISK_MODEL_URL:-}"; TOKEN="${CLIMRISK_MODEL_TOKEN:-}"
while [ $# -gt 0 ]; do case "$1" in --file) FILE="$2"; shift 2;; --url) URL="$2"; shift 2;; --token) TOKEN="$2"; shift 2;; *) die "unknown option $1";; esac; done
HERE="$(cd "$(dirname "$0")" && pwd)"; MD="$HERE/model"; [ -d "$MD" ] || MD="$HERE/../model"
MANIFEST="$MD/model_manifest.json"; TAIL="$MD/climrisk-llm.Modelfile.tail"; SRC="$MD/model-source.json"
[ -f "$MANIFEST" ] && [ -f "$TAIL" ] || die "The model manifest is missing from this install ($MD). Reinstall ClimRisk Intelligence."
NAME="climrisk-llm-v6"; CH="$HOME/.climrisk"; DL="$CH/model"; mkdir -p "$DL"
PYBIN="$(command -v python3 || true)"; [ -n "$PYBIN" ] || die "python3 is needed to read the manifest"
jget() { "$PYBIN" - "$1" "$2" <<'PY'
import json,sys
d=json.load(open(sys.argv[1])); d=[x for x in d if x.get("model")=="climrisk-llm-v6"][0] if isinstance(d,list) else d
print(d.get(sys.argv[2],""))
PY
}
WANT_SHA="$(jget "$MANIFEST" sha256)"; WANT_FILE="$(jget "$MANIFEST" file)"; WANT_BYTES="$(jget "$MANIFEST" bytes)"
sha() { if command -v shasum >/dev/null; then shasum -a 256 "$1" | cut -d' ' -f1; else sha256sum "$1" | cut -d' ' -f1; fi; }

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v ollama >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then say "Installing Ollama with Homebrew"; brew install ollama || die "brew could not install Ollama. Get it from https://ollama.com/download and run this again."
  else die "Ollama is not installed. Download it from https://ollama.com/download (drag to Applications, open once), then run this again."; fi
fi
curl -fsS --max-time 2 http://127.0.0.1:11434/api/tags >/dev/null 2>&1 || { say "Starting the Ollama service"; (ollama serve >/dev/null 2>&1 &); sleep 5; }
curl -fsS --max-time 5 http://127.0.0.1:11434/api/tags >/dev/null 2>&1 || die "The Ollama service did not start. Open the Ollama app once and try again."

if ollama list | grep -q "^$NAME"; then say "$NAME is already installed"; else
  if [ -z "$FILE" ]; then
    [ -n "$URL" ] || { [ -f "$SRC" ] && URL="$("$PYBIN" -c "import json;print(json.load(open('$SRC')).get('url',''))")"; }
    [ -n "$URL" ] || die "No model source. Re-run with --file <path to $WANT_FILE> or --url <download link> (you were sent one with your trial licence)."
    FILE="$DL/$WANT_FILE"; say "Downloading the ClimRisk model (~$((WANT_BYTES/1000000000)) GB, one time; resumes if interrupted)"
    if [ -n "$TOKEN" ]; then curl -L --fail -C - -H "Authorization: Bearer $TOKEN" -o "$FILE" "$URL" || die "download failed; run this again to resume"
    else curl -L --fail -C - -o "$FILE" "$URL" || die "download failed; run this again to resume"; fi
  fi
  [ -f "$FILE" ] || die "model file not found: $FILE"
  say "Checking the file is exactly the model that was tested (SHA-256)"
  GOT="$(sha "$FILE")"; [ "$GOT" = "$WANT_SHA" ] || die "checksum mismatch (got $GOT). The file is damaged or not the ClimRisk model; it was NOT imported."
  say "Importing into Ollama as $NAME"
  { echo "FROM $(cd "$(dirname "$FILE")" && pwd)/$(basename "$FILE")"; cat "$TAIL"; echo "PARAMETER temperature 0.2"; } > "$DL/Modelfile"
  ollama create "$NAME" -f "$DL/Modelfile" || die "ollama could not import the model"
  case "$FILE" in "$DL"/*) rm -f "$FILE";; esac       # the model now lives inside Ollama; free the 2 GB copy
fi
printf '%s' "$NAME" > "$CH/active_model"; printf '%s' "$NAME" > "$CH/active_reasoning_model"
say "Smoke test"; ollama run "$NAME" "In one sentence: what is a covenant breach?" 2>&1 | head -3 | sed 's/^/  /'
say "Done. Reopen ClimRisk Intelligence: the AI now runs on this computer. CPU-only machines answer slowly (tens of seconds); the engine falls back to its rule-based answer if a reply is too slow."
