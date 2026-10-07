import express from 'express';
import { body } from 'express-validator';
import winston from 'winston';

import { requireJWT, AuthenticatedRequest } from '../jwt-middleware.js';
import { TierService } from '../tier-service.js';
import { createCheckoutSession, isStripeConfigured } from '../stripe-service.js';
import { makeValidationErrorHandler } from './_helpers.js';

export function createBillingRouter(deps: {
  logger: winston.Logger;
  tierService: TierService;
}): express.Router {
  const { logger, tierService } = deps;
  const handleValidationErrors = makeValidationErrorHandler(logger);
  const router = express.Router();

  router.get(
    '/subscription',
    requireJWT,
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;
        if (!user.emailHash) {
          return res.json({ tier: 'demo' });
        }
        const tier = await tierService.getTier(user.emailHash);
        const trialEnd = await tierService.getTrialEnd(user.emailHash);
        res.json({ tier, ...(trialEnd ? { trialEnd } : {}) });
      } catch (error) {
        logger.error('Get subscription error', { error });
        res.status(500).json({ error: 'Failed to get subscription' });
      }
    }
  );

  router.post(
    '/start-trial',
    requireJWT,
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;
        if (!user.creatorVerified) {
          return res.status(403).json({ error: 'Email verification required' });
        }
        if (!user.emailHash) {
          return res.status(503).json({ error: 'Service not available' });
        }

        const currentTier = await tierService.getTier(user.emailHash);
        if (currentTier !== 'demo') {
          const trialEnd = await tierService.getTrialEnd(user.emailHash);
          return res.json({ ok: true, tier: currentTier, ...(trialEnd ? { trialEnd } : {}) });
        }

        const { trialEnd } = await tierService.startTrial(user.emailHash);
        logger.info('Trial started');
        res.json({ ok: true, tier: 'pro', trialEnd });
      } catch (error) {
        logger.error('Start trial error', { error });
        res.status(500).json({ error: 'Failed to start trial' });
      }
    }
  );

  router.post(
    '/create-checkout-session',
    requireJWT,
    [body('tier').isIn(['pro', 'firm']).withMessage('Invalid tier')],
    handleValidationErrors,
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;
        if (!user.creatorVerified) {
          return res.status(403).json({ error: 'Email verification required' });
        }
        if (!isStripeConfigured()) {
          return res.status(503).json({ error: 'Payment not configured' });
        }
        if (!user.emailHash) {
          return res.status(403).json({ error: 'No email hash in token' });
        }

        const { tier } = req.body;
        const email = (user as any).email || '';
        const origin = req.get('origin') || 'https://hushroom.io';
        const successUrl = `${origin}/?payment=success`;
        const cancelUrl = `${origin}/?payment=cancelled`;

        const url = await createCheckoutSession(tier, user.emailHash, email, successUrl, cancelUrl);
        res.json({ url });
      } catch (error) {
        logger.error('Checkout session error', { error });
        res.status(500).json({ error: 'Failed to create checkout session' });
      }
    }
  );

  return router;
}
