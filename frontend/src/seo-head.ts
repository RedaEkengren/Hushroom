import { SEO_ROUTES, OG_IMAGE, type RouteMeta } from './seo-meta';

// Pure head-rewriting logic for prerendering level 1. Lives in src/ so both the
// Vite plugin (vite-prerender-head.ts, which does the file IO) and the unit
// tests can import it without crossing the composite-project boundary between
// the browser project and the Node build project.
//
// No node imports here on purpose: this is string and path manipulation only.

export const ROUTES_FOR_PRERENDER = SEO_ROUTES;
export { OG_IMAGE };
export type { RouteMeta };

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Replace a <meta property|name="x" content="..."> value, or report a miss. */
function setMeta(html: string, attr: 'property' | 'name', key: string, content: string): string {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`);
  if (!re.test(html)) {
    throw new Error(`prerender-head: no <meta ${attr}="${key}"> in index.html template`);
  }
  return html.replace(re, `$1${escapeAttr(content)}$2`);
}

const HREFLANG_BLOCK = /(\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*"\s*\/>)+/;

export function renderHead(template: string, meta: RouteMeta): string {
  let html = template;

  html = html.replace(/<html lang="[^"]*">/, `<html lang="${meta.lang}">`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeText(meta.title)}</title>`);
  html = setMeta(html, 'name', 'description', meta.description);
  html = html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${escapeAttr(meta.canonical)}" />`,
  );

  const alternates = meta.alternates
    .map((a) => `\n    <link rel="alternate" hreflang="${a.hreflang}" href="${escapeAttr(a.href)}" />`)
    .join('');
  if (!HREFLANG_BLOCK.test(html)) {
    throw new Error('prerender-head: no hreflang block in index.html template');
  }
  html = html.replace(HREFLANG_BLOCK, alternates);

  html = setMeta(html, 'property', 'og:title', meta.ogTitle);
  html = setMeta(html, 'property', 'og:description', meta.description);
  html = setMeta(html, 'property', 'og:url', meta.canonical);
  html = setMeta(html, 'property', 'og:image', OG_IMAGE);
  html = setMeta(html, 'property', 'og:locale', meta.ogLocale);
  html = setMeta(html, 'property', 'og:locale:alternate', meta.ogLocaleAlternate);
  html = setMeta(html, 'name', 'twitter:title', meta.ogTitle);
  html = setMeta(html, 'name', 'twitter:description', meta.description);

  return html;
}

/**
 * dist-relative file path for a route: "/" -> index.html,
 * "/sakerhet" -> sakerhet/index.html. Joined with "/" rather than node:path so
 * this file stays free of node imports; these are always POSIX-style URL paths.
 */
export function outputPathFor(routePath: string): string {
  const clean = routePath.replace(/^\/+|\/+$/g, '');
  return clean ? `${clean}/index.html` : 'index.html';
}
