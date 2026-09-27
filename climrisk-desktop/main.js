'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  ClimRisk Desktop — Main Process
//  Architecture:
//    1. On startup, read stored license key from encrypted electron-store
//    2. If no key → show activation.html (license entry screen)
//    3. If key present → validate against /license/validate on Render backend
//    4. On valid key → load dashboard (climrisk.io or bundled renderer)
//    5. Inject license key into sessionStorage so dashboard.html auth passes
//    6. Native menus, tray icon, auto-updater
// ─────────────────────────────────────────────────────────────────────────────

const { app, BrowserWindow, Menu, Tray, dialog, shell, ipcMain,
        nativeImage, session } = require('electron');
const path   = require('path');
const https  = require('https');
const Store  = require('electron-store');
const { autoUpdater } = require('electron-updater');

// ── Config store (encrypted on disk) ─────────────────────────────────────────
const store = new Store({
  name: 'climrisk-config',
  encryptionKey: 'cr-desktop-v1-config',  // obfuscation; proper signing is code-signing cert
  schema: {
    licenseKey:   { type: 'string', default: '' },
    licenseEmail: { type: 'string', default: '' },
    licenseTier:  { type: 'string', default: '' },
    engineUrl:    { type: 'string', default: 'https://climrisk-github-io.onrender.com' },
    windowBounds: {
      type: 'object',
      properties: {
        width:  { type: 'number', default: 1440 },
        height: { type: 'number', default: 900 },
        x:      { type: 'number' },
        y:      { type: 'number' }
      }
    }
  }
});

// ── Globals ───────────────────────────────────────────────────────────────────
let mainWindow = null;
let tray       = null;
let licenseData = null;  // cache from /license/validate

const ENGINE_URL     = store.get('engineUrl', 'https://climrisk-github-io.onrender.com');
const DASHBOARD_URL  = 'https://climrisk.io/dashboard.html';
const IS_MAC         = process.platform === 'darwin';
const IS_WIN         = process.platform === 'win32';
const DEV            = !app.isPackaged;

// ── Single instance lock ──────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// ── License validation (calls Render backend) ─────────────────────────────────
function validateLicense(key) {
  return new Promise((resolve, reject) => {
    const url    = new URL('/license/validate', ENGINE_URL);
    const opts   = {
      hostname: url.hostname,
      port:     url.port || 443,
      path:     url.pathname,
      method:   'GET',
      headers:  { 'X-API-Key': key },
      timeout:  15000
    };
    const useHttp = url.protocol === 'http:';
    const mod  = useHttp ? require('http') : https;
    const req  = mod.request(opts, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (res.statusCode === 200 && data.valid !== false) {
            resolve(data);
          } else {
            reject(new Error(data.error || 'Invalid license key'));
          }
        } catch (e) { reject(new Error('Invalid response from license server')); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('License server timeout')); });
    req.end();
  });
}

// ── Create main window ────────────────────────────────────────────────────────
function createWindow(startUrl) {
  const bounds = store.get('windowBounds', { width: 1440, height: 900 });

  mainWindow = new BrowserWindow({
    width:  bounds.width  || 1440,
    height: bounds.height || 900,
    x:      bounds.x,
    y:      bounds.y,
    minWidth:  1024,
    minHeight: 680,
    title: 'ClimRisk',
    backgroundColor: '#05070d',
    // Use native titlebar on Mac; custom frame could go here later
    titleBarStyle: IS_MAC ? 'hiddenInset' : 'default',
    icon: path.join(__dirname, 'assets', IS_WIN ? 'icon.ico' : 'icon.png'),
    webPreferences: {
      preload:            path.join(__dirname, 'preload.js'),
      contextIsolation:   true,
      nodeIntegration:    false,
      webSecurity:        !DEV,   // allow mixed content in dev only
      allowRunningInsecureContent: false,
      // Required so dashboard.html can call localStorage across origins
      partition:          'persist:climrisk'
    },
    show: false   // show after content loads
  });

  // Save window size/position on move/resize
  const saveBounds = () => {
    if (!mainWindow.isMaximized() && !mainWindow.isMinimized()) {
      store.set('windowBounds', mainWindow.getBounds());
    }
  };
  mainWindow.on('resize', saveBounds);
  mainWindow.on('move',   saveBounds);

  // Load the requested URL
  mainWindow.loadURL(startUrl);

  // Show window once DOM is ready (avoids white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (DEV) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  // Intercept navigation to keep user inside the app
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed = [
      'climrisk.io',
      'climrisk-github-io.onrender.com',
      'localhost',
      'app.html',
      'dashboard.html',
      'activation.html'
    ];
    const parsed = new URL(url);
    const isLocal = url.startsWith('file://');
    const isAllowed = allowed.some(h => parsed.hostname.includes(h));
    if (!isLocal && !isAllowed) {
      event.preventDefault();
      shell.openExternal(url);  // open in real browser instead
    }
  });

  // Handle new-window (target="_blank") links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Show activation screen ────────────────────────────────────────────────────
