import crypto from 'crypto';
import { RedisClientType } from 'redis';

// Partner API keys. A partner (a SaaS embedding Hushroom, an interpretation
// agency, a legal platform) calls POST /api/v1/rooms with a key instead of
// going through email verification like a human creator does.
//
// Storage: only the sha256 of the key is stored, never the key itself. The
// plaintext is returned exactly once, at creation. Losing it means minting a
// new one, which is the intended behaviour.
//
// Usage counting: total rooms per key per month is kept for invoicing. That is
// allowed under the observability policy amended 2026-08-26 (aggregated
// consumption per paying partner, never per end user, per room or per session).

const KEY_PREFIX = 'hr_live_';
const KEY_BYTES = 32;

export interface ApiKeyRecord {
  id: string;
  tenantSlug: string;
  name: string;
  /** first 12 chars of the key, safe to display so a partner can tell keys apart */
  display: string;
  createdAt: number;
  active: boolean;
}

export interface CreatedApiKey extends ApiKeyRecord {
  /** returned once, never stored */
  key: string;
}

export class ApiKeyService {
  private client: RedisClientType;
  /** rooms per key per minute; a booking system bursts, a runaway loop does not stop */
  private readonly rateLimitPerMinute: number;

  constructor(client: RedisClientType, opts: { rateLimitPerMinute?: number } = {}) {
    this.client = client;
    this.rateLimitPerMinute = opts.rateLimitPerMinute ?? 60;
  }

  private static hash(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  private static monthKey(now = Date.now()): string {
    const d = new Date(now);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  async createKey(tenantSlug: string, name: string): Promise<CreatedApiKey> {
    const key = KEY_PREFIX + crypto.randomBytes(KEY_BYTES).toString('base64url');
    const id = crypto.randomUUID();
    const record: ApiKeyRecord = {
      id,
      tenantSlug,
      name,
      display: key.slice(0, 12) + '...',
      createdAt: Date.now(),
      active: true,
    };

    await this.client.set(`hushroom:apikey:${ApiKeyService.hash(key)}`, JSON.stringify(record));
    await this.client.set(`hushroom:apikey-meta:${id}`, JSON.stringify(record));
    await this.client.sAdd(`hushroom:apikeys:${tenantSlug}`, id);

    return { ...record, key };
  }

  /** Returns the record for a valid, active key, or null. Never throws on bad input. */
  async verifyKey(rawKey: string | undefined | null): Promise<ApiKeyRecord | null> {
    if (!rawKey || !rawKey.startsWith(KEY_PREFIX)) return null;
    const raw = await this.client.get(`hushroom:apikey:${ApiKeyService.hash(rawKey)}`);
    if (!raw) return null;
    try {
      const record = JSON.parse(raw) as ApiKeyRecord;
      return record.active ? record : null;
    } catch {
      return null;
    }
  }

  async listKeys(tenantSlug: string): Promise<ApiKeyRecord[]> {
    const ids = await this.client.sMembers(`hushroom:apikeys:${tenantSlug}`);
    const records: ApiKeyRecord[] = [];
    for (const id of ids) {
      const raw = await this.client.get(`hushroom:apikey-meta:${id}`);
      if (!raw) continue;
      try {
        records.push(JSON.parse(raw) as ApiKeyRecord);
      } catch {
        // corrupt entry, skip rather than fail the whole listing
      }
    }
    return records.sort((a, b) => b.createdAt - a.createdAt);
  }

  /** Revoking keeps the record so the partner still sees it in their list, marked inactive. */
  async revokeKey(tenantSlug: string, id: string): Promise<boolean> {
    const raw = await this.client.get(`hushroom:apikey-meta:${id}`);
    if (!raw) return false;
    let record: ApiKeyRecord;
    try {
      record = JSON.parse(raw) as ApiKeyRecord;
    } catch {
      return false;
    }
    if (record.tenantSlug !== tenantSlug) return false;

    record.active = false;
    await this.client.set(`hushroom:apikey-meta:${id}`, JSON.stringify(record));

    // The lookup entry is keyed by the hash of a key we do not have, so walk the
    // partner's keys. Volumes here are tiny (a handful per partner).
    // node-redis v5 yields batches (string[]); older versions yield single keys.
    outer: for await (const batch of this.client.scanIterator({ MATCH: 'hushroom:apikey:*', COUNT: 100 })) {
      const keys: string[] = Array.isArray(batch) ? batch : [batch as unknown as string];
      for (const k of keys) {
        const entry = await this.client.get(k);
        if (!entry) continue;
        try {
          const parsed = JSON.parse(entry) as ApiKeyRecord;
          if (parsed.id === id) {
            parsed.active = false;
            await this.client.set(k, JSON.stringify(parsed));
            break outer;
          }
        } catch {
          // corrupt entry, keep scanning
        }
      }
    }
    return true;
  }

  /** Sliding one-minute window per key. Returns false when the key is over budget. */
  async checkRate(keyId: string, now = Date.now()): Promise<boolean> {
    const minute = Math.floor(now / 60000);
    const redisKey = `hushroom:apikey-rl:${keyId}:${minute}`;
    const count = await this.client.incr(redisKey);
    if (count === 1) await this.client.expire(redisKey, 120);
    return count <= this.rateLimitPerMinute;
  }

  /** Rooms created this month, for invoicing. Aggregated per key, nothing else. */
  async recordRoomCreated(keyId: string, now = Date.now()): Promise<void> {
    const redisKey = `hushroom:usage:${keyId}:${ApiKeyService.monthKey(now)}`;
    await this.client.incr(redisKey);
    // 13 months so a full year is available when invoicing in arrears
    await this.client.expire(redisKey, 60 * 60 * 24 * 400);
  }

  async getUsage(keyId: string, now = Date.now()): Promise<number> {
    const raw = await this.client.get(`hushroom:usage:${keyId}:${ApiKeyService.monthKey(now)}`);
    return raw ? Number(raw) || 0 : 0;
  }
}
