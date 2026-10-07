import type { Lang } from './landing-copy';
import type { RichText } from './rich-text';
import { LANDING_COPY } from './landing-copy';
import { SECURITY_COPY } from './security-copy';
import { HOW_COPY } from './how-copy';
import { PRICING_COPY } from './pricing-copy';
import { LAWFIRMS_COPY } from './lawfirms-copy';
import { ABOUT_COPY } from './about-copy';
import { PRIVACY_COPY } from './privacy-copy';
import { TERMS_COPY } from './terms-copy';
import { ROUTES, type PageKey } from './routes';
import { BASE_TITLE } from './usePageTitle';

// Per-route <head> metadata, derived from the copy files rather than written
// twice. The prerender step (vite.config.ts) turns this into one static
// index.html per route so link previews and crawlers that do not run
// JavaScript see the right title and description. See docs/BUILD-PLAN-2026-08.md.

export const SITE_ORIGIN = 'https://hushroom.io';
export const OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

const OG_LOCALE: Record<Lang, string> = { sv: 'sv_SE', en: 'en_GB' };

/** Flatten a RichText paragraph to plain text for use in a meta tag. */
export function flattenRich(parts: RichText | string): string {
  if (typeof parts === 'string') return parts;
  return parts
    .map((p) => {
      if (typeof p === 'string') return p;
      if ('b' in p) return p.b;
      if ('i' in p) return p.i;
      if ('code' in p) return p.code;
      return p.link;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface RouteMeta {
  key: PageKey;
  lang: Lang;
  path: string;
  /** Full <title>, exactly what usePageTitle sets at runtime. */
  title: string;
  description: string;
  ogTitle: string;
  ogLocale: string;
  ogLocaleAlternate: string;
  canonical: string;
  /** hreflang alternates for this page: sv, en and x-default. */
  alternates: { hreflang: string; href: string }[];
}

/** Sub-pages: title comes from copy.title, the same string usePageTitle uses. */
function subPage(
  key: Exclude<PageKey, 'landing'>,
  lang: Lang,
  copy: { title: string; heroTitle: string; heroSubtitle: RichText | string },
): RouteMeta {
  return {
    key,
    lang,
    path: ROUTES[key][lang],
    title: `${copy.title} · ${BASE_TITLE}`,
    description: flattenRich(copy.heroSubtitle),
    ogTitle: `${copy.heroTitle} · ${BASE_TITLE}`,
    ogLocale: OG_LOCALE[lang],
    ogLocaleAlternate: OG_LOCALE[lang === 'sv' ? 'en' : 'sv'],
    canonical: `${SITE_ORIGIN}${ROUTES[key][lang]}`,
    alternates: alternatesFor(key),
  };
}

function alternatesFor(key: PageKey): { hreflang: string; href: string }[] {
  return [
    { hreflang: 'sv', href: `${SITE_ORIGIN}${ROUTES[key].sv}` },
    { hreflang: 'en', href: `${SITE_ORIGIN}${ROUTES[key].en}` },
    { hreflang: 'x-default', href: `${SITE_ORIGIN}${ROUTES[key].sv}` },
  ];
}

function landing(lang: Lang): RouteMeta {
  const c = LANDING_COPY[lang];
  return {
    key: 'landing',
    lang,
    path: ROUTES.landing[lang],
    // The landing keeps its full SEO title (no " · Hushroom" suffix), matching
    // HushroomLandingPage which sets document.title = copy.documentTitle.
    title: c.documentTitle,
    description: `${c.hero.sub1} ${c.hero.sub2}`,
    ogTitle: `${BASE_TITLE} – ${c.hero.line1} ${c.hero.line2}`,
    ogLocale: OG_LOCALE[lang],
    ogLocaleAlternate: OG_LOCALE[lang === 'sv' ? 'en' : 'sv'],
    canonical: `${SITE_ORIGIN}${ROUTES.landing[lang]}`,
    alternates: alternatesFor('landing'),
  };
}

const LANGS: Lang[] = ['sv', 'en'];

/** All 16 prerenderable marketing routes. Rooms, admin and the firm wizard are
 *  deliberately absent: they are private, stateful or ephemeral. */
export const SEO_ROUTES: RouteMeta[] = [
  ...LANGS.map(landing),
  ...LANGS.map((l) => subPage('howItWorks', l, HOW_COPY[l])),
  ...LANGS.map((l) => subPage('security', l, SECURITY_COPY[l])),
  ...LANGS.map((l) => subPage('pricing', l, PRICING_COPY[l])),
  ...LANGS.map((l) => subPage('lawFirms', l, LAWFIRMS_COPY[l])),
  ...LANGS.map((l) => subPage('about', l, ABOUT_COPY[l])),
  ...LANGS.map((l) => subPage('privacy', l, PRIVACY_COPY[l])),
  ...LANGS.map((l) => subPage('terms', l, TERMS_COPY[l])),
];
