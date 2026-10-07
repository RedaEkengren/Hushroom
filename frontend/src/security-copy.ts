import type { Lang } from './landing-copy';
import type { RichText } from './rich-text';

// Copy for /sakerhet (sv) and /en/security (en).

export interface SecurityCopy {
  title: string;
  heroAlt: string;
  heroTitle: string;
  heroSubtitle: RichText;

  zeroKnowledge: { heading: string; p1: RichText; p2: string; quote: string };

  encrypt: {
    heading: string;
    text: { heading: string; body: RichText; specs: { label: string; value: string }[] };
    media: { heading: string; body: RichText; specs: { label: string; value: string }[] };
    whySecure: { label: string; points: string[] };
  };

  dontStore: { heading: string; items: string[]; whySecure: { label: string; points: string[] } };

  legal: {
    heading: string;
    intro: string;
    canHeading: string;
    can: string[];
    cannotHeading: string;
    cannot: string[];
    whySecure: { label: string; points: string[] };
  };

  chatControl: { heading: string; p1: RichText; p2: string; reviewed: string };

  autoDelete: {
    heading: string;
    p1: string;
    p2: string;
    noBackupsTitle: string;
    noBackupsBody: string;
    whySecure: { label: string; points: string[] };
  };

  email: { heading: string; intro: RichText; steps: RichText[]; outro: RichText };

  abuse: { heading: string; points: { label: string; text: string }[] };

  infra: { heading: string; items: { label: string; value: string }[] };

  cta: { heading: string; sub: string; primaryLabel: string };
}

