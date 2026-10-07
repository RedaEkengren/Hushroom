import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Plugin } from 'vite';
import { SEO_ROUTES } from './src/seo-meta';
import { renderHead, outputPathFor } from './src/seo-head';

// Prerendering, level 1: one static index.html per marketing route, each with
// its own title, description, og/twitter tags, canonical and hreflang.
//
// Why this exists: the site is a single-page app, so without this every route
// serves the landing page's <head>. LinkedIn, Slack and WhatsApp never execute
// JavaScript when they build a link preview, so sharing /sakerhet showed the
// landing page's title. Google does run JS, but the preview scrapers do not.
//
// The rewriting itself lives in src/seo-head.ts so the tests can reach it.
// Level 2 (scripts/prerender-content.mjs) fills in the rendered body afterwards
// and is allowed to be skipped.
//
// nginx serves these automatically: `try_files $uri $uri/ /index.html` with
// root frontend/dist means a request for /sakerhet resolves to the directory
// dist/sakerhet/ and nginx serves its index.html. No server change needed.

export function prerenderHead(): Plugin {
  let resolvedOutDir = 'dist';
  return {
    name: 'hushroom-prerender-head',
    apply: 'build',
    configResolved(config) {
      // Honour --outDir / build.outDir: the deploy builds into dist.new.
      resolvedOutDir = config.build.outDir;
    },
    closeBundle() {
      const outDir = join(process.cwd(), resolvedOutDir);
      const template = readFileSync(join(outDir, 'index.html'), 'utf8');

      const manifest: { path: string; file: string; lang: string }[] = [];

      for (const meta of SEO_ROUTES) {
        const file = outputPathFor(meta.path);
        const target = join(outDir, file);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, renderHead(template, meta), 'utf8');
        manifest.push({ path: meta.path, file, lang: meta.lang });
      }

      // Level 2 (scripts/prerender-content.mjs) is plain JS and cannot import
      // this TypeScript module, so hand it the route list as data.
      writeFileSync(
        join(outDir, 'prerender-manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf8',
      );

      console.log(`prerender level 1: wrote ${SEO_ROUTES.length} static route heads`);
    },
  };
}
