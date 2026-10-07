import express from 'express';
import crypto from 'crypto';
import winston from 'winston';
import { RedisClientType } from 'redis';

import { requireJWT, AuthenticatedRequest } from '../jwt-middleware.js';
import { JWTAuth } from '../jwt-auth.js';
import {
  createLiveKitToken,
  isLiveKitConfigured,
  getLiveKitUrl,
} from '../livekit-service.js';

export function createLiveKitRouter(deps: {
  logger: winston.Logger;
  redisClient: RedisClientType;
}): express.Router {
  const { logger, redisClient } = deps;
  const router = express.Router();

  router.post(
    '/livekit-token',
    requireJWT,
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        if (!isLiveKitConfigured()) {
          return res.status(503).json({ error: 'Voice/video not available' });
        }

        const user = req.user!;
        const { roomId } = req.body;
        if (!roomId || typeof roomId !== 'string') {
          return res.status(400).json({ error: 'roomId is required' });
        }

        // The JWT must already grant access to this specific room. Without this
        // check, any authenticated user could request a LiveKit token for any
        // room ID they happened to know — see Sprint 13.2 / code-review A2.
        if (!user.roomId || user.roomId !== roomId) {
          return res.status(403).json({ error: 'Not authorized for this room' });
        }

        const token = await createLiveKitToken(roomId, user.userId, user.name);
        res.json({ token, url: getLiveKitUrl() });
      } catch (error) {
        logger.error('LiveKit token error', { error });
        res.status(500).json({ error: 'Failed to generate voice token' });
      }
    }
  );

  router.post(
    '/ws-ticket',
    requireJWT,
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const token = JWTAuth.extractTokenFromRequest(req);
        if (!token) {
          return res.status(401).json({ error: 'No token' });
        }
        const ticket = crypto.randomUUID();
        await redisClient.setEx(`hushroom:ws-ticket:${ticket}`, 30, token);
        res.json({ ticket });
      } catch (error) {
        logger.error('WS ticket error', { error });
        res.status(500).json({ error: 'Failed to create ticket' });
      }
    }
  );

  return router;
}
