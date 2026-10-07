import { describe, it, expect, beforeEach } from 'vitest';
import { TierService } from './tier-service.js';

// In-memory Redis mock — same shape as the other backend test mocks.
function makeMockRedis() {
  const store = new Map<string, string>();
  const expiry = new Map<string, number>();

  const isExpired = (key: string): boolean => {
    const exp = expiry.get(key);
    if (exp === undefined) return false;
    if (Date.now() >= exp) {
      store.delete(key);
      expiry.delete(key);
      return true;
    }
    return false;
  };

  return {
    store,
    expiry,
    async get(key: string) {
      if (isExpired(key)) return null;
      return store.get(key) ?? null;
    },
    async set(key: string, value: string) {
      store.set(key, value);
      expiry.delete(key); // .set without EX = no TTL
    },
    async setEx(key: string, ttlSeconds: number, value: string) {
      store.set(key, value);
      expiry.set(key, Date.now() + ttlSeconds * 1000);
    },
    async ttl(key: string) {
      if (!store.has(key)) return -2;
      const exp = expiry.get(key);
      if (exp === undefined) return -1;
      const remaining = Math.ceil((exp - Date.now()) / 1000);
      return remaining > 0 ? remaining : -2;
    },
  } as any;
}

let mock: ReturnType<typeof makeMockRedis>;
let svc: TierService;

beforeEach(() => {
  mock = makeMockRedis();
  svc = new TierService(mock);
});

describe('getTier — defaults', () => {
  it('returns "demo" for a brand-new user (no trial, no sub)', async () => {
    expect(await svc.getTier('fresh-hash')).toBe('demo');
  });
});

describe('getTier — trial path', () => {
  it('returns "pro" while a trial Redis key is present', async () => {
    await svc.startTrial('trial-hash');
    expect(await svc.getTier('trial-hash')).toBe('pro');
  });

  it('reverts to "demo" once the trial key has expired', async () => {
    await svc.startTrial('expiring-hash');
    // Force-expire the trial key
    mock.expiry.set('hushroom:trial:expiring-hash', Date.now() - 1);
    expect(await svc.getTier('expiring-hash')).toBe('demo');
  });
});

describe('getTier — subscription path', () => {
  it('returns sub.tier when subscription is active (overrides trial)', async () => {
    // Even with a trial in flight, an active sub takes precedence
    await svc.startTrial('mixed-hash');
    await svc.setSubscription('mixed-hash', {
      tier: 'firm',
      stripeCustomerId: 'cus_123',
      subscriptionId: 'sub_456',
      status: 'active',
      currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });
    expect(await svc.getTier('mixed-hash')).toBe('firm');
  });

  it('falls through to trial when subscription is past_due / cancelled', async () => {
    await svc.startTrial('cancelled-but-trialing');
    await svc.setSubscription('cancelled-but-trialing', {
      tier: 'pro',
      stripeCustomerId: 'cus_x',
      subscriptionId: 'sub_y',
      status: 'cancelled',
      currentPeriodEnd: Date.now(),
    });
    // Cancelled sub doesn't gate, trial does → 'pro'
    expect(await svc.getTier('cancelled-but-trialing')).toBe('pro');
  });

  it('falls through to "demo" when sub is cancelled and no trial', async () => {
    await svc.setSubscription('lapsed-hash', {
      tier: 'pro',
      stripeCustomerId: 'cus_z',
      subscriptionId: 'sub_z',
      status: 'cancelled',
      currentPeriodEnd: Date.now(),
    });
    expect(await svc.getTier('lapsed-hash')).toBe('demo');
  });
});

describe('startTrial', () => {
  it('writes the trial key with a 14-day TTL', async () => {
    const { trialEnd } = await svc.startTrial('ttl-hash');
    const key = 'hushroom:trial:ttl-hash';
    expect(mock.store.has(key)).toBe(true);
    const ttl = await mock.ttl(key);
    // Allow ±5s drift; real value = 14d in seconds
    const fourteenDays = 14 * 24 * 60 * 60;
    expect(Math.abs(ttl - fourteenDays)).toBeLessThanOrEqual(5);
    // trialEnd should be ~14d from now
    expect(trialEnd - Date.now()).toBeGreaterThan(13 * 24 * 60 * 60 * 1000);
    expect(trialEnd - Date.now()).toBeLessThan(15 * 24 * 60 * 60 * 1000);
  });

  it('overwrites an existing trial (route layer handles the idempotency)', async () => {
    // The TierService.startTrial is intentionally NOT idempotent — it just
    // resets startedAt + TTL. Idempotency is enforced in routes/billing.ts
    // via getTier()-gating before calling startTrial. This test pins the
    // current behaviour so the gate semantics don't silently change.
    await svc.startTrial('reset-hash');
    const firstBlob = JSON.parse(mock.store.get('hushroom:trial:reset-hash')!);

    await new Promise(r => setTimeout(r, 5));
    await svc.startTrial('reset-hash');
    const secondBlob = JSON.parse(mock.store.get('hushroom:trial:reset-hash')!);

    expect(secondBlob.startedAt).toBeGreaterThan(firstBlob.startedAt);
  });
});

describe('getTrialEnd', () => {
  it('returns null when no trial key exists', async () => {
    expect(await svc.getTrialEnd('no-trial')).toBeNull();
  });

  it('returns a future timestamp when trial is active', async () => {
    await svc.startTrial('active-trial');
    const end = await svc.getTrialEnd('active-trial');
    expect(end).not.toBeNull();
    expect(end!).toBeGreaterThan(Date.now());
  });

  it('returns null when the trial key has expired', async () => {
    await svc.startTrial('soon-expired');
    mock.expiry.set('hushroom:trial:soon-expired', Date.now() - 1);
    expect(await svc.getTrialEnd('soon-expired')).toBeNull();
  });
});

describe('getSubscription', () => {
  it('returns null when no subscription is set', async () => {
    expect(await svc.getSubscription('none')).toBeNull();
  });

  it('round-trips a complete subscription record', async () => {
    const data = {
      tier: 'pro' as const,
      stripeCustomerId: 'cus_AAA',
      subscriptionId: 'sub_BBB',
      status: 'active',
      currentPeriodEnd: 9999999999,
      email: 'should-not-leak@example.com',
    };
    await svc.setSubscription('roundtrip', data);
    const back = await svc.getSubscription('roundtrip');
    expect(back).toEqual(data);
  });

  it('returns null when stored JSON is corrupt (defensive)', async () => {
    mock.store.set('hushroom:sub:corrupt', '{not valid json');
    expect(await svc.getSubscription('corrupt')).toBeNull();
  });
});

describe('Redis key namespacing', () => {
  it('uses hushroom:trial:<hash> + hushroom:sub:<hash> (production layout)', async () => {
    await svc.startTrial('layout-hash');
    await svc.setSubscription('layout-hash', {
      tier: 'pro',
      stripeCustomerId: 'cus',
      subscriptionId: 'sub',
      status: 'active',
      currentPeriodEnd: 0,
    });
    expect(mock.store.has('hushroom:trial:layout-hash')).toBe(true);
    expect(mock.store.has('hushroom:sub:layout-hash')).toBe(true);
  });
});
