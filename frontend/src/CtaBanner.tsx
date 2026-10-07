import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Lang } from './landing-copy';
import { pathFor } from './routes';

// Dark photo CTA banner shown right before the footer on the landing page
// and the marketing sub-pages (TrackOne-style "Har du ett projekt?" block).
// Primary action either navigates (primaryTo) or calls a handler (onPrimary:
// the landing page uses this to open the email-verify / create-room flow).
export interface CtaBannerProps {
  lang?: Lang;
  heading?: string;
  sub?: string;
  primaryLabel?: string;
  primaryTo?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  secondaryTo?: string;      // internal route or mailto:/https: link
}

const DEFAULTS: Record<Lang, { heading: string; sub: string; primary: string; secondary: string }> = {
  sv: {
    heading: 'Redo för ett samtal som inte lämnar spår?',
    sub: 'Skapa ett krypterat rum på ungefär tio sekunder. Motparten behöver inget konto.',
    primary: 'Skapa rum',
    secondary: 'Så fungerar det',
  },
  en: {
    heading: 'Ready for a conversation that leaves no trace?',
    sub: 'Create an encrypted room in about 10 seconds. No sign-up for participants.',
    primary: 'Create Instant Room',
    secondary: 'How it works',
  },
};

export function CtaBanner({
  lang = 'en',
  heading,
  sub,
  primaryLabel,
  primaryTo,
  onPrimary,
  secondaryLabel,
  secondaryTo,
}: CtaBannerProps) {
  const d = DEFAULTS[lang];
  const resolvedHeading = heading ?? d.heading;
  const resolvedSub = sub ?? d.sub;
  const resolvedPrimaryLabel = primaryLabel ?? d.primary;
  const resolvedPrimaryTo = primaryTo ?? pathFor('landing', lang);
  const resolvedSecondaryLabel = secondaryLabel ?? d.secondary;
  const resolvedSecondaryTo = secondaryTo ?? pathFor('howItWorks', lang);

  const primaryClass =
    'inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3.5 px-8 rounded-xl transition-colors duration-200 shadow-lg shadow-emerald-900/40';
  const secondaryClass =
    'inline-flex items-center gap-2 border border-white/60 text-white font-semibold py-3.5 px-8 rounded-xl hover:bg-white/10 transition-colors duration-200';
  const secondaryIsExternal = /^(mailto:|https?:)/.test(resolvedSecondaryTo);

  return (
    <section className="relative overflow-hidden" aria-labelledby="cta-banner-heading">
      <img
        src="/img/cta-office-night.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(3,24,18,0.78) 0%, rgba(4,32,24,0.86) 100%)' }}
      />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center text-white">
        <h2 id="cta-banner-heading" className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{resolvedHeading}</h2>
        <p className="text-lg text-emerald-50/85 mb-10 max-w-2xl mx-auto">{resolvedSub}</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {onPrimary ? (
            <button type="button" onClick={onPrimary} className={primaryClass}>
              {resolvedPrimaryLabel}
              <ArrowRight size={18} />
            </button>
          ) : (
            <Link to={resolvedPrimaryTo} className={primaryClass}>
              {resolvedPrimaryLabel}
              <ArrowRight size={18} />
            </Link>
          )}
          {resolvedSecondaryLabel && (
            secondaryIsExternal ? (
              <a href={resolvedSecondaryTo} className={secondaryClass}>{resolvedSecondaryLabel}</a>
            ) : (
              <Link to={resolvedSecondaryTo} className={secondaryClass}>{resolvedSecondaryLabel}</Link>
            )
          )}
        </div>
      </div>
    </section>
  );
}