function showActivation() {
  const activationPath = path.join(__dirname, 'renderer', 'activation.html');
  createWindow(`file://${activationPath}`);
}

// ── Load dashboard after successful activation ────────────────────────────────
async function loadDashboard(key, licInfo) {
  licenseData = licInfo;
  store.set('licenseKey',   key);
  store.set('licenseEmail', licInfo.company || 'ClimRisk User');
  store.set('licenseTier',  licInfo.tier    || 'analyst');

  // Load the live dashboard
  if (!mainWindow) createWindow(DASHBOARD_URL);
  else             mainWindow.loadURL(DASHBOARD_URL);

  // After the page loads, inject the auth token so dashboard.html skips login
  mainWindow.webContents.once('did-finish-load', () => {
    const email = licInfo.company ? `${licInfo.company.toLowerCase().replace(/\s+/g,'.')}@climrisk.io` : 'user@climrisk.io';
    mainWindow.webContents.executeJavaScript(`
      (function() {
        try {
          sessionStorage.setItem('cri_auth',  '${key}');
          sessionStorage.setItem('cri_email', '${email}');
          // Expose feature flags for the dashboard
          window.__CRI_LICENSE__ = ${JSON.stringify({
            tier:     licInfo.tier,
            features: licInfo.features || [],
            company:  licInfo.company,
            expires:  licInfo.expires
          })};
        } catch(e) {}
      })();
    `);

    // Rebuild menu with license info
    buildMenu(licInfo);
  });
}

// ── Native application menu ───────────────────────────────────────────────────
function buildMenu(licInfo) {
  const tier    = (licInfo && licInfo.tier) || store.get('licenseTier') || '';
  const tierLbl = { analyst: 'Analyst', professional: 'Professional', enterprise: 'Enterprise' }[tier] || 'Free';

  const template = [
    // macOS app menu
    ...(IS_MAC ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { label: 'Preferences…', accelerator: 'CmdOrCtrl+,', click: showPreferences },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),

    {
      label: 'File',
      submenu: [
        { label: 'New Assessment',   accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow && mainWindow.webContents.executeJavaScript('if(window.openNewAssessment) openNewAssessment();') },
        { label: 'Import Excel…',    accelerator: 'CmdOrCtrl+O', click: importExcel },
        { type: 'separator' },
        { label: 'Export PDF Report',accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow && mainWindow.webContents.executeJavaScript('if(window.exportToPDF) exportToPDF();') },
        { type: 'separator' },
        IS_MAC ? { role: 'close' } : { role: 'quit', label: 'Exit' }
      ]
    },

    {
      label: 'View',
      submenu: [
        { label: 'Dashboard',   click: () => loadDashboard(store.get('licenseKey'), licenseData || {}) },
        { type: 'separator' },
        { label: 'Zoom In',     accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn'  },
        { label: 'Zoom Out',    accelerator: 'CmdOrCtrl+-',    role: 'zoomOut' },
        { label: 'Reset Zoom',  accelerator: 'CmdOrCtrl+0',    role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Toggle Full Screen', role: 'togglefullscreen' },
        ...(DEV ? [{ type: 'separator' }, { label: 'Dev Tools', role: 'toggleDevTools' }] : [])
      ]
    },

    {
      label: 'License',
      submenu: [
        { label: `Current Plan: ${tierLbl}`, enabled: false },
        { type: 'separator' },
        ...(tier !== 'enterprise' ? [{
          label: 'Upgrade License…',
          click: () => shell.openExternal('https://climrisk.io/pricing')
        }] : []),
        { label: 'Change License Key…', click: reactivate },
        { label: 'View License Details…', click: showLicenseInfo },
        { type: 'separator' },
        { label: 'Check for Updates…', click: () => autoUpdater.checkForUpdatesAndNotify() }
      ]
    },

    {
      label: 'Help',
      submenu: [
        { label: 'ClimRisk Documentation', click: () => shell.openExternal('https://climrisk.io/docs') },
        { label: 'API Reference',           click: () => shell.openExternal(`${ENGINE_URL}/docs`) },
        { label: 'Methodology — NGFS/IPCC', click: () => shell.openExternal('https://climrisk.io/methodology') },
        { type: 'separator' },
        { label: 'Contact Support', click: () => shell.openExternal('mailto:support@climrisk.io') },
        ...(!IS_MAC ? [{ type: 'separator' }, { role: 'about' }] : [])
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── System tray ───────────────────────────────────────────────────────────────
function setupTray() {
  try {
    const iconPath = path.join(__dirname, 'assets', IS_MAC ? 'tray-icon.png' : 'icon.ico');
    tray = new Tray(iconPath);
    tray.setToolTip('ClimRisk Intelligence');
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Open ClimRisk', click: () => {
        if (!mainWindow) { app.emit('activate'); }
        else { mainWindow.show(); mainWindow.focus(); }
      }},
      { type: 'separator' },
      { label: 'New Assessment', click: () => {
        if (mainWindow) mainWindow.webContents.executeJavaScript('if(window.openNewAssessment) openNewAssessment();');
      }},
      { type: 'separator' },
      { label: 'Quit ClimRisk', click: () => { tray = null; app.quit(); } }
    ]));
    tray.on('double-click', () => {
      if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
    });
  } catch (e) {
    console.warn('Tray setup failed:', e.message);
  }
}

// ── IPC handlers (called from preload → renderer) ─────────────────────────────
ipcMain.handle('license:validate', async (_, key) => {
  try {
    const info = await validateLicense(key);
    return { success: true, data: info };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('license:activate', async (_, key) => {
  try {
    const info = await validateLicense(key);
    await loadDashboard(key, info);
    return { success: true, data: info };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('license:get', () => {
  return {
    key:   store.get('licenseKey',   ''),
    email: store.get('licenseEmail', ''),
    tier:  store.get('licenseTier',  ''),
    data:  licenseData
  };
});

ipcMain.handle('app:getEngineUrl', () => ENGINE_URL);

ipcMain.handle('file:import', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title:       'Import Company Excel File',
    filters:     [{ name: 'Excel Files', extensions: ['xlsx'] }],
    properties:  ['openFile']
  });
  if (canceled || !filePaths.length) return null;
  return filePaths[0];
});

ipcMain.handle('pdf:save', async (_, { filename, buffer }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title:       'Save PDF Report',
    defaultPath: filename || 'ClimRisk_Report.pdf',
    filters:     [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (canceled || !filePath) return null;
  require('fs').writeFileSync(filePath, Buffer.from(buffer));
  shell.openPath(filePath);
  return filePath;
});

// ── Helper actions ─────────────────────────────────────────────────────────────
function importExcel() {
  ipcMain.emit('file:import');
}

function showPreferences() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Preferences',
    message: 'Preferences',
    detail: `Engine URL: ${ENGINE_URL}\nLicense Tier: ${store.get('licenseTier','—')}\nConfig: ${store.path}`,
    buttons: ['OK']
  });
}

function showLicenseInfo() {
  const lic = licenseData || {};
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'License Details',
    message: `ClimRisk ${(lic.tier || 'Free').charAt(0).toUpperCase() + (lic.tier||'free').slice(1)} License`,
    detail: [
      `Company:  ${lic.company  || '—'}`,
      `Tier:     ${lic.tier     || '—'}`,
      `Expires:  ${lic.expires  || 'N/A'}`,
      `Seats:    ${lic.seats    || 1}`,
      `Features: ${(lic.features || []).join(', ') || '—'}`,
      `Key:      ${store.get('licenseKey','—').slice(0,4)}…`
    ].join('\n'),
    buttons: ['OK', 'Upgrade']
  }).then(({ response }) => {
    if (response === 1) shell.openExternal('https://climrisk.io/pricing');
  });
}

