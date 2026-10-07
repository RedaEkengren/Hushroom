// Single source of truth for tier copy. Consumed by PricingSection (landing),
// PricingPage (/pricing) and ForLawFirmsPage (Pro + Firm only). Change bullets
// or prices HERE, never inline in a page.
//
// NOTE: limits on the Free tier are *stated*, not enforced — enforcement was
// deliberately turned off in Sprint 14.4 (winrar model). See the Pricing FAQ.

export type TierId = 'free' | 'pro' | 'firm';

export interface TierCopy {
  id: TierId;
  name: string;
  price: string;      // e.g. "€0"
  period: string;     // e.g. "/month"
  tagline?: string;   // short audience line (used on ForLawFirmsPage)
  bullets: string[];
}

export const TIERS: Record<TierId, TierCopy> = {
  free: {
    id: 'free',
    name: 'Free',
    price: '€0',
    period: '/month',
    tagline: 'For trying it out and occasional rooms',
    bullets: [
      'Up to 4 participants',
      'Rooms up to 60 minutes',
      'E2EE chat, voice & video',
      'No account, no credit card',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: '€49',
    period: '/month',
    tagline: 'For solo practitioners and small teams',
    bullets: [
      'Unlimited rooms',
      'Up to 12 participants',
      'Up to 4 hours per room',
      'E2EE chat, voice & video',
      'Priority support',
    ],
  },
  firm: {
    id: 'firm',
    name: 'Organisation',
    price: '€149',
    period: '/month',
    tagline: 'For organisations that need their own branded space',
    bullets: [
      'Everything in Pro',
      'Branded subdomain (yourorg.hushroom.io)',
      'Admin dashboard + compliance reports',
      '10 team members',
      'Priority support',
    ],
  },
};

export const TRIAL_LABEL = 'Start 14-day free trial';
export const TRIAL_NOTE = 'No credit card required';

// Swedish tier copy for the localised landing page ("/"). Same ids, prices and
// Stripe wiring — only the display strings differ. The "Firm" tier is called
// "Organisation" towards the public-sector audience (see docs/GO-TO-MARKET-EU-ROOM.md).
const TIERS_SV: Record<TierId, TierCopy> = {
  free: {
    id: 'free',
    name: 'Gratis',
    price: '€0',
    period: '/mån',
    tagline: 'För att prova och för enstaka rum',
    bullets: [
      'Upp till 4 deltagare',
      'Rum upp till 60 minuter',
      'E2EE-chatt, röst och video',
      'Inget konto, inget kort',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: '€49',
    period: '/mån',
    tagline: 'För enskilda handläggare och små team',
    bullets: [
      'Obegränsat antal rum',
      'Upp till 12 deltagare',
      'Upp till 4 timmar per rum',
      'E2EE-chatt, röst och video',
      'Prioriterad support',
    ],
  },
  firm: {
    id: 'firm',
    name: 'Organisation',
    price: '€149',
    period: '/mån',
    tagline: 'För organisationer som vill ha en egen adress',
    bullets: [
      'Allt i Pro',
      'Egen subdomän (dinorg.hushroom.io)',
      'Adminvy + efterlevnadsrapport',
      '10 medarbetare',
      'Prioriterad support',
    ],
  },
};

export function getTiers(lang: 'sv' | 'en'): Record<TierId, TierCopy> {
  return lang === 'sv' ? TIERS_SV : TIERS;
}
