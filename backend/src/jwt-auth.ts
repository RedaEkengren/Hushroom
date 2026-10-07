import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}
const JWT_SECRET: string = process.env.JWT_SECRET;
const JWT_EXPIRY = '1h';

export interface JWTPayload {
  userId: string;
  name: string;
  roomId?: string;
  role?: 'host' | 'participant';
  creatorVerified?: boolean;
  emailHash?: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

export class JWTAuth {
  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRY,
      jwtid: randomUUID()
    });
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static refreshToken(token: string): string {
    const payload = this.verifyToken(token);
    // Strip the registered claims jsonwebtoken would otherwise refuse to
    // re-sign over (iat/exp are stale; jti would clash with the new
    // jwtid we mint inside generateToken).
    const { iat, exp, jti, ...refreshPayload } = payload;
    return this.generateToken(refreshPayload);
  }

  static extractTokenFromRequest(req: any): string | null {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    // Check query parameter (for WebSocket)
    if (req.query?.token) {
      return req.query.token;
    }

    // Check URL search params (for WebSocket)
    if (req.url) {
      const url = new URL(req.url, `http://${req.headers.host}`);
      return url.searchParams.get('token');
    }

    return null;
  }
}
