import { describe, it, expect } from 'vitest';
import { deriveKey, encryptMessage, generatePassphrase } from './crypto';
import {
  DEMO_EMAIL_HASH,
  DEMO_ROOM_ID,
  DEMO_TTL_SECONDS,
  ROOMS_BY_EMAIL_TTL_SECONDS,
  TTL_NO_KEY,
  advance,
  base64Length,
  chunk,
  fakeBase64,
  formatCountdown,
  participantsKey,
  payloadBytes,
  roomKey,
  roomsByEmailKey,
  storedMessageFor,
  truncate,
  utf8Bytes,
  wireRecordFor,
} from './demo-data';
import { LANDING_COPY } from './landing-copy';

// The point of this file is the "matches the real thing" block at the bottom.
// ServerViewDemo tells visitors it shows what the server actually holds, so the
// blob lengths are checked against real encryptMessage output rather than
// against a hard-coded number someone could quietly drift away from.

describe('utf8Bytes', () => {
  it('counts ASCII as one byte', () => {
    expect(utf8Bytes('hello')).toBe(5);
  });

  it('counts Swedish characters as two bytes', () => {
    expect(utf8Bytes('å')).toBe(2);
    expect(utf8Bytes('hörs')).toBe(5);
  });

  it('counts astral characters as four bytes', () => {
    expect(utf8Bytes('\u{1F512}')).toBe(4);
  });

  it('agrees with TextEncoder for mixed text', () => {
    const text = 'Ja, 14:00 funkar bra. åäö';
    expect(utf8Bytes(text)).toBe(new TextEncoder().encode(text).length);
  });
});

describe('base64Length', () => {
  it('is a multiple of four', () => {
    for (let n = 0; n < 200; n++) expect(base64Length(n) % 4).toBe(0);
  });

  it('matches btoa for real byte strings', () => {
    for (let n = 1; n < 60; n++) {
      const bin = 'a'.repeat(n);
      expect(base64Length(n)).toBe(btoa(bin).length);
    }
  });
});

describe('fakeBase64', () => {
  it('returns exactly the length the byte count encodes to', () => {
    for (let n = 1; n < 120; n++) {
      expect(fakeBase64(n, n).length).toBe(base64Length(n));
    }
  });

  it('pads the way base64 does', () => {
    for (let n = 1; n < 120; n++) {
      const out = fakeBase64(n, n);
      const expected = n % 3 === 0 ? 0 : n % 3 === 1 ? 2 : 1;
      expect(out.length - out.replace(/=+$/, '').length).toBe(expected);
      expect(out.slice(0, out.length - expected)).toMatch(/^[A-Za-z0-9+/]*$/);
    }
  });

  it('decodes as valid base64', () => {
    for (let n = 1; n < 80; n++) {
      expect(() => atob(fakeBase64(n, n * 31))).not.toThrow();
      expect(atob(fakeBase64(n, n * 31)).length).toBe(n);
    }
  });

  it('is deterministic for a given seed and different across seeds', () => {
    expect(fakeBase64(48, 7)).toBe(fakeBase64(48, 7));
    expect(fakeBase64(48, 7)).not.toBe(fakeBase64(48, 8));
  });
});

describe('payloadBytes', () => {
  it('measures the JSON envelope crypto.ts builds', () => {
    const sender = 'Anna';
    const ts = 1787771592246;
    const text = 'Hej';
    expect(payloadBytes(sender, ts, text)).toBe(
      new TextEncoder().encode(JSON.stringify({ s: sender, t: ts, m: text })).length,
    );
  });
});

describe('wireRecordFor', () => {
  it('has exactly the fields the relay broadcasts, and no text field', () => {
    // websocket-service.ts builds { id, user, ciphertext, nonce, encrypted, timestamp }
    // and only adds text: '[encrypted]' on the record it persists.
    const record = wireRecordFor({ sender: 'Anna', text: 'Hej' }, 0);
    expect(Object.keys(record).sort()).toEqual(
      ['ciphertext', 'encrypted', 'nonce', 'timestamp', 'user'].sort(),
    );
    expect(record).not.toHaveProperty('text');
    expect(record.encrypted).toBe(true);
  });

  it('keeps the display name, because the server really does see it', () => {
    expect(wireRecordFor({ sender: 'Anna', text: 'Hej' }, 0).user).toBe('Anna');
  });

  it('never leaks the plaintext into any field', () => {
    const record = wireRecordFor({ sender: 'Anna', text: 'Hemligt' }, 1);
    expect(JSON.stringify(record)).not.toContain('Hemligt');
  });

  it('produces a 32-character nonce, the base64 of 24 bytes', () => {
    const record = wireRecordFor({ sender: 'Anna', text: 'Hej' }, 0);
    expect(record.nonce).toHaveLength(32);
    expect(atob(record.nonce).length).toBe(24);
  });

  it('is stable across calls and increases the timestamp per message', () => {
    const a = wireRecordFor({ sender: 'Anna', text: 'Hej' }, 0);
    expect(wireRecordFor({ sender: 'Anna', text: 'Hej' }, 0)).toEqual(a);
    expect(wireRecordFor({ sender: 'Anna', text: 'Hej' }, 1).timestamp).toBeGreaterThan(a.timestamp);
  });

  it('gives different messages different blobs', () => {
    const a = wireRecordFor({ sender: 'Anna', text: 'Hej' }, 0);
    const b = wireRecordFor({ sender: 'Johan', text: 'Ja' }, 1);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.nonce).not.toBe(b.nonce);
  });
});

