import express from 'express';
import { body } from 'express-validator';
import crypto from 'crypto';
import winston from 'winston';

import { JWTAuth } from '../jwt-auth.js';
import { optionalJWT, requireJWT, AuthenticatedRequest } from '../jwt-middleware.js';
import { AuthService } from '../auth-service.js';
import { sendVerificationCode, isEmailConfigured } from '../email-service.js';
import {
  sanitizeInput,
  validateUsername,
  makeValidationErrorHandler,
} from './_helpers.js';

export function createAuthRouter(deps: {
  logger: winston.Logger;
  authService: AuthService;
  loginLimiter: express.RequestHandler;
  requestLinkLimiter: express.RequestHandler;
  verifyCodeLimiter: express.RequestHandler;
}): express.Router {
  const { logger, authService, loginLimiter, requestLinkLimiter, verifyCodeLimiter } = deps;
  const handleValidationErrors = makeValidationErrorHandler(logger);
  const router = express.Router();

  router.post(
    '/login',
    loginLimiter,
    optionalJWT,
    validateUsername,
    handleValidationErrors,
    (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const { name } = req.body;
        const sanitizedName = sanitizeInput(name.trim());

        const existingUser = req.user;
        // Stable userId: derive from emailHash when verified (so the same
        // person joining twice — e.g. two tabs — gets the same userId and
        // ensureParticipant stays idempotent in Redis). Anonymous joiners
        // still get a fresh randomUUID.
        const stableUserId =
          existingUser?.userId ||
          (existingUser?.emailHash ? `email:${existingUser.emailHash}` : crypto.randomUUID());

        const tokenPayload: any = {
          userId: stableUserId,
          name: sanitizedName,
        };

        if (existingUser?.creatorVerified) {
          tokenPayload.creatorVerified = true;
          tokenPayload.emailHash = existingUser.emailHash;
        }

        const token = JWTAuth.generateToken(tokenPayload);
        logger.info('User logged in');
        res.json({ token, user: { name: sanitizedName } });
      } catch (error) {
        logger.error('Login error', { error });
        res.status(500).json({ error: 'Serverfel vid inloggning' });
      }
    }
  );

  router.post(
    '/refresh-token',
    requireJWT,
    (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const token = JWTAuth.extractTokenFromRequest(req);
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }
        const newToken = JWTAuth.refreshToken(token);
        res.json({ token: newToken });
      } catch (error) {
        logger.error('Token refresh error', { error });
        res.status(401).json({ error: 'Failed to refresh token' });
      }
    }
  );

  router.post(
    '/auth/request-link',
    requestLinkLimiter,
    [body('email').isEmail().normalizeEmail().withMessage('Invalid email address')],
    handleValidationErrors,
    async (req: express.Request, res: express.Response) => {
      try {
        if (!isEmailConfigured()) {
          return res.status(503).json({ error: 'Email service not configured' });
        }

        const { email } = req.body;
        const emailHash = authService.hashEmail(email);
        const banned = await authService.isEmailBanned(emailHash);
        if (banned) {
          return res.json({ success: true, message: 'Check your email' });
        }

        const code = await authService.createOTP(email);
        await sendVerificationCode(email, code);

        logger.info('Verification code sent');
        res.json({ success: true, message: 'Check your email' });
      } catch (error) {
        logger.error('Verification code request error', { error });
        res.status(500).json({ error: 'Failed to send verification email' });
      }
    }
  );

  router.post(
    '/auth/verify-code',
    verifyCodeLimiter,
    [
      body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
      body('code').trim().isLength({ min: 6, max: 6 }).isNumeric().withMessage('Invalid code format'),
    ],
    handleValidationErrors,
    async (req: express.Request, res: express.Response) => {
      try {
        const { email, code } = req.body;
        const emailHash = await authService.verifyOTP(email, code);
        if (!emailHash) {
          return res.status(400).json({ error: 'Invalid or expired code' });
        }

        const jwt = JWTAuth.generateToken({
          userId: crypto.randomUUID(),
          name: 'Creator',
          creatorVerified: true,
          emailHash,
        });

        logger.info('Email verified via OTP');
        res.json({ success: true, token: jwt });
      } catch (error) {
        logger.error('OTP verification error', { error });
        res.status(500).json({ error: 'Verification failed' });
      }
    }
  );

  return router;
}
