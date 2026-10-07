import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock factories are hoisted to the top of the file BEFORE any imports,
// so refs to module-scope variables fail. Use vi.hoisted to lift the mock
// shape into that hoisted region.
const { mockRedisService } = vi.hoisted(() => ({
  mockRedisService: {
    roomExists: vi.fn(),
    addParticipant: vi.fn(),
    removeParticipant: vi.fn(),
    cancelHostGracePeriod: vi.fn(),
    getRoomParticipants: vi.fn(),
    addMessage: vi.fn(),
    updateRoomLock: vi.fn(),
  },
}));

vi.mock('./redis-room-service.js', () => ({ redisRoomService: mockRedisService }));

import { StatelessWebSocketService } from './websocket-service.js';
import { WebSocket } from 'ws';

// Sprint 19.4b — full WS handler coverage.
//
// We can't actually instantiate the service (its constructor spins up a
// WebSocketServer on a real http.Server). So we allocate via the prototype,
// manually populate the connections map, and call handlers as `(svc as any)`.
// All redisRoomService side effects go through the vi.mock above; the socket
// itself is a vi.fn() shim with the readyState the handlers branch on.

interface MockSocket {
  readyState: number;
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

function makeSocket(): MockSocket {
  return {
    readyState: WebSocket.OPEN,
    send: vi.fn(),
    close: vi.fn(),
  };
}

function makeService(): any {
  // Skip constructor (would call new WebSocketServer({ server, ... }))
  const svc = Object.create(StatelessWebSocketService.prototype);
  svc.connections = new Map();
  return svc;
}

function addConnection(svc: any, opts: {
  connectionId: string;
  user: { userId: string; name: string; roomId?: string; role?: 'host' | 'participant' };
  currentRoomId?: string;
}): MockSocket {
  const socket = makeSocket();
  const now = Date.now();
  svc.connections.set(opts.connectionId, {
    socket,
    user: opts.user,
    lastActivity: now,
    currentRoomId: opts.currentRoomId,
    messageCount: 0,
    messagePeriodStart: now,
    bytesCount: 0,
    bytesPeriodStart: now,
  });
  return socket;
}

function lastSentTo(socket: MockSocket): any {
  const last = socket.send.mock.calls.at(-1)?.[0];
  return last ? JSON.parse(last) : undefined;
}

function allSentTo(socket: MockSocket): any[] {
  return socket.send.mock.calls.map(c => JSON.parse(c[0]));
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── handleJoinRoom ────────────────────────────────────────────

describe('handleJoinRoom', () => {
  it('rejects join with JWT roomId-mismatch (Sprint 13.1) — close 4003 + error', async () => {
    const svc = makeService();
    const socket = addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'Alice', roomId: 'jwt-room' },
    });

    await svc.handleJoinRoom('c1', { roomId: 'different-room', name: 'Alice' });

    expect(socket.close).toHaveBeenCalledWith(4003, 'not authorized for room');
    expect(lastSentTo(socket).type).toBe('error');
    expect(lastSentTo(socket).error).toContain('Not authorized');
    expect(mockRedisService.addParticipant).not.toHaveBeenCalled();
  });

