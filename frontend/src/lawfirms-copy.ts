import type { Lang } from './landing-copy';

// Copy for /for-advokatbyraer (sv) and /en/for-law-firms (en).

export type Tone = 'good' | 'warn' | 'bad' | 'na';

export interface LawFirmsCopy {
  title: string;
  heroAlt: string;
  heroTitle: string;
  heroSubtitle: string;

  problem: {
    heading: string;
    intro: string;
    cards: { title: string; text: string }[];
  };

  compare: {
    heading: string;
    intro: string;
    columns: { feature: string; hushroom: string; teams: string; signal: string; phone: string };
    rows: {
      feature: string;
      hushroom: string;
      teams: string; teamsTone: Tone;
      signal: string; signalTone: Tone;
      phone: string; phoneTone: Tone;
    }[];
  };

  how: { heading: string; steps: { title: string; text: string }[] };

  disclosure: { heading: string; body: string; link: string };

  features: { heading: string; intro: string; cards: { title: string; text: string }[] };

  pricing: { heading: string; recommended: string; trialBullet: string; startTrial: string; getStarted: string };

  cta: { sub: string; secondaryLabel: string };
}

const sv: LawFirmsCopy = {
  title: 'För advokatbyråer',
  heroAlt: 'Person vid ett bord i ett dunkelt rum med en stadssiluett bakom',
  heroTitle: 'För advokatbyråer',
  heroSubtitle: 'Det säkra rummet för samtalet före uppdragsavtalet. Inga konton, inga loggar, inga spår.',

  problem: {
    heading: 'Samtalen som inte ska lämna spår',
    intro: 'Varje dag har jurister samtal som inte ska lämna ett digitalt fotavtryck. Ni har redan Teams för allt som ska dokumenteras. Hushroom är för allt som inte ska det.',
    cards: [
      { title: 'Före uppdragsavtalet', text: 'En möjlig klient hör av sig och vill beskriva sin situation innan något uppdrag är formaliserat. Det samtalet ska inte loggas på byråns servrar.' },
      { title: 'Före sekretessavtalet', text: 'Två rådgivare sonderar om en affär är värd att driva. Samtalet måste ske innan något papper existerar.' },
      { title: 'Känslig strategi', text: 'Kollegor som diskuterar processtrategi utanför protokollet. Ingen risk vid edition. Ingen administratör med tillgång till utskrifter. Inget att begära ut.' },
    ],
  },

  compare: {
    heading: 'Varför inte bara Teams, Signal eller ett telefonsamtal?',
    intro: 'Befintliga verktyg loggar allt, kräver konton eller saknar kryptering. Hushroom är det enda alternativet som kombinerar alla tre.',
    columns: { feature: 'Funktion', hushroom: 'Hushroom', teams: 'Teams / Zoom', signal: 'Signal', phone: 'Telefonsamtal' },
    rows: [
      { feature: 'Konto krävs inte', hushroom: '✓ Klicka på en länk', teams: '✗', teamsTone: 'bad', signal: '✗ Telefonnummer krävs', signalTone: 'bad', phone: '~ Nummer syns', phoneTone: 'warn' },
      { feature: 'Krypterat hela vägen', hushroom: '✓ Text, röst och video', teams: '✗', teamsTone: 'bad', signal: '✓', signalTone: 'good', phone: '✗', phoneTone: 'bad' },
      { feature: 'Raderas automatiskt', hushroom: '✓ Alltid, max 4 h', teams: '✗ Loggar allt', teamsTone: 'bad', signal: '~ Valfritt', signalTone: 'warn', phone: '✗ Samtalslistor sparas', phoneTone: 'bad' },
      { feature: 'Inga serverloggar', hushroom: '✓ Inga personuppgifter loggas', teams: '✗ Full loggning', teamsTone: 'bad', signal: '~ Minimal metadata', signalTone: 'warn', phone: '✗ Operatörens metadata', phoneTone: 'bad' },
      { feature: 'Administratör kan läsa chattar', hushroom: 'Nej (zero knowledge)', teams: 'Ja (edition)', teamsTone: 'bad', signal: 'Nej', signalTone: 'good', phone: 'Ej tillämpligt', phoneTone: 'na' },
    ],
  },

  how: {
    heading: 'Så fungerar det för er byrå',
    steps: [
      { title: 'Skapa ett rum', text: 'Verifiera er e-post en gång. Välj längd och deltagargräns. Tar ungefär tio sekunder. Ingen programvara att installera.' },
      { title: 'Skicka länken', text: 'Dela länken med klienten eller kollegan. De klickar och är inne direkt. Ingen app, ingen registrering, inget konto.' },
      { title: 'Prata fritt', text: 'Text, röst eller video. Allt är krypterat hela vägen. När tiden går ut raderas all data permanent.' },
    ],
  },

  disclosure: {
    heading: 'Vad som kan lämnas ut',
    body: 'Om er byrå får en begäran om edition, eller om Hushroom får ett domstolsbeslut, är svaret kort: vi kan bekräfta att ett rum har funnits, ungefär när det skapades och hur många som anslöt. Vi kan inte lämna ut meddelandeinnehåll, inspelningar, krypteringsnycklar, deltagares identiteter eller IP-adresser. Ingenting av det når oss. Krypteringsnyckeln ligger i URL-fragmentet, som webbläsare aldrig skickar till servern. Det är tekniska begränsningar, inte löften i en policy.',
    link: 'Se exakt vad vi kan och inte kan lämna ut',
  },

  features: {
    heading: 'Vad organisationsplanen ger',
    intro: 'Byggt för byråer som behöver integritetsinfrastruktur, inte bara ett chattverktyg.',
    cards: [
      { title: 'Egen subdomän', text: 'erbyra.hushroom.io med er egen profil. Klienten ser er identitet, inte vår.' },
      { title: 'Adminvy', text: 'Överblick över rumsaktivitet och efterlevnadsrapporter. Se användningen utan att se innehållet.' },
      { title: '10 medarbetare', text: 'Ert team skapar rum under byråns subdomän. En samlad faktura.' },
      { title: 'Obegränsat antal rum', text: 'Ingen gräns för aktiva rum. Upp till tolv deltagare per rum och fyra timmar per session.' },
      { title: 'Zero knowledge', text: 'Samma kryptering som i alla planer. Inte ens som administratör kan ni läsa innehållet i rummen.' },
      { title: 'Driftat i EU', text: 'Egen drift i Sverige. Ingen amerikansk molnleverantör i dataflödet. Uppfyller dataskyddsförordningen.' },
    ],
  },

  pricing: {
    heading: 'Priser för advokatbyråer',
    recommended: 'REKOMMENDERAS',
    trialBullet: '14 dagars gratis provperiod',
    startTrial: 'Starta provperioden',
    getStarted: 'Kom igång',
  },

  cta: {
    sub: 'Skapa ett krypterat rum på ungefär tio sekunder. Klienten klickar bara på en länk.',
    secondaryLabel: 'Sätt upp er byrås arbetsyta',
  },
};

