#!/bin/bash
# Test build: the app with the already-tested v6 portable model inside, to prove the one-file install end to end while v8 trains.
ls -la "$HOME/ClimRisk-model-dist" > "$(dirname "$0")/build_test_v6_dir.txt" 2>&1
MODEL_DIR="$HOME/ClimRisk-model-dist" bash "$(dirname "$0")/Build-App-Mac.command"
