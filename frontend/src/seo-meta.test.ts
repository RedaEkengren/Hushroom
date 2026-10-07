import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SEO_ROUTES, flattenRich } from './seo-meta';
import { renderHead, outputPathFor } from './seo-head';

// The prerender step rewrites the real index.html template, so these tests run
// against that template rather than a fixture: if someone edits index.html in a
// way the rewriter cannot handle, this fails instead of shipping a wrong <head>.
const template = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');

const bySlug = (path: string) => {
  const route = SEO_ROUTES.find((r) => r.path === path);
  if (!route) throw new Error(`no SEO route for ${path}`);
  return route;
};

describe('prerendered head', () => {
  it('renders a Swedish sub-page with its own title, description and canonical', () => {
    const html = renderHead(template, bySlug('/sakerhet'));

    expect(html).toContain('<html lang="sv">');
    expect(html).toContain('<title>Säkerhet · Hushroom</title>');
    expect(html).toContain('<link rel="canonical" href="https://hushroom.io/sakerhet" />');
    expect(html).toContain('hreflang="sv" href="https://hushroom.io/sakerhet"');
    expect(html).toContain('hreflang="en" href="https://hushroom.io/en/security"');
    expect(html).toContain('hreflang="x-default" href="https://hushroom.io/sakerhet"');
    expect(html).toContain('<meta property="og:locale" content="sv_SE" />');
    expect(html).toContain('<meta property="og:url" content="https://hushroom.io/sakerhet" />');
    // description comes from the page's own hero subtitle, quotes escaped
    expect(html).toContain('content="Zero knowledge genom design.');
    expect(html).toContain('&quot;vill inte&quot;');
    // the landing page's copy must not leak into a sub-page
    expect(html).not.toContain('Krypterat mötesrum utan konto | Hostat i Sverige');
  });

  it('renders the English counterpart of the same page', () => {
    const html = renderHead(template, bySlug('/en/security'));

    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<title>Security · Hushroom</title>');
    expect(html).toContain('<link rel="canonical" href="https://hushroom.io/en/security" />');
    expect(html).toContain('<meta property="og:locale" content="en_GB" />');
    expect(html).toContain('<meta property="og:locale:alternate" content="sv_SE" />');
    expect(html).toContain('Zero-knowledge design.');
  });

  it('covers all 16 marketing routes with unique paths and non-empty metadata', () => {
    expect(SEO_ROUTES).toHaveLength(16);
    expect(new Set(SEO_ROUTES.map((r) => r.path)).size).toBe(16);

    for (const route of SEO_ROUTES) {
      expect(route.title.trim(), route.path).not.toBe('');
      expect(route.description.trim(), route.path).not.toBe('');
      expect(route.canonical, route.path).toBe(`https://hushroom.io${route.path}`);
      expect(route.alternates, route.path).toHaveLength(3);
    }
  });

  it('never prerenders rooms, admin or the firm wizard', () => {
    const paths = SEO_ROUTES.map((r) => r.path);
    for (const secret of ['/r/', '/admin', '/get-started/firm', '/firm-welcome']) {
      expect(paths.some((p) => p.startsWith(secret))).toBe(false);
    }
  });

  it('maps route paths to the right file on disk', () => {
    expect(outputPathFor('/')).toBe('index.html');
    expect(outputPathFor('/sakerhet')).toBe('sakerhet/index.html');
    expect(outputPathFor('/en/security')).toBe('en/security/index.html');
  });

  it('keeps em dashes out of the generated metadata', () => {
    for (const route of SEO_ROUTES) {
      expect(route.title, route.path).not.toContain('—');
      expect(route.description, route.path).not.toContain('—');
      expect(route.ogTitle, route.path).not.toContain('—');
    }
  });

  it('flattens rich text to plain metadata text', () => {
    expect(flattenRich(['a ', { b: 'bold' }, ' c'])).toBe('a bold c');
    expect(flattenRich(['x ', { link: 'here', href: 'mailto:a@b.c' }])).toBe('x here');
    expect(flattenRich('already plain')).toBe('already plain');
  });
});