const sv: SecurityCopy = {
  title: 'Säkerhet',
  heroAlt: 'Suddig siluett av en person bakom frostat glas',
  heroTitle: 'Säkerhetsarkitektur',
  heroSubtitle: ['Zero knowledge genom design. Vi kan inte läsa era samtal. Inte "vill inte", utan tekniskt ', { i: 'kan inte' }, '.'],

  zeroKnowledge: {
    heading: 'Zero knowledge genom design',
    p1: [
      'Krypteringsnycklarna ligger i URL-fragmentet (',
      { code: '#key=...' },
      '). Enligt HTTP-specifikationen skickas URL-fragment ',
      { b: 'aldrig till servern' },
      '. Webbläsaren klipper bort fragmentet innan den gör någon förfrågan.',
    ],
    p2: 'Det innebär att servern aldrig ser krypteringsnycklar. Inte i förfrågningarnas adresser, inte i headers, inte i loggar, ingenstans. Även med full åtkomst till servern (root, databasdump, minnesinspektion) förblir samtalen oläsbara.',
    quote: '"Vi kan inte lämna ut det vi inte har."',
  },

  encrypt: {
    heading: 'Vad vi krypterar',
    text: {
      heading: 'Textmeddelanden',
      body: [
        'Krypteras i webbläsaren med ',
        { b: 'NaCl secretbox' },
        ' (xsalsa20-poly1305). Varje meddelande använder en unik slumpmässig nonce. Servern lagrar bara ciphertext.',
      ],
      specs: [
        { label: 'Algoritm', value: 'XSalsa20-Poly1305' },
        { label: 'Nyckellängd', value: '256 bitar' },
        { label: 'Bibliotek', value: 'TweetNaCl' },
        { label: 'Nonce', value: 'Slumpmässig, unik per meddelande' },
      ],
    },
    media: {
      heading: 'Röst och video',
      body: [
        'Krypteras med ',
        { b: 'LiveKit E2EE' },
        ' och PBKDF2-nyckelhärledning. Alla ljud- och videorutor krypteras innan de lämnar din enhet.',
      ],
      specs: [
        { label: 'Protokoll', value: 'LiveKit E2EE (SFrame)' },
        { label: 'Nyckelhärledning', value: 'PBKDF2' },
        { label: 'Mediaserver', value: 'Egen drift, inte moln' },
        { label: 'Inspelning', value: 'Omöjlig (nycklarna finns aldrig på servern)' },
      ],
    },
    whySecure: {
      label: 'DÄRFÖR ÄR DET SÄKERT',
      points: [
        'Text: NaCl secretbox (xsalsa20-poly1305), autentiserad kryptering, 256-bitars nyckel, granskad TweetNaCl-implementation',
        'Röst och video: varje ruta krypteras innan den lämnar din enhet',
        'Egen mediaserver, ingen tredjepartsmoln behandlar era strömmar',
      ],
    },
  },

  dontStore: {
    heading: 'Vad vi inte lagrar',
    items: [
      'Meddelandeinnehåll eller klartext',
      'Röst- eller videoinspelningar',
      'Krypteringsnycklar',
      'IP-adresser',
      'Webbläsarfingeravtryck eller user agents',
      'Användarkonton eller lösenord',
      'Samtalsmetadata eller samtalslängd',
      'Aktivitets- eller åtkomstloggar',
      'Cookies (utöver sessions-JWT)',
      'Filuppladdningar (stöds inte)',
    ],
    whySecure: {
      label: 'DÄRFÖR ÄR DET SÄKERT',
      points: [
        'Ingenting att stjäla, även ett fullständigt dataintrång ger noll användbar data',
        'Inga användarkonton betyder inga lösenordsdatabaser att attackera',
        'Ingen IP-loggning betyder ingen koppling mellan rum och identiteter',
      ],
    },
  },

  legal: {
    heading: 'Om vi tvingas av lag',
    intro: 'Om Hushroom får en giltig rättslig begäran (domstolsbeslut, föreläggande, begäran från brottsbekämpande myndighet) är detta en transparent redovisning av vad vi kan och inte kan lämna ut:',
    canHeading: 'Vi KAN bekräfta',
    can: [
      'Att någon begärde en verifieringskod via e-post (vi lagrar inte vilken adress som användes)',
      'Ungefärlig tidpunkt för när rummet skapades',
      'Att ett rum har funnits (inte dess innehåll)',
      'Antal deltagare (inte deras identiteter)',
    ],
    cannotHeading: 'Vi KAN INTE lämna ut',
    cannot: [
      'Meddelandeinnehåll (krypterat hela vägen, lagras aldrig i klartext)',
      'Röst- eller videoinspelningar (spelas aldrig in)',
      'Krypteringsnycklar (når aldrig servern)',
      'E-postadressen som användes för att skapa rummet (lagras inte, bara en envägshash)',
      'Deltagares identiteter (anonyma genom design)',
      'IP-adresser (loggas inte)',
      'Historisk data (raderas automatiskt, inga backuper)',
    ],
    whySecure: {
      label: 'DÄRFÖR ÄR DET SÄKERT',
      points: [
        'Tekniska begränsningar, inte löften i en policy. Vi kan inte lämna ut det vi inte har',
        'Minimalt med metadata, bara det som krävs för att förhindra missbruk',
        'Även metadata raderas när rummets TTL löper ut, inga historiska register',
      ],
    },
  },

  chatControl: {
    heading: 'EU:s "Chat Control" (CSA-förordningen) och Hushroom',
    p1: [
      'EU förhandlar om en förordning för att upptäcka material med sexuella övergrepp mot barn, ofta kallad "Chat Control". En tillfällig ordning med ',
      { i: 'frivillig' },
      ' skanning gäller från augusti 2026. Den permanenta förordningen förhandlas fortfarande och väntas, enligt rapporteringen från trilogerna, skydda kryptering hela vägen.',
    ],
    p2: 'Oavsett slutlig text lämnar Hushrooms konstruktion ingenting att skanna hos oss: det finns inga användarkonton, rummen är tillfälliga, meddelandeinnehåll krypteras i din webbläsare och servern håller bara ciphertext som raderas när rummet stänger. Vi kan inte läsa, spara eller lämna ut innehåll, och vi kommer inte att bygga in en bakdörr i produkten. Om lagstiftning någon gång skulle kräva det säger vi det här, öppet, innan vi ändrar något.',
    reviewed: 'Vi följer förhandlingarna om CSA-förordningen och uppdaterar det här avsnittet när rättsläget ändras (senast granskat 2026-08-23).',
  },

  autoDelete: {
    heading: 'Automatisk radering',
    p1: 'All krypterad rumsdata ligger i Redis med strikt TTL och finns bara i RAM. Ingenting skrivs till disk (RDB och AOF är avstängda), och när TTL:en löper ut eller processen stoppas är det borta.',
    p2: 'Rummen löper ut vid den tid som skaparen valt (15 minuter till 4 timmar). Raderingen är automatisk, inte ett städjobb som någon måste komma ihåg att köra.',
    noBackupsTitle: 'Inga backuper. Inga repliker. Ingen återställning.',
    noBackupsBody: 'När data raderats är den borta. Det finns inget sätt att återskapa ett utgånget rum, även om vi ville.',
    whySecure: {
      label: 'DÄRFÖR ÄR DET SÄKERT',
      points: [
        'Lagring bara i RAM, försvinner strömmen töms minnet omedelbart',
        'Ingen persistens på disk (RDB och AOF avstängda), ingenting skrivs till disk någonsin',
        'Automatisk TTL, raderingen är garanterad och inte valfri',
      ],
    },
  },

  email: {
    heading: 'Hantering av e-post',
    intro: [
      'E-postadresser samlas bara in för den som ',
      { b: 'skapar' },
      ' rum, inte för deltagare. Syftet är att förhindra missbruk genom att begränsa hur många rum en identitet kan skapa.',
    ],
    steps: [
      ['Du anger din e-post för att skapa ett rum'],
      ['Vi skickar en sexsiffrig verifieringskod (via Lettermint)'],
      ['Efter verifiering ', { b: 'SHA-256-hashas' }, ' adressen och originalet kastas'],
      ['Bara hashen sparas i JWT-token och används för att begränsa antalet rum'],
      ['Vi kan inte återskapa din e-postadress ur hashen, det är en envägsfunktion'],
    ],
    outro: [
      'Deltagare, alltså de som ansluter via länk, lämnar ',
      { b: 'ingen e-post' },
      '. Bara ett visningsnamn som finns i minnet så länge sessionen pågår.',
    ],
  },

  abuse: {
    heading: 'Skydd mot missbruk',
    points: [
      { label: 'Frekvensbegränsning', text: 'Redis-baserad begränsning på alla endpoints. Inloggning: 5 anrop per 15 minuter och IP. Rumsskapande: 10 per timme och verifierad e-post.' },
      { label: 'Värdkontroller', text: 'Den som skapat rummet kan kicka deltagare och låsa rummet så att ingen ny kan ansluta.' },
      { label: 'Rapportering', text: 'Rapportering av missbruk inne i rummet. Rapporter sparas i 90 dagar (bara rums-id och typ av rapport, inget meddelandeinnehåll).' },
      { label: 'Avstängning', text: 'Permanenta avstängningar med e-posthashar. Avstängda kan inte skapa rum, och eftersom bara hashen sparas innehåller inte ens spärrlistan några e-postadresser.' },
    ],
  },

  infra: {
    heading: 'Infrastruktur',
    items: [
      { label: 'Drift', value: 'Egen drift i Sverige (EU)' },
      { label: 'Transport', value: 'HTTPS och WSS (TLS 1.3)' },
      { label: 'Mediaserver', value: 'Egen LiveKit-drift, inte moln' },
      { label: 'TURN-relä', value: 'Egen drift (UDP 3478, TLS 5349)' },
      { label: 'Datalagring', value: 'Redis (bara RAM, ingen persistens på disk)' },
      { label: 'Jurisdiktion', value: 'Svensk rätt (EU:s dataskyddsförordning)' },
    ],
  },

  cta: {
    heading: 'Frågor om säkerhetsmodellen?',
    sub: 'Läs om hur rummen fungerar, eller skriv till oss. Vi svarar utförligt på säkerhetsfrågor.',
    primaryLabel: 'Skapa rum',
  },
};

