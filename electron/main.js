'use strict';

// ── ClimRisk Intelligence Desktop — Main Process ─────────────────────────────
// Electron main process: window lifecycle, license management, IPC, system tray.
//
// Architecture:
//   main.js        — this file; runs in Node.js
//   preload.js     — contextBridge; injects license key before page scripts run
//   renderer/
//     license.html — activation screen (first launch or license expired)
//   ../dashboard.html (extraResource) — the main platform UI
//   engine.js      — starts the Python engine locally (127.0.0.1, per-session token);
//                    no hosted server is used

const {
  app, BrowserWindow, Menu, Tray,
  ipcMain, shell, dialog, nativeImage,
  globalShortcut, session
} = require('electron');
const path  = require('path');
const Store = require('electron-store');
const { LocalEngine, HOME_DIR } = require('./engine');

// ── Constants ─────────────────────────────────────────────────────────────────
// The engine runs on this machine (see engine.js). URL + token are set at start-up.
const engine = new LocalEngine();
let engineInfo = null;            // { url, token }
const APP_VERSION  = app.getVersion();
const IS_DEV       = process.env.ELECTRON_IS_DEV === '1' || !app.isPackaged;
const IS_MAC       = process.platform === 'darwin';
const IS_WIN       = process.platform === 'win32';

// ── Persistent store (AES-256 encrypted on disk) ─────────────────────────────
const store = new Store({
  name: 'climrisk-prefs',
  encryptionKey: 'cri-desktop-2026',   // obfuscation layer (not a secret)
  defaults: {
    licenseKey: null,
    licenseTier: null,
    licenseEmail: null,
    windowBounds: { width: 1440, height: 900 },
    maximized: false
  }
});

// ── State ─────────────────────────────────────────────────────────────────────
let mainWindow  = null;
let licenseWin  = null;
let tray        = null;
let isQuitting  = false;
let splashWin   = null;

// ── Resource path helper ──────────────────────────────────────────────────────
// In dev: files live in ../  relative to electron/
// When packaged: extraResources copies them to process.resourcesPath
function resPath(filename) {
  return IS_DEV
    ? path.join(__dirname, '..', filename)
    : path.join(process.resourcesPath, filename);
}

// ── License helpers ───────────────────────────────────────────────────────────
async function validateLicenseKey(key) {
  // Evaluation licences are signed by ClimRisk and verified offline by the local engine (cri.licence).
  // There are no built-in keys and no "offline grace": an unverifiable key is simply refused.
  if (!key || key.length < 40) return { valid: false, error: 'That does not look like a complete licence key. Paste the whole key from your email.' };
  if (!engineInfo) return { valid: false, error: 'The local engine is not running yet. Wait a moment and try again.' };
  try {
    const res = await fetch(`${engineInfo.url}/licence/install`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': engineInfo.token },
      body: JSON.stringify({ key }),
      signal: AbortSignal.timeout(15000)
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.allowed) {
      return { valid: true, tier: 'Evaluation', email: data.licensee, expiresAt: data.ends, daysLeft: data.days_left, remaining: data.remaining };
    }
    const d = data.detail || data;
    return { valid: false, error: d.message || 'The licence key was rejected.' };
  } catch (err) {
    return { valid: false, error: 'Could not reach the local engine: ' + err.message };
  }
}

async function engineLicenceStatus() {
  if (!engineInfo) return { allowed: false, state: 'none' };
  try {
    const res = await fetch(`${engineInfo.url}/licence/status`, { headers: { 'X-API-Key': engineInfo.token }, signal: AbortSignal.timeout(8000) });
    return await res.json();
  } catch (_) { return { allowed: false, state: 'none' }; }
}