describe('storedMessageFor', () => {
  it('is the wire record plus the [encrypted] placeholder the backend persists', () => {
    const wire = wireRecordFor({ sender: 'Anna', text: 'Hej' }, 0);
    const stored = storedMessageFor({ sender: 'Anna', text: 'Hej' }, 0);
    expect(stored.text).toBe('[encrypted]');
    expect(stored.roomId).toBe(DEMO_ROOM_ID);
    for (const key of Object.keys(wire) as (keyof typeof wire)[]) {
      expect(stored[key]).toEqual(wire[key]);
    }
  });

  it('still never contains the plaintext', () => {
    expect(JSON.stringify(storedMessageFor({ sender: 'Anna', text: 'Hemligt' }, 0))).not.toContain('Hemligt');
  });
});

describe('the Redis keys match redis-room-service.ts', () => {
  it('builds the three keys createRoom actually writes', () => {
    expect(roomKey('tyst-ek-4821')).toBe('hushroom:room:tyst-ek-4821');
    expect(participantsKey('tyst-ek-4821')).toBe('hushroom:room:tyst-ek-4821:participants');
    expect(roomsByEmailKey('abc123')).toBe('hushroom:rooms-by-email:abc123');
  });

  it('prefixes every key with hushroom:, as KEY_PREFIX does', () => {
    for (const key of [roomKey(), participantsKey(), roomsByEmailKey()]) {
      expect(key.startsWith('hushroom:')).toBe(true);
    }
  });

  it('uses the TTLs the service sets', () => {
    expect(DEMO_TTL_SECONDS).toBe(60 * 60); // setEx(key, duration * 60, ...) for a 60 min room
    expect(ROOMS_BY_EMAIL_TTL_SECONDS).toBe(7 * 24 * 60 * 60); // expire(setKey, 7 days)
  });

  it('uses -2 for the TTL of a missing key, which is what Redis returns', () => {
    expect(TTL_NO_KEY).toBe(-2);
  });

  it('keys the email set by a hash, never by an address', () => {
    expect(DEMO_EMAIL_HASH).toMatch(/^[0-9a-f]+$/);
    expect(roomsByEmailKey()).not.toContain('@');
  });
});

describe('truncate', () => {
  it('leaves short values alone', () => {
    expect(truncate('abc', 8)).toBe('abc');
  });

  it('cuts to the given length and marks the cut', () => {
    expect(truncate('abcdefghij', 4)).toBe('abcd\u2026');
  });
});

describe('the demo matches what crypto.ts actually produces', () => {
  const key = deriveKey(generatePassphrase());

  const cases = (['sv', 'en'] as const).flatMap((lang) =>
    LANDING_COPY[lang].serverView.messages.map((m) => ({ lang, ...m })),
  );

  it.each(cases)('$lang: "$text" has the real ciphertext length', ({ sender, text }) => {
    const record = wireRecordFor({ sender, text }, 0);
    const real = encryptMessage(text, key, sender, record.timestamp);
    expect(record.ciphertext).toHaveLength(real.ciphertext.length);
    expect(record.nonce).toHaveLength(real.nonce.length);
  });

  it('encrypts the same JSON envelope the demo measures', () => {
    const record = wireRecordFor({ sender: 'Anna', text: 'Hej' }, 0);
    const real = encryptMessage('Hej', key, 'Anna', record.timestamp);
    expect(Object.keys(real).sort()).toEqual(['ciphertext', 'nonce']);
    // Both sides agree on how many bytes the plaintext envelope is.
    expect(base64Length(payloadBytes('Anna', record.timestamp, 'Hej') + 16)).toBe(real.ciphertext.length);
  });
});

describe('chunk', () => {
  it('splits into pieces of the given size and loses nothing', () => {
    expect(chunk('abcdefg', 3)).toEqual(['abc', 'def', 'g']);
    expect(chunk('abcdefg', 3).join('')).toBe('abcdefg');
  });

  it('returns the whole value for a non-positive size', () => {
    expect(chunk('abc', 0)).toEqual(['abc']);
    expect(chunk('abc', -1)).toEqual(['abc']);
  });

  it('returns nothing for an empty string', () => {
    expect(chunk('', 4)).toEqual([]);
  });
});

describe('advance', () => {
  it('wraps at the end', () => {
    expect(advance(0, 5)).toBe(1);
    expect(advance(4, 5)).toBe(0);
  });

  it('never returns an out-of-range index', () => {
    let step = 0;
    for (let i = 0; i < 50; i++) {
      step = advance(step, 5);
      expect(step).toBeGreaterThanOrEqual(0);
      expect(step).toBeLessThan(5);
    }
  });

  it('is safe for a zero step count', () => {
    expect(advance(3, 0)).toBe(0);
  });
});

describe('formatCountdown', () => {
  it('formats as mm:ss', () => {
    expect(formatCountdown(3600)).toBe('60:00');
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(61)).toBe('01:01');
    expect(formatCountdown(599)).toBe('09:59');
  });

  it('clamps negatives and floors fractions', () => {
    expect(formatCountdown(-5)).toBe('00:00');
    expect(formatCountdown(90.9)).toBe('01:30');
  });
});
