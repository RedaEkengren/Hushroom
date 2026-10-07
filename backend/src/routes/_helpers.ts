import express from 'express';
import { body, validationResult } from 'express-validator';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import winston from 'winston';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

export function sanitizeInput(input: string): string {
  return purify.sanitize(input, { ALLOWED_TAGS: [] });
}

export function makeValidationErrorHandler(logger: winston.Logger) {
  return function handleValidationErrors(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors', { errors: errors.array() });
      return res.status(400).json({
        error: 'Invalid input',
        details: errors.array().map((err) => err.msg),
      });
    }
    next();
  };
}

export const validateUsername = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZåäöÅÄÖ0-9\s\-_]+$/)
    .withMessage('Name may only contain letters, numbers, spaces, hyphens and underscores')
    .escape(),
];

export const validateRoomCreation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Room name must be between 2 and 50 characters'),
  body('maxParticipants').isInt({ min: 2, max: 12 }).withMessage('Max participants must be between 2 and 12'),
  body('duration').isIn([15, 30, 60, 120, 180, 240]).withMessage('Invalid room duration'),
  body('hostName').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
];

export const validateRoomJoin = [
  body('roomId').trim().isLength({ min: 1 }).withMessage('Room ID is required'),
  body('participantName').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
];
