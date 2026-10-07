#!/usr/bin/env node
// Prerendering, level 2: render each marketing route in headless chromium and
// bake the resulting markup into the static index.html that level 1 wrote.
//
// Level 1 (vite-prerender-head.ts) already gives every route the right title,
// description and og tags, which is what link previews need. This step adds the
// visible text so crawlers that do not execute JavaScript still see the page
// content.
//
// MUST NEVER FAIL THE BUILD. Chromium is not installed on the prod server (the
// frontend is built there by scripts/deploy-prod.sh), so a missing browser is
// an expected condition: log it and leave the level 1 output alone. To enable
// level 2 on the server, run `npx playwright install chromium` there once.
//
// The app mounts with createRoot, not hydrateRoot, so React replaces this
// markup on mount. That is intentional: this is static output for crawlers,
// not hydration. The prerendered state is the logged-out, empty one (fresh
// browser context, no localStorage), so nothing user-specific is baked in.

import { createServer } from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';

const DIST = resolve(process.cwd(), process.env.VITE_BUILD_OUT_DIR || 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'text/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

/** Static server that mirrors nginx: try $uri, then $uri/index.html, then /index.html. */
async function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const candidates = [
    join(DIST, clean),
    join(DIST, clean, 'index.html'),
    join(DIST, 'index.html'),
  ];
  for (const candidate of candidates) {
    if (!candidate.startsWith(DIST)) continue; // no path traversal
    try {
      const s = await stat(candidate);
      if (s.isFile()) return candidate;
    } catch {
      // try next
    }
  }
  return null;
}

function startServer() {
  const server = createServer(async (req, res) => {
    const file = await resolveFile(req.url || '/');
    if (!file) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  });
  return new Promise((res) => server.listen(0, '127.0.0.1', () => res(server)));
}

async function loadRoutes() {
  // seo-meta.ts is TypeScript and this script is plain JS, so read the route
  // list from the manifest that level 1 emits next to the HTML it wrote.
  const raw = await readFile(join(DIST, 'prerender-manifest.json'), 'utf8');
  return JSON.parse(raw);
}

async function main() {
  let chromium;
  try {
    ({ chromium } = await import('@playwright/test'));
  } catch {
    console.log('prerender level 2: skipped (playwright not installed)');
    return;
  }

  let routes;
  try {
    routes = await loadRoutes();
  } catch (err) {
    console.log(`prerender level 2: skipped (no route manifest: ${err.message})`);
    return;
  }

  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    const first = String(err.message).split('\n')[0];
    console.log(`prerender level 2: skipped (chromium not available: ${first})`);
    console.log('prerender level 2: run "npx playwright install chromium" to enable it here');
    return;
  }

  const server = await startServer();
  const { port } = server.address();
  const origin = `http://127.0.0.1:${port}`;
  let done = 0;

  try {
    // reducedMotion: 'reduce' makes the landing-page demos render their static
    // frame, so the markup baked into dist/ is a deliberate, readable frame
    // rather than whatever mid-animation state the page happened to be in.
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();

    for (const route of routes) {
      const target = `${origin}${route.path}`;
      await page.goto(target, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForSelector('#root > *', { timeout: 10000 });

      const markup = await page.evaluate(() => document.getElementById('root')?.innerHTML ?? '');
      if (!markup.trim()) {
        console.log(`prerender level 2: empty render for ${route.path}, keeping head-only output`);
        continue;
      }

      const file = join(DIST, route.file);
      const html = await readFile(file, 'utf8');
      const filled = html.replace(
        /<div id="root"><\/div>/,
        `<div id="root">${markup}</div>`,
      );
      if (filled === html) {
        console.log(`prerender level 2: no #root placeholder in ${route.file}, skipping`);
        continue;
      }
      await writeFile(file, filled, 'utf8');
      done += 1;
    }

    await context.close();
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`prerender level 2: rendered ${done}/${routes.length} routes into static HTML`);
}

main().catch((err) => {
  // Still never fail the build: level 1 output is already on disk and correct.
  console.log(`prerender level 2: skipped after error (${err.message})`);
});
