import { RedisClientType } from 'redis';
import crypto from 'crypto';

const KEY_PREFIX = 'hushroom:';

// Single source of truth — also imported by routes/tenant.ts so the public
// HTTP API and getTenantSlugFromHost() can never disagree about reservations.
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  'www', 'api', 'admin', 'mail', 'smtp', 'livekit', 'app', 'static',
]);
export const SLUG_REGEX = /^[a-z0-9-]{1,32}$/;

export interface TenantConfig {
  slug: string;
  adminEmailHash: string;
  displayName: string;
  primaryColor: string;
  logoUrl: string;
  maxRooms: number;
  createdAt: number;
}

export interface DashboardStats {
  roomsToday: number;
  roomsThisMonth: number;
  roomsTotal: number;
  activeNow: number;
}

function dateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function validateSlug(slug: string): void {
  if (!SLUG_REGEX.test(slug)) {
    throw new Error('Invalid slug: must be 1-32 chars, only a-z, 0-9, and hyphens');
  }
  if (RESERVED_SLUGS.has(slug)) {
    throw new Error(`Slug "${slug}" is reserved`);
  }
}

function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

export class TenantService {
  private client: RedisClientType;

  constructor(client: RedisClientType) {
    this.client = client;
  }

  getTenantSlugFromHost(host: string): string | null {
    // Strip port if present
    const hostname = host.split(':')[0];

    // Must end with .hushroom.io
    if (!hostname.endsWith('.hushroom.io')) {
      return null;
    }

    const sub = hostname.slice(0, hostname.length - '.hushroom.io'.length);

    // Must have exactly one subdomain level and not be empty
    if (!sub || sub.includes('.')) {
      return null;
    }

    // Exclude reserved subdomains
    if (RESERVED_SLUGS.has(sub)) {
      return null;
    }

    return sub;
  }

  async getTenant(slug: string): Promise<TenantConfig | null> {
    const raw = await this.client.get(`${KEY_PREFIX}tenant:${slug}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as TenantConfig;
    } catch {
      return null;
    }
  }

  async provisionTenant(
    slug: string,
    adminEmail: string,
    displayName: string,
    primaryColor = '#059669',
    logoUrl = ''
  ): Promise<void> {
    validateSlug(slug);

    const adminEmailHash = hashEmail(adminEmail);

    const config: TenantConfig = {
      slug,
      adminEmailHash,
      displayName,
      primaryColor,
      logoUrl,
      maxRooms: -1,
      createdAt: Date.now(),
    };

    await this.client.set(`${KEY_PREFIX}tenant:${slug}`, JSON.stringify(config));
    await this.client.set(`${KEY_PREFIX}tenant-by-email:${adminEmailHash}`, slug);
  }

  async createAdminOTP(adminEmailHash: string, slug: string): Promise<string> {
    const code = String(crypto.randomInt(100000, 999999));
    const key = `${KEY_PREFIX}admin-otp:${adminEmailHash}`;
    await this.client.setEx(key, 10 * 60, JSON.stringify({ code, slug }));
    return code;
  }

  async verifyAdminOTP(
    adminEmailHash: string,
    code: string,
    slug: string
  ): Promise<string | null> {
    const key = `${KEY_PREFIX}admin-otp:${adminEmailHash}`;
    const raw = await this.client.get(key);
    if (!raw) return null;

    let stored: { code: string; slug: string };
    try {
      stored = JSON.parse(raw);
    } catch {
      return null;
    }

    if (stored.code !== code || stored.slug !== slug) {
      return null;
    }

    // Invalidate OTP
    await this.client.del(key);

    // Create session
    const sessionToken = crypto.randomUUID();
    const sessionKey = `${KEY_PREFIX}admin-session:${sessionToken}`;
    await this.client.setEx(
      sessionKey,
      3600, // 1 hour
      JSON.stringify({ emailHash: adminEmailHash, slug, createdAt: Date.now() })
    );

    return sessionToken;
  }

  async getAdminSession(token: string): Promise<{ emailHash: string; slug: string } | null> {
    const key = `${KEY_PREFIX}admin-session:${token}`;
    const raw = await this.client.get(key);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      return { emailHash: data.emailHash, slug: data.slug };
    } catch {
      return null;
    }
  }

  async deleteAdminSession(token: string): Promise<void> {
    await this.client.del(`${KEY_PREFIX}admin-session:${token}`);
  }

  async recordRoomCreated(slug: string): Promise<void> {
    const today = dateKey(new Date());
    const key = `${KEY_PREFIX}tenant:${slug}:stats:rooms:${today}`;
    const count = await this.client.incr(key);
    if (count === 1) {
      // Set 90-day TTL on first increment
      await this.client.expire(key, 90 * 24 * 60 * 60);
    }
  }

  async getDashboardStats(slug: string): Promise<DashboardStats> {
    const now = new Date();
    const todayKey = dateKey(now);

    // Today's count
    const todayVal = await this.client.get(`${KEY_PREFIX}tenant:${slug}:stats:rooms:${todayKey}`);
    const roomsToday = todayVal ? parseInt(todayVal, 10) : 0;

    // This month (sum all days in current month)
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    let roomsThisMonth = 0;
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const monthKeys: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dd = String(d).padStart(2, '0');
      const mm = String(month).padStart(2, '0');
      monthKeys.push(`${KEY_PREFIX}tenant:${slug}:stats:rooms:${year}${mm}${dd}`);
    }
    const monthVals = await this.client.mGet(monthKeys);
    for (const v of monthVals) {
      if (v) roomsThisMonth += parseInt(v, 10);
    }

    // Total last 90 days
    let roomsTotal = 0;
    const totalKeys: string[] = [];
    for (let i = 0; i < 90; i++) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      totalKeys.push(`${KEY_PREFIX}tenant:${slug}:stats:rooms:${dateKey(d)}`);
    }
    const totalVals = await this.client.mGet(totalKeys);
    for (const v of totalVals) {
      if (v) roomsTotal += parseInt(v, 10);
    }

    return {
      roomsToday,
      roomsThisMonth,
      roomsTotal,
      activeNow: 0, // Will be filled by caller if needed
    };
  }

  async getActiveRoomsCount(slug: string, redisRoomService: any): Promise<number> {
    try {
      // Use scan to find rooms belonging to this tenant's slug
      // We look for any active rooms that have the tenant slug recorded
      const tenantRoomsKey = `${KEY_PREFIX}tenant:${slug}:rooms`;
      const count = await this.client.sCard(tenantRoomsKey);
      return count;
    } catch {
      return 0;
    }
  }

  async addRoomToTenant(slug: string, roomId: string): Promise<void> {
    const key = `${KEY_PREFIX}tenant:${slug}:rooms`;
    await this.client.sAdd(key, roomId);
    // Keep the set around for 90 days max
    await this.client.expire(key, 90 * 24 * 60 * 60);
  }

  hashEmail(email: string): string {
    return hashEmail(email);
  }
}
