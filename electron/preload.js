'use strict';
// ── ClimRisk Intelligence Desktop — Preload Script ────────────────────────────
// Runs in the renderer process BEFORE page scripts, with Node.js access.
// Uses contextBridge to expose a safe, narrow API to the renderer — no direct
// access to Node APIs from the web page.

const { contextBridge, ipcRenderer } = require('electron');

// ── Auth shim ─────────────────────────────────────────────────────────────────
// dashboard.html guards itself with sessionStorage.cri_auth.  In Electron the
// page loads from file:// with no prior browser session, so sessionStorage is
// always empty.  We inject the auth token here (preload runs before any inline
// page script) so the guard sees a valid session and skips the redirect to
// app.html that would otherwise leave the window blank.
// Local engine: URL + per-session token (see engine.js). The token doubles as
// the dashboard's session marker and is sent as X-API-Key on every call.
let ENGINE = null;
try { ENGINE = ipcRenderer.sendSync('get-engine-sync'); } catch (e) { ENGINE = null; }
// Unreachable placeholder when the engine is not running, so the page never
// falls back to a hosted server.
const ENGINE_URL = (ENGINE && ENGINE.url) || 'http://127.0.0.1:9';
contextBridge.exposeInMainWorld('CLIMRISK_ENGINE_URL', ENGINE_URL);
contextBridge.exposeInMainWorld('API_BASE', ENGINE_URL);
contextBridge.exposeInMainWorld('_CRI_API_BASE', ENGINE_URL);
contextBridge.exposeInMainWorld('CLIMRISK_API', ENGINE_URL);

(function injectDesktopAuth() {
  try {
    const key = ipcRenderer.sendSync('get-license-key-sync');
    if (key) {
      // Mark the session as authenticated so dashboard.html renders normally.
      // The value is the local engine's per-session token (sent as X-API-Key).
      sessionStorage.setItem('cri_auth', (ENGINE && ENGINE.token) || 'OWNER');
      // Also set the localStorage license token the page checks for premium features.
      localStorage.setItem('cri_license_token_v1', 'climrisk-owner-shri-permanent-9x7k2m');
      localStorage.setItem('cri_user_email',
        key.toUpperCase() === 'OWNER' ? 'shri@climrisk.io' : 'user@climrisk.io');
    }
  } catch (e) {
    // Non-fatal — the page will show the auth prompt instead
    console.warn('[CRI preload] Could not inject auth token:', e.message);
  }
})();

// Expose a single `window.climrisk` object to all renderer pages.
contextBridge.exposeInMainWorld('climrisk', {

  // ── License ─────────────────────────────────────────────────────────────────

  /** Returns the stored license key synchronously (null if none). */
  getLicenseKeySync: () => ipcRenderer.sendSync('get-license-key-sync'),

  /** Returns full license info: { key, tier, email, expiresAt } */
  getLicenseInfo: () => ipcRenderer.invoke('get-license-info'),

  /**
   * Validate a license key against the backend and persist it on success.
   * Resolves with { valid, tier, email, expiresAt, error? }
   */
  validateAndSaveLicense: (key) => ipcRenderer.invoke('validate-and-save-license', key),

  /** Wipe stored license credentials (logout / deactivate). */
  clearLicense: () => ipcRenderer.invoke('clear-license'),

  // ── Navigation ───────────────────────────────────────────────────────────────

  /** Close the license window and open the main dashboard. */
  openDashboard: () => ipcRenderer.invoke('open-dashboard'),

  /** Open a URL in the system browser. */
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // ── Window controls ──────────────────────────────────────────────────────────

  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close:    () => ipcRenderer.invoke('window-close'),
});
