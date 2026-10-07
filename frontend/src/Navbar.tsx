import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { langFromPath, LANDING_COPY } from './landing-copy';
import { LanguageSwitcher } from './LanguageSwitcher';
import { pathFor, otherLangPath, pageFromPath, DARK_HERO_PATHS } from './routes';

export function Navbar() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [navMobileOpen, setNavMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setNavMobileOpen(false);
  }, [location.pathname]);

  const activeLang = langFromPath(location.pathname);
  const nav = LANDING_COPY[activeLang].nav;
  // The whole marketing site is localised, so the switcher is shown on every
  // localised page and points at the SAME page in the other language.
  const isMarketingPage = pageFromPath(location.pathname) !== null;
  const switchTo = otherLangPath(location.pathname, activeLang);

  // Pages whose top is a dark photo hero (PageHero / LandingHero): use white
  // nav text until the user scrolls and the bar turns solid white.
  const onDark = !navScrolled && DARK_HERO_PATHS.includes(location.pathname);
  const linkClass = `transition-colors ${onDark ? 'text-white/85 hover:text-white' : navScrolled ? 'text-gray-700 hover:text-emerald-600' : 'text-gray-600 hover:text-emerald-600'}`;

  const links = [
    { to: pathFor('howItWorks', activeLang), label: nav.howItWorks },
    { to: pathFor('security', activeLang), label: nav.security },
    { to: pathFor('pricing', activeLang), label: nav.pricing },
    { to: pathFor('lawFirms', activeLang), label: nav.lawFirms },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${navScrolled ? 'bg-white/90 backdrop-blur shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link to={pathFor('landing', activeLang)} className="flex items-center gap-2">
          <img src="/logo.webp" alt="Hushroom" className="h-8 w-auto rounded-xl" />
          <span className={`font-bold text-lg ${onDark ? 'text-white' : navScrolled ? 'text-gray-900' : 'text-gray-800'}`}>Hushroom</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={linkClass}>{l.label}</Link>
          ))}
          {isMarketingPage && (
            <LanguageSwitcher active={activeLang} to={switchTo} tone={onDark ? 'dark' : 'light'} />
          )}
        </div>

        {/* Mobile: language flag + hamburger to X animated */}
        <div className="md:hidden flex items-center gap-1">
          {isMarketingPage && (
            <LanguageSwitcher
              active={activeLang}
              to={switchTo}
              tone={onDark && !navMobileOpen ? 'dark' : 'light'}
              variant="mobile"
            />
          )}
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-white/20 transition-colors relative w-10 h-10 flex items-center justify-center"
            aria-label={navMobileOpen ? nav.closeMenu : nav.openMenu}
            onClick={() => setNavMobileOpen(v => !v)}
          >
            <span className="block absolute w-5">
              <span className={`block h-0.5 rounded-full transition-all duration-300 ease-in-out ${navMobileOpen || navScrolled ? 'bg-gray-800' : onDark ? 'bg-white' : 'bg-gray-600'} ${navMobileOpen ? 'rotate-45 translate-y-[5px]' : ''}`} />
              <span className={`block h-0.5 rounded-full transition-all duration-300 ease-in-out mt-[4px] ${navMobileOpen || navScrolled ? 'bg-gray-800' : onDark ? 'bg-white' : 'bg-gray-600'} ${navMobileOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block h-0.5 rounded-full transition-all duration-300 ease-in-out mt-[4px] ${navMobileOpen || navScrolled ? 'bg-gray-800' : onDark ? 'bg-white' : 'bg-gray-600'} ${navMobileOpen ? '-rotate-45 -translate-y-[5px]' : ''}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile slide-down drawer */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${navMobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-gray-900/95 backdrop-blur-lg px-6 py-6 space-y-1">
          {links.map((l, i) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setNavMobileOpen(false)}
              className={`flex items-center justify-between w-full py-3 text-white/90 hover:text-emerald-400 transition-colors text-base font-medium ${i < links.length - 1 ? 'border-b border-white/10' : ''}`}
            >
              {l.label}
              <ArrowRight size={16} className="text-white/30" />
            </Link>
          ))}
          <Link
            to={pathFor('landing', activeLang)}
            onClick={() => setNavMobileOpen(false)}
            className="block w-full mt-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 text-sm text-center"
          >
            {nav.createRoom}
          </Link>
        </div>
      </div>
    </nav>
  );
}