// ── License window ────────────────────────────────────────────────────────────
function createLicenseWindow() {
  if (licenseWin && !licenseWin.isDestroyed()) {
    licenseWin.focus();
    return;
  }

  licenseWin = new BrowserWindow({
    width:  520,
    height: 640,
    resizable:   false,
    minimizable: true,
    maximizable: false,
    frame:       !IS_WIN,           // frameless on Windows (custom titlebar in HTML)
    titleBarStyle: IS_MAC ? 'hiddenInset' : 'default',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false
    },
    title:           'ClimRisk Intelligence — Activation',
    backgroundColor: '#05070d',
    show: false
  });

  licenseWin.loadFile(path.join(__dirname, 'renderer', 'license.html'));

  licenseWin.once('ready-to-show', () => licenseWin.show());
  licenseWin.on('closed', () => { licenseWin = null; });
}

// ── Main dashboard window ─────────────────────────────────────────────────────
function createMainWindow() {
  const { width, height } = store.get('windowBounds');

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth:  1024,
    minHeight: 680,
    frame:       !IS_WIN,
    titleBarStyle: IS_MAC ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
      webSecurity:      false    // allow file:// → fetch() cross-origin in dev
    },
    title:           'ClimRisk Intelligence',
    backgroundColor: '#05070d',
    show: false
  });

  if (store.get('maximized')) mainWindow.maximize();

  mainWindow.loadFile(resPath('dashboard.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (IS_DEV) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  // Persist window bounds
  mainWindow.on('resize', saveBounds);
  mainWindow.on('move',   saveBounds);
  mainWindow.on('maximize',   () => store.set('maximized', true));
  mainWindow.on('unmaximize', () => store.set('maximized', false));

  // Intercept navigation — keep everything inside the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http') || url.startsWith('https')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Redirect to license screen if app.html is requested (shouldn't happen normally)
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.includes('app.html')) {
      event.preventDefault();
      createLicenseWindow();
    }
  });

  // Minimise to tray instead of closing (on Windows / Linux)
  mainWindow.on('close', (event) => {
    if (!isQuitting && !IS_MAC) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function saveBounds() {
  if (mainWindow && !mainWindow.isMaximized() && !mainWindow.isDestroyed()) {
    store.set('windowBounds', mainWindow.getBounds());
  }
}

// ── System tray ───────────────────────────────────────────────────────────────
function createTray() {
  // 16x16 template image (monochrome on Mac); falls back to text if no icon file
  const iconPath = path.join(__dirname, 'assets', IS_MAC ? 'trayTemplate.png' : 'tray.ico');
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('ClimRisk Intelligence');

  const menu = Menu.buildFromTemplate([
    { label: 'Open ClimRisk', click: showMainWindow },
    { type: 'separator' },
    {
      label: 'License',
      submenu: [
        { label: `Tier: ${store.get('licenseTier') || '—'}`, enabled: false },
        { label: 'Manage License…', click: createLicenseWindow }
      ]
    },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit(); } }
  ]);

  tray.setContextMenu(menu);
  tray.on('double-click', showMainWindow);
}

function showMainWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
}

// ── Application menu ──────────────────────────────────────────────────────────
function buildMenu() {
  const tier  = store.get('licenseTier') || 'Unlicensed';
  const email = store.get('licenseEmail') || '—';

  const template = [
    // App menu (Mac only)
    ...(IS_MAC ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: `License: ${tier} — ${email}`,
          enabled: false
        },
        { label: 'Manage License…', click: createLicenseWindow },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Assessment…',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.executeJavaScript('openNewAssessment()')
        },
        { type: 'separator' },
        {
          label: 'Export PDF Report',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => mainWindow?.webContents.executeJavaScript('exportToPDF()')
        },
        { type: 'separator' },
        IS_MAC ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(IS_DEV ? [
          { type: 'separator' },
          { role: 'toggleDevTools' }
        ] : [])
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://climrisk.io/docs')
        },
        {
          label: 'Contact Support',
          click: () => shell.openExternal('mailto:support@climrisk.io')
        },
        { type: 'separator' },
        {
          label: `Version ${APP_VERSION}`,
          enabled: false
        },
        {
          label: `License: ${tier}`,
          enabled: false
        }
      ]
    }
  ];

  return Menu.buildFromTemplate(template);
}

