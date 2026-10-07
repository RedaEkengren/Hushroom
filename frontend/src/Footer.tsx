import { Link, useLocation } from 'react-router-dom';
import { Globe2 } from 'lucide-react';
import { langFromPath, LANDING_COPY } from './landing-copy';
import { pathFor } from './routes';

export function Footer() {
  const lang = langFromPath(useLocation().pathname);
  const copy = LANDING_COPY[lang];
  const { nav } = copy;

  const links = [
    { to: pathFor('howItWorks', lang), label: nav.howItWorks },
    { to: pathFor('security', lang), label: nav.security },
    { to: pathFor('pricing', lang), label: nav.pricing },
    { to: pathFor('privacy', lang), label: nav.privacy },
    { to: pathFor('terms', lang), label: nav.terms },
    { to: pathFor('lawFirms', lang), label: nav.lawFirms },
    { to: pathFor('about', lang), label: nav.about },
  ];

  return (
    <footer className="py-16 bg-white/80 backdrop-blur-sm border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-8">
            <img src="/logo.webp" alt="Hushroom" className="h-10 w-auto mx-auto mb-3" />
            <p className="text-lg text-gray-700 font-medium mb-2">{copy.footer.tagline}</p>
            <div className="flex items-center justify-center gap-2 text-emerald-600">
              <Globe2 size={18} />
              <span className="text-sm font-medium">hushroom.io</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-sm">
            {links.map((l, i) => (
              <div key={l.to} className="flex items-center gap-6">
                <Link to={l.to} className="text-gray-600 hover:text-emerald-600 transition-colors duration-200 font-medium">
                  {l.label}
                </Link>
                {i < links.length - 1 && <span className="text-gray-300">&middot;</span>}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-500">
              {copy.footer.copyright}
              {' · '}
              <a href="mailto:hello@hushroom.io" className="text-emerald-600 hover:text-emerald-700">hello@hushroom.io</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
