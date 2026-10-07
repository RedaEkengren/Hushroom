import { describe, it, expect, beforeEach } from 'vitest';
import { RedisRoomService } from './redis-room-service.js';
import type { CreateRoomRequest } from './room-types.js';

// Minimal in-memory mock of node-redis covering exactly the surface the
// service touches. TTLs are tracked as expiry timestamps so we can simulate
// expired rooms without sleeping in tests.
function makeMockRedis() {
  const store = new Map<string, string>();
  const expiry = new Map<string, number>(); // key → epoch ms when it expires
  const sets = new Map<string, Set<string>>();
  const published: Array<{ channel: string; data: string }> = [];

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
    sets,
    published,
    on(_event: string, _cb: any) { /* no-op */ },
    async get(key: string) {
      if (isExpired(key)) return null;
      return store.get(key) ?? null;
    },
    async setEx(key: string, ttlSeconds: number, value: string) {
      store.set(key, value);
      expiry.set(key, Date.now() + ttlSeconds * 1000);
    },
    async set(key: string, value: string, opts?: { EX?: number }) {
      store.set(key, value);
      if (opts?.EX) expiry.set(key, Date.now() + opts.EX * 1000);
    },
    async del(key: string) {
      const had = store.delete(key);
      expiry.delete(key);
      return had ? 1 : 0;
    },
    async ttl(key: string) {
      if (!store.has(key)) return -2;
      const exp = expiry.get(key);
      if (exp === undefined) return -1;
      const remaining = Math.ceil((exp - Date.now()) / 1000);
      return remaining > 0 ? remaining : -2;
    },
    async expire(key: string, ttlSeconds: number) {
      if (!store.has(key)) return 0;
      expiry.set(key, Date.now() + ttlSeconds * 1000);
      return 1;
    },
    async exists(key: string) {
      if (isExpired(key)) return 0;
      return store.has(key) ? 1 : 0;
    },
    async sAdd(setKey: string, value: string) {
      if (!sets.has(setKey)) sets.set(setKey, new Set());
      sets.get(setKey)!.add(value);
      return 1;
    },
    async sRem(setKey: string, value: string) {
      const s = sets.get(setKey);
      if (!s) return 0;
      return s.delete(value) ? 1 : 0;
    },
    async sMembers(setKey: string) {
      return Array.from(sets.get(setKey) ?? []);
    },
    async keys(pattern: string) {
      const re = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return Array.from(store.keys()).filter(k => re.test(k) && !isExpired(k));
    },
    async publish(channel: string, data: string) {
      published.push({ channel, data });
      return 0;
    },
    async subscribe(_channel: string, _cb: any) { /* no-op */ },
  } as any;
}

let svc: RedisRoomService;
let mock: ReturnType<typeof makeMockRedis>;

beforeEach(() => {
  mock = makeMockRedis();
  // pubClient + subClient share the same mock — publish goes onto a shared
  // log we can assert against.
  svc = new RedisRoomService(mock, mock, mock);
});

const baseCreateReq: CreateRoomRequest = {
  name: 'Test Room',
  hostName: 'Alice',
  maxParticipants: 4,
  duration: 30, // minutes
};

describe('createRoom', () => {
  it('creates a room with the host as participant', async () => {
    const result = await svc.createRoom(baseCreateReq, 'host-uid', 'host-hash');
    expect(result.success).toBe(true);
    expect(result.room?.id).toBeTruthy();
    expect(result.room?.participants.size).toBe(1);
    expect(result.token).toBeTruthy();
  });

  it('serialises hostEmailHash so deleteRoom can clean up rooms-by-email', async () => {
    const result = await svc.createRoom(baseCreateReq, 'host-uid', 'host-hash');
    const stored = mock.store.get(`hushroom:room:${result.room!.id}`);
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!).hostEmailHash).toBe('host-hash');
  });

  it('adds the new room to rooms-by-email set when emailHash is given', async () => {
    const r = await svc.createRoom(baseCreateReq, 'h1', 'eh1');
    expect(mock.sets.get('hushroom:rooms-by-email:eh1')?.has(r.room!.id)).toBe(true);
  });

  it('skips the rooms-by-email set when no emailHash is given', async () => {
    await svc.createRoom(baseCreateReq, 'h2');
    expect(mock.sets.size).toBe(0);
  });
});