// ── Local engine start-up ─────────────────────────────────────────────────────
function showSplash() {
  splashWin = new BrowserWindow({
    width: 420, height: 220, frame: false, resizable: false, show: true,
    backgroundColor: '#05070d', webPreferences: { contextIsolation: true, nodeIntegration: false }
  });
  const html = `<html><body style="margin:0;background:#05070d;color:#dce8ff;font-family:-apple-system,sans-serif;
    display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh">
    <div style="font-weight:800;letter-spacing:3px;color:#38bdf8;font-size:18px">CLIMRISK</div>
    <div id="msg" style="margin-top:14px;font-size:13px;text-align:center;padding:0 24px">Starting the local analysis engine…</div>
    <div style="margin-top:6px;font-size:11px;color:#7a8bb0">Runs on this Mac only — nothing is sent to a server</div>
    </body></html>`;
  splashWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
}

function setSplash(text) {
  if (splashWin && !splashWin.isDestroyed()) splashWin.webContents.executeJavaScript('document.getElementById("msg").textContent=' + JSON.stringify(text)).catch(() => {});
}

function closeSplash() {
  if (splashWin && !splashWin.isDestroyed()) splashWin.close();
  splashWin = null;
}

// Packaged: shipped outside the asar archive (extraResources) so Terminal can run it
const SETUP_DIR = IS_DEV ? __dirname : process.resourcesPath;
const ENGINE_SRC_ARG = IS_DEV ? '' : ' "' + path.join(process.resourcesPath, 'engine') + '"';      // packaged builds carry the engine source
const SETUP_CMD = IS_WIN
  ? 'powershell -NoProfile -ExecutionPolicy Bypass -File "' + path.join(SETUP_DIR, 'setup-local-engine.ps1') + '"' + ENGINE_SRC_ARG
  : 'bash "' + path.join(SETUP_DIR, 'setup-local-engine.sh') + '"' + ENGINE_SRC_ARG;
const SETUP_SHELL = IS_WIN ? 'PowerShell' : 'Terminal';


