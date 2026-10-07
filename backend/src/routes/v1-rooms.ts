import express from 'express';
import { randomUUID } from 'crypto';
import { body } from 'express-validator';
import winston from 'winston';

import { redisRoomService } from '../redis-room-service.js';
import { validateRoomSettings } from '../room-types.js';
import { ApiKeyService, ApiKeyRecord } from '../api-key-service.js';
import { TenantService } from '../tenant-service.js';
import { sanitizeInput, makeValidationErrorHandler } from './_helpers.js';

// Partner API. A partner's backend creates a room with an API key instead of a
// verified email, then builds the join link itself.
//
// The encryption key is NEVER part of this API. The partner generates 32 random
// bytes in their own backend and appends them as the URL fragment:
//
//   https://<tenant>.hushroom.io/r/<roomId>#key=<64 hex chars>
//
// Fragments are not sent to servers, so we cannot read the conversation even
// though we created the room. That property is the product, and it is the one
// thing no hosted competitor can offer.

// Rooms only accept these durations (room-types.ts). Exposed in the API error
// message so a partner does not have to guess.
const ALLOWED_DURATIONS = [15, 30, 60, 120, 180, 240] as const;
type AllowedDuration = (typeof ALLOWED_DURATIONS)[number];

export interface PartnerRequest extends express.Request {
  partner?: ApiKeyRecord;
}

export function createV1RoomsRouter(deps: {
  logger: winston.Logger;
  apiKeyService: ApiKeyService;
  tenantService: TenantService;
}): express.Router {
  const { logger, apiKeyService, tenantService } = deps;
  const handleValidationErrors = makeValidationErrorHandler(logger);
  const router = express.Router();

  const requireApiKey = async (
    req: PartnerRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const header = req.headers.authorization;
    const key = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const record = await apiKeyService.verifyKey(key);
    if (!record) {
      return res.status(401).json({ error: 'Invalid or missing API key' });
    }
    const withinRate = await apiKeyService.checkRate(record.id);
    if (!withinRate) {
      return res.status(429).json({ error: 'Rate limit exceeded for this API key' });
    }
    req.partner = record;
    next();
  };

  router.post(
    '/v1/rooms',
    requireApiKey,
    [
      body('durationMinutes')
        .isInt()
        .toInt()
        .isIn(ALLOWED_DURATIONS as unknown as number[])
        .withMessage(`durationMinutes must be one of ${ALLOWED_DURATIONS.join(', ')}`),
      body('maxParticipants')
        .optional()
        .isInt({ min: 2, max: 12 })
        .withMessage('maxParticipants must be between 2 and 12'),
      body('displayName')
        .optional()
        .isLength({ max: 60 })
        .withMessage('displayName must be at most 60 characters'),
      body('hostName')
        .optional()
        .isLength({ max: 50 })
        .withMessage('hostName must be at most 50 characters'),
    ],
    handleValidationErrors,
    async (req: PartnerRequest, res: express.Response) => {
      const partner = req.partner!;
      try {
        const {
          durationMinutes,
          maxParticipants = 4,
          displayName,
          hostName,
        } = req.body as {
          durationMinutes: AllowedDuration;
          maxParticipants?: number;
          displayName?: string;
          hostName?: string;
        };

        const roomRequest = {
          // The room name is stored in plaintext, so a partner should pass a
          // reference (a booking number), never anything about the parties.
          name: sanitizeInput(displayName || 'Room'),
          maxParticipants,
          duration: durationMinutes as AllowedDuration,
          hostName: sanitizeInput(hostName || 'Host'),
        };

        const validationErrors = validateRoomSettings(roomRequest);
        if (validationErrors.length > 0) {
          return res.status(400).json({ error: 'Invalid room settings', details: validationErrors });
        }

        // The host identity belongs to the partner's system, not to us. We mint
        // an opaque id so nothing about their user reaches Redis.
        const hostUserId = randomUUID();
        const result = await redisRoomService.createRoom(roomRequest, hostUserId);
        if (!result.success || !result.room) {
          return res.status(400).json({ error: result.error || 'Failed to create room' });
        }

        const roomId = result.room.id;

        tenantService
          .addRoomToTenant(partner.tenantSlug, roomId)
          .catch((err) => logger.warn('Failed to add partner room to tenant set', { err }));
        tenantService
          .recordRoomCreated(partner.tenantSlug)
          .catch((err) => logger.warn('Failed to record partner room for tenant stats', { err }));
        apiKeyService
          .recordRoomCreated(partner.id)
          .catch((err) => logger.warn('Failed to record API key usage', { err }));

        logger.info('Partner room created', { tenantSlug: partner.tenantSlug });

        res.status(201).json({
          roomId,
          hostToken: result.token,
          joinPath: `/r/${roomId}`,
          embedPath: `/embed/r/${roomId}`,
          expiresAt: result.room.expiresAt,
          maxParticipants: result.room.maxParticipants,
          note: 'Generate 32 random bytes in your backend and append them as #key=<hex> to the join URL. The key must never be sent to Hushroom.',
        });
      } catch (error) {
        logger.error('Partner room creation error', { error });
        res.status(500).json({ error: 'Failed to create room' });
      }
    }
  );

  // Lets a partner confirm their key works and see this month's consumption
  // without creating anything.
  router.get('/v1/me', requireApiKey, async (req: PartnerRequest, res: express.Response) => {
    const partner = req.partner!;
    const roomsThisMonth = await apiKeyService.getUsage(partner.id);
    res.json({
      keyId: partner.id,
      name: partner.name,
      tenant: partner.tenantSlug,
      roomsThisMonth,
    });
  });

  // ── Internal key management ───────────────────────────────────────────────
  // Nginx returns 403 for /api/internal/* from the internet, so these are only
  // reachable from the server itself. Same guard as provision-tenant.
  const requireInternalKey = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const internalKey = process.env.INTERNAL_API_KEY;
    if (!internalKey) {
      return res.status(503).json({ error: 'Internal API not configured' });
    }
    const provided = req.headers['x-internal-key'] as string | undefined;
    if (!provided || provided !== internalKey) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };

  router.post(
    '/internal/api-keys',
    requireInternalKey,
    async (req: express.Request, res: express.Response) => {
      const { tenantSlug, name } = req.body as { tenantSlug?: string; name?: string };
      if (!tenantSlug || !name) {
        return res.status(400).json({ error: 'tenantSlug and name are required' });
      }
      const created = await apiKeyService.createKey(tenantSlug, name);
      logger.info('Partner API key created', { tenantSlug });
      // The plaintext key is returned exactly once and never stored.
      res.status(201).json(created);
    }
  );

  router.get(
    '/internal/api-keys',
    requireInternalKey,
    async (req: express.Request, res: express.Response) => {
      const tenantSlug = req.query.tenantSlug as string | undefined;
      if (!tenantSlug) {
        return res.status(400).json({ error: 'tenantSlug is required' });
      }
      res.json({ keys: await apiKeyService.listKeys(tenantSlug) });
    }
  );

  router.delete(
    '/internal/api-keys/:id',
    requireInternalKey,
    async (req: express.Request, res: express.Response) => {
      const tenantSlug = req.query.tenantSlug as string | undefined;
      if (!tenantSlug) {
        return res.status(400).json({ error: 'tenantSlug is required' });
      }
      const revoked = await apiKeyService.revokeKey(tenantSlug, req.params.id);
      if (!revoked) return res.status(404).json({ error: 'Key not found for this tenant' });
      logger.info('Partner API key revoked', { tenantSlug });
      res.json({ revoked: true });
    }
  );

  return router;
}
