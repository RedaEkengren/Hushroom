import type { Lang } from './landing-copy';
import type { RichText } from './rich-text';

// Copy for /sa-fungerar-det (sv) and /en/how-it-works (en).

export interface HowCopy {
  title: string;            // document title, without the " · Hushroom" suffix
  heroAlt: string;
  heroTitle: string;
  heroSubtitle: string;

  rooms: {
    heading: string;
    steps: { title: string; text: string }[];
    storageHeading: string;
    storageP1: RichText;
    storageP2: string;
    durations: string;
  };

  encryption: {
    heading: string;
    fragmentHeading: string;
    fragmentIntro: RichText;
    exampleUrl: string;
    exampleKey: string;
    fragmentSpec: RichText;
    textHeading: string;
    textBody: RichText;
    mediaHeading: string;
    mediaBody: RichText;
    lifecycleHeading: string;
    lifecycle: RichText[];
    whySecure: { label: string; points: string[] };
  };

  stores: {
    heading: string;
    intro: string;
    columns: [string, string, string];
    rows: { data: string; storedAs: string; retention: string; highlight?: boolean; code?: boolean }[];
    notCollected: string;
  };

  disclosure: {
    heading: string;
    body: string;
    link: string;
  };

  isp: {
    heading: string;
    intro: RichText;
    items: RichText[];
    reveals: RichText;
    advice: string;
  };

  cta: { secondaryLabel: string };
}

