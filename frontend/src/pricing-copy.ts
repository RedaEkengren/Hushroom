import type { Lang } from './landing-copy';

// Copy for /priser (sv) and /en/pricing (en). Tier names, prices and bullets
// come from pricing-data.ts via getTiers(lang).

export interface PricingCopy {
  title: string;
  heroAlt: string;
  heroTitle: string;
  heroSubtitle: string;

  createRoom: string;
  mostPopular: string;
  firmActive: string;
  trialActive: string;
  subscribeNow: (price: string) => string;
  getStarted: string;
  trialLabel: string;
  trialNote: string;

  faqHeading: string;
  faqs: { q: string; a: string }[];

  toasts: { trialStarted: string; trialFailed: string; checkoutFailed: string };
  verifyPlanLabel: string;

  cta: { heading: string; sub: string };
}

const sv: PricingCopy = {
  title: 'Priser',
  heroAlt: 'Kontorsfönster med utsikt över en stadssiluett',
  heroTitle: 'Enkla priser',
  heroSubtitle: 'Börja gratis. Uppgradera när ni behöver mer.',

  createRoom: 'Skapa rum',
  mostPopular: 'Populärast',
  firmActive: 'Organisationsplanen är aktiv',
  trialActive: 'Provperiod aktiv',
  subscribeNow: (price) => `Teckna nu (${price}/mån)`,
  getStarted: 'Kom igång →',
  trialLabel: 'Starta 14 dagars gratis provperiod',
  trialNote: 'Inget kort behövs',

  faqHeading: 'Vanliga frågor',
  faqs: [
    {
      q: 'Raderas datan på riktigt?',
      a: 'Ja. All rumsdata ligger i Redis (RAM) med strikt TTL. När rummet löper ut kastar Redis nyckeln automatiskt. Det finns ingen databas på disk, inga backuper, inga repliker. Vi kan inte återskapa raderad data ens om vi ville.',
    },
    {
      q: 'Tillämpas gränserna i Gratis idag?',
      a: 'Under early access tillämpar vi inga gränser: rum kan pågå upp till fyra timmar med upp till tolv deltagare även på Gratis. Priserna för Pro och Organisation gäller för när vi gör det, och för team som vill ha prioriterad support och en egen adress redan nu.',
    },
    {
      q: 'Vad händer när provperioden tar slut?',
      a: 'Kontot går tillbaka till Gratis (upp till fyra deltagare och rum upp till 60 minuter när gränserna väl tillämpas). Ingen data går förlorad, det finns ingenting att förlora eftersom rummen raderas automatiskt.',
    },
    {
      q: 'Krävs det avtal?',
      a: 'Nej. Pro löper månadsvis via Stripe och kan sägas upp när som helst från er Stripe-panel. Organisation löper också månadsvis men inkluderar hjälp med uppsättningen.',
    },
    {
      q: 'Kan vi gå från Pro till Organisation?',
      a: 'Ja. Hör av er så flyttar vi över prenumerationen. Organisationsplanen lägger till egen subdomän (dinorg.hushroom.io), adminvy, efterlevnadsdokumentation och hantering av medarbetare.',
    },
  ],

  toasts: {
    trialStarted: 'Provperioden på 14 dagar är igång. Obegränsat antal rum.',
    trialFailed: 'Kunde inte starta provperioden',
    checkoutFailed: 'Kunde inte starta betalningen',
  },
  verifyPlanLabel: 'Pro, 14 dagars gratis provperiod',

  cta: {
    heading: 'Prova gratis',
    sub: 'Skapa ett krypterat rum på ungefär tio sekunder. Inget kort behövs.',
  },
};

const en: PricingCopy = {
  title: 'Pricing',
  heroAlt: 'Office window overlooking a city skyline',
  heroTitle: 'Simple pricing',
  heroSubtitle: 'Start free. Upgrade when you need more.',

  createRoom: 'Create Room',
  mostPopular: 'Most popular',
  firmActive: 'Organisation plan active',
  trialActive: 'Trial active',
  subscribeNow: (price) => `Subscribe now (${price}/mo)`,
  getStarted: 'Get started →',
  trialLabel: 'Start 14-day free trial',
  trialNote: 'No credit card required',

  faqHeading: 'Frequently asked questions',
  faqs: [
    {
      q: 'Is data really deleted?',
      a: 'Yes. All room data lives in Redis (RAM) with a strict TTL. When the room expires, Redis evicts the key automatically. There is no disk database, no backups, no replicas. We cannot recover deleted data even if we wanted to.',
    },
    {
      q: 'Are the Free limits enforced today?',
      a: "During early access we don't enforce limits: rooms can run up to 4 hours with up to 12 participants on the Free tier. Pro and Organisation pricing is for when we do, and for teams that want priority support and branded workspaces now.",
    },
    {
      q: 'What happens after the trial ends?',
      a: 'Your account reverts to the Free tier (up to 4 participants, rooms up to 60 minutes once limits are enforced). No data is lost, there is nothing to lose since rooms auto-delete.',
    },
    {
      q: 'Do you require a contract?',
      a: 'No contract. Pro is month-to-month via Stripe. Cancel anytime from your Stripe dashboard. Organisation is also monthly but includes dedicated onboarding support.',
    },
    {
      q: 'Can I upgrade from Pro to Organisation?',
      a: "Yes. Contact us and we'll migrate your subscription. The Organisation plan adds a branded subdomain (yourorg.hushroom.io), admin dashboard, compliance documentation, and team member management.",
    },
  ],

  toasts: {
    trialStarted: '14-day Pro trial started! Enjoy unlimited rooms.',
    trialFailed: 'Failed to start trial',
    checkoutFailed: 'Failed to start checkout',
  },
  verifyPlanLabel: 'Pro – 14-day free trial',

  cta: {
    heading: 'Try it free',
    sub: 'Create an encrypted room in about 10 seconds. No credit card required.',
  },
};

export const PRICING_COPY: Record<Lang, PricingCopy> = { sv, en };
