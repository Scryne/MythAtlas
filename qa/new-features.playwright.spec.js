const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:3000';
const ROUTES = [
  '/dna',
  '/family-tree',
  '/family-tree/deities',
  '/bibliography',
  '/scholars',
  '/archaeology',
  '/sites',
  '/mythology/greek',
  '/mythology/babylonian',
];

for (const route of ROUTES) {
  test(`desktop smoke + console audit ${route}`, async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    const badResponses = [];

    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        consoleErrors.push({ type, text: msg.text() });
      }
    });
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    page.on('requestfailed', (request) =>
      failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || 'unknown'}`)
    );
    page.on('response', (response) => {
      if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
    });

    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    const relevantFailedRequests = failedRequests.filter(
      (item) =>
        !/upload\.wikimedia\.org/i.test(item) &&
        !/ERR_BLOCKED_BY_ORB/i.test(item)
    );
    const hardErrors = consoleErrors.filter(
      (item) =>
        !/Failed to load resource: the server responded with a status of 404/i.test(item.text) &&
        !/favicon/i.test(item.text)
    );

    expect.soft(pageErrors, `page errors for ${route}`).toEqual([]);
    expect.soft(relevantFailedRequests, `failed requests for ${route}`).toEqual([]);
    expect.soft(badResponses, `4xx/5xx responses for ${route}`).toEqual([]);
    expect.soft(hardErrors, `console errors/warnings for ${route}`).toEqual([]);
  });

  test(`mobile smoke ${route}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    if (route === '/family-tree') {
      await expect(page.getByText(/Aile agaci masaustunde daha iyi goruntulenir/i)).toBeVisible();
    }

    await context.close();
  });
}
