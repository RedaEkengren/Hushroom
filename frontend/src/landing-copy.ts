// Landing-page copy in Swedish (default, "/") and English ("/en").
// Positioning per docs/GO-TO-MARKET-EU-ROOM.md: "a meeting room with no
// account, for conversations that must not leave the EU". The whole marketing
// site is localised: Swedish on the clean paths, English under /en (routes.ts).
//
// Everything user-visible on the landing page should come from here so the
// two languages can't drift. Tier names/bullets live in pricing-data.ts
// (getTiers(lang)) because /pricing and /for-law-firms share them.

export type Lang = 'sv' | 'en';

export const LANDING_PATHS: Record<Lang, string> = { sv: '/', en: '/en' };

export interface LandingCopy {
  lang: Lang;
  htmlLang: string;
  documentTitle: string;
  nav: { howItWorks: string; security: string; pricing: string; lawFirms: string; createRoom: string; toggleLabel: string; openMenu: string; closeMenu: string; privacy: string; terms: string; about: string };
  hero: {
    line1: string;
    line2: string;
    sub1: string;
    sub2: string;
    cta: string;
    micro: string;
    recentTitle: string;
    recentMinutesLeft: (n: number) => string;
    recentRemove: string;
    recentNote: string;
    heroImageAlt: string;
  };
  social: { title: string; sub: string }[];
  linkFlow: {
    heading: string;
    sub: string;
    exampleBadge: string;
    steps: { label: string; caption: string }[];   // 5, drives the animation
    room: { name: string; participants: string };
    url: { base: string; fragment: string };
    share: string;
    messages: string[];
    gone: string;
    imageAlt: string;
  };
  serverView: {
    heading: string;
    sub: string;
    /** Must match the room id in linkFlow.url.base, the two demos sit on the same page. */
    roomId: string;
    browserLabel: string;
    wireLabel: string;
    dbLabel: string;
    messages: { sender: string; text: string }[];
    /** Marks the jump from "the room is live" to "the room has expired". */
    laterLabel: string;
    ttlLabel: string;
    goneLine: string;
    /** Shown in the two empty panels once the room is gone, so the emptiness reads as the point. */
    goneBrowser: string;
    goneWire: string;
    caption: string;
  };
  how: {
    heading: string;
    sub: string;
    steps: { title: string; text: string }[];
    more: string;
  };
  features: {
    heading: string;
    sub: string;
    cards: { title: string; text: string }[];
  };
  situations: {
    eyebrow: string;
    heading: string;
    intro: string;
    items: { title: string; text: string }[];
    chips: string[];
    lawFirmsLink: string;
    imageAlt: string;
  };
  compare: {
    heading: string;
    sub: string;
    columns: string[];          // Teams · Zoom · Signal · Hushroom
    rows: { label: string; cells: { text: string; tone: 'good' | 'bad' | 'mixed' }[] }[];
    note: string;
  };
  testimonial: { quote: string; attribution: string; note: string };
  pricing: {
    heading: string;
    sub: string;
    createRoom: string;
    mostPopular: string;
    trialLabel: string;
    trialNote: string;
    firmActive: string;
    trialActive: string;
    subscribeNow: (price: string) => string;
    getStarted: string;
    viewFull: string;
  };
  cta: { heading: string; sub: string; primary: string; secondary: string };
  footer: { tagline: string; copyright: string };
}

