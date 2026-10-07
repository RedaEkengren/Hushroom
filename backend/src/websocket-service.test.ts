import { describe, it, expect, vi } from 'vitest';
import { StatelessWebSocketService } from './websocket-service.js';

// The handler methods are tightly coupled to a real WebSocketServer + the
// redisRoomService singleton. A complete handler test pass needs a refactor
// (deferred to 19.4b in sprints.md).
//
// What we CAN unit-test today: the rate-limit helpers `checkMessageRate` and
// `checkByteRate`. They're pure state-machine functions on a connection
// object — security-critical (Sprint 11 byte-throttle) and easy to exercise
// in isolation by skipping the WSS constructor with `Object.create`.

function makeService(): StatelessWebSocketService {
  // Skip the constructor (which would try to spin up a real WebSocketServer)
  // by allocating the prototype directly. Tests only exercise prototype
  // methods, never the wss field.
  return Object.create(StatelessWebSocketService.prototype);
}

function makeConnection(now = Date.now()) {
  return {
    socket: {} as any,
    user: { userId: 'u1', name: 'Alice' } as any,
    lastActivity: now,
    messageCount: 0,
    messagePeriodStart: now,
    bytesCount: 0,
    bytesPeriodStart: now,
  };
}

describe('checkMessageRate (30 messages / 10 seconds)', () => {
  it('allows the first 30 messages in a window', () => {
    const svc = makeService();
    const conn = makeConnection();
    for (let i = 0; i < 30; i++) {
      expect((svc as any).checkMessageRate(conn)).toBe(true);
    }
  });

  it('rejects message #31 in the same window', () => {
    const svc = makeService();
    const conn = makeConnection();
    for (let i = 0; i < 30; i++) (svc as any).checkMessageRate(conn);
    expect((svc as any).checkMessageRate(conn)).toBe(false);
  });

  it('resets the counter after the 10-second window rolls', () => {
    const svc = makeService();
    const t0 = 1_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(t0);
    const conn = makeConnection(t0);

    for (let i = 0; i < 30; i++) (svc as any).checkMessageRate(conn);
    expect((svc as any).checkMessageRate(conn)).toBe(false);

    // Roll forward 10.001s — should reset
    vi.spyOn(Date, 'now').mockReturnValue(t0 + 10_001);
    expect((svc as any).checkMessageRate(conn)).toBe(true);

    vi.restoreAllMocks();
  });
});

describe('checkByteRate (256KB / 10 seconds)', () => {
  const KB = 1024;
  const MAX_BYTES = 256 * KB;

  it('allows a single small frame', () => {
    const svc = makeService();
    const conn = makeConnection();
    expect((svc as any).checkByteRate(conn, 4 * KB)).toBe(true);
  });

  it('accumulates bytes across calls within the window', () => {
    const svc = makeService();
    const conn = makeConnection();
    // 200 KB across 50 frames is well under the 256 KB cap
    for (let i = 0; i < 50; i++) {
      expect((svc as any).checkByteRate(conn, 4 * KB)).toBe(true);
    }
  });

  it('rejects when the cumulative bytes exceed 256 KB in a window', () => {
    const svc = makeService();
    const conn = makeConnection();
    // Fill the bucket to just under the cap
    for (let i = 0; i < 32; i++) {
      expect((svc as any).checkByteRate(conn, 8 * KB)).toBe(true);
    }
    // 33 * 8KB = 264KB > 256KB threshold
    expect((svc as any).checkByteRate(conn, 8 * KB)).toBe(false);
  });

  it('does not let an individual oversized frame slip through', () => {
    // Even though the WSS is configured with maxPayload=8KB so the framing
    // layer rejects oversized messages first, the byte-rate check is the
    // second line of defence.
    const svc = makeService();
    const conn = makeConnection();
    // A single 300 KB blob > 256 KB threshold immediately returns false
    expect((svc as any).checkByteRate(conn, 300 * KB)).toBe(false);
  });

  it('resets the byte counter after the 10-second window rolls', () => {
    const svc = makeService();
    const t0 = 2_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(t0);
    const conn = makeConnection(t0);

    expect((svc as any).checkByteRate(conn, MAX_BYTES)).toBe(true);
    // Next call would exceed
    expect((svc as any).checkByteRate(conn, 1)).toBe(false);

    // Roll forward past the 10s window
    vi.spyOn(Date, 'now').mockReturnValue(t0 + 10_001);
    expect((svc as any).checkByteRate(conn, 1 * KB)).toBe(true);

    vi.restoreAllMocks();
  });

  it('rejects exactly at the 256 KB + 1 byte boundary', () => {
    const svc = makeService();
    const conn = makeConnection();
    // Send exactly 256 KB → ok (bytesCount === MAX_BYTES_PER_WINDOW)
    expect((svc as any).checkByteRate(conn, MAX_BYTES)).toBe(true);
    // One more byte → over
    expect((svc as any).checkByteRate(conn, 1)).toBe(false);
  });
});
