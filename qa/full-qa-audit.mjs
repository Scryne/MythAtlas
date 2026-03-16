#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, 'qa', 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'full-qa-report.json');
const PORT = Number(process.env.QA_PORT || 3210);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const AUTO_BUILD = process.env.QA_AUTO_BUILD !== '0';

const BREAKPOINTS = [
  { label: 'mobile', width: 375, height: 812 },
  { label: 'tablet', width: 768, height: 1024 },
  { label: 'laptop', width: 1024, height: 768 },
  { label: 'desktop', width: 1440, height: 900 },
];

const CORE_ROUTES = ['/', '/map', '/parallels', '/compare', '/discover', '/stats', '/themes'];

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

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function firstMythByType() {
  const myths = readJson('src/data/myths.json');
  const wanted = ['creation', 'hero', 'trickster', 'love', 'war', 'quest'];
  const map = new Map();
  for (const myth of myths) {
    if (!map.has(myth.type) && wanted.includes(myth.type)) map.set(myth.type, myth.id);
  }
  return wanted.map((type) => ({ type, id: map.get(type) || null })).filter((entry) => entry.id);
}

function selectSiteIds() {
  const sites = readJson('src/data/sacred-sites.json');
  const preferred = ['parthenon', 'delphi', 'giza-pyramids', 'machu-picchu', 'stonehenge'];
  return preferred.filter((id) => sites.some((site) => site.id === id));
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(timeoutMs = 180000, isServerExited = () => false) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (isServerExited()) {
      throw new Error('QA server exited before becoming ready.');
    }
    try {
      const response = await fetch(`${BASE_URL}/`);
      if (response.ok) return;
    } catch {
      // ignore until ready
    }
    await sleep(500);
  }
  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

function startServer() {
  const server = spawn('cmd.exe', ['/c', `npm.cmd run start -- -p ${PORT}`], {
    cwd: ROOT,
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });

  const logs = {
    stdout: [],
    stderr: [],
  };

  server.stdout.on('data', (chunk) => logs.stdout.push(chunk.toString()));
  server.stderr.on('data', (chunk) => logs.stderr.push(chunk.toString()));

  return { server, logs };
}

async function runPageAudit(browser, route, viewport, reducedMotion = false) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
  });
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
  page.on('pageerror', (err) => pageErrors.push(String(err)));
  page.on('requestfailed', (req) =>
    requestFailures.push({
      url: req.url(),
      method: req.method(),
      failure: req.failure()?.errorText || 'unknown',
    })
  );
  page.on('response', (res) => {
    const status = res.status();
    if (status >= 400) {
      responseErrors.push({
        url: res.url(),
        status,
      });
    }
  });

  let navigationError = null;
  try {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(900);
  } catch (error) {
    navigationError = String(error);
  }

  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    bodyOverflowX: getComputedStyle(document.body).overflowX,
    headingFont:
      getComputedStyle(document.querySelector('h1') || document.body).fontFamily || '',
    bodyFont: getComputedStyle(document.body).fontFamily || '',
  }));

  const overflow = layout.scrollWidth > layout.innerWidth + 1;

  const resourceTiming = await page.evaluate(() => {
    return performance
      .getEntriesByType('resource')
      .filter((entry) => entry.name.includes('/data/'))
      .map((entry) => ({ name: entry.name, duration: entry.duration }));
  });

  await context.close();

  return {
    route,
    viewport: viewport.label,
    reducedMotion,
    navigationError,
    overflow,
    layout,
    consoleEvents,
    pageErrors,
    requestFailures,
    responseErrors,
    dataResources: resourceTiming,
  };
}

