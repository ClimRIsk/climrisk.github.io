#!/bin/bash
# Repairs the Electron install (keeps the broken copy aside, never deletes it), syncs the engine, builds the DMG.
# Log: mac-test/build_app.log   Marker at the end: BUILD_APP_DONE or BUILD_APP_FAILED
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENGINE="$HOME/Documents/Claude/Projects/climrisk-engine-space/climate_risk_engine"
LOG="$ROOT/mac-test/build_app.log"
exec > >(tee "$LOG") 2>&1
echo "[$(date +%T)] start"
fail(){ echo "BUILD_APP_FAILED: $1"; exit 1; }
[ -d "$ENGINE/src/cri" ] || fail "engine folder not found at $ENGINE"
command -v node >/dev/null || fail "node is not installed"

# engine refresh first, so the engine-served pages in the build are current
if [ -f "$ROOT/Sync-Engine-Mac.command" ]; then
  echo "[$(date +%T)] sync engine"; bash "$ROOT/Sync-Engine-Mac.command" </dev/null || echo "sync reported a problem; continuing"
fi

cd "$ROOT/electron" || fail "electron folder"
if [ ! -f node_modules/electron/path.txt ]; then
  echo "[$(date +%T)] electron install is incomplete; moving it aside"
  [ -d node_modules/electron ] && mv node_modules/electron "node_modules/electron.broken.$(date +%H%M%S)"
  npm install --no-audit --no-fund || fail "npm install"
fi
unset ELECTRON_SKIP_BINARY_DOWNLOAD
[ -f node_modules/electron/path.txt ] || { node node_modules/electron/install.js || echo "install.js reported a problem"; }
if [ ! -f node_modules/electron/path.txt ]; then
  # npm's own unzip step stops early on this Mac; extract the downloaded zip with the system tool instead
  echo "[$(date +%T)] extracting the Electron zip with ditto"
  EV=$(node -p "require('./node_modules/electron/package.json').version")
  case "$(uname -m)" in arm64) EA=arm64;; *) EA=x64;; esac
  ZIP=$(find "$HOME/Library/Caches/electron" -name "electron-v$EV-darwin-$EA.zip" 2>/dev/null | head -1)
  if [ -z "$ZIP" ]; then
    ZIP="/tmp/electron-v$EV-darwin-$EA.zip"
    curl -fL -o "$ZIP" "https://github.com/electron/electron/releases/download/v$EV/electron-v$EV-darwin-$EA.zip" || fail "electron download (internet?)"
  fi
  echo "zip: $ZIP"
  rm -rf node_modules/electron/dist && mkdir -p node_modules/electron/dist
  ditto -x -k "$ZIP" node_modules/electron/dist || fail "ditto extract"
  [ -f node_modules/electron/dist/Electron.app/Contents/Info.plist ] || fail "extracted app is incomplete"
  printf "%s" "$EV" > node_modules/electron/dist/version
  printf "%s" "Electron.app/Contents/MacOS/Electron" > node_modules/electron/path.txt
fi
[ -f node_modules/electron/path.txt ] || fail "electron still has no path.txt"
ls node_modules/electron-builder >/dev/null 2>&1 || npm install --no-audit --no-fund || fail "npm install builder"

echo "[$(date +%T)] building"
# electron-builder reads this as a path relative to electron/ (an absolute path gets glued onto it and the engine is silently left out)
export CLIMRISK_ENGINE_SRC="$(python3 -c 'import os,sys;print(os.path.relpath(sys.argv[1]))' "$ENGINE")"
echo "engine source for the bundle: $CLIMRISK_ENGINE_SRC"
export CSC_IDENTITY_AUTO_DISCOVERY=false
bash build-mac.sh </dev/null || fail "build-mac.sh"
[ -d "dist/mac-universal/ClimRisk Intelligence.app/Contents/Resources/engine/src/cri" ] || fail "the engine was not bundled into the app"
DMG=$(ls -t dist/*.dmg 2>/dev/null | head -1)
[ -n "$DMG" ] || fail "no dmg produced"
shasum -a 256 "$DMG" | tee "$DMG.sha256"
echo "DMG: $ROOT/electron/$DMG"
echo "[$(date +%T)] BUILD_APP_DONE"
