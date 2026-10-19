# Windows (Surface Pro) readiness and F2F plan

Status as of 19 Oct 2026. Nothing has been sent to Charles.

## What is true today
- **No Windows build exists.** `electron/dist` holds the Mac DMG only. The `win` target (NSIS + portable, x64) is configured in `electron/package.json` but has never been built or run.
- `setup-local-engine.ps1` and `setup-local-llm.ps1` have **never been run on Windows**. Both say so in their headers.
- The app does not install the AI model on Windows by itself (`ensureModel()` skips Windows). The script must be run by hand.
- Fixed today (untested): `setup-local-llm.ps1` hard-coded model `climrisk-llm-v6` while the bundled manifest is `v8`, so it would have failed. It now reads the name from the manifest. It also copies the bundled embedding model, as the Mac script does.
- The embedding model folder has real files, no symlinks, so it copies to Windows safely. `engine.js` already points the engine at it on Windows.
- Surface Pro may be **ARM (Snapdragon) or x64**. The build is x64 only. On ARM it would run emulated; scientific Python wheels and onnxruntime on Windows ARM are the likely failure point. Unknown until tried.
- First-run install pulls Python 3.10+ (winget), a few hundred MB of libraries and a ~2 GB model: expect 20+ minutes and a working internet connection. Not a thing to do live in front of a reviewer.

## Recommendation
Do not ask Charles to install anything for the first session. Run a **screen-share demo from your Mac** (the verified build), 20-30 minutes, from 27 Oct:
1. Ask ClimRisk: a paraphrased case question (cited answer, honesty check).
2. 3D Hazard Viewer: landslide on real terrain, then Show buildings coloured by hazard class. Say plainly it is screening grade and the landslide layer is not calibrated (see `climate_risk_engine/docs/LANDSLIDE_VALIDATION.md`).
3. Point him to the evidence pack for what is and is not validated. Ask him the actuarial question: what would he need to see before trusting a loss number.
No code and no model leave your machine. If he wants hands-on later, first build and test a Windows installer on a Windows machine you control.

## To make a Windows build trustworthy (not done)
1. Borrow or rent a Windows 11 x64 machine; also check whether Charles's Surface is ARM.
2. `npm run build` for `--win` there; run `setup-local-engine.ps1`, then `setup-local-llm.ps1 -File <gguf>`.
3. Record what breaks; fix; only then offer it.