const en: LawFirmsCopy = {
  title: 'For Law Firms',
  heroAlt: 'Person at a table in a dim room with a city skyline behind',
  heroTitle: 'For Law Firms',
  heroSubtitle: 'The secure room for the conversation before the engagement letter. No accounts, no logs, no trace.',

  problem: {
    heading: "The conversations that shouldn't leave a trace",
    intro: "Every day, legal professionals have conversations that shouldn't leave a digital footprint. You already have Teams for everything that needs to be documented. Hushroom is for everything that doesn't.",
    cards: [
      { title: 'Before the engagement letter', text: "A potential client calls. They want to describe their situation before a formal engagement. That conversation shouldn't be logged on your firm's servers." },
      { title: 'Before the NDA', text: 'Two M&A advisors exploring whether a deal is worth pursuing. The conversation needs to happen before any paperwork exists.' },
      { title: 'Sensitive strategy', text: 'Colleagues discussing case strategy off the record. No e-discovery risk. No admin access to transcripts. Nothing to subpoena.' },
    ],
  },

  compare: {
    heading: 'Why not Teams, Signal, or a phone call?',
    intro: 'Every existing tool either logs everything, requires accounts, or lacks encryption. Hushroom is the only option that combines all three.',
    columns: { feature: 'Feature', hushroom: 'Hushroom', teams: 'Teams / Zoom', signal: 'Signal', phone: 'Phone call' },
    rows: [
      { feature: 'No account needed', hushroom: '✓ Click a link', teams: '✗', teamsTone: 'bad', signal: '✗ Phone # required', signalTone: 'bad', phone: '~ Caller ID visible', phoneTone: 'warn' },
      { feature: 'E2E encrypted', hushroom: '✓ Text + voice + video', teams: '✗', teamsTone: 'bad', signal: '✓', signalTone: 'good', phone: '✗', phoneTone: 'bad' },
      { feature: 'Auto-delete', hushroom: '✓ Enforced, max 4h', teams: '✗ Logs everything', teamsTone: 'bad', signal: '~ Optional', signalTone: 'warn', phone: '✗ CDR retained', phoneTone: 'bad' },
      { feature: 'No server logs', hushroom: '✓ Zero PII logged', teams: '✗ Full logging', teamsTone: 'bad', signal: '~ Minimal metadata', signalTone: 'warn', phone: '✗ Carrier metadata', phoneTone: 'bad' },
      { feature: 'Admin can read chats', hushroom: 'No (zero-knowledge)', teams: 'Yes (e-discovery)', teamsTone: 'bad', signal: 'No', signalTone: 'good', phone: 'N/A', phoneTone: 'na' },
    ],
  },

  how: {
    heading: 'How it works for your firm',
    steps: [
      { title: 'Create a room', text: 'Verify your email once. Pick a duration and participant limit. Takes about 10 seconds. No software to install.' },
      { title: 'Send the link', text: 'Share the link with your client or colleague. They click and join instantly. No app, no sign-up, no account.' },
      { title: 'Talk freely', text: 'Text, voice, or video. Everything is end-to-end encrypted. When the timer runs out, all data is permanently deleted.' },
    ],
  },

  disclosure: {
    heading: 'What can be disclosed',
    body: 'If your firm receives a disclosure request, or Hushroom receives a court order or subpoena, the answer is short: we can confirm that a room existed, roughly when it was created and how many people joined. We cannot provide message content, recordings, encryption keys, participant identities or IP addresses. None of it ever reaches us. The encryption key lives in the URL fragment, which browsers never send to the server. These are technical limitations, not policy promises.',
    link: 'See exactly what we can and cannot disclose',
  },

  features: {
    heading: 'Organisation plan features',
    intro: 'Purpose-built for law firms that need privacy infrastructure, not just a chat tool.',
    cards: [
      { title: 'Branded subdomain', text: 'yourfirm.hushroom.io with your branding. Clients see your identity, not ours.' },
      { title: 'Admin dashboard', text: 'Room activity overview and compliance reports. See usage stats without seeing content.' },
      { title: '10 team members', text: "Your team creates rooms under the firm's subdomain. Centralized billing." },
      { title: 'Unlimited rooms', text: 'No cap on active rooms. Up to 12 participants per room, up to 4 hours per session.' },
      { title: 'Zero-knowledge', text: 'Same E2E encryption as all plans. Even as admin, you cannot read room contents.' },
      { title: 'EU hosted', text: 'Self-hosted in Sweden (EU). No US cloud providers in the data path. GDPR compliant.' },
    ],
  },

  pricing: {
    heading: 'Pricing for law firms',
    recommended: 'RECOMMENDED',
    trialBullet: '14-day free trial',
    startTrial: 'Start free trial',
    getStarted: 'Get started',
  },

  cta: {
    sub: 'Create an encrypted room in about 10 seconds. Your client just clicks a link.',
    secondaryLabel: 'Set up your firm workspace',
  },
};

export const LAWFIRMS_COPY: Record<Lang, LawFirmsCopy> = { sv, en };