// One-time engine setup, run by the app itself (Mac/Linux) so nobody has to open a Terminal. Resolves to {ok, logFile}.
function runEngineSetup() {
  return new Promise((resolve) => {
    const fs = require('fs'), { spawn } = require('child_process');
    fs.mkdirSync(path.join(HOME_DIR, 'logs'), { recursive: true });
    const logFile = path.join(HOME_DIR, 'logs', 'engine-setup.log');
    const out = fs.openSync(logFile, 'w');
    setSplash('First-time setup, about 5 to 10 minutes. Needs the internet once. Please keep this window open.');
    const child = spawn('bash', [path.join(SETUP_DIR, 'setup-local-engine.sh'), path.join(process.resourcesPath, 'engine')], { stdio: ['ignore', out, out] });
    const tick = setInterval(() => {
      try { const t = fs.readFileSync(logFile, 'utf8').split('\n').filter(l => l.startsWith('\u001b[1;36m') || l.includes('▸')).pop(); if (t) setSplash('First-time setup (about 5 to 10 minutes): ' + t.replace(/\u001b\[[0-9;]*m/g, '').replace('▸', '').trim().slice(0, 90)); } catch (e) { /* log not readable yet */ }
    }, 4000);
    child.on('exit', (code) => { clearInterval(tick); resolve({ ok: code === 0, logFile }); });
    child.on('error', () => { clearInterval(tick); resolve({ ok: false, logFile }); });
  });
}

let autoSetupTried = false;
async function startLocalEngine() {
  for (;;) {
    const r = await engine.start();
    if (!r.ok && r.setupRequired && !IS_WIN && !IS_DEV && !autoSetupTried) {
      autoSetupTried = true;
      const s = await runEngineSetup();
      if (s.ok) { setSplash('Starting the local analysis engine…'); continue; }
    }
    if (r.ok) {
      engineInfo = { url: r.url, token: r.token };
      engine.onExit = onEngineStopped;
      return true;
    }
    const buttons = r.setupRequired ? ['Show setup steps', 'Retry', 'Quit'] : ['Retry', 'Open log', 'Quit'];
    const { response } = await dialog.showMessageBox({
      type: 'error', buttons, defaultId: 0, cancelId: buttons.length - 1,
      title: 'ClimRisk engine',
      message: r.setupRequired ? 'The local analysis engine is not installed yet.' : 'The local analysis engine could not start.',
      detail: r.setupRequired
        ? 'One-time setup (about 5 minutes). In ' + SETUP_SHELL + ' run:\n\n' + SETUP_CMD +
          '\n\nThen choose Retry.'
        : r.error
    });
    const choice = buttons[response];
    if (choice === 'Quit') { isQuitting = true; app.quit(); return false; }
    if (choice === 'Show setup steps') {
      await dialog.showMessageBox({ type: 'info', title: 'Set up the local engine',
        message: 'Run this once in ' + SETUP_SHELL + ', then choose Retry:', detail: SETUP_CMD +
        '\n\nOptional: put GROQ_API_KEY=... in ' + path.join(HOME_DIR, 'engine.env') + ' to enable AI deep dive.' });
    }
    if (choice === 'Open log' && r.logFile) shell.openPath(r.logFile);
  }
}



// Make sure the Ollama service (which serves the language model) is running on later launches too; start it quietly if it is installed but stopped.
function ensureOllama() {
  if (IS_DEV || IS_WIN) return;
  const fs = require('fs'), http = require('http'), { spawn } = require('child_process');
  const req = http.get({ host: '127.0.0.1', port: 11434, path: '/api/tags', timeout: 1500 }, (res) => { res.resume(); });
  const start = () => {
    const cands = [path.join(HOME_DIR, 'ollama-app', 'Ollama.app', 'Contents', 'Resources', 'ollama'), '/opt/homebrew/bin/ollama', '/usr/local/bin/ollama', '/Applications/Ollama.app/Contents/Resources/ollama'];
    const bin = cands.find(f => { try { return fs.existsSync(f); } catch (e) { return false; } });
    if (bin) { try { spawn(bin, ['serve'], { detached: true, stdio: 'ignore' }).unref(); } catch (e) { /* the engine falls back to rule-based answers */ } }
  };
  req.on('error', start); req.on('timeout', () => { req.destroy(); start(); });
}

// First run: install the language model that ships inside the app (no download, no questions). Runs in the background; the app works with rule-based answers until it finishes.
// The model file is checked against the SHA-256 in the manifest before it is imported, so what runs is exactly the model that was tested.
function ensureModel() {
  if (IS_DEV || IS_WIN) return;                                   // Windows: known gap (setup-local-llm.ps1 must be run by hand)
  const fs = require('fs'), { spawn } = require('child_process');
  const bundled = path.join(process.resourcesPath, 'model');
  let want;
  try { const m = JSON.parse(fs.readFileSync(path.join(bundled, 'model_manifest.json'), 'utf8')); want = (Array.isArray(m) ? m[0] : m); } catch (e) { return; }
  if (!want || !fs.existsSync(path.join(bundled, want.file))) return;                     // this build carries no model file
  const marker = path.join(HOME_DIR, 'active_model');
  let have = ''; try { have = fs.readFileSync(marker, 'utf8').trim(); } catch (e) { /* none yet */ }
  if (have === want.model) return;                                // already installed
  fs.mkdirSync(path.join(HOME_DIR, 'logs'), { recursive: true });
  const logFile = path.join(HOME_DIR, 'logs', 'model-setup.log');
  const out = fs.openSync(logFile, 'a');
  const child = spawn('bash', [path.join(process.resourcesPath, 'setup-local-llm.sh')], { stdio: ['ignore', out, out] });
  child.on('exit', (code) => {
    if (isQuitting) return;
    if (code === 0) {
      dialog.showMessageBox({ type: 'info', buttons: ['OK'], title: 'ClimRisk AI model',
        message: 'The ClimRisk language model is installed and runs on this computer.', detail: 'Model: ' + want.model + ' (checked against its fingerprint). No data leaves this Mac.' });
    } else {
      dialog.showMessageBox({ type: 'warning', buttons: ['Open log', 'Later'], defaultId: 0, title: 'ClimRisk AI model',
        message: 'The language model could not be installed yet.',
        detail: 'The app still works and answers from rules. The usual cause is no internet on first run. Reopen the app with internet to try again.' })
        .then(r => { if (r.response === 0) shell.openPath(logFile); });
    }
  });
}

async function onEngineStopped(code) {
  if (isQuitting) return;
  const { response } = await dialog.showMessageBox({
    type: 'warning', buttons: ['Restart engine', 'Quit'], defaultId: 0,
    title: 'ClimRisk engine', message: 'The local analysis engine stopped unexpectedly.',
    detail: `Exit code ${code}. Log: ${engine.logFile}`
  });
  if (response === 1) { isQuitting = true; app.quit(); return; }
  const ok = await startLocalEngine();
  if (ok && mainWindow && !mainWindow.isDestroyed()) mainWindow.reload();   // picks up new URL + token
}

// ── IPC Handlers ──────────────────────────────────────────────────────────────

// Synchronous: local engine URL + session token for the preload script
ipcMain.on('get-engine-sync', (event) => {
  event.returnValue = engineInfo;
});

// Synchronous: called from preload before page scripts run
ipcMain.on('get-license-key-sync', (event) => {
  event.returnValue = store.get('licenseKey', null);
});

ipcMain.handle('get-license-info', () => ({
  key:       store.get('licenseKey'),
  tier:      store.get('licenseTier'),
  email:     store.get('licenseEmail'),
  isDesktop: true,
  version:   APP_VERSION
}));

ipcMain.handle('validate-and-save-license', async (_, key) => {
  const result = await validateLicenseKey(key.trim());
  if (result.valid) {
    store.set('licenseKey',   key.trim());
    store.set('licenseTier',  result.tier);
    store.set('licenseEmail', result.email);
    Menu.setApplicationMenu(buildMenu());
  }
  return result;
});

ipcMain.handle('get-licence-status', () => engineLicenceStatus());

ipcMain.handle('clear-license', () => {
  store.delete('licenseKey');
  store.delete('licenseTier');
  store.delete('licenseEmail');
  Menu.setApplicationMenu(buildMenu());
  return true;
});

ipcMain.handle('open-dashboard', () => {
  if (licenseWin && !licenseWin.isDestroyed()) licenseWin.close();
  if (!mainWindow || mainWindow.isDestroyed()) createMainWindow();
  else mainWindow.show();
});

ipcMain.handle('open-external', (_, url) => shell.openExternal(url));
ipcMain.handle('window-minimize', () => mainWindow?.minimize());
ipcMain.handle('window-maximize', () =>
  mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.handle('window-close',    () => { isQuitting = true; app.quit(); });

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Set CSP for renderer pages
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' " +
          "http://127.0.0.1:* " +
          "https://fonts.googleapis.com https://fonts.gstatic.com " +
          "https://cdnjs.cloudflare.com https://unpkg.com " +
          "https://api.open-meteo.com https://archive-api.open-meteo.com data: blob:;"
        ]
      }
    });
  });

  showSplash();
  const ready = await startLocalEngine();
  closeSplash();
  if (!ready) return;               // user chose Quit

  ensureOllama();
  ensureModel();
  const lic = await engineLicenceStatus();
  if (lic.allowed) {
    store.set('licenseTier', 'Evaluation'); store.set('licenseEmail', lic.licensee || '');
    if (!store.get('licenseKey')) store.set('licenseKey', 'evaluation');
    createMainWindow();
  } else {
    createLicenseWindow();      // none, expired, exhausted, tampered or invalid: the activation screen says which
  }

  createTray();
  Menu.setApplicationMenu(buildMenu());

  // Re-create main window on dock click (Mac)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      engineLicenceStatus().then(l => (l.allowed ? createMainWindow() : createLicenseWindow()));
    } else {
      showMainWindow();
    }
  });
});

app.on('before-quit', () => { isQuitting = true; engine.stop(); });
app.on('will-quit', () => engine.stop());
process.on('exit', () => engine.stop());

app.on('window-all-closed', () => {
  if (IS_MAC) return;  // Mac: keep process alive until explicit Quit
  app.quit();
});
