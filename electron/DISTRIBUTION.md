# Desktop distribution: status and next steps

| Item | Status |
|---|---|
| Signed, offline evaluation licence (14 days, 30 runs, 100 AI questions, per person) | Built and tested (engine `cri.licence`, 6 tests). Enforced by the engine when `CRI_LICENCE_MODE=required`; the app sets it. |
| Hardcoded keys (`CRI2026`, `OWNER`) and "offline grace = valid" | Removed from `electron/main.js`. The key `OWNER` was committed earlier in this repo: if the repo was pushed publicly, treat it as exposed; it no longer opens anything. |
| Licence signing key pair | Created. Private key: `~/.climrisk-signing/licence_private.pem` on the Mac, back it up offline, never commit. Public key committed in the engine. |
| Windows engine setup | `setup-local-engine.ps1` written. NOT yet run on a Windows machine. |
| Windows and Mac installers | `.github/workflows/desktop-build.yml` (manual run; needs secret `ENGINE_REPO_TOKEN`). Not yet run. Windows installers must be built on Windows (the workflow does this). |
| Engine bundled into the installer | `extraResources` now copies the engine source (`CLIMRISK_ENGINE_SRC`). First launch still runs the setup script to create a Python environment (needs internet, about 5 minutes). |
| macOS signing and notarization | Not done (`identity: null`). Needs an Apple Developer ID. Until then recipients right-click > Open. |
| Windows code signing | Not done. Windows SmartScreen will warn ("More info" > "Run anyway"). |
| Fine-tuned language model on other devices | Converted from the fused v6 weights to GGUF Q4_K_M (2.02 GB, runs on Windows, Mac, Linux through Ollama; the Mac-only MLX copy in Ollama is NOT portable). Installers `setup-local-llm.ps1` / `.sh` install Ollama if missing, download or take a given file, verify SHA-256 against `model/model_manifest.json` shipped in the app, `ollama create climrisk-llm-v6`, and write `~/.climrisk/active_model` + `active_reasoning_model`. Tested on this Mac: imported exactly as a customer would, then run through the same 140-row reasoning exam as v6 (composite 0.973 for the GGUF vs 0.906 for the MLX copy; verdict accuracy 1.00 vs 0.98; n=140, so read it as 'no loss from conversion', not 'better'). Speed on this Mac: the exam took 7,070 s through llama.cpp vs 2,530 s through MLX. See `mac-test/llm/reasoning_eval_v6_gguf.json`. NOT yet tested on Windows. Hosting not chosen: `model/model-source.json` url is empty (use a private link; do not put the file in a public repo). Without the model the app still works (rule-based answers). |

## Before sending anything to a stranger
1. Run the GitHub workflow; install the Windows artifact on a clean Windows 10/11 PC and the DMG on a clean Mac user account.
2. Activate with the licence file; confirm: runs count down, a wrong or edited key is refused, the app stops at the cap and after expiry.
3. Only then send installer + licence.

## Known gaps
- The model download is a separate ~2 GB step after install; the app does not yet prompt for it on first run (run `setup-local-llm` by hand or via the installer link).
- CPU-only PCs will answer slowly (the Mac GPU produced ~12 tokens/s in llama.cpp; a CPU laptop may be several times slower). The engine's 60/90 s deadline falls back to the rule-based answer.
- Exports (PDF, Excel) do not yet carry a "Trial" watermark.
- When the allowance runs out, the dashboard shows the engine's 402 reply, not a friendly banner.
- Licensing is local and not tamper-proof; paying customers need online activation with a short offline grace period.
