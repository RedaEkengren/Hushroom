import { Link } from 'react-router-dom';
import type { Lang } from './landing-copy';

// Language switcher in the benbo.se / smartkarni style: a single small link
// showing the flag of the language you would switch TO (crisp inline SVG, not
// an emoji, because emoji flags render inconsistently on Windows). Shown on
// every localised marketing page; the parent passes `to` so it links to the
// SAME page in the other language (see otherLangPath in routes.ts).
export const Flag = ({ lang, className = 'w-6 h-auto' }: { lang: Lang; className?: string }) =>
  lang === 'sv' ? (
    <svg viewBox="0 0 16 10" className={`${className} rounded-[2px] shadow-sm ring-1 ring-black/10`} aria-hidden="true">
      <rect width="16" height="10" fill="#006AA7" />
      <rect x="5" width="2" height="10" fill="#FECC00" />
      <rect y="4" width="16" height="2" fill="#FECC00" />
    </svg>
  ) : (
    <svg viewBox="0 0 60 30" className={`${className} rounded-[2px] shadow-sm ring-1 ring-black/10`} aria-hidden="true">
      <clipPath id="hr-uk-clip"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
      <clipPath id="hr-uk-tri"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
      <g clipPath="url(#hr-uk-clip)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#hr-uk-tri)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );

export interface LanguageSwitcherProps {
  /** currently active language */
  active: Lang;
  /** where to go: the same page in the other language */
  to: string;
  /** dark = sitting on the photo hero (white text), light = solid white navbar */
  tone?: 'dark' | 'light';
  /** mobile = larger tap target next to the hamburger */
  variant?: 'inline' | 'mobile';
  onNavigate?: () => void;
}

export function LanguageSwitcher({ active, to, tone = 'light', variant = 'inline', onNavigate }: LanguageSwitcherProps) {
  const target: Lang = active === 'sv' ? 'en' : 'sv';
  const label = target === 'en' ? 'Switch to English' : 'Byt till svenska';

  const base = 'inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors';
  const toneClass = tone === 'dark'
    ? 'text-white/85 hover:text-white hover:bg-white/10'
    : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50';
  const sizeClass = variant === 'mobile'
    ? 'min-h-11 min-w-11 justify-center px-2 text-xs'
    : 'px-2 py-1 text-xs';

  return (
    <Link to={to} onClick={onNavigate} aria-label={label} title={label} className={`${base} ${toneClass} ${sizeClass}`}>
      <Flag lang={target} className={variant === 'mobile' ? 'w-7 h-auto' : 'w-6 h-auto'} />
      <span className="uppercase tracking-wide">{target}</span>
    </Link>
  );
}
