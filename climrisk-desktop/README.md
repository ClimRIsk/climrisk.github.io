# ClimRisk Desktop

Native desktop application for ClimRisk Intelligence — wraps the dashboard in an Electron shell with license key management, native menus, and offline-resilient validation.

## Architecture

```
main.js          — Electron main process (window lifecycle, IPC, auto-updater)
preload.js       — Secure contextBridge: exposes window.electronAPI to renderer
renderer/
  activation.html — License key entry screen (shown on first launch / invalid key)
assets/
  icon.icns      — macOS icon
  icon.ico       — Windows icon
  icon.png       — Linux / tray icon
```

The renderer loads `https://climrisk.io/dashboard.html` (live, always up to date).
The Electron main process injects `sessionStorage.cri_auth = licenseKey` after the page loads,
bypassing the app.html login gate.

## Prerequisites

```bash
cd climrisk-desktop
npm install
```

Requires Node 18+ and npm.

## Development

```bash
npm start
```

Opens the app in dev mode with DevTools attached.

## Build installers

```bash
npm run build:mac     # → dist/ClimRisk-1.0.0-universal.dmg + .zip
npm run build:win     # → dist/ClimRisk Setup 1.0.0.exe
npm run build:linux   # → dist/ClimRisk-1.0.0.AppImage
npm run build:all     # all three
```

Code signing (required for distribution without Gatekeeper warnings):
- Mac: set `CSC_LINK` (p12 cert path) + `CSC_KEY_PASSWORD` env vars
- Win: set `WIN_CSC_LINK` + `WIN_CSC_KEY_PASSWORD`

## License key system

On startup:
1. Read stored key from encrypted `electron-store`
2. Call `GET /license/validate` with `X-API-Key: <key>` → returns `{ tier, features, expires, valid }`
3. If valid → load dashboard, inject key into sessionStorage
4. If invalid / no key → show `activation.html`
5. If engine unreachable (timeout) → use cached tier, proceed to dashboard (offline resilience)

## Auto-updates

Points to GitHub Releases on `ClimRIsk/climrisk-desktop-releases`.
On update available → dialog prompt → download → `quitAndInstall()`.

## Adding the /license/validate endpoint

The backend (main.py) must expose:

```
GET /license/validate
Headers: X-API-Key: <key>
Response 200: { tier, features, company, expires, seats, valid }
Response 403: { error: "Invalid license key" }
```

See `climate_risk_engine/src/cri/api/main.py` — the endpoint is already added.
