import crypto from 'crypto';
import { RedisClientType } from 'redis';

const KEY_PREFIX = 'hushroom:';

export class AuthService {
  private client: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.client = redisClient;
  }

  hashEmail(email: string): string {
    return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
  }

  generateOTP(): string {
    // 6-digit numeric code (100000-999999)
    return String(crypto.randomInt(100000, 999999));
  }

  async createOTP(email: string): Promise<string> {
    const emailHash = this.hashEmail(email);
    const code = this.generateOTP();
    const key = `${KEY_PREFIX}otp:${emailHash}`;
    const attemptsKey = `${KEY_PREFIX}otp-attempts:${emailHash}`;

    // Store only the code — key itself is sha256(email), so the hash binds
    // the code to the address without keeping plaintext in Redis.
    await this.client.setEx(key, 10 * 60, code);
    // Reset attempts counter
    await this.client.del(attemptsKey);

    return code;
  }

  async verifyOTP(email: string, code: string): Promise<string | null> {
    const emailHash = this.hashEmail(email);
    const key = `${KEY_PREFIX}otp:${emailHash}`;
    const attemptsKey = `${KEY_PREFIX}otp-attempts:${emailHash}`;

    // Check attempts (max 5)
    const attempts = await this.client.incr(attemptsKey);
    if (attempts === 1) {
      await this.client.expire(attemptsKey, 10 * 60); // same TTL as OTP
    }
    if (attempts > 5) {
      await this.client.del(key); // Invalidate code after too many attempts
      await this.client.del(attemptsKey);
      return null;
    }

    const storedCode = await this.client.get(key);
    if (!storedCode) return null;

    if (code !== storedCode) return null;

    // Valid — delete OTP and attempts
    await this.client.del(key);
    await this.client.del(attemptsKey);

    // Store creator record (30 day TTL)
    const creatorKey = `${KEY_PREFIX}creator:${emailHash}`;
    const now = Date.now();

    const existing = await this.client.get(creatorKey);
    const creatorData = existing
      ? { ...JSON.parse(existing), lastRoomAt: now }
      : { createdAt: now, lastRoomAt: now };

    await this.client.setEx(creatorKey, 30 * 24 * 60 * 60, JSON.stringify(creatorData));

    return emailHash;
  }

  async isEmailBanned(emailHash: string): Promise<boolean> {
    const result = await this.client.sIsMember(`${KEY_PREFIX}banned`, emailHash);
    return !!result;
  }

  async banEmail(emailHash: string): Promise<void> {
    await this.client.sAdd(`${KEY_PREFIX}banned`, emailHash);
  }

  async checkRoomCreationRate(emailHash: string): Promise<boolean> {
    const key = `${KEY_PREFIX}ratelimit:room:${emailHash}`;
    const count = await this.client.incr(key);

    // Set TTL on first increment
    if (count === 1) {
      await this.client.expire(key, 3600); // 1 hour
    }

    return count <= 10; // max 10 rooms per hour
  }
}
