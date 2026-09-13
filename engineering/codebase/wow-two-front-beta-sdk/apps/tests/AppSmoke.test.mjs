import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright';
import { expect } from 'playwright/test';

// Build all three apps first, then: node --test apps/tests/AppSmoke.test.mjs.
// PLAYWRIGHT_CHANNEL=chrome uses a locally installed Chrome when needed.
const appsRoot = fileURLToPath(new URL('../', import.meta.url));
const apps = new Set(['playground', 'showcase', 'theme-studio']);
const contentTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
};
let browser;
let baseUrl;
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const [, prefix, app, ...rest] = pathname.split('/');
    // Playground is a local-only app whose Vite base is the origin root.
    const appName = prefix === 'nested' ? app : 'playground';
    assert.ok(apps.has(appName));
    const relative = prefix === 'nested' ? rest.join('/') : pathname.slice(1);
    const file = path.join(appsRoot, appName, 'dist', relative || 'index.html');
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': contentTypes[path.extname(file)] ?? 'application/octet-stream',
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  });
});
after(async () => {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
});

async function openPage(url, run) {
  const page = await browser.newPage();
  try {
    await page.goto(`${baseUrl}${url}`);
    await run(page);
  } finally {
    await page.close();
  }
}

test('playground applies the SDK utilities and themes portaled Select content', async () => {
  await openPage('/', async (page) => {
    await expect(page.locator('body')).toHaveClass(/theme-haven/);
    await expect(page.locator('body')).toHaveClass(/dark/);
    const trigger = page.getByRole('button', { name: 'All', exact: true }).first();
    await trigger.click();
    const owner = page.getByRole('option', { name: /Owner/ });
    await expect(owner).toBeVisible();
    await expect(page.getByRole('option', { name: /Unresolved/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    assert.equal(await trigger.evaluate((el) => getComputedStyle(el).display), 'flex');
    await owner.click();
    await expect(page.getByRole('button', { name: /Clear/i }).first()).toBeVisible();
  });
});

test('showcase serves media below a path prefix and renders one toast per event', async () => {
  await openPage('/nested/showcase/#/app/media', async (page) => {
    const poster = page.getByAltText('Aurora over the ridge').first();
    await expect(poster).toBeVisible();
    await page.waitForFunction(() => {
      const img = document.querySelector('img[alt="Aurora over the ridge"]');
      return img?.complete && img.naturalWidth > 0;
    });
    assert.ok((await poster.getAttribute('src')).startsWith('./samples/'));
    const audio = page.locator('audio');
    assert.match(await audio.getAttribute('src'), /^\.\/samples\//);
    await page.goto(`${baseUrl}/nested/showcase/#/galleries/feedback`);
    await page.getByRole('button', { name: 'Success toast', exact: true }).click();
    await expect(page.getByText('All changes persisted.', { exact: true })).toHaveCount(1);
  });
});

test('theme studio previews are inert, generated CSS updates, and export retains the name', async () => {
  await openPage('/nested/theme-studio/', async (page) => {
    const preview = page.locator('[aria-hidden="true"][inert]').first();
    await expect(preview).toBeVisible();
    await preview
      .locator('button')
      .first()
      .evaluate((el) => el.focus());
    assert.equal(await preview.evaluate((el) => el.contains(document.activeElement)), false);
    await page.getByRole('link', { name: 'Generator', exact: true }).click();
    const generated = page.locator('.theme-studio-generated');
    await expect(generated).toBeVisible();
    const primaryColor = () =>
      generated.evaluate((el) => getComputedStyle(el).getPropertyValue('--color-primary'));
    const beforeColor = await primaryColor();
    assert.notEqual(beforeColor.trim(), '');
    const input = page.getByPlaceholder('you@example.com');
    await input.fill('retained@example.com');
    await page.getByRole('slider', { name: 'Primary hue' }).press('ArrowRight');
    await expect.poll(primaryColor).not.toBe(beforeColor);
    await expect(input).toHaveValue('retained@example.com');
    await page.getByRole('link', { name: 'Export', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Export — /);
    const heading = await page.getByRole('heading', { level: 1 }).innerText();
    await page.getByRole('tab', { name: 'Token JSON' }).click();
    const tokens = JSON.parse(await page.getByRole('tabpanel').locator('pre code').innerText());
    assert.equal(tokens.name, heading.replace('Export — ', ''));
  });
});
