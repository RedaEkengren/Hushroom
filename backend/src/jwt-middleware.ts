import { Request, Response, NextFunction } from 'express';
import { JWTAuth, JWTPayload } from './jwt-auth.js';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export function requireJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = JWTAuth.extractTokenFromRequest(req);
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const payload = JWTAuth.verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = JWTAuth.extractTokenFromRequest(req);
    
    if (token) {
      const payload = JWTAuth.verifyToken(token);
      req.user = payload;
    }
    
    next();
  } catch (error) {
    // Invalid token, but continue without user
    next();
  }
}
