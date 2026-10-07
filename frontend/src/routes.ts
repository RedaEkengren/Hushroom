import type { Lang } from './landing-copy';

// Central route map for the bilingual marketing site.
// Swedish gets the clean paths, English lives under /en (docs/BUILD-PLAN-2026-08.md).
// Everything that builds a link between pages must go through pathFor() so the
// two languages can never drift apart.
export type PageKey =
  | 'landing'
  | 'howItWorks'
  | 'security'
  | 'pricing'
  | 'lawFirms'
  | 'about'
  | 'privacy'
  | 'terms';

export const ROUTES: Record<PageKey, Record<Lang, string>> = {
  landing: { sv: '/', en: '/en' },
  howItWorks: { sv: '/sa-fungerar-det', en: '/en/how-it-works' },
  security: { sv: '/sakerhet', en: '/en/security' },
  pricing: { sv: '/priser', en: '/en/pricing' },
  lawFirms: { sv: '/for-advokatbyraer', en: '/en/for-law-firms' },
  about: { sv: '/om-oss', en: '/en/about' },
  privacy: { sv: '/integritet', en: '/en/privacy' },
  terms: { sv: '/villkor', en: '/en/terms' },
};

/** Path for a page in a given language. */
export function pathFor(key: PageKey, lang: Lang): string {
  return ROUTES[key][lang];
}

/**
 * The old English-only paths. They stay alive as permanent redirects to their
 * /en equivalent so existing links, bookmarks and the previous sitemap keep
 * working.
 */
export const LEGACY_REDIRECTS: { from: string; to: string }[] = [
  { from: '/how-it-works', to: ROUTES.howItWorks.en },
  { from: '/security', to: ROUTES.security.en },
  { from: '/pricing', to: ROUTES.pricing.en },
  { from: '/for-law-firms', to: ROUTES.lawFirms.en },
  { from: '/about', to: ROUTES.about.en },
  { from: '/privacy', to: ROUTES.privacy.en },
  { from: '/terms', to: ROUTES.terms.en },
];

/** Reverse lookup: which page is this pathname, in either language? */
export function pageFromPath(pathname: string): PageKey | null {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') || '/' : pathname;
  for (const key of Object.keys(ROUTES) as PageKey[]) {
    if (ROUTES[key].sv === clean || ROUTES[key].en === clean) return key;
  }
  return null;
}

/**
 * Where the language switcher should point from the current location: the SAME
 * page in the other language. Falls back to the other language's landing page
 * for anything that is not a localised marketing page (rooms, admin, 404).
 */
export function otherLangPath(pathname: string, currentLang: Lang): string {
  const target: Lang = currentLang === 'sv' ? 'en' : 'sv';
  const page = pageFromPath(pathname);
  return page ? ROUTES[page][target] : ROUTES.landing[target];
}

/** Marketing routes whose top is a dark photo hero (white navbar text). */
export const DARK_HERO_PATHS: string[] = (
  ['landing', 'howItWorks', 'security', 'pricing', 'lawFirms', 'about'] as PageKey[]
).flatMap((key) => [ROUTES[key].sv, ROUTES[key].en]);
