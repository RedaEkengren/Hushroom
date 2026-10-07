import type { Lang } from './landing-copy';
import type { LegalPageCopy } from './LegalPage';

// Copy for /integritet (sv) and /en/privacy (en).

const sv: LegalPageCopy = {
  title: 'Integritetspolicy',
  heroTitle: 'Integritetspolicy',
  heroSubtitle: 'Vi samlar in det absolut minsta för att förhindra missbruk. Samtal är krypterade hela vägen. Rumsdata raderas automatiskt. Hashen av din e-post sparas i 30 dagar och raderas sedan.',
  lastUpdated: 'Senast uppdaterad: 3 mars 2026',

  sections: [
    {
      heading: 'Vad vi samlar in',
      blocks: [
        { kind: 'labeled', label: 'Den som skapar rum', text: ['Din e-postadress krävs för att skapa rum. Det förhindrar missbruk och spam. Adressen används en gång för att skicka en verifieringskod och kastas sedan direkt. Vi sparar bara en envägshash (SHA-256) av adressen och kan inte återskapa den ur hashen.'] },
        { kind: 'labeled', label: 'Deltagare', text: ['Ingen e-post, inget konto, ingen identifiering. Deltagare anger bara ett visningsnamn som finns i minnet under sessionen.'] },
        { kind: 'labeled', label: 'Innehållet i kommunikationen', text: ['Alla meddelanden är krypterade hela vägen. Servern ser bara krypterade block. Vi lagrar inte chattmeddelanden, röst eller video. Krypteringsnyckeln finns bara i rumslänken (URL-fragmentet) och når aldrig vår server.'] },
        { kind: 'labeled', label: 'Ingen IP-loggning', text: ['Vi loggar inte IP-adresser, user agents eller några personuppgifter i applikationsloggarna.'] },
      ],
    },
    {
      heading: 'Rättslig grund för behandlingen (dataskyddsförordningen art. 6)',
      blocks: [
        { kind: 'p', text: ['Varje uppgift vi behandlar har en specifik rättslig grund enligt artikel 6. Vi behandlar det minsta möjliga för varje ändamål.'] },
        {
          kind: 'table',
          firstColBold: true,
          head: ['Uppgift', 'Rättslig grund', 'Ändamål'],
          rows: [
            [['E-posthash (SHA-256)'], ['Berättigat intresse (art. 6.1 f)'], ['Förhindra missbruk, begränsa antal rum, upprätthålla avstängningar']],
            [['Prenumerationsuppgifter'], ['Fullgörande av avtal (art. 6.1 b)'], ['Tillgång till betald nivå, fakturering via Stripe']],
            [['Rapporter om missbruk'], ['Rättslig förpliktelse eller berättigat intresse (art. 6.1 c och f)'], ['Svara på begäran från myndighet, säkerhet på plattformen']],
            [['Innehållet i kommunikationen'], [{ b: 'Behandlas inte' }], ['Krypterat hela vägen, servern får aldrig klartext (art. 25, inbyggt dataskydd)']],
          ],
        },
      ],
    },
    {
      heading: 'Lagringstider',
      blocks: [
        {
          kind: 'table',
          firstColBold: true,
          head: ['Uppgift', 'Lagringstid'],
          rows: [
            [['Rumsdata'], ['Raderas automatiskt när rummet löper ut (max 4 timmar). Lagras bara i minnet (Redis), skrivs aldrig till disk.']],
            [['E-posthash'], ['Sparas i 30 dagar efter att du senast skapade ett rum, raderas sedan automatiskt.']],
            [['Verifieringskod'], ['Raderas efter tio minuter eller direkt när den använts.']],
            [['Rapporter om missbruk'], ['Om någon rapporterar ett rum sparas rapporten (rums-id och typ av rapport, inget meddelandeinnehåll) i 90 dagar.']],
            [['Återkoppling'], ['Frivilligt inskickad återkoppling sparas i 180 dagar.']],
            [['Spärrlista'], ['Om ett konto stängs av för missbruk sparas e-posthashen permanent för att upprätthålla avstängningen. Inga andra uppgifter sparas.']],
          ],
        },
      ],
    },
    {
      heading: 'Begäran från brottsbekämpande myndigheter',
      blocks: [
        { kind: 'p', text: ['Vi svarar på lagliga begäranden från brottsbekämpande myndigheter. Vår zero knowledge-arkitektur innebär att vi inte kan lämna ut det vi inte har.'] },
        {
          kind: 'twoCol',
          left: {
            title: 'Vi KAN lämna ut',
            items: [
              ['Tidpunkt när rummet skapades och vald längd'],
              ['Antal deltagare (inga identiteter)'],
              ['SHA-256-hash av skaparens e-post (om den finns kvar inom 30-dagarsfönstret)'],
              ['Prenumerationsnivå och betalstatus'],
              ['Uppgifter om rapporterat missbruk (rums-id, typ av rapport, 90 dagar)'],
            ],
          },
          right: {
            title: 'Vi KAN INTE lämna ut',
            items: [
              ['Meddelandeinnehåll (krypterat hela vägen, vi ser aldrig klartext)'],
              ['Röst- eller videoinspelningar (krypterade, lagras aldrig)'],
              ['Deltagares identiteter (inget konto krävs för att ansluta)'],
              ['E-postadress i klartext (kastas direkt efter verifieringen)'],
              ['Historiskt rumsinnehåll (bara i RAM, raderas när rummet löper ut)'],
            ],
          },
        },
        { kind: 'p', text: ['Rättsliga förfrågningar: ', { link: 'legal@hushroom.io', href: 'mailto:legal@hushroom.io' }, '. Vi underrättar berörda användare om vi inte är förhindrade av lag.'] },
      ],
    },
    {
      heading: 'Dina rättigheter',
      blocks: [
        { kind: 'p', text: ['Enligt dataskyddsförordningen har användare inom EU rätt att begära information, radering, invända mot behandling och lämna in klagomål. Eftersom systemet är byggt med inbyggt dataskydd är det mesta redan raderat innan du hinner begära det.'] },
        { kind: 'p', text: ['För överklagande av avstängning eller begäran om uppgifter, kontakta oss nedan.'] },
      ],
    },
  ],

  contact: {
    heading: 'Kontakt',
    items: [
      { label: 'Frågor om integritet', email: 'privacy@hushroom.io' },
      { label: 'Anmäl missbruk', email: 'abuse@hushroom.io' },
    ],
    linkLabel: 'Läs säkerhetsarkitekturen',
  },
};

