import express from 'express';
import { body } from 'express-validator';
import crypto from 'crypto';
import winston from 'winston';
import { RedisClientType } from 'redis';

import { requireJWT, AuthenticatedRequest } from '../jwt-middleware.js';
import { sanitizeInput, makeValidationErrorHandler } from './_helpers.js';

export function createFeedbackRouter(deps: {
  logger: winston.Logger;
  redisClient: RedisClientType;
}): express.Router {
  const { logger, redisClient } = deps;
  const handleValidationErrors = makeValidationErrorHandler(logger);
  const router = express.Router();

  router.post(
    '/feedback',
    requireJWT,
    [
      body('type')
        .isIn(['missing_feature', 'bug', 'confusing_ux', 'love_it', 'other'])
        .withMessage('Invalid feedback type'),
      body('text').trim().isLength({ min: 1, max: 1000 }).withMessage('Feedback text required (max 1000 chars)'),
      body('roomId').optional().trim(),
    ],
    handleValidationErrors,
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const { type, text, roomId } = req.body;
        const feedbackId = crypto.randomUUID();
        const feedbackKey = `hushroom:feedback:${feedbackId}`;
        await redisClient.setEx(
          feedbackKey,
          180 * 24 * 60 * 60,
          JSON.stringify({ type, text: sanitizeInput(text), roomId, timestamp: Date.now() })
        );

        logger.info('Feedback submitted', { feedbackId, type });
        res.json({ success: true });
      } catch (error) {
        logger.error('Feedback error', { error });
        res.status(500).json({ error: 'Failed to submit feedback' });
      }
    }
  );

  return router;
}
