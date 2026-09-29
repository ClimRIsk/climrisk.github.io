#!/bin/bash
# ── ClimRisk Intelligence — macOS Build Script ────────────────────────────────
# Run from the electron/ directory:
#   cd electron && bash build-mac.sh
# Produces: dist/ClimRisk Intelligence-1.0.0.dmg  (drag-to-install)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "╔══════════════════════════════════════════════════════╗"
echo "║   ClimRisk Intelligence — macOS App Builder          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Generate icon.icns from logo.png ──────────────────────────────────
LOGO="../logo.png"
ICONSET="assets/AppIcon.iconset"
ICNS="assets/icon.icns"

if [ ! -f "$ICNS" ]; then
  echo "▸ Generating icon.icns from logo.png ..."
  mkdir -p "$ICONSET"
  sips -z 16   16   "$LOGO" --out "$ICONSET/icon_16x16.png"    >/dev/null 2>&1
  sips -z 32   32   "$LOGO" --out "$ICONSET/icon_16x16@2x.png" >/dev/null 2>&1
  sips -z 32   32   "$LOGO" --out "$ICONSET/icon_32x32.png"    >/dev/null 2>&1
  sips -z 64   64   "$LOGO" --out "$ICONSET/icon_32x32@2x.png" >/dev/null 2>&1
  sips -z 128  128  "$LOGO" --out "$ICONSET/icon_128x128.png"  >/dev/null 2>&1
  sips -z 256  256  "$LOGO" --out "$ICONSET/icon_128x128@2x.png" >/dev/null 2>&1
  sips -z 256  256  "$LOGO" --out "$ICONSET/icon_256x256.png"  >/dev/null 2>&1
  sips -z 512  512  "$LOGO" --out "$ICONSET/icon_256x256@2x.png" >/dev/null 2>&1
  sips -z 512  512  "$LOGO" --out "$ICONSET/icon_512x512.png"  >/dev/null 2>&1
  cp "$LOGO"                     "$ICONSET/icon_512x512@2x.png"
  iconutil -c icns "$ICONSET" -o "$ICNS"
  rm -rf "$ICONSET"
  echo "  ✅ icon.icns created"
else
  echo "  ✅ icon.icns already exists — skipping"
fi

# ── Step 2: Verify required files exist ──────────────────────────────────────
echo ""
echo "▸ Checking required files ..."
MISSING=0
for f in main.js preload.js ../dashboard.html ../app.html; do
  if [ ! -f "$f" ]; then
    echo "  ✗ Missing: $f"
    MISSING=1
  else
    echo "  ✅ $f"
  fi
done
[ "$MISSING" -eq 1 ] && echo "Fix missing files before building." && exit 1

# ── Step 3: Install/update node_modules if needed ────────────────────────────
echo ""
echo "▸ Checking node_modules ..."
if [ ! -d "node_modules" ]; then
  echo "  Installing dependencies ..."
  npm install --quiet
else
  echo "  ✅ node_modules present"
fi

# ── Step 4: Build the macOS app ──────────────────────────────────────────────
echo ""
echo "▸ Building macOS .app and .dmg (this takes ~60-90 seconds) ..."
echo ""

# CSC_IDENTITY_AUTO_DISCOVERY=false tells electron-builder to skip codesign
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:mac

# ── Step 5: Done ─────────────────────────────────────────────────────────────
echo ""
DMG=$(ls dist/*.dmg 2>/dev/null | head -1)
if [ -n "$DMG" ]; then
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║   ✅  Build complete!                                 ║"
  echo "╚══════════════════════════════════════════════════════╝"
  echo ""
  echo "  DMG: $DMG"
  echo ""
  echo "  To install: double-click the DMG, then drag"
  echo "  'ClimRisk Intelligence' into /Applications"
  echo ""
  # Open the dist folder in Finder
  open dist/
else
  echo "⚠️  Build finished but no .dmg found — check output above."
fi
