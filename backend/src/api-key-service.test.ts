import { describe, it, expect, beforeEach } from 'vitest';
import { ApiKeyService } from './api-key-service.js';

// In-memory Redis mock covering exactly what ApiKeyService touches, in the same
// style as auth-service.test.ts.
function makeMockRedis() {
  const store = new Map<string, string>();
  const sets = new Map<string, Set<string>>();
  return {
    store,
    sets,
    async set(key: string, value: string) {
      store.set(key, String(value));
    },
    async get(key: string) {
      return store.get(key) ?? null;
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
    async sAdd(setKey: string, value: string) {
      if (!sets.has(setKey)) sets.set(setKey, new Set());
      sets.get(setKey)!.add(value);
      return 1;
    },
    async sMembers(setKey: string) {
      return [...(sets.get(setKey) ?? [])];
    },
    scanIterator({ MATCH }: { MATCH: string; COUNT?: number }) {
      const prefix = MATCH.replace(/\*$/, '');
      const keys = [...store.keys()].filter((k) => k.startsWith(prefix));
      return (async function* () {
        for (const k of keys) yield k;
      })();
    },
  } as any;
}

let svc: ApiKeyService;
let redis: ReturnType<typeof makeMockRedis>;

beforeEach(() => {
  redis = makeMockRedis();
  svc = new ApiKeyService(redis, { rateLimitPerMinute: 3 });
});

describe('ApiKeyService.createKey', () => {
  it('returns a key with the hr_live_ prefix and a maskable display value', async () => {
    const created = await svc.createKey('byraan', 'Booking system');
    expect(created.key.startsWith('hr_live_')).toBe(true);
    expect(created.key.length).toBeGreaterThan(20);
    expect(created.display.endsWith('...')).toBe(true);
    expect(created.display.length).toBeLessThan(created.key.length);
    expect(created.active).toBe(true);
    expect(created.tenantSlug).toBe('byraan');
  });

  it('never stores the plaintext key', async () => {
    const created = await svc.createKey('byraan', 'Booking system');
    const stored = [...redis.store.values()].join('|');
    expect(stored).not.toContain(created.key);
  });

  it('mints a distinct key every time', async () => {
    const a = await svc.createKey('byraan', 'one');
    const b = await svc.createKey('byraan', 'two');
    expect(a.key).not.toBe(b.key);
    expect(a.id).not.toBe(b.id);
  });
});

describe('ApiKeyService.verifyKey', () => {
  it('accepts a freshly created key', async () => {
    const created = await svc.createKey('byraan', 'Booking system');
    const record = await svc.verifyKey(created.key);
    expect(record?.id).toBe(created.id);
    expect(record?.tenantSlug).toBe('byraan');
  });

  it('rejects unknown, malformed, empty and missing keys', async () => {
    await svc.createKey('byraan', 'Booking system');
    expect(await svc.verifyKey('hr_live_totallywrong')).toBeNull();
    expect(await svc.verifyKey('not-a-key')).toBeNull();
    expect(await svc.verifyKey('')).toBeNull();
    expect(await svc.verifyKey(undefined)).toBeNull();
    expect(await svc.verifyKey(null)).toBeNull();
  });

  it('rejects a revoked key', async () => {
    const created = await svc.createKey('byraan', 'Booking system');
    expect(await svc.revokeKey('byraan', created.id)).toBe(true);
    expect(await svc.verifyKey(created.key)).toBeNull();
  });

  it('returns null instead of throwing on a corrupt record', async () => {
    const created = await svc.createKey('byraan', 'Booking system');
    for (const k of redis.store.keys()) {
      if (k.startsWith('hushroom:apikey:')) redis.store.set(k, 'not json');
    }
    expect(await svc.verifyKey(created.key)).toBeNull();
  });
});

describe('ApiKeyService.listKeys and revokeKey', () => {
  it('lists a tenant keys newest first and never exposes the secret', async () => {
    const a = await svc.createKey('byraan', 'one');
    await new Promise((r) => setTimeout(r, 2));
    const b = await svc.createKey('byraan', 'two');
    const list = await svc.listKeys('byraan');
    expect(list.map((k) => k.id)).toEqual([b.id, a.id]);
    expect(JSON.stringify(list)).not.toContain(a.key);
    expect(JSON.stringify(list)).not.toContain(b.key);
  });

  it('does not list another tenant keys', async () => {
    await svc.createKey('byraan', 'one');
    expect(await svc.listKeys('annan-byra')).toEqual([]);
  });

  it('refuses to revoke a key belonging to another tenant', async () => {
    const created = await svc.createKey('byraan', 'one');
    expect(await svc.revokeKey('annan-byra', created.id)).toBe(false);
    expect(await svc.verifyKey(created.key)).not.toBeNull();
  });

  it('returns false for an unknown key id', async () => {
    expect(await svc.revokeKey('byraan', 'no-such-id')).toBe(false);
  });

  it('keeps the revoked key in the listing, marked inactive', async () => {
    const created = await svc.createKey('byraan', 'one');
    await svc.revokeKey('byraan', created.id);
    const list = await svc.listKeys('byraan');
    expect(list).toHaveLength(1);
    expect(list[0].active).toBe(false);
  });
});

describe('ApiKeyService.checkRate', () => {
  it('allows up to the limit and blocks past it within the same minute', async () => {
    const now = 1_800_000_000_000;
    expect(await svc.checkRate('key-1', now)).toBe(true);
    expect(await svc.checkRate('key-1', now)).toBe(true);
    expect(await svc.checkRate('key-1', now)).toBe(true);
    expect(await svc.checkRate('key-1', now)).toBe(false);
  });

  it('resets when the minute rolls over', async () => {
    const now = 1_800_000_000_000;
    for (let i = 0; i < 4; i++) await svc.checkRate('key-1', now);
    expect(await svc.checkRate('key-1', now + 60_000)).toBe(true);
  });

  it('counts each key separately', async () => {
    const now = 1_800_000_000_000;
    for (let i = 0; i < 4; i++) await svc.checkRate('key-1', now);
    expect(await svc.checkRate('key-2', now)).toBe(true);
  });
});

describe('ApiKeyService usage counting', () => {
  it('counts rooms per key per month and starts at zero', async () => {
    const jan = Date.UTC(2026, 0, 15);
    expect(await svc.getUsage('key-1', jan)).toBe(0);
    await svc.recordRoomCreated('key-1', jan);
    await svc.recordRoomCreated('key-1', jan);
    expect(await svc.getUsage('key-1', jan)).toBe(2);
  });

  it('keeps months apart', async () => {
    const jan = Date.UTC(2026, 0, 15);
    const feb = Date.UTC(2026, 1, 15);
    await svc.recordRoomCreated('key-1', jan);
    expect(await svc.getUsage('key-1', feb)).toBe(0);
  });

  it('keeps keys apart', async () => {
    const jan = Date.UTC(2026, 0, 15);
    await svc.recordRoomCreated('key-1', jan);
    expect(await svc.getUsage('key-2', jan)).toBe(0);
  });

  it('records nothing that identifies an end user, a room or a session', async () => {
    const jan = Date.UTC(2026, 0, 15);
    await svc.recordRoomCreated('key-1', jan);
    const usageKeys = [...redis.store.keys()].filter((k) => k.startsWith('hushroom:usage:'));
    expect(usageKeys).toEqual(['hushroom:usage:key-1:2026-01']);
    expect(redis.store.get(usageKeys[0])).toBe('1');
  });
});