  it('rejects join when room does not exist', async () => {
    const svc = makeService();
    const socket = addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'Alice', roomId: 'room-x' },
    });
    mockRedisService.roomExists.mockResolvedValue(false);

    await svc.handleJoinRoom('c1', { roomId: 'room-x', name: 'Alice' });

    expect(lastSentTo(socket).type).toBe('error');
    expect(lastSentTo(socket).error).toContain('Room not found');
    expect(mockRedisService.addParticipant).not.toHaveBeenCalled();
  });

  it('happy path: adds participant, sends joined_room, broadcasts participants_update', async () => {
    const svc = makeService();
    const socket = addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'Alice', roomId: 'room-x' },
    });
    mockRedisService.roomExists.mockResolvedValue(true);
    mockRedisService.getRoomParticipants.mockResolvedValue([{ id: 'u1', name: 'Alice' }]);

    await svc.handleJoinRoom('c1', { roomId: 'room-x', name: 'Alice' });

    expect(mockRedisService.addParticipant).toHaveBeenCalledWith('room-x', 'u1', 'Alice');
    const sent = allSentTo(socket);
    expect(sent.find(m => m.type === 'joined_room')).toMatchObject({ roomId: 'room-x', success: true });
    expect(sent.find(m => m.type === 'participants_update')).toBeTruthy();
  });

  it('host reconnect cancels grace period', async () => {
    const svc = makeService();
    addConnection(svc, {
      connectionId: 'c-host',
      user: { userId: 'u-host', name: 'Host', roomId: 'room-x', role: 'host' },
    });
    mockRedisService.roomExists.mockResolvedValue(true);
    mockRedisService.getRoomParticipants.mockResolvedValue([{ id: 'u-host', name: 'Host' }]);

    await svc.handleJoinRoom('c-host', { roomId: 'room-x', name: 'Host' });

    expect(mockRedisService.cancelHostGracePeriod).toHaveBeenCalledWith('room-x');
  });

  it('non-host join does NOT touch host grace period', async () => {
    const svc = makeService();
    addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'Bob', roomId: 'room-x', role: 'participant' },
    });
    mockRedisService.roomExists.mockResolvedValue(true);
    mockRedisService.getRoomParticipants.mockResolvedValue([]);

    await svc.handleJoinRoom('c1', { roomId: 'room-x', name: 'Bob' });

    expect(mockRedisService.cancelHostGracePeriod).not.toHaveBeenCalled();
  });

  it('sets currentRoomId on the connection after successful join', async () => {
    const svc = makeService();
    addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'A', roomId: 'room-x' },
    });
    mockRedisService.roomExists.mockResolvedValue(true);
    mockRedisService.getRoomParticipants.mockResolvedValue([]);

    await svc.handleJoinRoom('c1', { roomId: 'room-x', name: 'A' });

    expect(svc.connections.get('c1').currentRoomId).toBe('room-x');
  });
});

// ── handleSendEncryptedMessage ────────────────────────────────

describe('handleSendEncryptedMessage', () => {
  it('rejects when sender is not in a room', async () => {
    const svc = makeService();
    const socket = addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'A' },
      // no currentRoomId
    });

    await svc.handleSendEncryptedMessage('c1', { ciphertext: 'AAA', nonce: 'BBB' });

    expect(lastSentTo(socket).type).toBe('error');
    expect(lastSentTo(socket).error).toContain('Must be in a room');
    expect(mockRedisService.addMessage).not.toHaveBeenCalled();
  });

  it('rejects when ciphertext is missing or wrong type', async () => {
    const svc = makeService();
    const socket = addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'A' },
      currentRoomId: 'room-x',
    });

    await svc.handleSendEncryptedMessage('c1', { nonce: 'BBB' });

    expect(lastSentTo(socket).type).toBe('error');
    expect(lastSentTo(socket).error).toContain('missing ciphertext');
  });

  it('rejects oversized ciphertext (>1500 chars)', async () => {
    const svc = makeService();
    const socket = addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'A' },
      currentRoomId: 'room-x',
    });

    await svc.handleSendEncryptedMessage('c1', {
      ciphertext: 'a'.repeat(1501),
      nonce: 'BBB',
    });

    expect(lastSentTo(socket).type).toBe('error');
    expect(lastSentTo(socket).error).toContain('too large');
  });

  it('rejects oversized nonce (>64 chars)', async () => {
    const svc = makeService();
    const socket = addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'A' },
      currentRoomId: 'room-x',
    });

    await svc.handleSendEncryptedMessage('c1', {
      ciphertext: 'AAA',
      nonce: 'a'.repeat(65),
    });

    expect(lastSentTo(socket).type).toBe('error');
    expect(lastSentTo(socket).error).toContain('Invalid nonce');
  });

  it('happy path: broadcasts message + persists with [encrypted] placeholder (server cannot read plaintext)', async () => {
    const svc = makeService();
    const senderSocket = addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'Alice' },
      currentRoomId: 'room-x',
    });
    const peerSocket = addConnection(svc, {
      connectionId: 'c2',
      user: { userId: 'u2', name: 'Bob' },
      currentRoomId: 'room-x',
    });

    await svc.handleSendEncryptedMessage('c1', {
      ciphertext: 'AAA',
      nonce: 'BBB',
    });

    // Both sockets received the broadcast (sender included — same as production)
    const peerMsg = lastSentTo(peerSocket);
    expect(peerMsg.type).toBe('message');
    expect(peerMsg.message.encrypted).toBe(true);
    expect(peerMsg.message.ciphertext).toBe('AAA');
    expect(peerMsg.message.user).toBe('Alice');

    // Persisted with [encrypted] text placeholder — server doesn't see plaintext
    expect(mockRedisService.addMessage).toHaveBeenCalledWith('room-x', expect.objectContaining({
      ciphertext: 'AAA',
      nonce: 'BBB',
      text: '[encrypted]',
      encrypted: true,
    }));
    // Sender also got the broadcast
    const sentToSender = allSentTo(senderSocket);
    expect(sentToSender.some(m => m.type === 'message')).toBe(true);
  });
});

