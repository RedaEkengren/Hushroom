// Pure helpers for the two landing-page product animations (LinkFlowDemo and
// ServerViewDemo). Kept out of the components so they can be unit tested and so
// both the animated and the reduced-motion render use identical data.
//
// TRUTHFULNESS: ServerViewDemo claims to show what the server actually holds.
// The shapes here are derived from the real code, not invented:
//
//   frontend/src/crypto.ts        encryptMessage() encrypts
//                                 JSON.stringify({ s: sender, t: timestamp, m: text })
//                                 with nacl.secretbox and base64-encodes the result
//                                 plus a 24-byte nonce.
//   backend/src/websocket-service.ts  handleSendEncryptedMessage() relays
//                                 { id, user, ciphertext, nonce, encrypted, timestamp }
//                                 and persists the same record with text: '[encrypted]',
//                                 roomId and sessionId. Note the relayed envelope has no
//                                 text field at all; only the stored one does.
//   backend/src/redis-room-service.ts  createRoom() writes exactly three keys:
//                                 setEx hushroom:room:<id>               TTL = duration * 60
//                                 setEx hushroom:room:<id>:participants  same TTL
//                                 sAdd  hushroom:rooms-by-email:<sha256> then expire 7 days
//                                 The messages array lives inside the room value.
//
// So the server sees the display name and the timestamp, and nothing else in
// readable form. The demo says exactly that rather than implying total
// blindness, because overclaiming here would be the one unforgivable thing.

/** NaCl secretbox appends a 16-byte Poly1305 authentication tag. */
const POLY1305_TAG_BYTES = 16;
/** nacl.secretbox.nonceLength */
const NONCE_BYTES = 24;

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Deterministic PRNG so the prerendered markup and the client agree, and so tests are stable. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** UTF-8 byte length. Swedish characters cost two bytes, which the blob length reflects. */
export function utf8Bytes(value: string): number {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value).length;
  // jsdom and old runtimes: count manually rather than lie about the length.
  let bytes = 0;
  for (const ch of value) {
    const cp = ch.codePointAt(0) ?? 0;
    bytes += cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
  }
  return bytes;
}

/** Byte length of the plaintext payload crypto.ts encrypts for one message. */
export function payloadBytes(sender: string, timestamp: number, text: string): number {
  return utf8Bytes(JSON.stringify({ s: sender, t: timestamp, m: text }));
}

/** Number of base64 characters, padding included, that n bytes encode to. */
export function base64Length(byteLength: number): number {
  return Math.ceil(byteLength / 3) * 4;
}

/**
 * A base64 string of exactly the length the real ciphertext would have, with
 * correct padding. The bytes are fake, the shape is not.
 */
export function fakeBase64(byteLength: number, seed: number): string {
  const rem = byteLength % 3;
  const padding = rem === 0 ? 0 : rem === 1 ? 2 : 1;
  const random = mulberry32(seed);
  let out = '';
  for (let i = 0; i < base64Length(byteLength) - padding; i++) {
    out += B64_ALPHABET[Math.floor(random() * B64_ALPHABET.length)];
  }
  return out + '='.repeat(padding);
}

export interface DemoMessage {
  sender: string;
  text: string;
}

/**
 * What the relay broadcasts. Field names and the absence of `text` both match
 * the roomMessage literal in handleSendEncryptedMessage.
 */
export interface WireRecord {
  user: string;
  ciphertext: string;
  nonce: string;
  encrypted: true;
  timestamp: number;
}

/** What Redis ends up holding: the wire record plus the [encrypted] placeholder. */
export interface StoredMessage extends WireRecord {
  text: '[encrypted]';
  roomId: string;
}

/** Fixed base timestamp: the demo must not change between renders or between languages. */
const DEMO_BASE_TIMESTAMP = 1787771592246;

export function wireRecordFor(message: DemoMessage, index: number): WireRecord {
  const timestamp = DEMO_BASE_TIMESTAMP + index * 47_000;
  const plaintextBytes = payloadBytes(message.sender, timestamp, message.text);
  return {
    user: message.sender,
    ciphertext: fakeBase64(plaintextBytes + POLY1305_TAG_BYTES, index * 7919 + 13),
    nonce: fakeBase64(NONCE_BYTES, index * 104_729 + 37),
    encrypted: true,
    timestamp,
  };
}

export function storedMessageFor(message: DemoMessage, index: number): StoredMessage {
  return { ...wireRecordFor(message, index), text: '[encrypted]', roomId: DEMO_ROOM_ID };
}

// ── The three Redis keys createRoom() actually writes ────────────────────────

export const DEMO_ROOM_ID = 'tyst-ek-4821';
/** A sha256 of an address. Shown truncated, because that is all the key holds. */
export const DEMO_EMAIL_HASH = '9f2c7b41a8d35e6027f1c9ab4e8d05b3';
/** 60 minute room: createRoom does setEx(key, duration * 60, ...). */
export const DEMO_TTL_SECONDS = 60 * 60;
/** redis-room-service.ts: expire(setKey, 7 * 24 * 60 * 60). */
export const ROOMS_BY_EMAIL_TTL_SECONDS = 7 * 24 * 60 * 60;

export function roomKey(roomId: string = DEMO_ROOM_ID): string {
  return `hushroom:room:${roomId}`;
}

export function participantsKey(roomId: string = DEMO_ROOM_ID): string {
  return `hushroom:room:${roomId}:participants`;
}

export function roomsByEmailKey(hash: string = DEMO_EMAIL_HASH): string {
  return `hushroom:rooms-by-email:${hash}`;
}

/** Redis returns -2 for the TTL of a key that does not exist. */
export const TTL_NO_KEY = -2;

/** Shortens a blob for the database column, which quotes values rather than pretty-printing them. */
export function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max)}\u2026`;
}

/** Wraps a long blob so a narrow column shows it as data instead of one runaway line. */
export function chunk(value: string, size: number): string[] {
  if (size <= 0) return [value];
  const parts: string[] = [];
  for (let i = 0; i < value.length; i += size) parts.push(value.slice(i, i + size));
  return parts;
}

/** Step sequencing for the looping animations. */
export function advance(step: number, count: number): number {
  if (count <= 0) return 0;
  return (step + 1) % count;
}

/** mm:ss for the countdown in the link-flow demo. */
export function formatCountdown(secondsLeft: number): string {
  const clamped = Math.max(0, Math.floor(secondsLeft));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
