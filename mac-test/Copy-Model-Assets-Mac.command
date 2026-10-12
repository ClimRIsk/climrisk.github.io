#!/bin/bash
D="$(cd "$(dirname "$0")/.." && pwd)/electron/model"; mkdir -p "$D"
cp "$HOME/ClimRisk-model-dist/llama32.tail" "$D/climrisk-llm.Modelfile.tail"; echo copied > "$D/.copied"
