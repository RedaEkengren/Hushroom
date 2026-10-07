import type { ReactNode } from 'react';

// Full-bleed photo hero used at the top of the marketing sub-pages
// (/how-it-works, /security, /pricing, /for-law-firms, /about). The photo
// sits under a dark green→black overlay so the white h1/subtitle stay AA
// readable regardless of the image. Images live in /public/img (see
// /public/img/CREDITS.md — Unsplash License).
export interface PageHeroProps {
  image: string;            // e.g. "/img/security-frosted-person.webp"
  alt: string;
  title: ReactNode;         // rendered inside <h1>
  subtitle?: ReactNode;
  eyebrow?: string;         // small uppercase label above the title
  children?: ReactNode;     // optional CTA row under the subtitle
  /** 'tall' for the landing page, 'default' for sub-pages */
  size?: 'default' | 'tall';
  /** Prioritise the image (landing hero) */
  priority?: boolean;
}

export function PageHero({ image, alt, title, subtitle, eyebrow, children, size = 'default', priority = false }: PageHeroProps) {
  const heightClass = size === 'tall'
    ? 'min-h-[520px] md:min-h-[640px] py-24 md:py-32'
    : 'min-h-[260px] md:min-h-[360px] py-16 md:py-20';
  return (
    <header className={`relative overflow-hidden flex items-center ${heightClass} -mt-16 pt-16`}>
      <img
        src={image}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
      />
      {/* overlay: keeps contrast for white text, tints toward brand green */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(4,32,24,0.62) 0%, rgba(4,32,24,0.78) 60%, rgba(3,24,18,0.9) 100%)' }}
      />
      <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300 mb-4">{eyebrow}</p>
        )}
        <h1 className={`font-bold tracking-tight mb-4 ${size === 'tall' ? 'text-5xl md:text-6xl' : 'text-4xl md:text-5xl'}`}>
          {title}
        </h1>
        {subtitle && (
          <div className={`text-emerald-50/90 max-w-2xl mx-auto ${size === 'tall' ? 'text-xl md:text-2xl' : 'text-lg'}`}>
            {subtitle}
          </div>
        )}
        {children}
      </div>
    </header>
  );
}
