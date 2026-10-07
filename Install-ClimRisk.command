#!/bin/bash
# ── ClimRisk Intelligence — build and install on THIS Mac (local only) ─────────
# Double-click this file in Finder (or run:  bash Install-ClimRisk.command).
# It does not touch git or Render. Steps:
#   1. refresh the local engine (pip install -e, so engine edits are live)
#   2. run the engine test suite — stops here if anything fails
#   3. build the macOS app (electron-builder, universal)
#   4. quit the running app, replace /Applications/ClimRisk Intelligence.app, launch it
# Everything is logged to ~/.climrisk/logs/install.log

set -uo pipefail
LOGDIR="$HOME/.climrisk/logs"; mkdir -p "$LOGDIR"
LOG="$LOGDIR/install.log"
exec > >(tee -a "$LOG") 2>&1

ROOT="$(cd "$(dirname "$0")" && pwd)"
ENGINE="${CLIMRISK_ENGINE:-$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine}"
VENV="$HOME/.climrisk/engine-venv"
APP_NAME="ClimRisk Intelligence"

say()  { printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }
ok()   { printf '  \033[1;32m✓ %s\033[0m\n' "$*"; }
die()  { printf '\n\033[1;31m✗ %s\033[0m\n   Log: %s\n' "$*" "$LOG"; echo; read -r -p "Press Return to close…" _; exit 1; }

echo "════ $(date)  ClimRisk install ════"
[ -f "$ENGINE/pyproject.toml" ] || die "Engine not found at $ENGINE (set CLIMRISK_ENGINE to its path)."
[ -f "$ROOT/electron/package.json" ] || die "Run this from the 'Climate Financial Risk Modelling' folder."
command -v node >/dev/null 2>&1 || die "Node.js is required (brew install node)."
command -v npm  >/dev/null 2>&1 || die "npm is required (brew install node)."

# ── 1. engine ────────────────────────────────────────────────────────────────
say "1/4  Engine: refreshing the local environment"
bash "$ROOT/electron/setup-local-engine.sh" "$ENGINE" || die "Engine setup failed."
ok "engine installed (editable) at $VENV"

# ── 2. tests ─────────────────────────────────────────────────────────────────
say "2/4  Engine tests"
"$VENV/bin/python" -m pip install --quiet pytest httpx >/dev/null 2>&1
( cd "$ENGINE" && "$VENV/bin/python" -m pytest tests -q -p no:cacheprovider ) || die "Engine tests failed — nothing was installed."
ok "all engine tests pass"

# ── 3. build ─────────────────────────────────────────────────────────────────
say "3/4  Building the macOS app (about 2 minutes the first time)"
cd "$ROOT/electron" || die "electron folder missing"
[ -d node_modules ] || npm install --no-audit --no-fund || die "npm install failed."
rm -rf dist/mac-universal "dist/${APP_NAME}-"*.dmg "dist/${APP_NAME}-"*.blockmap
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:mac || die "App build failed."
BUILT="$(ls -d dist/mac*/"${APP_NAME}.app" 2>/dev/null | head -1)"
[ -n "$BUILT" ] || die "Build finished but no .app was produced."
ok "built: $BUILT"

# ── 4. install + launch ──────────────────────────────────────────────────────
say "4/4  Installing to /Applications and launching"
osascript -e "tell application \"${APP_NAME}\" to quit" >/dev/null 2>&1 || true
sleep 2
rm -rf "/Applications/${APP_NAME}.app"
cp -R "$BUILT" "/Applications/${APP_NAME}.app" || die "Could not copy into /Applications."
xattr -dr com.apple.quarantine "/Applications/${APP_NAME}.app" 2>/dev/null || true
open "/Applications/${APP_NAME}.app"
ok "installed and launched"

echo
printf '\033[1;32m═══ Done. ClimRisk Intelligence is running from /Applications. ═══\033[0m\n'
echo "A DMG for sharing is in: $ROOT/electron/dist/"
echo
# Optional: a language model that runs on this Mac (no key, no cloud) so the agent writes fluent, cited answers.
if ! curl -fsS --max-time 2 http://127.0.0.1:11434/api/tags 2>/dev/null | grep -q '"name"'; then
  echo "The agent answers from the public sources it has learned. For fluent written answers it can also use a free"
  echo "language model that runs on this Mac (Ollama, about 2 GB download, no account or key)."
  read -r -p "Set that up now? [y/N] " yn
  if [[ "$yn" =~ ^[Yy] ]]; then bash "$ROOT/electron/setup-local-llm.sh" || echo "(skipped — you can run electron/setup-local-llm.sh any time)"; fi
fi
read -r -p "Press Return to close…" _
