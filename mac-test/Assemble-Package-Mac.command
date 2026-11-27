#!/bin/bash
# Copies the FINAL built DMG into Review_Package_for_Charles/ClimRisk_App_Mac, writes its SHA-256, verifies the model inside the DMG's app against its manifest, and zips nothing (zip separately).
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$HERE/.."; exec > >(tee "$HERE/assemble_package.log") 2>&1
D="$ROOT/electron/dist"; DMG="$D/ClimRisk Intelligence-1.1.0-universal.dmg"; OUT="$ROOT/Review_Package_for_Charles/ClimRisk_App_Mac"
mkdir -p "$OUT"; rm -f "$OUT"/*.dmg "$OUT"/*.sha256
cp "$DMG" "$OUT/" || { echo ASSEMBLE_FAILED copy; exit 1; }
( cd "$OUT" && shasum -a 256 "ClimRisk Intelligence-1.1.0-universal.dmg" | tee "ClimRisk Intelligence-1.1.0-universal.dmg.sha256" )
S1="$(shasum -a 256 "$DMG" | cut -d' ' -f1)"; S2="$(cut -d' ' -f1 "$OUT/ClimRisk Intelligence-1.1.0-universal.dmg.sha256")"
[ "$S1" = "$S2" ] || { echo "ASSEMBLE_FAILED hash differs"; exit 1; }
echo "mounting the copied DMG to check the model file inside"
MP="$(hdiutil attach -nobrowse -readonly "$OUT/ClimRisk Intelligence-1.1.0-universal.dmg" | tail -1 | cut -f3)"; echo "mounted at $MP"
R="$MP/ClimRisk Intelligence.app/Contents/Resources"
GG="$(ls "$R"/model/*.gguf | head -1)"; WANT="$(python3 -c "import json;print(json.load(open('$R/model/model_manifest.json'))[0]['sha256'])")"; GOT="$(shasum -a 256 "$GG" | cut -d' ' -f1)"
echo "model file: $(basename "$GG")"; echo "manifest sha: $WANT"; echo "file sha:     $GOT"
[ "$WANT" = "$GOT" ] && echo "MODEL_HASH_OK" || echo "MODEL_HASH_MISMATCH"
ls "$R/engine/src/cri/resident/eventanswer.py" && echo ENGINE_HAS_EVENT_ROUTE
hdiutil detach "$MP" -quiet
du -sh "$ROOT/Review_Package_for_Charles"; echo ASSEMBLE_DONE
