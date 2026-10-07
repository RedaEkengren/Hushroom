import { useEffect } from 'react';

// The landing page keeps the full SEO title from index.html; every other
// route sets "<Page> · Hushroom" while mounted and restores the previous
// title on unmount (so navigating back to "/" shows the landing title again).
export const BASE_TITLE = 'Hushroom';

export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

// The marketing site is bilingual (sv on the clean paths, en under /en), so
// <html lang> has to follow the route rather than sit fixed in index.html.
export function useHtmlLang(lang: string) {
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [lang]);
}
