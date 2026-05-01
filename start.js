'use strict';
const { spawn, exec } = require('child_process');
const http  = require('http');
const net   = require('net');
const path  = require('path');

const BACKEND_PORT  = 5000;
const FRONTEND_PORT = 3000;
const ROOT = __dirname;

/* ── ANSI colours ──────────────────────────────────────────────────────── */
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  green:   '\x1b[32m',
  cyan:    '\x1b[36m',
  magenta: '\x1b[35m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
};

const log = {
  info:     (m) => console.log(`${C.green}[start]   ${C.reset}${m}`),
  warn:     (m) => console.log(`${C.yellow}[warn]    ${C.reset}${m}`),
  error:    (m) => console.log(`${C.red}[error]   ${C.reset}${m}`),
  backend:  (m) => console.log(`${C.cyan}[backend] ${C.reset}${C.dim}${m}${C.reset}`),
  frontend: (m) => console.log(`${C.magenta}[frontend]${C.reset}${C.dim}${m}${C.reset}`),
};

/* ── Port helpers ──────────────────────────────────────────────────────── */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const client = new net.Socket();
    client.setTimeout(500);
    client.connect(port, '127.0.0.1', () => { client.destroy(); resolve(true); });
    client.on('error',   () => resolve(false));
    client.on('timeout', () => { client.destroy(); resolve(false); });
  });
}

function killPort(port) {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr ":${port} "`, (err, stdout) => {
      if (!stdout) return resolve();
      const pids = new Set();
      stdout.split('\n').forEach((line) => {
        if (/LISTENING/i.test(line)) {
          const parts = line.trim().split(/\s+/);
          const pid   = parts[parts.length - 1];
          if (/^\d+$/.test(pid) && pid !== '0') pids.add(pid);
        }
      });
      if (!pids.size) return resolve();
      const cmds = [...pids].map((p) => `taskkill /F /T /PID ${p}`).join(' & ');
      exec(cmds, () => setTimeout(resolve, 600));
    });
  });
}

/* ── Process spawning ──────────────────────────────────────────────────── */
function spawnDev(label, logFn, cwd, command) {
  const proc = spawn(command, { cwd, shell: true, stdio: 'pipe' });
  const pipe = (data) =>
    data.toString().split('\n').forEach((line) => {
      const t = line.trim();
      if (t) logFn(t);
    });
  proc.stdout.on('data', pipe);
  proc.stderr.on('data', pipe);
  proc.on('exit', (code) => {
    if (code !== null && code !== 0 && code !== null)
      log.error(`${label} exited with code ${code}`);
  });
  return proc;
}

/* ── Frontend readiness poll ───────────────────────────────────────────── */
function waitForHttp(url, timeoutMs = 120_000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    function attempt() {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.setTimeout(2000);
      req.on('error', () => {
        if (Date.now() >= deadline)
          return reject(new Error(`Timed out waiting for ${url}`));
        setTimeout(attempt, 1500);
      });
      req.on('timeout', () => req.destroy());
    }
    attempt();
  });
}

/* ── Open browser (Windows) ────────────────────────────────────────────── */
function openBrowser(url) {
  exec(`start "" "${url}"`);
}

/* ── Graceful shutdown ─────────────────────────────────────────────────── */
function makeShutdown(procs) {
  let called = false;
  return function shutdown() {
    if (called) return;
    called = true;
    console.log(`\n${C.yellow}Shutting down servers...${C.reset}`);
    for (const p of procs) {
      if (p && p.pid) exec(`taskkill /F /T /PID ${p.pid}`, () => {});
    }
    setTimeout(() => process.exit(0), 1200);
  };
}

/* ── Main ──────────────────────────────────────────────────────────────── */
async function main() {
  console.log(`\n${C.bold}${C.green}◆  Car Rental — Dev Launcher${C.reset}\n`);

  /* Check / clear busy ports */
  const [beBusy, feBusy] = await Promise.all([
    isPortInUse(BACKEND_PORT),
    isPortInUse(FRONTEND_PORT),
  ]);

  if (beBusy) {
    log.warn(`Port ${BACKEND_PORT} already in use — stopping existing process...`);
    await killPort(BACKEND_PORT);
  }
  if (feBusy) {
    log.warn(`Port ${FRONTEND_PORT} already in use — stopping existing process...`);
    await killPort(FRONTEND_PORT);
  }

  /* Start servers */
  log.info('Starting backend...');
  const backend = spawnDev(
    'backend', log.backend,
    path.join(ROOT, 'backend'),
    'npm run dev',
  );

  // Small stagger so backend logs don't interleave with the next message
  await new Promise((r) => setTimeout(r, 600));

  log.info('Starting frontend...');
  const frontend = spawnDev(
    'frontend', log.frontend,
    path.join(ROOT, 'frontend'),
    'npm run dev',
  );

  /* Wire up shutdown before awaiting so Ctrl+C works during startup */
  const shutdown = makeShutdown([backend, frontend]);
  process.on('SIGINT',  shutdown);
  process.on('SIGTERM', shutdown);

  /* Wait for frontend, then open browser */
  log.info(`Waiting for frontend at http://localhost:${FRONTEND_PORT} ...`);
  try {
    await waitForHttp(`http://localhost:${FRONTEND_PORT}`);
    log.info('Opening browser...');
    openBrowser(`http://localhost:${FRONTEND_PORT}`);
    console.log(`\n${C.bold}${C.green}✓  App is running${C.reset}`);
    console.log(`   ${C.cyan}Frontend${C.reset}  →  http://localhost:${FRONTEND_PORT}`);
    console.log(`   ${C.cyan}Backend${C.reset}   →  http://localhost:${BACKEND_PORT}`);
    console.log(`\n${C.dim}   Press Ctrl+C to stop both servers.${C.reset}\n`);
  } catch (e) {
    log.error('Frontend did not respond within 2 minutes. Check the logs above.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
