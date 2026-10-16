#!/usr/bin/env bash
# ── ClimRisk Intelligence — one-time local engine setup ──────────────────────
# Creates ~/.climrisk/engine-venv and installs the ClimRisk engine into it in
# editable mode, so updates to the engine folder (git pull) take effect on the
# next app start without reinstalling.
#
# Usage:  bash setup-local-engine.sh [path/to/climate_risk_engine]
# Default engine path: ~/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine
set -euo pipefail

ENGINE_DIR="${1:-$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine}"
HOME_DIR="$HOME/.climrisk"
VENV="$HOME_DIR/engine-venv"

say() { printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

[ -f "$ENGINE_DIR/pyproject.toml" ] || die "Engine not found at: $ENGINE_DIR
Pass the path to the climate_risk_engine folder as the first argument."

# The engine needs Python 3.10+ (macOS's built-in python3 is often 3.9)
PY=""
if [ -z "${CLIMRISK_FORCE_UV:-}" ]; then
  for c in python3.12 python3.11 python3.10 /opt/homebrew/bin/python3 /usr/local/bin/python3 python3; do
    if command -v "$c" >/dev/null 2>&1 && "$c" -c 'import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)' 2>/dev/null; then
      PY="$(command -v "$c")"; break
    fi
  done
fi
UVBIN=""
if [ -z "$PY" ]; then
  # No suitable Python on this computer: fetch a self-contained one with uv (Astral's installer; no admin rights, no Homebrew, no Xcode tools). It goes into ~/.climrisk/uv.
  say "No Python 3.10+ found; installing a private copy (about 60 MB, one time)"
  mkdir -p "$HOME_DIR/uv"
  if [ ! -x "$HOME_DIR/uv/uv" ]; then
    curl -LsSf https://astral.sh/uv/install.sh | env UV_UNMANAGED_INSTALL="$HOME_DIR/uv" UV_NO_MODIFY_PATH=1 sh || die "Could not download Python (is the internet on?). Connect and run this again."
  fi
  UVBIN="$HOME_DIR/uv/uv"; [ -x "$UVBIN" ] || die "uv was not installed"
  "$UVBIN" python install 3.12 || die "Could not download Python 3.12 (is the internet on?)"
  PY="$("$UVBIN" python find 3.12)"
fi
say "Using $("$PY" --version) at $PY"

mkdir -p "$HOME_DIR/cache" "$HOME_DIR/logs"
chmod 700 "$HOME_DIR"

if [ ! -x "$VENV/bin/python" ]; then
  say "Creating Python environment at $VENV"
  if [ -n "$UVBIN" ]; then "$UVBIN" venv --seed --python "$PY" "$VENV"; else "$PY" -m venv "$VENV"; fi
fi

say "Installing the ClimRisk engine (first run downloads ~300 MB of scientific libraries)"
"$VENV/bin/python" -m pip install --upgrade pip wheel >/dev/null
# macOS blocks the desktop app (and the engine it launches) from reading ~/Documents, ~/Desktop and
# ~/Downloads without a per-app grant, and Python then hangs at start-up. So the engine is mirrored to
# ~/.climrisk/engine-src and installed from there. Re-run this script after pulling engine changes.
SRC_COPY="$HOME_DIR/engine-src"
case "$ENGINE_DIR" in
  "$HOME"/Documents/*|"$HOME"/Desktop/*|"$HOME"/Downloads/*|*.app/*)
    say "Mirroring the engine to $SRC_COPY (macOS blocks apps from reading Documents)"
    mkdir -p "$SRC_COPY"
    rsync -a --delete --exclude .git --exclude __pycache__ --exclude '*.egg-info' --exclude build --exclude tests "$ENGINE_DIR/" "$SRC_COPY/"
    ENGINE_DIR="$SRC_COPY" ;;
esac
"$VENV/bin/python" -m pip install -e "$ENGINE_DIR[api]"

say "Checking the engine starts"
"$VENV/bin/python" - <<'PY'
import importlib, sys
for m in ("cri.api.main", "cri.analysis.asset_intelligence", "cri.climate.tropical_cyclone", "rasterio", "pysheds"):
    importlib.import_module(m)
from cri.climate.tropical_cyclone import site_hazard
h = site_hazard(25.77, -80.19)
print(f"  engine OK · cyclone model loaded ({h.worst['name']} {h.worst['season']} is Miami's worst storm)")
PY

ENVFILE="$HOME_DIR/engine.env"
if [ ! -f "$ENVFILE" ]; then
  cat > "$ENVFILE" <<'EOF'
# ClimRisk local engine secrets — read only by the desktop app on this Mac.
# Uncomment and fill in to enable the AI deep dive (free key: console.groq.com):
# GROQ_API_KEY=
EOF
fi
chmod 600 "$ENVFILE"

say "Done. Open ClimRisk Intelligence (or choose Retry) — the engine now runs locally."
echo "  Engine code : $ENGINE_DIR (re-run this script after engine updates)"
echo "  Secrets     : $ENVFILE"
echo "  Logs        : $HOME_DIR/logs/engine.log"
