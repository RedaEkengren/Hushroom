import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useLayoutContext } from './LayoutContext';

export function Layout() {
  const { hideLayout } = useLayoutContext();
  const { pathname, hash } = useLocation();

  // Scroll to top on route change, or to the #anchor when the link carries
  // one (for example /sakerhet#legal from How-it-works / For Law Firms). The
  // target page is lazy-loaded, so retry briefly until the element exists.
  // Room links carry #key=<hex>, never a DOM id, so that falls through to top.
  useEffect(() => {
    const id = hash.startsWith('#') ? hash.slice(1) : '';
    if (!id || id.startsWith('key=')) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return;
    }
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        const navOffset = 72; // fixed navbar height
        const top = el.getBoundingClientRect().top + window.scrollY - navOffset;
        window.scrollTo({ top, left: 0, behavior: 'instant' });
      } else if (attempts++ < 20) {
        timer = setTimeout(tryScroll, 50);
      }
    };
    tryScroll();
    return () => { if (timer) clearTimeout(timer); };
  }, [pathname, hash]);

  return (
    <>
      {!hideLayout && <Navbar />}
      <Outlet />
      {!hideLayout && <Footer />}
    </>
  );
}