// ── handleSendMessage (plaintext, legacy path) ───────────────

describe('handleSendMessage', () => {
  it('rejects when not in a room', async () => {
    const svc = makeService();
    const socket = addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'A' },
    });

    await svc.handleSendMessage('c1', { text: 'hi' });

    expect(lastSentTo(socket).type).toBe('error');
    expect(mockRedisService.addMessage).not.toHaveBeenCalled();
  });

  it('rejects empty text', async () => {
    const svc = makeService();
    const socket = addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'A' },
      currentRoomId: 'room-x',
    });

    await svc.handleSendMessage('c1', { text: '   ' });

    expect(lastSentTo(socket).type).toBe('error');
    expect(lastSentTo(socket).error).toContain('Invalid message');
  });

  it('rejects text >500 chars', async () => {
    const svc = makeService();
    const socket = addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'A' },
      currentRoomId: 'room-x',
    });

    await svc.handleSendMessage('c1', { text: 'a'.repeat(501) });

    expect(lastSentTo(socket).type).toBe('error');
  });

  it('happy path: sanitizes + broadcasts + persists', async () => {
    const svc = makeService();
    const peer = addConnection(svc, {
      connectionId: 'c2',
      user: { userId: 'u2', name: 'B' },
      currentRoomId: 'room-x',
    });
    addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'A' },
      currentRoomId: 'room-x',
    });

    await svc.handleSendMessage('c1', { text: 'hello <script>alert(1)</script>' });

    const broadcast = lastSentTo(peer);
    expect(broadcast.type).toBe('message');
    // <script> stripped by DOMPurify
    expect(broadcast.message.text).not.toContain('<script>');
    expect(broadcast.message.user).toBe('A');
    expect(broadcast.message.sanitized).toBe(true);

    expect(mockRedisService.addMessage).toHaveBeenCalledWith('room-x', expect.objectContaining({
      sessionId: 'u1',
      sanitized: true,
    }));
  });
});

// ── handleKickParticipant ─────────────────────────────────────

