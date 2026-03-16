#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, 'qa', 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'new-feature-browser-audit.json');
const PORT = Number(process.env.QA_PORT || 3211);
const HOST = process.env.QA_HOST || '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;
const AUTO_START_SERVER = process.env.AUTO_START_SERVER !== '0';
const AUTO_BUILD = process.env.QA_AUTO_BUILD !== '0';

const ROUTES = [
  '/dna',
  '/family-tree',
  '/family-tree/deities',
  '/bibliography',
  '/scholars',
  '/archaeology',
  '/sites',
];

const THRESHOLDS = {
  '/dna': 82,
  '/family-tree': 78,
  '/family-tree/deities': 85,
  '/bibliography': 88,
  '/scholars': 88,
  '/archaeology': 83,
  '/sites': 83,
};

function ensureServerChunkShims() {
  const serverDir = path.join(ROOT, '.next', 'server');
  const chunksDir = path.join(serverDir, 'chunks');
  if (!fs.existsSync(serverDir) || !fs.existsSync(chunksDir)) return;
  const chunkFiles = fs.readdirSync(chunksDir).filter((name) => name.endsWith('.js'));
  for (const file of chunkFiles) {
    const source = path.join(chunksDir, file);
    const target = path.join(serverDir, file);
    if (!fs.existsSync(target)) {
      fs.copyFileSync(source, target);
    }
  }
}

function runCommand(command, args, label) {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === 'win32';
    const child = isWin
      ? spawn('cmd.exe', ['/c', command, ...args], {
          cwd: ROOT,
          env: process.env,
          stdio: 'inherit',
          shell: false,
        })
      : spawn(command, args, {
          cwd: ROOT,
          env: process.env,
          stdio: 'inherit',
          shell: false,
        });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${label} failed with exit code ${code ?? 'unknown'}`));
    });
  });
}

async function ensureProductionBuild() {
  if (!AUTO_BUILD) return;
  fs.rmSync(path.join(ROOT, '.next'), { recursive: true, force: true });
  const npmCmd = process.platform === 'win32' ? 'npm' : 'npm';
  await runCommand(npmCmd, ['run', 'build'], 'Build');
}

async function auditRoute(browser, route, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleEvents = [];
  const pageErrors = [];
  const requestFailures = [];
  const responseErrors = [];

  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      consoleEvents.push({ type, text: msg.text() });
    }
  });
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('requestfailed', (request) =>
    requestFailures.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText || 'unknown',
    })
  );
  page.on('response', (response) => {
    if (response.status() >= 400) {
      responseErrors.push({ url: response.url(), status: response.status() });
    }
  });

  let navigationError = null;
  try {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(1400);
  } catch (error) {
    navigationError = String(error);
  }

  const checks = {};
  if (route === '/family-tree' && viewport.width <= 375) {
    checks.mobileHintVisible =
      (await page.locator('text=/Aile agaci masaustunde daha iyi goruntulenir/i').count()) > 0;
  }
  if (route === '/dna') {
    checks.elementUniverseCards = await page
      .locator('section:has-text("Element Universe") button')
      .count();
  }

  await context.close();
  return {
    route,
    viewport,
    navigationError,
    consoleEvents,
    pageErrors,
    requestFailures,
    responseErrors,
    checks,
  };
}

async function runLighthouse() {
  if (process.env.DISABLE_LIGHTHOUSE === '1') return {};
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
  });
  const results = {};
  try {
    for (const route of ROUTES) {
      try {
        const report = await lighthouse(`${BASE_URL}${route}`, {
          port: chrome.port,
          output: 'json',
          logLevel: 'error',
          onlyCategories: ['performance'],
        });
        const score = Math.round((report?.lhr?.categories?.performance?.score || 0) * 100);
        results[route] = {
          score,
          threshold: THRESHOLDS[route],
          pass: score >= THRESHOLDS[route],
        };
      } catch (error) {
        results[route] = { error: String(error), threshold: THRESHOLDS[route], pass: false };
      }
    }
  } finally {
    try {
      await chrome.kill();
    } catch {
      // ignore
    }
  }
  return results;
}

async function isServerReady() {
  return fetch(`${BASE_URL}/`, { cache: 'no-store' }).then((res) => res.ok).catch(() => false);
}

async function waitForServer(timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerReady()) return true;
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  return false;
}

function startServer() {
  const args = ['node_modules/next/dist/bin/next', 'start', '-p', String(PORT), '-H', HOST];
  return spawn('node', args, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    env: process.env,
  });
}

async function main() {
  await ensureProductionBuild();

  let server = null;
  const serverLogs = { out: '', err: '' };

  let ready = false;
  if (AUTO_START_SERVER) {
    ensureServerChunkShims();
    server = startServer();
    server.stdout?.on('data', (chunk) => {
      serverLogs.out += String(chunk);
    });
    server.stderr?.on('data', (chunk) => {
      serverLogs.err += String(chunk);
    });
    ready = await waitForServer(90000);
  } else {
    ready = await isServerReady();
  }

  if (!ready) {
    const details =
      AUTO_START_SERVER && server
        ? `\nAuto-start logs:\nSTDOUT:\n${serverLogs.out || '(empty)'}\nSTDERR:\n${serverLogs.err || '(empty)'}`
        : '';
    throw new Error(
      `No running server detected at ${BASE_URL}. Start the app first and rerun this audit.${details}`
    );
  }

  const browser = await chromium.launch({ headless: true });

  try {
    const routeAudits = [];
    for (const route of ROUTES) {
      routeAudits.push(await auditRoute(browser, route, { width: 1440, height: 900 }));
      routeAudits.push(await auditRoute(browser, route, { width: 375, height: 812 }));
    }
    await browser.close();

    let lighthouse;
    try {
      lighthouse = await runLighthouse();
    } catch (error) {
      lighthouse = { error: String(error) };
    }
    const totals = routeAudits.reduce(
      (acc, item) => {
        acc.consoleWarnings += item.consoleEvents.filter((event) => event.type === 'warning').length;
        acc.consoleErrors += item.consoleEvents.filter((event) => event.type === 'error').length;
        acc.pageErrors += item.pageErrors.length;
        acc.requestFailures += item.requestFailures.length;
        acc.responseErrors += item.responseErrors.length;
        if (item.navigationError) acc.navigationErrors += 1;
        return acc;
      },
      {
        consoleWarnings: 0,
        consoleErrors: 0,
        pageErrors: 0,
        requestFailures: 0,
        responseErrors: 0,
        navigationErrors: 0,
      }
    );

    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      routes: ROUTES,
      routeAudits,
      totals,
      lighthouse,
    };

    fs.mkdirSync(REPORT_DIR, { recursive: true });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

    const lighthouseFailures =
      typeof lighthouse === 'object' && !Array.isArray(lighthouse)
        ? Object.values(lighthouse).filter((item) => item && item.pass === false).length
        : 0;
    console.log(
      JSON.stringify(
        {
          reportPath: path.relative(ROOT, REPORT_PATH),
          totals,
          lighthouseFailures,
        },
        null,
        2
      )
    );
  } finally {
    try {
      await browser.close();
    } catch {
      // ignore
    }
    if (server) {
      try {
        server.kill('SIGTERM');
      } catch {
        // ignore
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