const en: SecurityCopy = {
  title: 'Security',
  heroAlt: 'Blurred silhouette of a person behind frosted glass',
  heroTitle: 'Security architecture',
  heroSubtitle: ['Zero-knowledge design. We can\'t read your conversations. Not "won\'t", but technically ', { i: 'cannot' }, '.'],

  zeroKnowledge: {
    heading: 'Zero-knowledge design',
    p1: [
      'Encryption keys are embedded in the URL fragment (',
      { code: '#key=...' },
      '). Per the HTTP specification, URL fragments are ',
      { b: 'never sent to the server' },
      '. The browser strips the fragment before making any request.',
    ],
    p2: 'This means the server never sees encryption keys: not in request URLs, not in headers, not in logs, nowhere. Even with full server access (root shell, database dump, memory inspection), conversations remain unreadable.',
    quote: '"We can\'t hand over what we don\'t have."',
  },

  encrypt: {
    heading: 'What we encrypt',
    text: {
      heading: 'Text messages',
      body: [
        'Encrypted client-side using ',
        { b: 'NaCl secretbox' },
        ' (xsalsa20-poly1305). Each message uses a unique random nonce. The server only stores ciphertext blobs.',
      ],
      specs: [
        { label: 'Algorithm', value: 'XSalsa20-Poly1305' },
        { label: 'Key size', value: '256-bit' },
        { label: 'Library', value: 'TweetNaCl' },
        { label: 'Nonce', value: 'Random, unique per message' },
      ],
    },
    media: {
      heading: 'Voice and video',
      body: [
        'Encrypted using ',
        { b: 'LiveKit E2EE' },
        ' with PBKDF2 key derivation. All audio and video frames are encrypted before leaving your device.',
      ],
      specs: [
        { label: 'Protocol', value: 'LiveKit E2EE (SFrame)' },
        { label: 'Key derivation', value: 'PBKDF2' },
        { label: 'Media server', value: 'Self-hosted (not cloud)' },
        { label: 'Recording', value: 'Impossible (keys never on server)' },
      ],
    },
    whySecure: {
      label: "WHY IT'S SECURE",
      points: [
        'Text: NaCl secretbox (xsalsa20-poly1305), authenticated encryption, 256-bit key, audited TweetNaCl implementation',
        'Voice and video: every frame encrypted before leaving your device',
        'Self-hosted media server, no third-party cloud processes your streams',
      ],
    },
  },

  dontStore: {
    heading: "What we don't store",
    items: [
      'Message content or plaintext',
      'Voice or video recordings',
      'Encryption keys',
      'IP addresses',
      'Browser fingerprints or user agents',
      'User accounts or passwords',
      'Call metadata or duration',
      'Activity or access logs',
      'Cookies (beyond session JWT)',
      'File uploads (not supported)',
    ],
    whySecure: {
      label: "WHY IT'S SECURE",
      points: [
        'Nothing to steal, even a full database breach yields zero usable data',
        'No user accounts means no credential databases to target',
        'No IP logging means no connection between rooms and identities',
      ],
    },
  },

  legal: {
    heading: 'If compelled by law',
    intro: 'If Hushroom receives a valid legal request (court order, subpoena, law enforcement request), here is a transparent breakdown of what we can and cannot provide:',
    canHeading: 'We CAN confirm',
    can: [
      "That someone requested a verification code through email (we don't store which email was used)",
      'Approximate timestamp of room creation',
      'That a room existed (not its contents)',
      'Number of participants (not their identities)',
    ],
    cannotHeading: 'We CANNOT provide',
    cannot: [
      'Message content (E2EE, never stored in plaintext)',
      'Voice or video recordings (never recorded)',
      'Encryption keys (never reach server)',
      'The email used to create a room (not stored, only a one-way hash)',
      'Participant identities (anonymous by design)',
      'IP addresses (not logged)',
      'Historical data (auto-deleted, no backups)',
    ],
    whySecure: {
      label: "WHY IT'S SECURE",
      points: [
        "Technical limitations, not policy promises. We cannot provide what we don't possess",
        "Minimal metadata footprint, only what's strictly necessary for abuse prevention",
        'Even metadata auto-deletes after room TTL, no historical records',
      ],
    },
  },

  chatControl: {
    heading: 'EU "Chat Control" (CSA Regulation) and Hushroom',
    p1: [
      'The EU is negotiating a regulation on detecting child sexual abuse material (often called "Chat Control"). A temporary, ',
      { i: 'voluntary' },
      '-scanning regime applies from August 2026; the permanent regulation is still being negotiated and, as reported from the trilogues, is expected to protect end-to-end encryption.',
    ],
    p2: "Whatever the final text, Hushroom's design leaves nothing to scan on our side: there are no user accounts, rooms are ephemeral, message content is end-to-end encrypted in your browser, and the server only ever holds ciphertext that is deleted when the room expires. We cannot read, retain or hand over content, and we will not build a back door into the product. If legislation ever required one, we would say so here, openly, before changing anything.",
    reviewed: 'We follow the CSA Regulation negotiations and update this section when the legal situation changes (last reviewed 2026-08-23).',
  },

  autoDelete: {
    heading: 'Auto-delete',
    p1: 'All encrypted room data is held in Redis with a strict TTL and lives only in RAM. Nothing is written to disk (RDB and AOF persistence are disabled), and when the TTL expires or the process stops, it is gone.',
    p2: 'Rooms expire at the creator-chosen time limit (15 min to 4 hours). Deletion is automatic, not a cleanup job someone has to remember to run.',
    noBackupsTitle: 'No backups. No replicas. No recovery.',
    noBackupsBody: "When data is deleted, it's gone. There is no way to recover an expired room, even if we wanted to.",
    whySecure: {
      label: "WHY IT'S SECURE",
      points: [
        'RAM-only storage, if the power goes off the memory is cleared instantly',
        'No disk persistence (RDB/AOF disabled), nothing written to disk, ever',
        'Automatic TTL expiry, deletion is guaranteed, not optional',
      ],
    },
  },

  email: {
    heading: 'Email handling',
    intro: [
      'Email addresses are only collected for room ',
      { b: 'creators' },
      ', not participants. The purpose is abuse prevention: rate limiting room creation per identity.',
    ],
    steps: [
      ['You enter your email to create a room'],
      ['We send a 6-digit verification code (via Lettermint)'],
      ['After verification, the email is ', { b: 'SHA-256 hashed' }, ' and the original is discarded'],
      ['Only the hash is stored in the JWT token and used for rate limiting'],
      ['We cannot recover your email from the hash, it is a one-way function'],
    ],
    outro: [
      'Participants (people who join via link) provide ',
      { b: 'no email' },
      ', only a display name that exists in memory for the duration of the session.',
    ],
  },

  abuse: {
    heading: 'Abuse prevention',
    points: [
      { label: 'Rate limiting', text: 'Redis-backed rate limiting on all endpoints. Auth endpoints: 5 req/15 min per IP. Room creation: 10/hour per verified email.' },
      { label: 'Host controls', text: 'Room creators can kick participants and lock rooms to prevent new joins.' },
      { label: 'Reporting', text: 'In-room abuse reporting. Reports stored for 90 days (room ID and report type only, no message content).' },
      { label: 'Ban system', text: 'Persistent bans using email hashes. Banned users cannot create rooms, and because only the hash is stored, even the ban list contains no email addresses.' },
    ],
  },

  infra: {
    heading: 'Infrastructure',
    items: [
      { label: 'Hosting', value: 'Self-hosted in Sweden (EU)' },
      { label: 'Transport', value: 'HTTPS + WSS (TLS 1.3)' },
      { label: 'Media server', value: 'Self-hosted LiveKit (not cloud)' },
      { label: 'TURN relay', value: 'Self-hosted (UDP 3478, TLS 5349)' },
      { label: 'Data store', value: 'Redis (RAM only, no disk persistence)' },
      { label: 'Jurisdiction', value: 'Swedish law (EU GDPR)' },
    ],
  },

  cta: {
    heading: 'Questions about the security model?',
    sub: 'Read how rooms work, or write to us. We answer security questions in detail.',
    primaryLabel: 'Create Instant Room',
  },
};

export const SECURITY_COPY: Record<Lang, SecurityCopy> = { sv, en };
