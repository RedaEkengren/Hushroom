import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { JWTAuth, type JWTPayload } from './jwt-auth.js';
import { requireJWT, optionalJWT, type AuthenticatedRequest } from './jwt-middleware.js';

// JWT_SECRET is set by the vitest runner (see backend/package.json test script
// or env). For these tests we trust whatever it is — we don't need to match
// production. The module read the value at import time.
const SECRET = process.env.JWT_SECRET as string;

function mockResponse() {
  const res: any = {
    statusCode: 200,
    body: undefined as any,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: any) { this.body = payload; return this; },
  };
  return res;
}

describe('JWTAuth.generateToken + verifyToken round-trip', () => {
  it('produces a token verifyable with the same secret', () => {
    const token = JWTAuth.generateToken({ userId: 'u1', name: 'Alice' });
    const decoded = JWTAuth.verifyToken(token);
    expect(decoded.userId).toBe('u1');
    expect(decoded.name).toBe('Alice');
    expect(decoded.iat).toBeTypeOf('number');
    expect(decoded.exp).toBeTypeOf('number');
  });

  it('preserves roomId, role, creatorVerified, emailHash through round-trip', () => {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: 'u1',
      name: 'Alice',
      roomId: 'room-abc',
      role: 'host',
      creatorVerified: true,
      emailHash: 'hash-xyz',
    };
    const token = JWTAuth.generateToken(payload);
    const decoded = JWTAuth.verifyToken(token);
    expect(decoded.userId).toBe('u1');
    expect(decoded.roomId).toBe('room-abc');
    expect(decoded.role).toBe('host');
    expect(decoded.creatorVerified).toBe(true);
    expect(decoded.emailHash).toBe('hash-xyz');
  });

  it('two tokens for the same payload have different jti (uuid)', () => {
    const t1 = JWTAuth.generateToken({ userId: 'u', name: 'A' });
    const t2 = JWTAuth.generateToken({ userId: 'u', name: 'A' });
    expect(t1).not.toBe(t2);
    const d1 = jwt.decode(t1) as any;
    const d2 = jwt.decode(t2) as any;
    expect(d1.jti).toBeTruthy();
    expect(d2.jti).toBeTruthy();
    expect(d1.jti).not.toBe(d2.jti);
  });
});

describe('JWTAuth.verifyToken — failure modes', () => {
  it('throws on a token signed with the wrong secret', () => {
    const badToken = jwt.sign({ userId: 'u', name: 'A' }, 'a-different-secret', { expiresIn: '1h' });
    expect(() => JWTAuth.verifyToken(badToken)).toThrow(/Invalid or expired/);
  });

  it('throws on an expired token', () => {
    // Sign a token that is already expired (issued 2h ago, 1h validity).
    const expired = jwt.sign(
      { userId: 'u', name: 'A', iat: Math.floor(Date.now() / 1000) - 7200 },
      SECRET,
      { expiresIn: '1h' },
    );
    expect(() => JWTAuth.verifyToken(expired)).toThrow(/Invalid or expired/);
  });

  it('throws on a malformed token', () => {
    expect(() => JWTAuth.verifyToken('not-a-jwt')).toThrow(/Invalid or expired/);
    expect(() => JWTAuth.verifyToken('aaa.bbb.ccc')).toThrow(/Invalid or expired/);
  });

  it('throws on a tampered payload (signature broken)', () => {
    const valid = JWTAuth.generateToken({ userId: 'u', name: 'A' });
    const [h, p, s] = valid.split('.');
    // Re-encode payload with a different userId; the existing signature
    // no longer matches, so verify must fail.
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(p, 'base64').toString()), userId: 'attacker' })
    ).toString('base64url');
    const tampered = `${h}.${tamperedPayload}.${s}`;
    expect(() => JWTAuth.verifyToken(tampered)).toThrow(/Invalid or expired/);
  });
});

