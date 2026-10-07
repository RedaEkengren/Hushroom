import express from 'express';
import crypto from 'crypto';
import winston from 'winston';
import { RedisClientType } from 'redis';

import { constructWebhookEvent } from '../stripe-service.js';
import { TierService } from '../tier-service.js';
import { TenantService } from '../tenant-service.js';
import { sendPaymentFailed, sendFirmOnboardingEmail, isEmailConfigured } from '../email-service.js';

export function createStripeWebhookRouter(deps: {
  logger: winston.Logger;
  tierService: TierService;
  tenantService: TenantService;
  redisClient: RedisClientType;
}): express.Router {
  const { logger, tierService, tenantService, redisClient } = deps;
  const router = express.Router();

  router.post(
    '/stripe-webhook',
    express.raw({ type: 'application/json' }),
    async (req: express.Request, res: express.Response) => {
      const sig = req.headers['stripe-signature'] as string;
      if (!sig) {
        return res.status(400).json({ error: 'Missing stripe-signature header' });
      }

      let event;
      try {
        event = constructWebhookEvent(req.body as Buffer, sig);
      } catch (err: any) {
        logger.warn('Stripe webhook signature verification failed', { error: err.message });
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      try {
        if (event.type === 'checkout.session.completed') {
          const session = event.data.object as any;
          const emailHash = session.metadata?.emailHash as string;
          const tier = (session.metadata?.tier as 'pro' | 'firm') || 'pro';
          const stripeCustomerId = session.customer as string;
          const subscriptionId = session.subscription as string;
          const setupToken = session.metadata?.setupToken as string | undefined;

          if (setupToken) {
            const pendingKey = `hushroom:pending-firm:${setupToken}`;
            const pendingRaw = await redisClient.get(pendingKey);
            if (pendingRaw) {
              const pending = JSON.parse(pendingRaw);
              const pendingEmailHash = crypto
                .createHash('sha256')
                .update(pending.adminEmail)
                .digest('hex');
              await tierService.setSubscription(pendingEmailHash, {
                tier: 'firm',
                stripeCustomerId,
                subscriptionId,
                status: 'active',
                currentPeriodEnd: 0,
                email: pending.adminEmail,
              });
              await tenantService.provisionTenant(
                pending.slug,
                pending.adminEmail,
                pending.displayName,
                pending.primaryColor,
                pending.logoUrl
              );
              if (isEmailConfigured()) {
                try {
                  await sendFirmOnboardingEmail(pending.adminEmail, pending.slug, pending.displayName);
                } catch (err) {
                  logger.warn('Firm onboarding email failed', { error: err });
                }
              }
              await redisClient.del(pendingKey);
              logger.info('Auto-provisioned firm tenant', { slug: pending.slug });
              return res.json({ received: true });
            }
          }

          if (emailHash) {
            await tierService.setSubscription(emailHash, {
              tier,
              stripeCustomerId,
              subscriptionId,
              status: 'active',
              currentPeriodEnd: 0,
            });
            logger.info('Subscription activated via checkout');
          }
        } else if (event.type === 'customer.subscription.updated') {
          const sub = event.data.object as any;
          const emailHash = sub.metadata?.emailHash as string;
          if (emailHash) {
            const existing = await tierService.getSubscription(emailHash);
            if (existing) {
              await tierService.setSubscription(emailHash, {
                ...existing,
                status: sub.status,
                currentPeriodEnd: sub.current_period_end * 1000,
              });
            }
          }
        } else if (event.type === 'customer.subscription.deleted') {
          const sub = event.data.object as any;
          const emailHash = sub.metadata?.emailHash as string;
          if (emailHash) {
            const existing = await tierService.getSubscription(emailHash);
            if (existing) {
              await tierService.setSubscription(emailHash, {
                ...existing,
                status: 'cancelled',
              });
            }
            logger.info('Subscription cancelled');
          }
        } else if (event.type === 'invoice.payment_failed') {
          const invoice = event.data.object as any;
          const email = invoice.customer_email as string;
          if (email && isEmailConfigured()) {
            await sendPaymentFailed(email);
          }
          logger.info('Payment failed, email sent');
        }

        res.json({ received: true });
      } catch (error) {
        logger.error('Stripe webhook processing error', { error });
        res.status(500).json({ error: 'Webhook processing failed' });
      }
    }
  );

  return router;
}