const sv: HowCopy = {
  title: 'Så fungerar det',
  heroAlt: 'Varmt ljus genom ett frostat kontorsfönster',
  heroTitle: 'Så fungerar Hushroom',
  heroSubtitle: 'En teknisk genomgång av hur rum skapas, hur krypteringen skyddar era samtal och vad som händer med datan.',

  rooms: {
    heading: 'Så fungerar rummen',
    steps: [
      { title: 'Skapa', text: 'Verifiera din e-post en gång. Välj rumsnamn, längd och antal deltagare. Tar ungefär tio sekunder.' },
      { title: 'Dela länken', text: 'Skicka länken till deltagarna. De klickar och är inne. Ingen app, ingen registrering, inget konto.' },
      { title: 'Rummet stänger', text: 'När tiden går ut raderas rummet och all data permanent. Inga backuper, ingen återställning.' },
    ],
    storageHeading: 'Lagringsarkitektur',
    storageP1: [
      'Rummen finns bara i ',
      { b: 'Redis (RAM)' },
      '. Det finns ingen databas på disk, ingen SQL, ingen fillagring. Krypterad rumsdata lever bara i minnet: ingenting skrivs till disk, och när rummets TTL löper ut eller processen stoppas är det borta.',
    ],
    storageP2: 'När TTL:en löper ut kastar Redis nyckeln automatiskt. Ingen människa behöver ingripa, det finns inga backuper och ingen återställning. Även den som fick full tillgång till servern efteråt skulle inte hitta något.',
    durations: 'Rumslängder: 15 minuter, 30 minuter, 1 timme, 2 timmar, 3 timmar eller 4 timmar. Väljs av den som skapar rummet.',
  },

  encryption: {
    heading: 'Så fungerar krypteringen',
    fragmentHeading: 'Nyckeln i URL-fragmentet',
    fragmentIntro: [
      'När du skapar ett rum genereras en ',
      { b: '32 byte lång slumpnyckel' },
      ' i din webbläsare. Nyckeln läggs i URL-fragmentet, alltså delen efter ',
      { code: '#' },
      ':',
    ],
    exampleUrl: 'https://hushroom.io/r/mitt-rum',
    exampleKey: '#key=a1b2c3d4e5f6...64 hex-tecken',
    fragmentSpec: [
      'Enligt ',
      { b: 'HTTP-specifikationen' },
      ' skickas URL-fragment ',
      { i: 'aldrig till servern' },
      '. Webbläsaren klipper bort fragmentet innan den gör någon förfrågan. Vår server ser alltså aldrig krypteringsnyckeln: inte i loggar, inte i headers, ingenstans. Det är zero knowledge genom design.',
    ],
    textHeading: 'Textmeddelanden',
    textBody: [
      'Varje meddelande krypteras ',
      { b: 'i webbläsaren' },
      ' med ',
      { b: 'NaCl secretbox' },
      ' (xsalsa20-poly1305) innan det skickas över WebSocket. Varje meddelande får en unik slumpmässig nonce. Servern ser bara ciphertext och nonce, och sparar ',
      { code: '[encrypted]' },
      ' som platshållare.',
    ],
    mediaHeading: 'Röst och video',
    mediaBody: [
      'Röst- och videoströmmar krypteras med ',
      { b: 'LiveKit E2EE' },
      ' och PBKDF2-nyckelhärledning. Alla ljud- och videorutor krypteras innan de lämnar din enhet. Samma rumsnyckel från URL-fragmentet används för att härleda mediernas krypteringsnyckel.',
    ],
    lifecycleHeading: 'Nyckelns livscykel',
    lifecycle: [
      ['Nyckeln skapas i webbläsaren när rummet skapas'],
      ['Nyckeln finns bara i React-state, den sparas aldrig i localStorage eller cookies'],
      ['Nyckeln delas genom att hela rumslänken delas, inklusive ', { code: '#key=' }, '-fragmentet'],
      ['När fliken stängs eller rummet löper ut är nyckeln borta'],
    ],
    whySecure: {
      label: 'DÄRFÖR ÄR DET SÄKERT',
      points: [
        'Krypteringsnyckeln lämnar aldrig din webbläsare, servern kan bokstavligen inte dekryptera',
        'URL-fragmentet (#key=) klipps bort av webbläsaren före varje HTTP-anrop',
        'Varje meddelande får en unik slumpmässig nonce, ingen mönsteranalys är möjlig',
        'Röst och video krypteras ruta för ruta innan de lämnar din enhet',
      ],
    },
  },

  stores: {
    heading: 'Vad servern lagrar',
    intro: 'Under ett pågående rum håller servern:',
    columns: ['Data', 'Lagras som', 'Livslängd'],
    rows: [
      { data: 'Rumsnamn', storedAs: 'Klartext', retention: 'Tills rummets TTL löper ut' },
      { data: 'Antal deltagare', storedAs: 'Siffra', retention: 'Tills rummets TTL löper ut' },
      { data: 'Visningsnamn', storedAs: 'I minnet (WebSocket-state)', retention: 'Tills frånkoppling' },
      { data: 'Meddelanden', storedAs: '[encrypted]', retention: 'Tills rummets TTL löper ut', code: true },
      { data: 'Skaparens e-post', storedAs: 'SHA-256-hash (envägs)', retention: '30 dagar' },
      { data: 'Krypteringsnycklar', storedAs: 'Når aldrig servern', retention: '-', highlight: true },
    ],
    notCollected: 'Inte på listan, eftersom det aldrig samlas in: IP-adresser, webbläsarfingeravtryck, användarkonton, meddelanden i klartext, inspelningar.',
  },

  disclosure: {
    heading: 'Vad som kan lämnas ut',
    body: 'Om Hushroom får en giltig rättslig begäran, till exempel ett domstolsbeslut, kan vi bekräfta att ett rum har funnits, ungefär när det skapades och hur många som anslöt. Inget mer. Meddelandeinnehåll, inspelningar, krypteringsnycklar, deltagares identiteter och IP-adresser finns aldrig hos oss och kan därför inte lämnas ut. Det är tekniska begränsningar, inte löften i en policy.',
    link: 'Se exakt vad vi kan och inte kan lämna ut',
  },

  isp: {
    heading: 'Ärlig brasklapp: din internetleverantör',
    intro: [
      'Som med alla internettjänster kan din ',
      { b: 'internetleverantör' },
      ' spara anslutningsmetadata enligt lagkrav om datalagring. Det kan omfatta:',
    ],
    items: [
      ['Att en anslutning till ', { code: 'hushroom.io' }, ' gjordes'],
      ['Tidpunkt och längd på anslutningen'],
      ['Mängden överförd data'],
      ['Din IP-adress (tilldelad av leverantören)'],
    ],
    reveals: [
      'Det avslöjar ',
      { b: 'att' },
      ' du besökte hushroom.io, inte ',
      { b: 'vad' },
      ' du kommunicerade. Innehållet i meddelanden, röstsamtal och video förblir krypterat hela vägen. Krypteringsnyckeln lämnar aldrig din webbläsare.',
    ],
    advice: 'Om metadata hos internetleverantören är ett problem för er, använd VPN eller Tor Browser. Hushroom fungerar som vanligt över båda.',
  },

  cta: { secondaryLabel: 'Läs om säkerheten' },
};