describe('ensureParticipant — happy path', () => {
  it('first-time joiner gets isNew:true', async () => {
    const created = await svc.createRoom(baseCreateReq, 'host-uid', 'host-hash');
    const r = await svc.ensureParticipant(created.room!.id, 'guest-uid', 'Bob');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.isNew).toBe(true);
      expect(r.room.participants.size).toBe(2);
    }
  });

  it('re-join with same userId is idempotent (isNew:false, joinedAt preserved)', async () => {
    const created = await svc.createRoom(baseCreateReq, 'host-uid', 'host-hash');
    const first = await svc.ensureParticipant(created.room!.id, 'guest-uid', 'Bob');
    expect(first.ok).toBe(true);
    const firstJoinedAt = first.ok ? first.room.participants.get('guest-uid')!.joinedAt : 0;

    // Wait a tick, re-join with a different display name
    await new Promise(r => setTimeout(r, 5));
    const second = await svc.ensureParticipant(created.room!.id, 'guest-uid', 'Bob-renamed');
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.isNew).toBe(false);
      expect(second.room.participants.get('guest-uid')!.joinedAt).toBe(firstJoinedAt);
      expect(second.room.participants.get('guest-uid')!.name).toBe('Bob-renamed');
    }
  });
});

describe('ensureParticipant — rejection paths', () => {
  it('non-existent room → reason:not-found', async () => {
    const r = await svc.ensureParticipant('does-not-exist-1234', 'uid', 'name');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not-found');
  });

  it('expired room → reason:expired (and the room key is deleted)', async () => {
    const created = await svc.createRoom(baseCreateReq, 'host-uid');
    const roomId = created.room!.id;
    // Force-expire by rewinding the stored room.expiresAt to the past
    const storeKey = `hushroom:room:${roomId}`;
    const blob = JSON.parse(mock.store.get(storeKey)!);
    blob.expiresAt = Date.now() - 1000;
    mock.store.set(storeKey, JSON.stringify(blob));

    const r = await svc.ensureParticipant(roomId, 'guest-uid', 'Bob');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('expired');
    // The stale key was wiped
    expect(mock.store.has(storeKey)).toBe(false);
  });

  it('locked room rejects NEW joiners with reason:locked', async () => {
    const created = await svc.createRoom(baseCreateReq, 'host-uid');
    await svc.updateRoomLock(created.room!.id, true);

    const r = await svc.ensureParticipant(created.room!.id, 'late-uid', 'Late');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('locked');
  });

  it('locked room still admits EXISTING participants (idempotent re-join)', async () => {
    const created = await svc.createRoom(baseCreateReq, 'host-uid');
    // guest joins while open
    await svc.ensureParticipant(created.room!.id, 'guest-uid', 'Bob');
    // host locks
    await svc.updateRoomLock(created.room!.id, true);
    // guest reconnects (e.g. WS visibilitychange)
    const r = await svc.ensureParticipant(created.room!.id, 'guest-uid', 'Bob');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.isNew).toBe(false);
  });

  it('full room rejects NEW joiners with reason:full', async () => {
    const created = await svc.createRoom(
      { ...baseCreateReq, maxParticipants: 2 },
      'host-uid',
    );
    await svc.ensureParticipant(created.room!.id, 'guest-uid', 'Bob');
    // Room now has 2 of 2 participants. Third joiner gets bounced.
    const r = await svc.ensureParticipant(created.room!.id, 'third-uid', 'Carol');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('full');
  });

  it('full room still admits EXISTING participants (re-join over capacity)', async () => {
    const created = await svc.createRoom(
      { ...baseCreateReq, maxParticipants: 2 },
      'host-uid',
    );
    await svc.ensureParticipant(created.room!.id, 'guest-uid', 'Bob');
    // Re-join an existing — should succeed even at capacity
    const r = await svc.ensureParticipant(created.room!.id, 'guest-uid', 'Bob');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.isNew).toBe(false);
  });
});