describe('JWTAuth.refreshToken', () => {
  it('returns a new token preserving payload claims (regression: jti collision)', () => {
    // Sprint 19.2 — caught a real bug: refreshToken used to leave the
    // original token's jti claim on the payload, so jwt.sign({ jwtid: new })
    // threw "payload already has jti". Test guards both behaviours:
    //   1. refresh succeeds without throwing
    //   2. payload claims (userId/roomId/...) are preserved
    const original = JWTAuth.generateToken({
      userId: 'u1', name: 'Alice', roomId: 'r1', creatorVerified: true,
    });
    const decodedOriginal = JWTAuth.verifyToken(original);

    const refreshed = JWTAuth.refreshToken(original);
    const decodedRefreshed = JWTAuth.verifyToken(refreshed);

    expect(decodedRefreshed.userId).toBe(decodedOriginal.userId);
    expect(decodedRefreshed.name).toBe(decodedOriginal.name);
    expect(decodedRefreshed.roomId).toBe(decodedOriginal.roomId);
    expect(decodedRefreshed.creatorVerified).toBe(true);
    // jti must be regenerated (not equal) — proves the strip worked
    const j1 = jwt.decode(original) as any;
    const j2 = jwt.decode(refreshed) as any;
    expect(j2.jti).toBeTruthy();
    expect(j2.jti).not.toBe(j1.jti);
  });

  it('throws when refreshing an invalid token', () => {
    expect(() => JWTAuth.refreshToken('bogus')).toThrow();
  });
});

describe('JWTAuth.extractTokenFromRequest', () => {
  it('reads from Authorization: Bearer <token>', () => {
    const req: any = { headers: { authorization: 'Bearer my-token' } };
    expect(JWTAuth.extractTokenFromRequest(req)).toBe('my-token');
  });

  it('returns null when Authorization header is missing', () => {
    const req: any = { headers: {} };
    expect(JWTAuth.extractTokenFromRequest(req)).toBeNull();
  });

  it('returns null when Authorization header is malformed (no Bearer prefix)', () => {
    const req: any = { headers: { authorization: 'Basic abc' } };
    expect(JWTAuth.extractTokenFromRequest(req)).toBeNull();
  });

  it('reads from query.token (WebSocket upgrade path)', () => {
    const req: any = { headers: {}, query: { token: 'ws-token' } };
    expect(JWTAuth.extractTokenFromRequest(req)).toBe('ws-token');
  });

  it('reads from URL search params when neither header nor query are set', () => {
    const req: any = { headers: { host: 'localhost' }, url: '/ws?token=url-token&other=1' };
    expect(JWTAuth.extractTokenFromRequest(req)).toBe('url-token');
  });
});

describe('requireJWT middleware', () => {
  it('returns 401 with no token', () => {
    const req: any = { headers: {} };
    const res = mockResponse();
    const next = vi.fn();

    requireJWT(req as AuthenticatedRequest, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body?.error).toContain('No token');
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 on an invalid token', () => {
    const req: any = { headers: { authorization: 'Bearer not-a-real-jwt' } };
    const res = mockResponse();
    const next = vi.fn();

    requireJWT(req as AuthenticatedRequest, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body?.error).toContain('Invalid');
    expect(next).not.toHaveBeenCalled();
  });

  it('populates req.user and calls next() on a valid token', () => {
    const token = JWTAuth.generateToken({
      userId: 'u1',
      name: 'Alice',
      roomId: 'room-abc',
      creatorVerified: true,
    });
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res = mockResponse();
    const next = vi.fn();

    requireJWT(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe('u1');
    expect(req.user.roomId).toBe('room-abc');
    expect(req.user.creatorVerified).toBe(true);
  });

  it('preserves roomId binding for downstream Sprint 13 checks', () => {
    const token = JWTAuth.generateToken({
      userId: 'u1',
      name: 'Alice',
      roomId: 'binding-room-id-42',
    });
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res = mockResponse();
    const next = vi.fn();

    requireJWT(req, res, next);

    expect(req.user?.roomId).toBe('binding-room-id-42');
  });
});

describe('optionalJWT middleware', () => {
  it('always calls next() — even with no token', () => {
    const req: any = { headers: {} };
    const res = mockResponse();
    const next = vi.fn();

    optionalJWT(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toBeUndefined();
  });

  it('always calls next() — even with an invalid token', () => {
    const req: any = { headers: { authorization: 'Bearer junk' } };
    const res = mockResponse();
    const next = vi.fn();

    optionalJWT(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toBeUndefined();
  });

  it('populates req.user on a valid token', () => {
    const token = JWTAuth.generateToken({ userId: 'u', name: 'A' });
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res = mockResponse();
    const next = vi.fn();

    optionalJWT(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user?.userId).toBe('u');
  });
});