describe('handleKickParticipant', () => {
  it('rejects non-host requesters', async () => {
    const svc = makeService();
    const socket = addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'NotHost', role: 'participant' },
      currentRoomId: 'room-x',
    });

    await svc.handleKickParticipant('c1', { targetUserId: 'u2' });

    expect(lastSentTo(socket).type).toBe('error');
    expect(lastSentTo(socket).error).toContain('Only host');
    expect(mockRedisService.removeParticipant).not.toHaveBeenCalled();
  });

  it('rejects without a target', async () => {
    const svc = makeService();
    const socket = addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'Host', role: 'host' },
      currentRoomId: 'room-x',
    });

    await svc.handleKickParticipant('c1', {});

    expect(lastSentTo(socket).type).toBe('error');
    expect(lastSentTo(socket).error).toContain('Invalid target');
  });

  it('happy path: closes target socket with 4001 + removes from room', async () => {
    const svc = makeService();
    addConnection(svc, {
      connectionId: 'c-host',
      user: { userId: 'u-host', name: 'Host', role: 'host' },
      currentRoomId: 'room-x',
    });
    const targetSocket = addConnection(svc, {
      connectionId: 'c-target',
      user: { userId: 'u-target', name: 'Bob' },
      currentRoomId: 'room-x',
    });
    mockRedisService.getRoomParticipants.mockResolvedValue([]);

    await svc.handleKickParticipant('c-host', { targetUserId: 'u-target' });

    expect(targetSocket.close).toHaveBeenCalledWith(4001, 'Kicked by host');
    const targetMsgs = allSentTo(targetSocket);
    expect(targetMsgs.some(m => m.type === 'kicked')).toBe(true);
    expect(mockRedisService.removeParticipant).toHaveBeenCalledWith('room-x', 'u-target');
  });

  it('host cannot kick themselves', async () => {
    const svc = makeService();
    const hostSocket = addConnection(svc, {
      connectionId: 'c-host',
      user: { userId: 'u-host', name: 'Host', role: 'host' },
      currentRoomId: 'room-x',
    });
    mockRedisService.getRoomParticipants.mockResolvedValue([]);

    await svc.handleKickParticipant('c-host', { targetUserId: 'u-host' });

    expect(hostSocket.close).not.toHaveBeenCalled();
    expect(mockRedisService.removeParticipant).not.toHaveBeenCalled();
  });

  it('kick by name works (mobile UI uses name, not userId)', async () => {
    const svc = makeService();
    addConnection(svc, {
      connectionId: 'c-host',
      user: { userId: 'u-host', name: 'Host', role: 'host' },
      currentRoomId: 'room-x',
    });
    const targetSocket = addConnection(svc, {
      connectionId: 'c-target',
      user: { userId: 'u-bob', name: 'Bob' },
      currentRoomId: 'room-x',
    });
    mockRedisService.getRoomParticipants.mockResolvedValue([]);

    await svc.handleKickParticipant('c-host', { targetUserName: 'Bob' });

    expect(targetSocket.close).toHaveBeenCalled();
    expect(mockRedisService.removeParticipant).toHaveBeenCalledWith('room-x', 'u-bob');
  });
});

// ── handleLockRoom ────────────────────────────────────────────

describe('handleLockRoom', () => {
  it('rejects non-host requesters', async () => {
    const svc = makeService();
    const socket = addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'NotHost', role: 'participant' },
      currentRoomId: 'room-x',
    });

    await svc.handleLockRoom('c1', true);

    expect(lastSentTo(socket).type).toBe('error');
    expect(lastSentTo(socket).error).toContain('Only host');
    expect(mockRedisService.updateRoomLock).not.toHaveBeenCalled();
  });

  it('host: lock broadcasts room_locked:true', async () => {
    const svc = makeService();
    addConnection(svc, {
      connectionId: 'c-host',
      user: { userId: 'u-host', name: 'Host', role: 'host' },
      currentRoomId: 'room-x',
    });
    const peerSocket = addConnection(svc, {
      connectionId: 'c-peer',
      user: { userId: 'u-peer', name: 'Peer' },
      currentRoomId: 'room-x',
    });
    mockRedisService.updateRoomLock.mockResolvedValue(true);

    await svc.handleLockRoom('c-host', true);

    expect(mockRedisService.updateRoomLock).toHaveBeenCalledWith('room-x', true);
    const peerMsg = lastSentTo(peerSocket);
    expect(peerMsg).toMatchObject({ type: 'room_locked', isLocked: true });
  });

  it('host: unlock broadcasts room_locked:false', async () => {
    const svc = makeService();
    addConnection(svc, {
      connectionId: 'c-host',
      user: { userId: 'u-host', name: 'Host', role: 'host' },
      currentRoomId: 'room-x',
    });
    mockRedisService.updateRoomLock.mockResolvedValue(true);

    await svc.handleLockRoom('c-host', false);

    expect(mockRedisService.updateRoomLock).toHaveBeenCalledWith('room-x', false);
  });

  it('Redis lock-update failure suppresses the broadcast', async () => {
    const svc = makeService();
    addConnection(svc, {
      connectionId: 'c-host',
      user: { userId: 'u-host', name: 'Host', role: 'host' },
      currentRoomId: 'room-x',
    });
    const peerSocket = addConnection(svc, {
      connectionId: 'c-peer',
      user: { userId: 'u-peer', name: 'Peer' },
      currentRoomId: 'room-x',
    });
    mockRedisService.updateRoomLock.mockResolvedValue(false);

    await svc.handleLockRoom('c-host', true);

    // No room_locked broadcast on persist failure
    expect(allSentTo(peerSocket).some(m => m.type === 'room_locked')).toBe(false);
  });
});

