import express from 'express';
import { body } from 'express-validator';
import crypto from 'crypto';
import winston from 'winston';
import { RedisClientType } from 'redis';

import { requireJWT, optionalJWT, AuthenticatedRequest } from '../jwt-middleware.js';
import { redisRoomService } from '../redis-room-service.js';
import { validateRoomSettings } from '../room-types.js';
import { AuthService } from '../auth-service.js';
import { TenantService } from '../tenant-service.js';
import {
  sanitizeInput,
  validateRoomCreation,
  validateRoomJoin,
  makeValidationErrorHandler,
} from './_helpers.js';

export function createRoomsRouter(deps: {
  logger: winston.Logger;
  authService: AuthService;
  tenantService: TenantService;
  redisClient: RedisClientType;
}): express.Router {
  const { logger, authService, tenantService, redisClient } = deps;
  const handleValidationErrors = makeValidationErrorHandler(logger);
  const router = express.Router();

  router.post(
    '/create-room',
    requireJWT,
    validateRoomCreation,
    handleValidationErrors,
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const { name, maxParticipants, duration, hostName } = req.body;
        const user = req.user!;

        if (!user.creatorVerified) {
          return res.status(403).json({ error: 'Email verification required to create rooms' });
        }

        if (user.emailHash) {
          const banned = await authService.isEmailBanned(user.emailHash);
          if (banned) {
            return res.status(403).json({ error: 'Account suspended' });
          }

          const allowed = await authService.checkRoomCreationRate(user.emailHash);
          if (!allowed) {
            return res.status(429).json({ error: 'Too many rooms created, try again later' });
          }
        }

        // Tier enforcement disabled — re-enable when paying customers exist

        const roomRequest = {
          name: sanitizeInput(name),
          maxParticipants,
          duration,
          hostName: sanitizeInput(hostName || user.name),
        };

        const validationErrors = validateRoomSettings(roomRequest);
        if (validationErrors.length > 0) {
          return res.status(400).json({ error: 'Invalid room settings', details: validationErrors });
        }

        const result = await redisRoomService.createRoom(roomRequest, user.userId, user.emailHash);
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }

        const host = req.headers.host || '';
        const slug = tenantService.getTenantSlugFromHost(host);
        if (slug) {
          tenantService.recordRoomCreated(slug).catch((err) =>
            logger.warn('Failed to record room creation for tenant stats', { slug, err })
          );
          if (result.room?.id) {
            tenantService.addRoomToTenant(slug, result.room.id).catch((err) =>
              logger.warn('Failed to add room to tenant set', { slug, roomId: result.room?.id, err })
            );
          }
        }

        res.json({
          roomId: result.room!.id,
          token: result.token,
          room: {
            id: result.room!.id,
            name: result.room!.name,
            expiresAt: result.room!.expiresAt,
          },
        });
      } catch (error) {
        logger.error('Create room error', { error });
        res.status(500).json({ error: 'Failed to create room' });
      }
    }
  );

  router.post(
    '/join-room',
    requireJWT,
    validateRoomJoin,
    handleValidationErrors,
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const { roomId, participantName } = req.body;
        const user = req.user!;

        const joinRequest = {
          roomId,
          participantName: sanitizeInput(participantName),
        };

        const result = await redisRoomService.joinRoom(joinRequest, user.userId);
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }

        res.json({ success: true, token: result.token, room: result.room });
      } catch (error) {
        logger.error('Join room error', { error });
        res.status(400).json({ error: 'Failed to join room' });
      }
    }
  );

  router.get('/room/:roomId', optionalJWT, async (req: express.Request, res: express.Response) => {
    try {
      const { roomId } = req.params;
      const room = await redisRoomService.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.json({
        id: room.id,
        name: room.name,
        participants: room.participants.size,
        maxParticipants: room.maxParticipants,
        expiresAt: room.expiresAt,
        isLocked: room.isLocked,
      });
    } catch (error) {
      logger.error('Get room error', { error });
      res.status(500).json({ error: 'Failed to get room info' });
    }
  });

  router.post(
    '/report',
    requireJWT,
    [
      body('roomId').trim().isLength({ min: 1 }).withMessage('roomId required'),
      body('type').isIn(['spam', 'harassment', 'illegal', 'other']).withMessage('Invalid report type'),
    ],
    handleValidationErrors,
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const { roomId, type } = req.body;
        const reportId = crypto.randomUUID();
        const reportKey = `hushroom:report:${reportId}`;
        await redisClient.setEx(
          reportKey,
          90 * 24 * 60 * 60,
          JSON.stringify({ roomId, type, timestamp: Date.now() })
        );

        logger.info('Abuse report filed', { reportId, type, roomId });
        res.json({ success: true, reportId });
      } catch (error) {
        logger.error('Report error', { error });
        res.status(500).json({ error: 'Failed to submit report' });
      }
    }
  );

  return router;
}