function reactivate() {
  store.delete('licenseKey');
  store.delete('licenseTier');
  licenseData = null;
  if (mainWindow) mainWindow.close();
  showActivation();
}

// ── Auto-updater ───────────────────────────────────────────────────────────────
function setupAutoUpdater() {
  if (DEV) return;
  autoUpdater.autoDownload = false;
  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `ClimRisk ${info.version} is available`,
      detail: 'A new version of ClimRisk is ready. Download it now?',
      buttons: ['Download', 'Later']
    }).then(({ response }) => {
      if (response === 0) autoUpdater.downloadUpdate();
    });
  });
  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. Restart ClimRisk to apply.',
      buttons: ['Restart Now', 'Later']
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });
  setTimeout(() => autoUpdater.checkForUpdatesAndNotify(), 10000);
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.on('ready', async () => {
  // Build initial menu
  buildMenu(null);
  setupTray();
  setupAutoUpdater();

  const storedKey = store.get('licenseKey', '');

  if (!storedKey) {
    // No key stored — show activation screen
    showActivation();
    return;
  }

  // Key stored — validate it silently on startup
  try {
    const info = await validateLicense(storedKey);
    licenseData = info;
    await loadDashboard(storedKey, info);
  } catch (err) {
    // Key invalid or engine offline
    console.warn('Startup license validation failed:', err.message);
    // If engine is just offline, still allow access with cached tier
    if (err.message.includes('timeout') || err.message.includes('ECONNREFUSED')) {
      // Engine unreachable — use cached tier, proceed to dashboard
      licenseData = { tier: store.get('licenseTier', 'analyst'), valid: true, offline: true };
      await loadDashboard(storedKey, licenseData);
    } else {
      // Invalid key — force reactivation
      store.delete('licenseKey');
      store.delete('licenseTier');
      showActivation();
    }
  }
});

app.on('window-all-closed', () => {
  // On macOS, keep app running in tray even when all windows closed
  if (!IS_MAC) app.quit();
});

app.on('activate', () => {
  if (!mainWindow) {
    const key = store.get('licenseKey', '');
    if (key) loadDashboard(key, licenseData || {});
    else     showActivation();
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  if (mainWindow) mainWindow.removeAllListeners('closed');
});
