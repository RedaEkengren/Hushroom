import express from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { TenantService } from './tenant-service.js';
import { sendVerificationCode } from './email-service.js';
import { auditEvent } from './admin-audit.js';
import winston from 'winston';

const KEY_PREFIX = 'hushroom:';

// Extend Request type to carry admin context
declare global {
  namespace Express {
    interface Request {
      adminSlug?: string;
      adminEmailHash?: string;
    }
  }
}

let tenantServiceRef: TenantService | null = null;
let redisClientRef: any = null;
let loggerRef: winston.Logger | null = null;

export function initAdminRoutes(
  tenantService: TenantService,
  redisClient: any,
  logger: winston.Logger
): express.Router {
  tenantServiceRef = tenantService;
  redisClientRef = redisClient;
  loggerRef = logger;

  const router = express.Router();

  // Admin OTP rate limiter: 5 req / 15 min per IP
  const adminOtpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, try again later' },
    store: new RedisStore({
      sendCommand: (...args: string[]) => (redisClient as any).sendCommand(args),
      prefix: `${KEY_PREFIX}rl:admin-otp:`,
    }),
  });

  // Middleware: validate admin session from X-Admin-Token header
  const requireAdminSession: express.RequestHandler = async (req, res, next) => {
    const token = req.headers['x-admin-token'] as string | undefined;
    if (!token) {
      return res.status(401).json({ error: 'Missing X-Admin-Token header' });
    }

    const session = await tenantServiceRef!.getAdminSession(token);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Verify slug matches Host header
    const host = req.headers.host || '';
    const slug = tenantServiceRef!.getTenantSlugFromHost(host);
    if (!slug || slug !== session.slug) {
      return res.status(401).json({ error: 'Session does not match this subdomain' });
    }

    req.adminSlug = session.slug;
    req.adminEmailHash = session.emailHash;
    next();
  };

  // POST /api/admin/request-otp
  router.post(
    '/request-otp',
    adminOtpLimiter,
    [body('email').isEmail().normalizeEmail().withMessage('Invalid email address')],
    async (req: express.Request, res: express.Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid email address' });
      }

      try {
        const { email } = req.body;
        const host = req.headers.host || '';
        const slug = tenantServiceRef!.getTenantSlugFromHost(host);

        if (!slug) {
          // Always respond same way to not reveal info
          auditEvent('admin.otp.request', req, {
            tenantSlug: null,
            emailMatchedAdmin: false,
            result: 'probe_no_slug',
          });
          return res.json({ success: true, message: 'Check your email' });
        }

        const tenant = await tenantServiceRef!.getTenant(slug);
        if (!tenant) {
          auditEvent('admin.otp.request', req, {
            tenantSlug: slug,
            emailMatchedAdmin: false,
            result: 'probe_unknown_tenant',
          });
          return res.json({ success: true, message: 'Check your email' });
        }

        const emailHash = tenantServiceRef!.hashEmail(email);
        const emailMatchedAdmin = emailHash === tenant.adminEmailHash;

        // Only send OTP if email matches admin — but always say same thing
        if (emailMatchedAdmin) {
          const code = await tenantServiceRef!.createAdminOTP(emailHash, slug);
          try {
            await sendVerificationCode(email, code);
          } catch (err) {
            loggerRef?.warn('Admin OTP email send failed', { error: err });
          }
        }

        auditEvent('admin.otp.request', req, {
          tenantSlug: slug,
          emailMatchedAdmin,
          result: 'success',
        });
        return res.json({ success: true, message: 'Check your email' });
      } catch (error) {
        loggerRef?.error('Admin request-otp error', { error });
        auditEvent('admin.otp.request', req, { result: 'error' });
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // POST /api/admin/verify-otp
  router.post(
    '/verify-otp',
    [
      body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
      body('code').trim().isLength({ min: 6, max: 6 }).isNumeric().withMessage('Invalid code format'),
    ],
    async (req: express.Request, res: express.Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input' });
      }

      try {
        const { email, code } = req.body;
        const host = req.headers.host || '';
        const slug = tenantServiceRef!.getTenantSlugFromHost(host);

        if (!slug) {
          return res.status(400).json({ error: 'Invalid subdomain' });
        }

        const emailHash = tenantServiceRef!.hashEmail(email);
        const sessionToken = await tenantServiceRef!.verifyAdminOTP(emailHash, code, slug);

        if (!sessionToken) {
          auditEvent('admin.otp.verify', req, {
            tenantSlug: slug,
            result: 'fail',
            reason: 'invalid_or_expired',
          });
          return res.status(400).json({ error: 'Invalid or expired code' });
        }

        auditEvent('admin.otp.verify', req, {
          tenantSlug: slug,
          adminEmailHash: emailHash,
          result: 'success',
        });
        return res.json({ sessionToken });
      } catch (error) {
        loggerRef?.error('Admin verify-otp error', { error });
        auditEvent('admin.otp.verify', req, { result: 'error' });
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // GET /api/admin/stats
  router.get('/stats', requireAdminSession, async (req: express.Request, res: express.Response) => {
    try {
      const slug = req.adminSlug!;
      const stats = await tenantServiceRef!.getDashboardStats(slug);
      // activeNow: count rooms in tenant rooms set (approximate)
      const activeNow = await tenantServiceRef!.getActiveRoomsCount(slug, null);
      auditEvent('admin.stats.view', req, {
        tenantSlug: slug,
        adminEmailHash: req.adminEmailHash || null,
        result: 'success',
      });
      return res.json({ ...stats, activeNow });
    } catch (error) {
      loggerRef?.error('Admin stats error', { error });
      auditEvent('admin.stats.view', req, { result: 'error' });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/admin/compliance-report
  router.get('/compliance-report', requireAdminSession, async (req: express.Request, res: express.Response) => {
    try {
      const slug = req.adminSlug!;
      const year = parseInt(req.query.year as string, 10);
      const month = parseInt(req.query.month as string, 10);

      if (
        !year || !month ||
        year < 2024 || year > 2100 ||
        month < 1 || month > 12
      ) {
        return res.status(400).json({ error: 'Invalid year or month' });
      }

      // Count rooms for that specific month
      const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const keys: string[] = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dd = String(d).padStart(2, '0');
        const mm = String(month).padStart(2, '0');
        keys.push(`${KEY_PREFIX}tenant:${slug}:stats:rooms:${year}${mm}${dd}`);
      }

      const vals = await redisClientRef.mGet(keys);
      let roomsCreated = 0;
      for (const v of vals) {
        if (v) roomsCreated += parseInt(v, 10);
      }

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthName = monthNames[month - 1];
      const period = `${monthName} ${year}`;

      const tenant = await tenantServiceRef!.getTenant(slug);
      const orgName = tenant?.displayName || slug;

      const statement =
        `During ${period}, ${roomsCreated} room${roomsCreated === 1 ? '' : 's'} ` +
        `were created on ${orgName}'s Hushroom workspace. ` +
        `No message content, participant names, or IP addresses were stored or retained.`;

      auditEvent('admin.compliance_report.view', req, {
        tenantSlug: slug,
        adminEmailHash: req.adminEmailHash || null,
        year,
        month,
        result: 'success',
      });
      return res.json({ period, roomsCreated, statement });
    } catch (error) {
      loggerRef?.error('Admin compliance-report error', { error });
      auditEvent('admin.compliance_report.view', req, { result: 'error' });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/admin/logout
  router.post('/logout', requireAdminSession, async (req: express.Request, res: express.Response) => {
    try {
      const token = req.headers['x-admin-token'] as string;
      await tenantServiceRef!.deleteAdminSession(token);
      auditEvent('admin.logout', req, {
        tenantSlug: req.adminSlug || null,
        adminEmailHash: req.adminEmailHash || null,
        result: 'success',
      });
      return res.json({ success: true });
    } catch (error) {
      loggerRef?.error('Admin logout error', { error });
      auditEvent('admin.logout', req, { result: 'error' });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