const en: HowCopy = {
  title: 'How it works',
  heroAlt: 'Warm light through a frosted office window',
  heroTitle: 'How Hushroom works',
  heroSubtitle: 'A technical overview of how rooms are created, how encryption protects your conversations, and what happens to your data.',

  rooms: {
    heading: 'How rooms work',
    steps: [
      { title: 'Create', text: 'Verify your email once. Pick a room name, duration, and max participants. Takes about 10 seconds.' },
      { title: 'Share the link', text: 'Send the link to participants. They click and join. No app, no sign-up, no account.' },
      { title: 'Room expires', text: 'When the timer runs out, the room and all data is permanently deleted. No backups, no recovery.' },
    ],
    storageHeading: 'Storage architecture',
    storageP1: [
      'Rooms exist only in ',
      { b: 'Redis (RAM)' },
      '. There is no disk-based database, no SQL, no file storage. Encrypted room data lives only in memory: nothing is written to disk, and when the room TTL expires or the process stops, it is gone.',
    ],
    storageP2: 'When the TTL expires, Redis evicts the key automatically. No human intervention, no backups, no recovery. Even someone with full server access after expiry would find nothing.',
    durations: 'Room durations: 15 min, 30 min, 1 hour, 2 hours, 3 hours, or 4 hours. Chosen by the room creator at creation time.',
  },

  encryption: {
    heading: 'How encryption works',
    fragmentHeading: 'The URL fragment approach',
    fragmentIntro: [
      'When you create a room, a ',
      { b: '32-byte random key' },
      ' is generated in your browser. This key is placed in the URL fragment, the part after the ',
      { code: '#' },
      ' symbol:',
    ],
    exampleUrl: 'https://hushroom.io/r/my-room',
    exampleKey: '#key=a1b2c3d4e5f6...64 hex chars',
    fragmentSpec: [
      'Per the ',
      { b: 'HTTP specification' },
      ', URL fragments are ',
      { i: 'never sent to the server' },
      '. The browser strips the fragment before making any request. This means our server never sees the encryption key: not in logs, not in request headers, nowhere. This is zero-knowledge by design.',
    ],
    textHeading: 'Text messages',
    textBody: [
      'Each message is encrypted ',
      { b: 'client-side' },
      ' using ',
      { b: 'NaCl secretbox' },
      ' (xsalsa20-poly1305) before being sent over WebSocket. Each message gets a unique random nonce. The server only sees ciphertext and nonce blobs, and stores ',
      { code: '[encrypted]' },
      ' as a placeholder.',
    ],
    mediaHeading: 'Voice and video',
    mediaBody: [
      'Voice and video streams are encrypted using ',
      { b: 'LiveKit E2EE' },
      ' with PBKDF2 key derivation. All audio and video frames are encrypted before leaving your device. The same room key from the URL fragment is used to derive the media encryption key.',
    ],
    lifecycleHeading: 'Key lifecycle',
    lifecycle: [
      ['Key is generated in the browser when the room is created'],
      ['Key lives only in React state, never persisted to localStorage or cookies'],
      ['Key is shared by sharing the full room link, including the ', { code: '#key=' }, ' fragment'],
      ['When the tab is closed or the room expires, the key is gone'],
    ],
    whySecure: {
      label: "WHY IT'S SECURE",
      points: [
        'Encryption key never leaves your browser, the server literally cannot decrypt',
        'URL fragment (#key=) is stripped by browsers before any HTTP request',
        'Every message gets a unique random nonce, no pattern analysis possible',
        'Voice and video encrypted frame by frame before leaving your device',
      ],
    },
  },

  stores: {
    heading: 'What the server stores',
    intro: 'During an active room session, the server holds:',
    columns: ['Data', 'Stored as', 'Retention'],
    rows: [
      { data: 'Room name', storedAs: 'Plaintext', retention: 'Until room TTL expires' },
      { data: 'Participant count', storedAs: 'Number', retention: 'Until room TTL expires' },
      { data: 'Display names', storedAs: 'In-memory (WebSocket state)', retention: 'Until disconnect' },
      { data: 'Messages', storedAs: '[encrypted]', retention: 'Until room TTL expires', code: true },
      { data: 'Creator email', storedAs: 'SHA-256 hash (one-way)', retention: '30 days' },
      { data: 'Encryption keys', storedAs: 'Never reaches server', retention: '-', highlight: true },
    ],
    notCollected: 'Not on this list, because it is never collected: IP addresses, browser fingerprints, user accounts, message plaintext, recordings.',
  },

  disclosure: {
    heading: 'What can be disclosed',
    body: 'If Hushroom receives a valid legal request (court order, subpoena), we can confirm that a room existed, roughly when it was created and how many people joined, and nothing more. Message content, recordings, encryption keys, participant identities and IP addresses are never in our possession, so they cannot be handed over. These are technical limitations, not policy promises.',
    link: 'See exactly what we can and cannot disclose',
  },

  isp: {
    heading: 'Honest disclaimer: your ISP',
    intro: [
      'As with any internet service, your ',
      { b: 'Internet Service Provider (ISP)' },
      ' may retain connection metadata as required by local data retention laws. This can include:',
    ],
    items: [
      ['That a connection to ', { code: 'hushroom.io' }, ' was made'],
      ['Timestamp and duration of the connection'],
      ['Volume of data transferred'],
      ['Your IP address (assigned by your ISP)'],
    ],
    reveals: [
      'This reveals ',
      { b: 'that' },
      ' you visited hushroom.io, not ',
      { b: 'what' },
      ' you communicated. The content of your messages, voice calls, and video remains encrypted end-to-end. The encryption key never leaves your browser.',
    ],
    advice: 'If ISP-level metadata is a concern, consider using a VPN or Tor Browser. Hushroom works normally over both.',
  },

  cta: { secondaryLabel: 'Read about security' },
};

export const HOW_COPY: Record<Lang, HowCopy> = { sv, en };