async function runInteractionChecks(browser, ids) {
  const results = {
    landing: {},
    map: {},
    searchModal: {},
    compare: {},
    discover: {},
    stats: {},
    themes: {},
    details: {
      mythology: [],
      myth: [],
      deity: [],
      site: [],
    },
  };

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  results.landing.titleVisible = await page.locator('h1:has-text("MythAtlas")').count();
  const exploreButton = page.locator('button').filter({ hasText: /Keşfetmeye|Kesfedin|Kalkan|Ke.*Ba.*/i }).first();
  results.landing.exploreButtonVisible = await exploreButton.isVisible().catch(() => false);
  if (results.landing.exploreButtonVisible) {
    await exploreButton.click();
    await page.waitForURL(/\/map/, { timeout: 15000 }).catch(() => {});
  }
  results.landing.navigatesToMap = /\/map/.test(page.url());

  await page.goto(`${BASE_URL}/map`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  results.map.mapCanvasCount = await page.locator('.maplibregl-canvas').count();
  results.map.mapControlsPresent = {
    zoomIn: await page.locator('button[aria-label="Zoom in"]').count(),
    zoomOut: await page.locator('button[aria-label="Zoom out"]').count(),
    resetView: await page.locator('button[aria-label="Reset map view"]').count(),
    resetBearing: await page.locator('button[aria-label="Reset map bearing"]').count(),
  };

  const filterToggle = page.locator('button[aria-label="Open filter panel"]');
  const legendToggle = page.locator('button[aria-label="Open legend panel"]');
  const parallelToggle = page.locator('button[aria-label="Toggle parallel myths mode"]');

  const classIncludes = async (selector, expected) => {
    const node = page.locator(selector);
    const count = await node.count();
    if (!count) return false;
    const cls = (await node.first().getAttribute('class').catch(() => null)) || '';
    return cls.includes(expected);
  };

  await filterToggle.click().catch(() => {});
  await page.waitForTimeout(300);
  results.map.filterPanelOpened = await classIncludes('[aria-label="Map filters panel"]', 'translate-x-0');

  await legendToggle.click().catch(() => {});
  await page.waitForTimeout(300);
  results.map.legendPanelOpened = await classIncludes('[aria-label="Map legend panel"]', 'translate-x-0');

  await parallelToggle.click().catch(() => {});
  await page.waitForTimeout(350);
  results.map.parallelModeHintVisible = (await page.locator('text=/Paralel Mitler Modu/i').count()) > 0;

  const mapSearchToggle = page.locator('button[aria-label="Open search panel"]');
  await mapSearchToggle.click().catch(() => {});
  const mapSearchInput = page.locator('input[placeholder*="Search mythologies"]');
  results.map.searchPanelOpened = await mapSearchInput.isVisible().catch(() => false);
  if (results.map.searchPanelOpened) {
    await mapSearchInput.fill('Greek');
    await page.waitForTimeout(350);
    const greekResult = page.locator('button').filter({ hasText: /Greek Mythology/i }).first();
    if ((await greekResult.count()) > 0) {
      await greekResult.click();
      await page.waitForTimeout(700);
    }
    results.map.selectedMythologyPanelOpened = await classIncludes(
      '[aria-label="Selected mythology panel"]',
      'translate-x-0'
    );
  }

  // Global Search modal checks.
  await page.goto(`${BASE_URL}/discover`, { waitUntil: 'domcontentloaded' });
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyK');
  await page.keyboard.up('Control');
  await page.waitForTimeout(1000); // Wait for modal to hydrate and animate in
  const searchInput = page.locator('input[placeholder*="ara"], input[placeholder*="Mitoloji"]').first();
  results.searchModal.opensWithCtrlK = await searchInput.isVisible().catch(() => false);
  if (results.searchModal.opensWithCtrlK) {
    await searchInput.fill('Prometh');
    await page.waitForTimeout(700);
    results.searchModal.fuzzyMatchesPrometheus = (await page.locator('text=/Prometheus/i').count()) > 0;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    results.searchModal.closesOnEsc = (await searchInput.count()) === 0;
  }

  // Compare page checks.
  await page.goto(`${BASE_URL}/compare?left=prometheus-fire&right=maui-fire`, { waitUntil: 'domcontentloaded' });
  const selects = page.locator('select');
  results.compare.selectCount = await selects.count();
  results.compare.firstSelectOptions = await selects.nth(0).locator('option').count();
  results.compare.queryPreselectWorks =
    ((await selects.nth(0).inputValue().catch(() => '')) === 'prometheus-fire') &&
    ((await selects.nth(1).inputValue().catch(() => '')) === 'maui-fire');

  const presetLabels = ['Noah', 'Prometheus', 'Zeus', 'Herk', 'Osiris'];
  const presetResults = [];
  for (const label of presetLabels) {
    const button = page.locator('button').filter({ hasText: new RegExp(label, 'i') }).first();
    if ((await button.count()) > 0) {
      await button.click();
      await page.waitForTimeout(300);
      const score = (await page.locator('text=/Benzerlik Skoru/i').count()) > 0;
      presetResults.push({ label, clicked: true, scoreVisible: score });
    } else {
      presetResults.push({ label, clicked: false, scoreVisible: false });
    }
  }
  results.compare.presets = presetResults;

  const beforeUrl = page.url();
  if ((await selects.count()) >= 2) {
    const secondOptions = selects.nth(1).locator('option');
    if ((await secondOptions.count()) > 2) {
      const newValue = await secondOptions.nth(2).getAttribute('value');
      if (newValue) {
        await selects.nth(1).selectOption(newValue);
        await page.waitForTimeout(300);
      }
    }
  }
  results.compare.urlUpdatesOnSelectionChange = page.url() !== beforeUrl;

  // Discover.
  await page.goto(`${BASE_URL}/discover`, { waitUntil: 'domcontentloaded' });
  results.discover.dailyMythTitle = await page.locator('h1').first().textContent().catch(() => null);
  const randomBtn = page.locator('button').filter({ hasText: /sasirt|şaşırt|sasirt/i }).first();
  results.discover.randomButtonVisible = await randomBtn.isVisible().catch(() => false);
  results.discover.collectionCards = await page.locator('article').count();
  results.discover.recentItems = await page.locator('text=/Recently Added/i').count();

  // Stats.
  await page.goto(`${BASE_URL}/stats`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  results.stats.chartsApprox = await page.locator('svg').count();
  results.stats.funFactCards = await page.locator('text=/Fun facts/i').count();

  // Themes.
  await page.goto(`${BASE_URL}/themes`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  results.themes.themeCards = await page.locator('button').count();
  results.themes.networkGraphPresent = await page.locator('svg').count();
  const firstThemeButton = page.locator('button').first();
  if ((await firstThemeButton.count()) > 0) {
    await firstThemeButton.click();
    await page.waitForTimeout(300);
  }
  results.themes.filteredMythsVisible = await page.locator('text=/Filtrelenmis mit listesi/i').count();

  await context.close();

  // Detail page checks (desktop for structure, mobile for responsive sample).
  for (const mythologyId of ids.mythologyIds) {
    const detailContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const detailPage = await detailContext.newPage();
    await detailPage.goto(`${BASE_URL}/mythology/${mythologyId}`, { waitUntil: 'domcontentloaded' });
    await detailPage.waitForTimeout(600);
    const tabs = await detailPage.locator('button').filter({ hasText: /Overview|Genel|Pantheon|Panteon|Myths|Mit|Stories|Sacred|Kutsal|Parallels|Paralel/i }).count();
    results.details.mythology.push({ id: mythologyId, tabs });
    await detailContext.close();
  }

  for (const mythId of ids.mythIds) {
    const detailContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const detailPage = await detailContext.newPage();
    await detailPage.goto(`${BASE_URL}/myth/${mythId}`, { waitUntil: 'domcontentloaded' });
    await detailPage.waitForTimeout(500);
    const headings = await detailPage.locator('h1, h2, h3').allTextContents();
    const hasSources = headings.some((text) => /source|kaynak/i.test(text));
    results.details.myth.push({ id: mythId, hasSources });
    await detailContext.close();
  }

  for (const deityId of ids.deityIds) {
    const detailContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const detailPage = await detailContext.newPage();
    await detailPage.goto(`${BASE_URL}/deity/${deityId}`, { waitUntil: 'domcontentloaded' });
    await detailPage.waitForTimeout(500);
    const hasEquivalents = (await detailPage.locator('text=/Equivalent|Esdeger|Equivalents/i').count()) > 0;
    results.details.deity.push({ id: deityId, hasEquivalents });
    await detailContext.close();
  }

  for (const siteId of ids.siteIds) {
    const detailContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const detailPage = await detailContext.newPage();
    await detailPage.goto(`${BASE_URL}/site/${siteId}`, { waitUntil: 'domcontentloaded' });
    await detailPage.waitForTimeout(500);
    const mapPresent = (await detailPage.locator('svg[aria-label^="Map around"]').count()) > 0;
    results.details.site.push({ id: siteId, mapPresent });
    await detailContext.close();
  }

  return results;
}

async function runLighthouseAudit(paths) {
  const lhUserDataDir = path.join(ROOT, 'qa', '.tmp', 'lighthouse-profile');
  fs.mkdirSync(lhUserDataDir, { recursive: true });

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox', `--user-data-dir=${lhUserDataDir}`],
  });

  const scores = {};
  try {
    for (const urlPath of paths) {
      const url = `${BASE_URL}${urlPath}`;
      try {
        const result = await lighthouse(url, {
          port: chrome.port,
          output: 'json',
          logLevel: 'error',
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        });
        if (!result?.lhr?.categories) {
          scores[urlPath] = { error: 'No category scores returned.' };
          continue;
        }
        const categories = result.lhr.categories;
        scores[urlPath] = {
          performance: Math.round((categories.performance?.score || 0) * 100),
          accessibility: Math.round((categories.accessibility?.score || 0) * 100),
          bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
          seo: Math.round((categories.seo?.score || 0) * 100),
        };
      } catch (error) {
        scores[urlPath] = { error: String(error) };
      }
    }
  } finally {
    try {
      await chrome.kill();
    } catch {
      // ignore Windows temp-dir permission issues during cleanup
    }
  }

  return scores;
}

function analyzeBundles() {
  const chunkDir = path.join(ROOT, '.next', 'static', 'chunks');
  if (!fs.existsSync(chunkDir)) return { largeChunks: [], nonExemptLargeChunks: [] };

  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.js')) files.push(full);
    }
  };
  walk(chunkDir);

  const largeChunks = files
    .map((file) => ({
      file: path.relative(ROOT, file),
      sizeKb: Number((fs.statSync(file).size / 1024).toFixed(2)),
      content: fs.readFileSync(file, 'utf8'),
    }))
    .filter((item) => item.sizeKb > 200);

  const nonExemptLargeChunks = largeChunks
    .filter((item) => !/maplibre|d3|d3-force|recharts|framer-motion/i.test(item.content))
    .map(({ content, ...rest }) => rest);

  return {
    largeChunks: largeChunks.map(({ content, ...rest }) => rest),
    nonExemptLargeChunks,
  };
}