const en: LegalPageCopy = {
  title: 'Privacy Policy',
  heroTitle: 'Privacy Policy',
  heroSubtitle: 'We collect the bare minimum to prevent abuse. Conversations are end-to-end encrypted. Room data auto-deletes. Your email hash is kept for 30 days, then deleted.',
  lastUpdated: 'Last updated: 3 March 2026',

  sections: [
    {
      heading: 'What we collect',
      blocks: [
        { kind: 'labeled', label: 'Room creators', text: ['Your email address is required to create rooms. This prevents abuse and spam. The email is used once to send a verification code, then immediately discarded. We store only a one-way hash (SHA-256) of your email, and we cannot recover your actual address from it.'] },
        { kind: 'labeled', label: 'Participants', text: ['No email, no account, no identification. Participants only provide a display name which is stored in memory during the session.'] },
        { kind: 'labeled', label: 'Communication content', text: ['All messages are end-to-end encrypted. The server only sees encrypted blobs. We do not store chat messages, voice, or video. The encryption key exists only in the room link (URL fragment) and never reaches our server.'] },
        { kind: 'labeled', label: 'No IP logging', text: ['We do not log IP addresses, user agents, or any personally identifiable information in our application logs.'] },
      ],
    },
    {
      heading: 'Legal basis for processing (GDPR Art. 6)',
      blocks: [
        { kind: 'p', text: ['Every data point we process has a specific legal basis under GDPR Article 6. We process the minimum necessary for each purpose.'] },
        {
          kind: 'table',
          firstColBold: true,
          head: ['Data', 'Legal basis', 'Purpose'],
          rows: [
            [['Email hash (SHA-256)'], ['Legitimate interest (Art. 6(1)(f))'], ['Abuse prevention, rate limiting, ban enforcement']],
            [['Subscription data'], ['Contract performance (Art. 6(1)(b))'], ['Providing paid tier access; billing via Stripe']],
            [['Abuse reports'], ['Legal obligation / Legitimate interest (Art. 6(1)(c)/(f))'], ['Responding to law enforcement; platform safety']],
            [['Communication content'], [{ b: 'Not processed' }], ['End-to-end encrypted, server never receives plaintext (GDPR Art. 25 privacy by design)']],
          ],
        },
      ],
    },
    {
      heading: 'Data retention',
      blocks: [
        {
          kind: 'table',
          firstColBold: true,
          head: ['Data', 'Retention'],
          rows: [
            [['Room data'], ['Automatically deleted when the room expires (max 4 hours). Stored only in memory (Redis), never written to disk.']],
            [['Email hash'], ['Stored for 30 days after your last room creation, then automatically deleted.']],
            [['Verification code'], ['Deleted after 10 minutes or immediately upon use.']],
            [['Abuse reports'], ['If someone reports a room, the report (room ID and report type, no message content) is stored for 90 days.']],
            [['Feedback'], ['Voluntarily submitted feedback is stored for 180 days.']],
            [['Ban list'], ['If an account is banned for abuse, the email hash is stored permanently to enforce the ban. No other data is retained.']],
          ],
        },
      ],
    },
    {
      heading: 'Law enforcement requests',
      blocks: [
        { kind: 'p', text: ['We respond to lawful requests from law enforcement. Our zero-knowledge architecture means we cannot provide what we do not have.'] },
        {
          kind: 'twoCol',
          left: {
            title: 'We CAN provide',
            items: [
              ['Room creation timestamp and configured duration'],
              ['Number of participants (no identities)'],
              ['SHA-256 hash of creator email (if within 30-day retention window)'],
              ['Subscription tier and billing status'],
              ['Abuse report records (room ID, report type, 90-day TTL)'],
            ],
          },
          right: {
            title: 'We CANNOT provide',
            items: [
              ['Message content (end-to-end encrypted, we never see plaintext)'],
              ['Voice or video recordings (E2EE, never stored)'],
              ['Participant identities (no account required to join)'],
              ['Plaintext email address (discarded immediately after OTP)'],
              ['Historical room content (RAM-only, deleted on expiry)'],
            ],
          },
        },
        { kind: 'p', text: ['Legal requests: ', { link: 'legal@hushroom.io', href: 'mailto:legal@hushroom.io' }, '. We notify affected users unless prohibited by law.'] },
      ],
    },
    {
      heading: 'Your rights',
      blocks: [
        { kind: 'p', text: ['Under GDPR, EU users have rights to request information, deletion, object to processing, and lodge complaints. Due to our privacy-by-design architecture, most data is automatically deleted before you could request it.'] },
        { kind: 'p', text: ['For ban appeals or data requests, contact us below.'] },
      ],
    },
  ],

  contact: {
    heading: 'Contact',
    items: [
      { label: 'Privacy questions', email: 'privacy@hushroom.io' },
      { label: 'Abuse reports', email: 'abuse@hushroom.io' },
    ],
    linkLabel: 'Read security architecture',
  },
};

export const PRIVACY_COPY: Record<Lang, LegalPageCopy> = { sv, en };
