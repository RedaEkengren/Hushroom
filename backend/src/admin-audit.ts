import crypto from 'crypto';
import express from 'express';
import winston from 'winston';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET required for admin-audit IP hashing');
}
const IP_SALT: string = process.env.JWT_SECRET;

const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'hushroom-admin-audit' },
  transports: [
    new winston.transports.File({ filename: 'logs/admin-audit.log' }),
  ],
});

export function hashIp(req: express.Request): string {
  const ip = (req.ip || req.headers['x-forwarded-for'] || 'unknown').toString();
  return crypto.createHmac('sha256', IP_SALT).update(ip).digest('hex').slice(0, 16);
}

type AuditDetails = Record<string, string | number | boolean | null | undefined>;

export function auditEvent(action: string, req: express.Request, details: AuditDetails = {}): void {
  auditLogger.info(action, {
    action,
    ipHash: hashIp(req),
    userAgent: (req.headers['user-agent'] || '').toString().slice(0, 80),
    ...details,
  });
}