const sv: LandingCopy = {
  lang: 'sv',
  htmlLang: 'sv',
  documentTitle: 'Hushroom – Krypterat mötesrum utan konto | Hostat i Sverige',
  nav: { howItWorks: 'Så fungerar det', security: 'Säkerhet', pricing: 'Priser', lawFirms: 'För advokatbyråer', createRoom: 'Skapa rum', toggleLabel: 'Byt språk', openMenu: 'Öppna menyn', closeMenu: 'Stäng menyn', privacy: 'Integritetspolicy', terms: 'Användarvillkor', about: 'Om oss' },
  hero: {
    line1: 'Ett mötesrum utan konto.',
    line2: 'När samtalet inte får lämna EU.',
    sub1: 'Skapa en krypterad länk på tio sekunder. Motparten klickar och är inne. Ingen app, inget konto, inget lagras.',
    sub2: 'Hostat i Sverige. När rummet stänger finns det inte.',
    cta: 'Skapa rum',
    micro: 'Klart på cirka 10 sekunder',
    recentTitle: 'Dina senaste rum',
    recentMinutesLeft: (n) => `· ${n} min kvar`,
    recentRemove: 'Ta bort från listan',
    recentNote: 'Krypteringsnyckeln finns bara i din URL-historik. Bokmärk rummet om du vill komma tillbaka.',
    heroImageAlt: 'Silhuetter av två personer som samtalar bakom frostade glasdörrar',
  },
  social: [
    { title: 'End-to-end-krypterat', sub: 'TweetNaCl + LiveKit E2EE' },
    { title: 'Hostat i Sverige', sub: 'Ingen amerikansk molnleverantör i dataflödet' },
    { title: 'Inga konton, inga loggar', sub: 'Inga backuper, inget att begära ut' },
    { title: 'Testat Stockholm ↔ Riyadh', sub: 'Perfekt video på 5G ↔ hotell-wifi' },
  ],
  linkFlow: {
    heading: 'Så fungerar ett rum',
    sub: 'Fem steg, från länk till ingenting.',
    exampleBadge: 'Exempel',
    steps: [
      { label: 'Rummet skapas', caption: 'Du väljer namn och hur länge det ska finnas. Inget konto behövs.' },
      { label: 'Länken genereras', caption: 'Allt efter # stannar i webbläsaren. Nyckeln når aldrig vår server.' },
      { label: 'Länken delas', caption: 'Motparten klickar och är inne. Ingen app, ingen registrering.' },
      { label: 'Ni pratar', caption: 'Chatt, röst och video. Krypteras i din webbläsare, inte hos oss.' },
      { label: 'Rummet försvinner', caption: 'När tiden är ute raderas allt. Det finns inget kvar att begära ut.' },
    ],
    room: { name: 'Klientmöte', participants: '2 deltagare' },
    url: { base: 'hushroom.io/r/tyst-ek-4821', fragment: '#key=a3f9c1b7…' },
    share: 'Ingen app. Inget konto.',
    messages: ['Hej, har du tid på torsdag?', 'Ja, 14:00 funkar bra.', 'Toppen. Vi hörs då.'],
    gone: 'Rummet finns inte längre.',
    imageAlt: '',
  },
  serverView: {
    heading: 'Vad servern ser',
    sub: 'Samma ögonblick, tre vyer. Från första meddelandet till att rummet upphör.',
    roomId: 'tyst-ek-4821',
    browserLabel: 'I webbläsaren',
    wireLabel: 'På tråden',
    dbLabel: 'I databasen',
    messages: [
      { sender: 'Anna', text: 'Hej, har du tid på torsdag?' },
      { sender: 'Johan', text: 'Ja, 14:00 funkar bra.' },
      { sender: 'Anna', text: 'Toppen. Vi hörs då.' },
    ],
    laterLabel: '60 minuter senare',
    ttlLabel: 'Sekunder kvar',
    goneLine: 'Rummet upphörde. Ingen raderade det, det fick aldrig finnas längre.',
    goneBrowser: 'Ingenting kvar att visa.',
    goneWire: 'Ingen trafik.',
    caption: 'Vi ser visningsnamnet och tidpunkten. Själva innehållet krypteras i din webbläsare och sparas som [encrypted]. Nyckeln finns bara i länkens fragment, som enligt HTTP-specifikationen aldrig skickas till en server. När nyckeln i Redis går ut finns ingenting kvar att lämna ut.',
  },
  how: {
    heading: 'Så fungerar det',
    sub: 'Tre steg. Ingen installation. Inget spår.',
    steps: [
      { title: 'Skapa ett rum', text: 'Verifiera din e-post en gång. Tar cirka 10 sekunder. Inget lösenord, inget konto.' },
      { title: 'Dela länken', text: 'Skicka länken till motparten. De klickar och är inne. Ingen app, ingen registrering.' },
      { title: 'Prata säkert', text: 'End-to-end-krypterad chatt, röst och video. Rummet raderas automatiskt när tiden är ute.' },
    ],
    more: 'Läs mer om hur rummen fungerar',
  },
  features: {
    heading: 'Byggt för förtrolighet',
    sub: 'Integritet genom design, inte genom löften',
    cards: [
      { title: 'End-to-end-krypterat', text: 'Meddelanden och samtal krypteras i din webbläsare. Inte ens vi kan läsa dem.' },
      { title: 'Rum som försvinner', text: 'Rummet raderas när tiden går ut. Samtalet har aldrig funnits.' },
      { title: 'Ingen registrering', text: 'Motparten går in direkt via länk. Ingen app, inget konto, inget spår.' },
    ],
  },
  situations: {
    eyebrow: 'För samtalen som inte ska lämna spår',
    heading: 'Tre samtal som inte hör hemma i er Teams',
    intro: 'Gemensamt för dem: personen finns utanför organisationen och samtalet ska varken arkiveras eller passera ett amerikanskt moln.',
    items: [
      { title: 'Anmälaren som vill vara anonym', text: 'Visselblåsarfunktion, fack, ombudsman. Skicka en länk. Inget konto, inget spår.' },
      { title: 'Klienten eller patienten utanför er M365', text: 'Juridik, vård, socialtjänst. Prata med video utan att bjuda in externa i Teams.' },
      { title: 'Källan som inte vill synas', text: 'Journalistik, revision. Rummet självdör, så det finns inget att begära ut.' },
    ],
    chips: ['E2EE Chat', 'E2EE Voice', 'E2EE Video', 'Auto-Expiry'],
    lawFirmsLink: 'Så använder advokatbyråer Hushroom',
    imageAlt: 'Person som tar ett förtroligt telefonsamtal vid ett stort kontorsfönster',
  },
  compare: {
    heading: 'Varför inte bara Teams?',
    sub: 'För det interna arbetet är Teams utmärkt. För det externa, förtroliga samtalet är det fel verktyg.',
    columns: ['Teams', 'Zoom', 'Signal', 'Hushroom'],
    rows: [
      { label: 'Konto krävs', cells: [
        { text: 'Ja, för er (gäster via webblänk)', tone: 'mixed' },
        { text: 'Ja, för värden', tone: 'mixed' },
        { text: 'Telefonnummer + app', tone: 'bad' },
        { text: 'Nej', tone: 'good' },
      ] },
      { label: 'Samtalet arkiveras', cells: [
        { text: 'Ja (M365-arkiv, e-discovery)', tone: 'bad' },
        { text: 'Inspelning och loggar valfritt', tone: 'mixed' },
        { text: 'På enheten', tone: 'mixed' },
        { text: 'Nej, raderas när rummet stänger', tone: 'good' },
      ] },
      { label: 'Amerikanskt moln', cells: [
        { text: 'Ja', tone: 'bad' },
        { text: 'Ja', tone: 'bad' },
        { text: 'Ja (servrar i USA)', tone: 'bad' },
        { text: 'Nej, Sverige', tone: 'good' },
      ] },
      { label: 'Bjuda in extern utan konto', cells: [
        { text: 'Delvis (webbgäst)', tone: 'mixed' },
        { text: 'Ja', tone: 'good' },
        { text: 'Nej (app krävs)', tone: 'bad' },
        { text: 'Ja, en länk', tone: 'good' },
      ] },
    ],
    note: 'Hushroom ersätter inte Teams. Det är rummet bredvid, för samtalet som inte ska finnas kvar.',
  },
  testimonial: {
    quote: '"Tested: Sweden 5G to Saudi Arabia WiFi - perfect video, zero latency"',
    attribution: 'Reda E. & Ali B., grundare · Stockholm ↔ Riyadh',
    note: 'End-to-end-krypterat. Inte ens vi kan komma åt samtalet.',
  },
  pricing: {
    heading: 'Enkla priser',
    sub: 'Börja gratis. Uppgradera när du behöver mer.',
    createRoom: 'Skapa rum',
    mostPopular: 'Populärast',
    trialLabel: 'Starta 14 dagars gratis test',
    trialNote: 'Inget betalkort krävs',
    firmActive: 'Organisationsplan aktiv',
    trialActive: 'Testperiod aktiv',
    subscribeNow: (price) => `Prenumerera (${price}/mån)`,
    getStarted: 'Kom igång →',
    viewFull: 'Se fullständiga priser & FAQ',
  },
  cta: {
    heading: 'Redo för ett samtal som inte lämnar spår?',
    sub: 'Skapa ett krypterat rum på cirka 10 sekunder. Ingen registrering för deltagare.',
    primary: 'Skapa ett rum nu',
    secondary: 'Så fungerar det',
  },
  footer: {
    tagline: 'Mötesrum utan konto, för samtal som inte ska lämna spår',
    copyright: '© 2026 Hushroom. Förtroliga samtal för professionella.',
  },
};

