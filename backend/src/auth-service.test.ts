import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from './auth-service.js';

// Minimal in-memory Redis mock — covers exactly the methods AuthService uses.
// TTLs are ignored in tests; we exercise them via explicit del() calls instead.
function makeMockRedis() {
  const store = new Map<string, string>();
  const sets = new Map<string, Set<string>>();
  return {
    store,
    sets,
    async setEx(key: string, _ttl: number, value: string) {
      store.set(key, String(value));
    },
    async del(key: string) {
      store.delete(key);
    },
    async incr(key: string) {
      const n = parseInt(store.get(key) ?? '0', 10) + 1;
      store.set(key, String(n));
      return n;
    },
    async expire(_key: string, _ttl: number) {
      return 1;
    },
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async sIsMember(setKey: string, value: string) {
      return sets.get(setKey)?.has(value) ?? false;
    },
    async sAdd(setKey: string, value: string) {
      if (!sets.has(setKey)) sets.set(setKey, new Set());
      sets.get(setKey)!.add(value);
      return 1;
    },
  } as any;
}

let svc: AuthService;
let redis: ReturnType<typeof makeMockRedis>;

beforeEach(() => {
  redis = makeMockRedis();
  svc = new AuthService(redis);
});

describe('hashEmail', () => {
  it('produces a 64-char hex SHA-256', () => {
    const h = svc.hashEmail('user@example.com');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is case-insensitive', () => {
    expect(svc.hashEmail('User@Example.com')).toBe(svc.hashEmail('user@example.com'));
  });

  it('trims whitespace', () => {
    expect(svc.hashEmail('  user@example.com  ')).toBe(svc.hashEmail('user@example.com'));
  });
});

describe('createOTP + verifyOTP round-trip', () => {
  it('issues a 6-digit numeric code', async () => {
    const code = await svc.createOTP('test@example.com');
    expect(code).toMatch(/^\d{6}$/);
  });

  it('stores ONLY the code in Redis (no plaintext email)', async () => {
    const email = 'leak-test@example.com';
    const code = await svc.createOTP(email);

    // The OTP key uses the email hash, not the email itself
    const hash = svc.hashEmail(email);
    const stored = redis.store.get(`hushroom:otp:${hash}`);
    expect(stored).toBe(code);

    // No entry in Redis should reveal the plaintext email
    for (const [k, v] of redis.store) {
      expect(k).not.toContain(email);
      expect(v).not.toContain(email);
    }
  });

  it('verifies with correct code → returns emailHash', async () => {
    const email = 'good@example.com';
    const code = await svc.createOTP(email);
    const result = await svc.verifyOTP(email, code);
    expect(result).toBe(svc.hashEmail(email));
  });

  it('rejects wrong code → returns null', async () => {
    const email = 'wrong-code@example.com';
    await svc.createOTP(email);
    expect(await svc.verifyOTP(email, '000000')).toBeNull();
  });

  it('rejects an unissued email → returns null', async () => {
    expect(await svc.verifyOTP('never-issued@example.com', '123456')).toBeNull();
  });

  it('deletes the OTP after a successful verify', async () => {
    const email = 'one-shot@example.com';
    const code = await svc.createOTP(email);
    await svc.verifyOTP(email, code);
    const hash = svc.hashEmail(email);
    expect(redis.store.has(`hushroom:otp:${hash}`)).toBe(false);
  });
});

describe('verifyOTP brute-force protection', () => {
  it('invalidates the OTP after >5 failed attempts', async () => {
    const email = 'brute@example.com';
    const code = await svc.createOTP(email);

    // 5 wrong attempts (allowed); 6th attempt invalidates
    for (let i = 0; i < 5; i++) {
      expect(await svc.verifyOTP(email, '000000')).toBeNull();
    }
    expect(await svc.verifyOTP(email, '111111')).toBeNull();

    // After lockout, even the correct code no longer works
    expect(await svc.verifyOTP(email, code)).toBeNull();

    // OTP key should be gone
    const hash = svc.hashEmail(email);
    expect(redis.store.has(`hushroom:otp:${hash}`)).toBe(false);
  });
});

describe('ban list', () => {
  it('isEmailBanned returns false for unbanned hash', async () => {
    expect(await svc.isEmailBanned(svc.hashEmail('clean@example.com'))).toBe(false);
  });

  it('banEmail + isEmailBanned round-trip', async () => {
    const hash = svc.hashEmail('bad-actor@example.com');
    await svc.banEmail(hash);
    expect(await svc.isEmailBanned(hash)).toBe(true);
  });

  it('bans are independent per hash', async () => {
    const banned = svc.hashEmail('blocked@example.com');
    const clean = svc.hashEmail('innocent@example.com');
    await svc.banEmail(banned);
    expect(await svc.isEmailBanned(banned)).toBe(true);
    expect(await svc.isEmailBanned(clean)).toBe(false);
  });
});

describe('checkRoomCreationRate', () => {
  it('allows the first 10 calls', async () => {
    const hash = svc.hashEmail('busy@example.com');
    for (let i = 0; i < 10; i++) {
      expect(await svc.checkRoomCreationRate(hash)).toBe(true);
    }
  });

  it('blocks call 11+', async () => {
    const hash = svc.hashEmail('over-limit@example.com');
    for (let i = 0; i < 10; i++) await svc.checkRoomCreationRate(hash);
    expect(await svc.checkRoomCreationRate(hash)).toBe(false);
    expect(await svc.checkRoomCreationRate(hash)).toBe(false);
  });

  it('rate is per-emailHash, not global', async () => {
    const a = svc.hashEmail('user-a@example.com');
    const b = svc.hashEmail('user-b@example.com');
    for (let i = 0; i < 10; i++) await svc.checkRoomCreationRate(a);
    expect(await svc.checkRoomCreationRate(a)).toBe(false);
    // user-b is fresh
    expect(await svc.checkRoomCreationRate(b)).toBe(true);
  });
});
