#!/bin/bash
# Installs the BUILT app (from electron/dist) over the one in /Applications and opens it, so it can be tested as a user would. Log: mac-test/install_test_app.log
HERE="$(cd "$(dirname "$0")" && pwd)"; exec > >(tee "$HERE/install_test_app.log") 2>&1
SRC="$HERE/../electron/dist/mac-universal/ClimRisk Intelligence.app"; DST="/Applications/ClimRisk Intelligence.app"
[ -d "$SRC" ] || { echo "no built app"; exit 1; }
osascript -e 'tell application "ClimRisk Intelligence" to quit' 2>/dev/null; sleep 3
rm -rf "$DST"; ditto "$SRC" "$DST" || { echo "copy failed"; exit 1; }
xattr -cr "$DST"; ls "$DST/Contents/Resources/model/"; cat "$DST/Contents/Resources/model/model_manifest.json"; echo
open "$DST"; echo "INSTALLED_AND_OPENED $(date +%T)"
