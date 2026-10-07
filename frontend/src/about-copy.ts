import type { Lang } from './landing-copy';
import type { RichText } from './rich-text';

// Copy for /om-oss (sv) and /en/about (en).

export interface AboutCopy {
  title: string;
  heroAlt: string;
  heroTitle: string;
  heroSubtitle: string;

  why: { heading: string; paragraphs: RichText[] };
  who: { heading: string; paragraphs: RichText[] };
  approach: { heading: string; cards: { title: string; text: string }[] };
  tech: { heading: string; rows: { label: string; value: string }[] };
  contact: { heading: string; items: { label: string; email: string }[] };
  cta: { sub: string; secondaryLabel: string };
}

const sv: AboutCopy = {
  title: 'Om oss',
  heroAlt: 'Stockholms vatten i skymning',
  heroTitle: 'Om Hushroom',
  heroSubtitle: 'Kommunikation med integritet inbyggd, för yrkesgrupper som inte har råd med läckor.',

  why: {
    heading: 'Varför vi byggde Hushroom',
    paragraphs: [
      ['De flesta kommunikationsplattformar sparar allt: meddelanden, metadata, samtalsloggar, IP-adresser. Även "krypterade" tjänster har ofta nycklarna själva. När ett intrång sker, eller när ett domstolsbeslut kommer, ligger allt öppet.'],
      [
        'Hushroom gör tvärtom. Vi har byggt systemet så att vi ',
        { i: 'inte kan' },
        ' komma åt era samtal. Inte "vill inte", utan tekniskt ',
        { i: 'kan inte' },
        '. Krypteringsnycklarna ligger i URL-fragmentet, som enligt HTTP-specifikationen aldrig når vår server. Rumsdata lagras bara i RAM och raderas automatiskt när tiden går ut.',
      ],
      ['Det finns ingenting att begära ut, ingenting att göra intrång i, ingenting att läcka. Det är inte ett löfte i en policy. Det är hur systemet är byggt.'],
    ],
  },

  who: {
    heading: 'Vilka vi är',
    paragraphs: [
      ['Hushroom byggs av ', { b: 'Benbo.se' }, ', ett svenskt mjukvaruföretag som bygger digitala verktyg med integritet först.'],
      ['Vi menar att integritet är en rättighet, inte en funktion. Varje arkitekturbeslut i Hushroom fattas utifrån en fråga: "Vad händer om vår server är helt komprometterad?" Om svaret innebär att användardata exponeras bygger vi om tills det inte gör det.'],
    ],
  },

  approach: {
    heading: 'Vårt arbetssätt',
    cards: [
      { title: 'Zero knowledge', text: 'Krypteringsnyckeln ligger i URL-fragmentet (#key=...), som aldrig når vår server. Vi kan inte läsa era meddelanden, även om vi ville.' },
      { title: 'Tillfälligt', text: 'All rumsdata raderas när tiden går ut. Inga backuper, inga arkiv, ingen återställning. Datan finns bara i RAM (Redis) och skrivs aldrig till disk.' },
      { title: 'Minimal datainsamling', text: 'Vi samlar bara in det som krävs för att förhindra missbruk. Ingen IP-loggning, inga webbläsarfingeravtryck, inga konton för deltagare.' },
      { title: 'Öppen arkitektur', text: 'Vår säkerhetsarkitektur är offentligt dokumenterad. Vi beskriver exakt vad servern lagrar, vad den kan lämna ut och vad den inte kan. Inga svarta lådor.' },
    ],
  },

  tech: {
    heading: 'Teknik',
    rows: [
      { label: 'Frontend', value: 'React och TypeScript' },
      { label: 'Textkryptering', value: 'TweetNaCl (xsalsa20-poly1305)' },
      { label: 'Röst och video', value: 'LiveKit med E2EE (egen drift)' },
      { label: 'Backend', value: 'Node.js, Express och WebSocket' },
      { label: 'Datalagring', value: 'Redis (bara i minnet, ingen persistens på disk)' },
      { label: 'Drift', value: 'Egen drift i Sverige (EU)' },
    ],
  },

  contact: {
    heading: 'Kontakt',
    items: [
      { label: 'Allmänna frågor', email: 'hello@hushroom.io' },
      { label: 'Frågor om integritet', email: 'privacy@hushroom.io' },
      { label: 'Anmäl missbruk', email: 'abuse@hushroom.io' },
    ],
  },

  cta: {
    sub: 'Skapa ett krypterat rum på ungefär tio sekunder. Motparten behöver inget konto.',
    secondaryLabel: 'Läs hur det fungerar',
  },
};