// ── handleTypingIndicator ─────────────────────────────────────

describe('handleTypingIndicator', () => {
  it('no-op when not in a room', () => {
    const svc = makeService();
    const socket = addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'A' },
    });

    svc.handleTypingIndicator('c1', 'typing_start');

    expect(socket.send).not.toHaveBeenCalled();
  });

  it('relays to peers in the same room, excluding sender (avoid self-typing toast)', () => {
    const svc = makeService();
    const senderSocket = addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'Alice' },
      currentRoomId: 'room-x',
    });
    const peerSocket = addConnection(svc, {
      connectionId: 'c2',
      user: { userId: 'u2', name: 'Bob' },
      currentRoomId: 'room-x',
    });

    svc.handleTypingIndicator('c1', 'typing_start');

    expect(senderSocket.send).not.toHaveBeenCalled();
    const peerMsg = lastSentTo(peerSocket);
    expect(peerMsg).toEqual({ type: 'typing_start', user: 'Alice' });
  });

  it('typing_stop also relays', () => {
    const svc = makeService();
    addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'Alice' },
      currentRoomId: 'room-x',
    });
    const peerSocket = addConnection(svc, {
      connectionId: 'c2',
      user: { userId: 'u2', name: 'Bob' },
      currentRoomId: 'room-x',
    });

    svc.handleTypingIndicator('c1', 'typing_stop');

    expect(lastSentTo(peerSocket).type).toBe('typing_stop');
  });

  it('does not leak across rooms', () => {
    const svc = makeService();
    addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'Alice' },
      currentRoomId: 'room-A',
    });
    const otherRoomSocket = addConnection(svc, {
      connectionId: 'c2',
      user: { userId: 'u2', name: 'Stranger' },
      currentRoomId: 'room-B',
    });

    svc.handleTypingIndicator('c1', 'typing_start');

    expect(otherRoomSocket.send).not.toHaveBeenCalled();
  });
});

// ── handleLeaveRoom ───────────────────────────────────────────

describe('handleLeaveRoom', () => {
  it('removes participant + clears currentRoomId + broadcasts participants_update', async () => {
    const svc = makeService();
    addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'A' },
      currentRoomId: 'room-x',
    });
    const peerSocket = addConnection(svc, {
      connectionId: 'c2',
      user: { userId: 'u2', name: 'B' },
      currentRoomId: 'room-x',
    });
    mockRedisService.getRoomParticipants.mockResolvedValue([{ id: 'u2', name: 'B' }]);

    await svc.handleLeaveRoom('c1');

    expect(mockRedisService.removeParticipant).toHaveBeenCalledWith('room-x', 'u1');
    expect(svc.connections.get('c1').currentRoomId).toBeUndefined();
    const peerMsg = lastSentTo(peerSocket);
    expect(peerMsg.type).toBe('participants_update');
  });

  it('no-op when sender is not in a room', async () => {
    const svc = makeService();
    addConnection(svc, {
      connectionId: 'c1',
      user: { userId: 'u1', name: 'A' },
    });

    await svc.handleLeaveRoom('c1');

    expect(mockRedisService.removeParticipant).not.toHaveBeenCalled();
  });
});
