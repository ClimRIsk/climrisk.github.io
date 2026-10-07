#!/usr/bin/env bash
# Optional: give the ClimRisk agent a language model that runs on THIS computer (no account, no API key, no cloud).
# The engine detects it automatically (Ollama on 127.0.0.1:11434) and uses it to write answers from the sources it has learned.
# Without it the agent still answers, by assembling the most relevant sentences from those sources.
set -euo pipefail
MODEL="${1:-llama3.2:3b}"        # ~2 GB. For better answers on a 16 GB Mac: qwen2.5:7b (~4.7 GB)

say() { printf '\033[1;36m▸ %s\033[0m\n' "$*"; }
die() { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

if ! command -v ollama >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    say "Installing Ollama with Homebrew"
    brew install ollama || die "brew could not install Ollama. Download the app from https://ollama.com/download and run this script again."
  else
    die "Ollama is not installed. Download it from https://ollama.com/download (drag to Applications, open once), then run this script again."
  fi
fi

if ! curl -fsS --max-time 2 http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  say "Starting the Ollama service"
  (ollama serve >/dev/null 2>&1 &) ; sleep 4
fi
curl -fsS --max-time 5 http://127.0.0.1:11434/api/tags >/dev/null 2>&1 || die "The Ollama service did not start. Open the Ollama app once and try again."

say "Downloading the model $MODEL (one time; this can take several minutes)"
ollama pull "$MODEL"
say "Done. Reopen ClimRisk: the agent will now write its answers with $MODEL, running on this computer."