async function main() {
  await ensureProductionBuild();
  ensureServerChunkShims();

  const ids = {
    mythologyIds: ['greek', 'norse', 'aztec', 'japanese', 'turkic'],
    mythIds: firstMythByType().map((entry) => entry.id),
    deityIds: ['zeus', 'odin', 'ra', 'quetzalcoatl-deity', 'tengri', 'izanagi', 'vishnu'],
    siteIds: selectSiteIds(),
  };

  const { server, logs } = startServer();
  const serverGuard = { exited: false };
  server.on('exit', () => {
    serverGuard.exited = true;
  });

  try {
    try {
      await waitForServer(180000, () => serverGuard.exited);
    } catch (error) {
      throw new Error(
        `${String(error)}\n--- server stdout ---\n${logs.stdout.join('')}\n--- server stderr ---\n${logs.stderr.join('')}`
      );
    }

    const browser = await chromium.launch({ headless: true });

    const routeAudits = [];
    for (const breakpoint of BREAKPOINTS) {
      for (const route of CORE_ROUTES) {
        routeAudits.push(await runPageAudit(browser, route, breakpoint, false));
      }
    }

    const reducedMotionAudit = await runPageAudit(
      browser,
      '/',
      { label: 'desktop-reduced', width: 1440, height: 900 },
      true
    );

    const interactionChecks = await runInteractionChecks(browser, ids);
    await browser.close();

    const lighthousePaths = ['/', '/map', '/mythology/greek', '/myth/mesopotamian-flood', '/parallels', '/stats'];
    const lighthouse = await runLighthouseAudit(lighthousePaths);

    const bundleAnalysis = analyzeBundles();

    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      ids,
      routeAudits,
      reducedMotionAudit,
      interactionChecks,
      lighthouse,
      bundleAnalysis,
      serverLogs: {
        stdout: logs.stdout.join(''),
        stderr: logs.stderr.join(''),
      },
    };

    fs.mkdirSync(REPORT_DIR, { recursive: true });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

    const totalConsoleErrors = routeAudits.reduce(
      (sum, item) => sum + item.consoleEvents.filter((event) => event.type === 'error').length,
      0
    );
    const totalPageErrors = routeAudits.reduce((sum, item) => sum + item.pageErrors.length, 0);
    const totalRequestFailures = routeAudits.reduce((sum, item) => sum + item.requestFailures.length, 0);
    const totalResponseErrors = routeAudits.reduce((sum, item) => sum + item.responseErrors.length, 0);
    const overflows = routeAudits.filter((item) => item.overflow).length;

    console.log(
      JSON.stringify(
        {
          reportPath: path.relative(ROOT, REPORT_PATH),
          routeAuditCount: routeAudits.length,
          totals: {
            consoleErrors: totalConsoleErrors,
            pageErrors: totalPageErrors,
            requestFailures: totalRequestFailures,
            responseErrors: totalResponseErrors,
            overflowRoutes: overflows,
          },
          lighthouse,
        },
        null,
        2
      )
    );
  } finally {
    if (!serverGuard.exited && server.pid) {
      try {
        server.kill('SIGTERM');
      } catch {
        // ignore
      }

      await sleep(500);

      if (!serverGuard.exited) {
        try {
          if (process.platform === 'win32') {
            spawn('taskkill', ['/PID', String(server.pid), '/T', '/F'], {
              stdio: 'ignore',
              shell: false,
            });
          } else {
            server.kill('SIGKILL');
          }
        } catch {
          // ignore
        }
      }

      await sleep(300);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
