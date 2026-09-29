'use strict';
// ── ClimRisk local engine manager ────────────────────────────────────────────
// Starts the Python engine (FastAPI / uvicorn) on this machine when the app
// opens and stops it when the app quits. Nothing is sent to a hosted server:
// analysis runs locally; only public datasets (AWS Open Data, Planetary
// Computer, NOAA) are downloaded.
//
// Security
//   • binds to 127.0.0.1 only — not reachable from the network
//   • a random per-session token is required on every API call
//     (CRI_API_KEYS), so other programs or web pages on this Mac cannot use it
//
// Layout (created by setup-local-engine.sh)
//   ~/.climrisk/engine-venv/     Python environment with the engine installed (editable)
//   ~/.climrisk/engine.env       optional KEY=VALUE secrets, e.g. GROQ_API_KEY (chmod 600)
//   ~/.climrisk/cache/           data cache
//   ~/.climrisk/logs/engine.log  engine output

const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');

const HOME_DIR = path.join(os.homedir(), '.climrisk');
const IS_WIN = process.platform === 'win32';

function pythonCandidates() {
  const venv = path.join(HOME_DIR, 'engine-venv', IS_WIN ? 'Scripts' : 'bin', IS_WIN ? 'python.exe' : 'python');
  return [process.env.CLIMRISK_PYTHON, venv].filter(Boolean);
}

function findPython() {
  return pythonCandidates().find(p => { try { return fs.statSync(p).isFile(); } catch { return false; } }) || null;
}

function readEnvFile(file) {
  const out = {};
  try {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith('#')) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* optional file */ }
  return out;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => { const { port } = srv.address(); srv.close(() => resolve(port)); });
  });
}

async function waitHealthy(url, timeoutMs, isAlive) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (!isAlive()) return false;
    try {
      const r = await fetch(url + '/health', { signal: AbortSignal.timeout(2000) });
      if (r.ok) return true;
    } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 400));
  }
  return false;
}

class LocalEngine {
  constructor() {
    this.proc = null;
    this.url = null;
    this.token = null;
    this.logFile = path.join(HOME_DIR, 'logs', 'engine.log');
    this.lastError = null;
    this.onExit = null;           // callback(code) when the engine stops unexpectedly
    this._stopping = false;
  }

  /** Resolve { ok, url, token, error } — never throws. */
  async start({ timeoutMs = 90000 } = {}) {
    const python = findPython();
    if (!python) {
      this.lastError = 'Local engine not installed. Run electron/setup-local-engine.sh once, then reopen the app.';
      return { ok: false, error: this.lastError, setupRequired: true };
    }
    fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
    fs.mkdirSync(path.join(HOME_DIR, 'cache'), { recursive: true });

    const port = await freePort();
    this.token = crypto.randomBytes(24).toString('hex');
    this.url = `http://127.0.0.1:${port}`;

    const env = {
      ...process.env,
      ...readEnvFile(path.join(HOME_DIR, 'engine.env')),
      CRI_API_KEYS: this.token,               // every request must carry this token
      CRI_CACHE_DIR: path.join(HOME_DIR, 'cache'),
      PYTHONUNBUFFERED: '1',
      CLIMRISK_LOCAL: '1',
    };
    delete env.API_KEYS;

    const log = fs.createWriteStream(this.logFile, { flags: 'a' });
    log.write(`\n── ${new Date().toISOString()} starting engine on ${this.url} (${python})\n`);
    this._stopping = false;
    this.proc = spawn(python, ['-m', 'uvicorn', 'cri.api.main:app', '--host', '127.0.0.1',
                               '--port', String(port), '--workers', '1', '--log-level', 'warning'],
                      { env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    this.proc.stdout.pipe(log);
    this.proc.stderr.pipe(log);
    let exited = false;
    this.proc.on('exit', (code) => {
      exited = true;
      log.write(`── engine exited (code ${code})\n`);
      if (!this._stopping && this.onExit) this.onExit(code);
    });
    this.proc.on('error', (err) => { exited = true; this.lastError = err.message; });

    const ok = await waitHealthy(this.url, timeoutMs, () => !exited);
    if (!ok) {
      this.lastError = exited
        ? `Engine exited during start-up. See ${this.logFile}`
        : `Engine did not respond within ${Math.round(timeoutMs / 1000)} s. See ${this.logFile}`;
      this.stop();
      return { ok: false, error: this.lastError, logFile: this.logFile };
    }
    return { ok: true, url: this.url, token: this.token };
  }

  stop() {
    this._stopping = true;
    if (this.proc && !this.proc.killed) {
      try { this.proc.kill(IS_WIN ? undefined : 'SIGTERM'); } catch { /* already gone */ }
      const p = this.proc;
      setTimeout(() => { try { if (!p.killed) p.kill('SIGKILL'); } catch { /* gone */ } }, 3000).unref();
    }
    this.proc = null;
  }
}

module.exports = { LocalEngine, HOME_DIR, findPython };
