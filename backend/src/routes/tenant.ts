import express from 'express';
import crypto from 'crypto';
import winston from 'winston';
import { RedisClientType } from 'redis';

import { TenantService, RESERVED_SLUGS, SLUG_REGEX } from '../tenant-service.js';
import { TierService } from '../tier-service.js';
import { createCheckoutSession, isStripeConfigured } from '../stripe-service.js';
import { sendFirmOnboardingEmail, isEmailConfigured } from '../email-service.js';

export function createTenantRouter(deps: {
  logger: winston.Logger;
  tenantService: TenantService;
  tierService: TierService;
  redisClient: RedisClientType;
}): express.Router {
  const { logger, tenantService, tierService, redisClient } = deps;
  const router = express.Router();

  router.get('/check-slug', async (req: express.Request, res: express.Response) => {
    const slug = req.query.slug as string | undefined;
    if (!slug) {
      return res.status(400).json({ error: 'slug query param required' });
    }
    if (!SLUG_REGEX.test(slug)) {
      return res.json({ available: false, reason: 'invalid' });
    }
    if (RESERVED_SLUGS.has(slug)) {
      return res.json({ available: false, reason: 'reserved' });
    }
    try {
      const existing = await tenantService.getTenant(slug);
      if (existing) {
        return res.json({ available: false, reason: 'taken' });
      }
      return res.json({ available: true });
    } catch (error) {
      logger.error('check-slug error', { error });
      return res.status(500).json({ error: 'Failed to check slug' });
    }
  });

  router.post('/init-firm-checkout', async (req: express.Request, res: express.Response) => {
    try {
      if (!isStripeConfigured()) {
        return res.status(503).json({ error: 'Payment not configured' });
      }

      const { slug, displayName, adminEmail, primaryColor, logoUrl } = req.body;

      if (!slug || !SLUG_REGEX.test(slug)) {
        return res.status(400).json({
          error: 'Invalid slug format (lowercase letters, numbers, hyphens, max 32 chars)',
        });
      }
      if (RESERVED_SLUGS.has(slug)) {
        return res.status(400).json({ error: 'Slug is reserved' });
      }
      if (!adminEmail || !adminEmail.includes('@') || !adminEmail.includes('.')) {
        return res.status(400).json({ error: 'Invalid admin email' });
      }
      if (!displayName || displayName.trim().length < 1 || displayName.trim().length > 100) {
        return res.status(400).json({ error: 'Display name must be 1-100 characters' });
      }

      const existing = await tenantService.getTenant(slug);
      if (existing) {
        return res.status(400).json({ error: 'Slug already taken' });
      }

      const emailHash = crypto
        .createHash('sha256')
        .update(adminEmail.toLowerCase().trim())
        .digest('hex');

      const sub = await tierService.getSubscription(emailHash);
      if (sub && sub.tier === 'firm' && sub.status === 'active') {
        return res.status(400).json({ error: 'Already subscribed as Firm', alreadySubscribed: true });
      }

      const setupToken = crypto.randomUUID();
      const pendingKey = `hushroom:pending-firm:${setupToken}`;
      await redisClient.setEx(
        pendingKey,
        1800,
        JSON.stringify({
          slug: slug.trim(),
          displayName: displayName.trim(),
          adminEmail: adminEmail.toLowerCase().trim(),
          primaryColor: primaryColor || '#059669',
          logoUrl: logoUrl || '',
        })
      );

      const origin = req.get('origin') || 'https://hushroom.io';
      const successUrl = `${origin}/firm-welcome?slug=${slug}`;
      const cancelUrl = `${origin}/?cancelled=firm`;

      const url = await createCheckoutSession(
        'firm',
        emailHash,
        adminEmail,
        successUrl,
        cancelUrl,
        setupToken
      );

      return res.json({ url });
    } catch (error) {
      logger.error('init-firm-checkout error', { error });
      return res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  router.get('/tenant-config', async (req: express.Request, res: express.Response) => {
    try {
      const host = req.headers.host || '';
      const slug = tenantService.getTenantSlugFromHost(host);
      if (!slug) {
        return res.json(null);
      }
      const tenant = await tenantService.getTenant(slug);
      if (!tenant) {
        return res.json(null);
      }
      return res.json({
        slug: tenant.slug,
        displayName: tenant.displayName,
        primaryColor: tenant.primaryColor,
        logoUrl: tenant.logoUrl,
      });
    } catch (error) {
      logger.error('Tenant config error', { error });
      return res.json(null);
    }
  });

  router.post('/internal/provision-tenant', async (req: express.Request, res: express.Response) => {
    try {
      const internalKey = process.env.INTERNAL_API_KEY;
      if (!internalKey) {
        return res.status(503).json({ error: 'Internal API not configured' });
      }
      const providedKey = req.headers['x-internal-key'] as string | undefined;
      if (!providedKey || providedKey !== internalKey) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { slug, adminEmail, displayName, primaryColor, logoUrl } = req.body;
      if (!slug || !adminEmail || !displayName) {
        return res.status(400).json({ error: 'slug, adminEmail, and displayName are required' });
      }

      await tenantService.provisionTenant(slug, adminEmail, displayName, primaryColor, logoUrl);

      if (isEmailConfigured()) {
        try {
          await sendFirmOnboardingEmail(adminEmail, slug, displayName);
        } catch (err) {
          logger.warn('Firm onboarding email failed', { error: err });
        }
      }

      logger.info('Tenant provisioned', { slug });
      return res.json({
        success: true,
        adminUrl: `https://${slug}.hushroom.io/admin`,
      });
    } catch (error: any) {
      logger.error('Provision tenant error', { error });
      if (error.message?.includes('reserved') || error.message?.includes('Invalid slug')) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to provision tenant' });
    }
  });

  return router;
}
