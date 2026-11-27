#!/bin/bash
# One file to upload: ClimRisk_for_Charles_Hett.zip (made with ditto so macOS opens it cleanly). Re-run after any change to Review_Package_for_Charles.
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$HERE/.."; exec > >(tee "$HERE/zip_package.log") 2>&1
cd "$ROOT" || exit 1
rm -f "$ROOT/ClimRisk_for_Charles_Hett.zip"
ditto -c -k --sequesterRsrc --keepParent Review_Package_for_Charles "$ROOT/ClimRisk_for_Charles_Hett.zip" && ls -lh "$ROOT/ClimRisk_for_Charles_Hett.zip" && shasum -a 256 "$ROOT/ClimRisk_for_Charles_Hett.zip" && echo ZIP_DONE || echo ZIP_FAILED
