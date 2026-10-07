import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { RedisClientType } from 'redis';

const KEY_PREFIX = 'hushroom:';

function createLimiter(redisClient: RedisClientType, prefix: string, max: number, windowMs = 15 * 60 * 1000) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, try again later' },
    store: new RedisStore({
      sendCommand: (...args: string[]) => (redisClient as any).sendCommand(args),
      prefix: `${KEY_PREFIX}rl:${prefix}:`,
    }),
  });
}

// Generic API-wide limit — applied to /api/* in server.ts
export function createApiRateLimiter(redisClient: RedisClientType) {
  return createLimiter(redisClient, 'api', 100);
}

// Sends a real email via Lettermint — keep tight
export function createRequestLinkRateLimiter(redisClient: RedisClientType) {
  return createLimiter(redisClient, 'request-link', 5);
}

// Cheap (just compares OTP code) but still abuse-prone — typo-tolerant.
// The auth-service also enforces a per-emailHash 5-attempts cap inside Redis,
// so this IP-cap is the secondary defense.
export function createVerifyCodeRateLimiter(redisClient: RedisClientType) {
  return createLimiter(redisClient, 'verify-code', 10);
}

// Used by joiners who never verify email — must be generous to allow legit
// office WiFi + cellular shared IPs. Generic API limit still applies on top.
export function createLoginRateLimiter(redisClient: RedisClientType) {
  return createLimiter(redisClient, 'login', 50);
}
