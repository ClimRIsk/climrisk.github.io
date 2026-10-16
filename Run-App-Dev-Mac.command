#!/bin/bash
# Run the desktop app straight from this repo (current dashboard.html and electron code), without building a .app.
# Quit the installed ClimRisk Intelligence first. The engine comes from ~/.climrisk/engine-venv (run Sync-Engine-Mac.command after engine changes).
cd "$(dirname "$0")/electron" || exit 1
[ -d node_modules ] || npm install
npm start
