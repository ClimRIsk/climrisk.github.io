#!/bin/bash
# Run the desktop app straight from this repo (current dashboard.html and electron code), without building a .app.
# Quit the installed ClimRisk Intelligence first. The engine comes from ~/.climrisk/engine-venv (run Sync-Engine-Mac.command after engine changes).
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "$(dirname "$0")/electron" || exit 1
[ -d node_modules ] || npm install
# npm sometimes finishes without having fetched the Electron binary (path.txt is what marks a finished download): fetch it again, once
if [ ! -f node_modules/electron/path.txt ]; then
  echo "Electron binary missing; downloading it again..."
  rm -rf node_modules/electron/dist
  node node_modules/electron/install.js || { echo "Electron download failed. Check the internet connection and run this again."; exit 1; }
fi
npm start
