'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  ClimRisk Desktop — Preload Script
//  Runs in the renderer process with Node access, exposes a safe contextBridge
//  API so the renderer (dashboard.html, activation.html) can talk to main.js
//  without full Node access.
// ─────────────────────────────────────────────────────────────────────────────
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

  // ── License management ────────────────────────────────────────────────────
  validateLicense: (key)      => ipcRenderer.invoke('license:validate', key),
  activateLicense: (key)      => ipcRenderer.invoke('license:activate', key),
  getLicense:      ()         => ipcRenderer.invoke('license:get'),

  // ── Engine URL ────────────────────────────────────────────────────────────
  getEngineUrl: () => ipcRenderer.invoke('app:getEngineUrl'),

  // ── File dialogs ──────────────────────────────────────────────────────────
  importExcelFile: ()                   => ipcRenderer.invoke('file:import'),
  savePdf:         (filename, buffer)   => ipcRenderer.invoke('pdf:save', { filename, buffer }),

  // ── Platform info ─────────────────────────────────────────────────────────
  platform: process.platform,
  isDesktop: true

});