const en: LandingCopy = {
  lang: 'en',
  htmlLang: 'en',
  documentTitle: 'Hushroom – Secure Encrypted Rooms | Zero Trace',
  nav: { howItWorks: 'How it works', security: 'Security', pricing: 'Pricing', lawFirms: 'For Law Firms', createRoom: 'Create Room', toggleLabel: 'Change language', openMenu: 'Open menu', closeMenu: 'Close menu', privacy: 'Privacy Policy', terms: 'Terms of Service', about: 'About' },
  hero: {
    line1: 'A meeting room with no account.',
    line2: 'For conversations that must not leave the EU.',
    sub1: 'Create an encrypted link in ten seconds. The other party clicks and is in. No app, no account, nothing stored.',
    sub2: 'Hosted in Sweden. When the room closes, it is gone.',
    cta: 'Create Instant Room',
    micro: 'Ready in about 10 seconds',
    recentTitle: 'Your recent rooms',
    recentMinutesLeft: (n) => `· ${n} min left`,
    recentRemove: 'Remove from list',
    recentNote: 'The encryption key only lives in your URL history. Bookmark a room if you want to come back later.',
    heroImageAlt: 'Silhouettes of two people talking behind frosted glass doors',
  },
  social: [
    { title: 'End-to-end encrypted', sub: 'TweetNaCl + LiveKit E2EE' },
    { title: 'Hosted in Sweden', sub: 'No US cloud in the data path' },
    { title: 'No accounts, no logs', sub: 'No backups, nothing to subpoena' },
    { title: 'Tested Stockholm ↔ Riyadh', sub: 'Perfect video on 5G ↔ hotel WiFi' },
  ],
  linkFlow: {
    heading: 'How a room works',
    sub: 'Five steps, from link to nothing.',
    exampleBadge: 'Example',
    steps: [
      { label: 'The room is created', caption: 'You pick a name and how long it should exist. No account needed.' },
      { label: 'The link is generated', caption: 'Everything after the # stays in the browser. The key never reaches our server.' },
      { label: 'The link is shared', caption: 'The other party clicks and is in. No app, no sign-up.' },
      { label: 'You talk', caption: 'Chat, voice and video. Encrypted in your browser, not on our side.' },
      { label: 'The room disappears', caption: 'When the timer runs out everything is deleted. There is nothing left to request.' },
    ],
    room: { name: 'Client meeting', participants: '2 participants' },
    url: { base: 'hushroom.io/r/quiet-oak-4821', fragment: '#key=a3f9c1b7…' },
    share: 'No app. No account.',
    messages: ['Hi, do you have time on Thursday?', 'Yes, 2pm works well.', 'Great. Talk then.'],
    gone: 'The room no longer exists.',
    imageAlt: '',
  },
  serverView: {
    heading: 'What the server sees',
    sub: 'The same moment, three views. From the first message to the room expiring.',
    roomId: 'quiet-oak-4821',
    browserLabel: 'In the browser',
    wireLabel: 'On the wire',
    dbLabel: 'In the database',
    messages: [
      { sender: 'Anna', text: 'Hi, do you have time on Thursday?' },
      { sender: 'Johan', text: 'Yes, 2pm works well.' },
      { sender: 'Anna', text: 'Great. Talk then.' },
    ],
    laterLabel: '60 minutes later',
    ttlLabel: 'Seconds left',
    goneLine: 'The room expired. Nobody deleted it, it was never allowed to last longer.',
    goneBrowser: 'Nothing left to show.',
    goneWire: 'No traffic.',
    caption: 'We see the display name and the time. The content itself is encrypted in your browser and stored as [encrypted]. The key lives only in the link fragment, which per the HTTP specification is never sent to a server. Once the Redis key expires there is nothing left to hand over.',
  },
  how: {
    heading: 'How it works',
    sub: 'Three steps. No setup. No trace.',
    steps: [
      { title: 'Create a room', text: 'Verify your email once. Takes about 10 seconds. No password, no account.' },
      { title: 'Share the link', text: 'Send the link to the other party. They click and join. No app, no sign-up.' },
      { title: 'Talk securely', text: 'End-to-end encrypted chat, voice and video. Room auto-deletes when done.' },
    ],
    more: 'Learn more about how rooms work',
  },
  features: {
    heading: 'Built for confidentiality',
    sub: 'Privacy by design, not by promise',
    cards: [
      { title: 'End-to-End Encrypted', text: 'Messages and calls encrypted client-side. Even we cannot read your conversations.' },
      { title: 'Self-Destructing Rooms', text: 'Rooms auto-delete when time runs out. The conversation never happened.' },
      { title: 'No Sign-Up Required', text: 'Participants join instantly via link. No app, no account, no trace left behind.' },
    ],
  },
  situations: {
    eyebrow: 'For the conversations that shouldn\'t leave a trace',
    heading: 'Three conversations that don\'t belong in your Teams',
    intro: 'What they have in common: the person is outside your organisation, and the conversation should neither be archived nor pass through a US cloud.',
    items: [
      { title: 'The whistleblower who wants to stay anonymous', text: 'Reporting channels, unions, ombudsmen. Send a link. No account, no trace.' },
      { title: 'The client or patient outside your M365', text: 'Legal, healthcare, social services. Talk on video without inviting outsiders into Teams.' },
      { title: 'The source who can\'t be seen', text: 'Journalism, audit. The room self-destructs, so there is nothing to request.' },
    ],
    chips: ['E2EE Chat', 'E2EE Voice', 'E2EE Video', 'Auto-Expiry'],
    lawFirmsLink: 'See how law firms use Hushroom',
    imageAlt: 'Person taking a confidential phone call by a large office window',
  },
  compare: {
    heading: 'Why not just Teams?',
    sub: 'For internal work, Teams is excellent. For the external, confidential conversation it is the wrong tool.',
    columns: ['Teams', 'Zoom', 'Signal', 'Hushroom'],
    rows: [
      { label: 'Account required', cells: [
        { text: 'Yes, for you (guests via web link)', tone: 'mixed' },
        { text: 'Yes, for the host', tone: 'mixed' },
        { text: 'Phone number + app', tone: 'bad' },
        { text: 'No', tone: 'good' },
      ] },
      { label: 'Conversation archived', cells: [
        { text: 'Yes (M365 archive, e-discovery)', tone: 'bad' },
        { text: 'Recording and logs optional', tone: 'mixed' },
        { text: 'On the device', tone: 'mixed' },
        { text: 'No, deleted when the room closes', tone: 'good' },
      ] },
      { label: 'US cloud', cells: [
        { text: 'Yes', tone: 'bad' },
        { text: 'Yes', tone: 'bad' },
        { text: 'Yes (US servers)', tone: 'bad' },
        { text: 'No, Sweden', tone: 'good' },
      ] },
      { label: 'Invite an outsider without an account', cells: [
        { text: 'Partly (web guest)', tone: 'mixed' },
        { text: 'Yes', tone: 'good' },
        { text: 'No (app required)', tone: 'bad' },
        { text: 'Yes, one link', tone: 'good' },
      ] },
    ],
    note: 'Hushroom does not replace Teams. It is the room next door, for the conversation that should not persist.',
  },
  testimonial: {
    quote: '"Tested: Sweden 5G to Saudi Arabia WiFi - perfect video, zero latency"',
    attribution: 'Reda E. & Ali B., founders · Stockholm ↔ Riyadh',
    note: 'End-to-end encrypted. Even we can\'t access the call.',
  },
  pricing: {
    heading: 'Simple pricing',
    sub: 'Start free. Upgrade when you need more.',
    createRoom: 'Create Room',
    mostPopular: 'Most popular',
    trialLabel: 'Start 14-day free trial',
    trialNote: 'No credit card required',
    firmActive: 'Organisation plan active',
    trialActive: 'Trial active',
    subscribeNow: (price) => `Subscribe now (${price}/mo)`,
    getStarted: 'Get started →',
    viewFull: 'View full pricing & FAQ',
  },
  cta: {
    heading: 'Ready for a conversation that leaves no trace?',
    sub: 'Create an encrypted room in about 10 seconds. No sign-up for participants.',
    primary: 'Create a room now',
    secondary: 'How it works',
  },
  footer: {
    tagline: 'Privacy-first instant rooms for any conversation',
    copyright: '© 2026 Hushroom. Privacy-first communication for professionals.',
  },
};

export const LANDING_COPY: Record<Lang, LandingCopy> = { sv, en };

/** Any path under /en is English; everything else is Swedish. */
export function langFromPath(pathname: string): Lang {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'sv';
}