describe('updateRoomLock preserves TTL', () => {
  it('does not reset the room TTL when toggling lock', async () => {
    const created = await svc.createRoom(baseCreateReq, 'host-uid');
    const roomKey = `hushroom:room:${created.room!.id}`;
    const ttlBefore = await mock.ttl(roomKey);
    expect(ttlBefore).toBeGreaterThan(0);

    await svc.updateRoomLock(created.room!.id, true);
    const ttlAfter = await mock.ttl(roomKey);
    // Allow ±2s drift from the test runtime; the key should NOT have been
    // reset to a fresh duration.
    expect(Math.abs(ttlAfter - ttlBefore)).toBeLessThanOrEqual(2);
  });

  it('returns false for a non-existent roomId', async () => {
    expect(await svc.updateRoomLock('not-real-9999', true)).toBe(false);
  });
});

describe('countActiveRoomsForUser', () => {
  it('returns 0 for a user with no rooms', async () => {
    expect(await svc.countActiveRoomsForUser('no-rooms-hash')).toBe(0);
  });

  it('counts active rooms and prunes stale entries', async () => {
    const r1 = await svc.createRoom(baseCreateReq, 'h1', 'eh-active');
    const r2 = await svc.createRoom(baseCreateReq, 'h2', 'eh-active');
    expect(await svc.countActiveRoomsForUser('eh-active')).toBe(2);

    // Manually delete room 2's blob (simulating TTL expiry); the set still
    // points at it, so countActiveRoomsForUser should prune.
    mock.store.delete(`hushroom:room:${r2.room!.id}`);
    expect(await svc.countActiveRoomsForUser('eh-active')).toBe(1);
    // After the call the stale set entry was removed
    expect(mock.sets.get('hushroom:rooms-by-email:eh-active')?.has(r2.room!.id)).toBe(false);
    expect(mock.sets.get('hushroom:rooms-by-email:eh-active')?.has(r1.room!.id)).toBe(true);
  });
});

describe('removeParticipant', () => {
  it('removes the user from the room blob without touching others', async () => {
    const created = await svc.createRoom(baseCreateReq, 'host-uid');
    await svc.ensureParticipant(created.room!.id, 'guest-uid', 'Bob');

    await svc.removeParticipant(created.room!.id, 'guest-uid');
    const after = await svc.getRoom(created.room!.id);
    expect(after?.participants.has('guest-uid')).toBe(false);
    expect(after?.participants.has('host-uid')).toBe(true);
  });

  it('is a no-op on a non-existent room', async () => {
    // Should not throw
    await svc.removeParticipant('not-real-9999', 'someone');
  });
});

describe('addParticipant (WS wrapper)', () => {
  it('throws when the room is locked and user is new', async () => {
    const created = await svc.createRoom(baseCreateReq, 'host-uid');
    await svc.updateRoomLock(created.room!.id, true);
    await expect(
      svc.addParticipant(created.room!.id, 'late-uid', 'Late')
    ).rejects.toThrow(/locked/);
  });

  it('does NOT throw on idempotent re-join even when locked', async () => {
    const created = await svc.createRoom(baseCreateReq, 'host-uid');
    await svc.ensureParticipant(created.room!.id, 'guest-uid', 'Bob');
    await svc.updateRoomLock(created.room!.id, true);
    // Re-join through the WS wrapper should succeed
    await svc.addParticipant(created.room!.id, 'guest-uid', 'Bob');
  });
});