const en: AboutCopy = {
  title: 'About',
  heroAlt: 'Stockholm waterfront at dusk',
  heroTitle: 'About Hushroom',
  heroSubtitle: "Privacy-by-design communication for professionals who can't afford data leaks.",

  why: {
    heading: 'Why we built Hushroom',
    paragraphs: [
      ['Most communication platforms store everything: messages, metadata, call logs, IP addresses. Even "encrypted" services often hold the keys. When a breach happens, or a subpoena arrives, all of it is exposed.'],
      [
        'Hushroom takes a different approach. We designed the system so that we ',
        { i: 'cannot' },
        ' access your conversations. Not "won\'t", technically ',
        { i: 'cannot' },
        '. Encryption keys live in the URL fragment, which by the HTTP specification never reaches our server. Room data is stored only in RAM and auto-deletes when the timer expires.',
      ],
      ["There is nothing to subpoena, nothing to breach, nothing to leak. That's not a policy promise. It's how the system is built."],
    ],
  },

  who: {
    heading: 'Who we are',
    paragraphs: [
      ['Hushroom is built by ', { b: 'Benbo.se' }, ', a Swedish software company focused on privacy-first digital tools.'],
      ['We believe privacy is a right, not a feature. Every architectural decision in Hushroom is made with one question: "What happens if our server is fully compromised?" If the answer involves exposing user data, we redesign until it doesn\'t.'],
    ],
  },

  approach: {
    heading: 'Our approach',
    cards: [
      { title: 'Zero-knowledge', text: 'The encryption key is embedded in the URL fragment (#key=...), which never reaches our server. We cannot read your messages, even if we wanted to.' },
      { title: 'Ephemeral', text: 'All room data auto-deletes when the timer expires. No backups, no archives, no recovery. Data stored only in RAM (Redis), never written to disk.' },
      { title: 'Minimal data', text: "We collect only what's strictly necessary to prevent abuse. No IP logging, no browser fingerprints, no user accounts for participants." },
      { title: 'Open architecture', text: 'Our security architecture is publicly documented. We explain exactly what the server stores, what it can disclose, and what it cannot. No black boxes.' },
    ],
  },

  tech: {
    heading: 'Technology',
    rows: [
      { label: 'Frontend', value: 'React + TypeScript' },
      { label: 'Text encryption', value: 'TweetNaCl (xsalsa20-poly1305)' },
      { label: 'Voice / Video', value: 'LiveKit with E2EE (self-hosted)' },
      { label: 'Backend', value: 'Node.js + Express + WebSocket' },
      { label: 'Data store', value: 'Redis (in-memory only, no disk persistence)' },
      { label: 'Hosting', value: 'Self-hosted in Sweden (EU)' },
    ],
  },

  contact: {
    heading: 'Contact',
    items: [
      { label: 'General inquiries', email: 'hello@hushroom.io' },
      { label: 'Privacy questions', email: 'privacy@hushroom.io' },
      { label: 'Abuse reports', email: 'abuse@hushroom.io' },
    ],
  },

  cta: {
    sub: 'Create an encrypted room in about 10 seconds. No sign-up required for participants.',
    secondaryLabel: 'Read how it works',
  },
};

export const ABOUT_COPY: Record<Lang, AboutCopy> = { sv, en };
