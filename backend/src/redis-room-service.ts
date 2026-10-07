import { createClient, RedisClientType } from 'redis';
import { Room, Participant, RoomMessage, CreateRoomRequest, JoinRoomRequest } from './room-types.js';
import { JWTAuth } from './jwt-auth.js';
import { logger } from './logger.js';

const KEY_PREFIX = 'hushroom:';

function errorForReason(reason: 'not-found' | 'expired' | 'locked' | 'full'): string {
  switch (reason) {
    case 'not-found': return 'Room not found or expired';
    case 'expired':   return 'Room has expired';
    case 'locked':    return 'Room is locked';
    case 'full':      return 'Room is full';
  }
}

export type JoinReason = 'not-found' | 'expired' | 'locked' | 'full';

export class RedisRoomService {
  private client: RedisClientType;
  private pubClient: RedisClientType;
  private subClient: RedisClientType;

  // Grace period timers for host disconnections (roomId → timer)
  private hostGraceTimers: Map<string, NodeJS.Timeout> = new Map();
  private static HOST_GRACE_PERIOD_MS = 60_000; // 60 seconds

  private key(suffix: string): string {
    return `${KEY_PREFIX}${suffix}`;
  }

  // Redis clients are injectable (Sprint 19.1 — for unit tests).
  // Production: pass nothing; we'll createClient() with REDIS_URL.
  constructor(
    client?: RedisClientType,
    pubClient?: RedisClientType,
    subClient?: RedisClientType,
  ) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = client ?? createClient({ url: redisUrl });
    this.pubClient = pubClient ?? createClient({ url: redisUrl });
    this.subClient = subClient ?? createClient({ url: redisUrl });

    // Only attach the error logger on auto-created clients — injected mocks
    // typically don't implement .on() and we don't need it for tests anyway.
    if (!client) this.client.on('error', (err) => logger.error('Redis Client Error', { err }));
    if (!pubClient) this.pubClient.on('error', (err) => logger.error('Redis Pub Error', { err }));
    if (!subClient) this.subClient.on('error', (err) => logger.error('Redis Sub Error', { err }));
  }

  async connect(): Promise<void> {
    await Promise.all([
      this.client.connect(),
      this.pubClient.connect(),
      this.subClient.connect()
    ]);
    logger.info('Redis connected for room storage');
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.client.disconnect(),
      this.pubClient.disconnect(),
      this.subClient.disconnect()
    ]);
  }

  // Create room with Redis persistence
  async createRoom(request: CreateRoomRequest, hostUserId: string, hostEmailHash?: string): Promise<{ success: boolean; room?: Room; token?: string; error?: string }> {
    try {
      const roomId = this.generateRoomId();
      const now = Date.now();
      const expiresAt = now + (request.duration * 60 * 1000);

      const room: Room = {
        id: roomId,
        name: request.name,
        hostId: hostUserId,
        maxParticipants: request.maxParticipants,
        duration: request.duration,
        createdAt: now,
        expiresAt,
        participants: new Map(),
        messages: [],
        isLocked: false,
        settings: {
          allowGuests: request.settings?.allowGuests ?? true,
          requireApproval: request.settings?.requireApproval ?? false,
          maxMessageLength: request.settings?.maxMessageLength ?? 500
        }
      };

      // Add host as participant
      const host: Participant = {
        sessionId: hostUserId,
        name: request.hostName,
        joinedAt: now,
        lastActivity: now,
        isHost: true
      };

      room.participants.set(hostUserId, host);

      // Store room in Redis with TTL
      const ttlSeconds = Math.ceil(request.duration * 60);
      const serialized = this.serializeRoom(room);
      if (hostEmailHash) {
        (serialized as any).hostEmailHash = hostEmailHash;
      }
      await this.client.setEx(
        this.key(`room:${roomId}`),
        ttlSeconds,
        JSON.stringify(serialized)
      );

      // Store participants separately for faster lookups
      await this.client.setEx(
        this.key(`room:${roomId}:participants`),
        ttlSeconds,
        JSON.stringify([{ userId: hostUserId, ...host }])
      );

      // Track active rooms per email
      if (hostEmailHash) {
        const setKey = `hushroom:rooms-by-email:${hostEmailHash}`;
        await this.client.sAdd(setKey, roomId);
        // Set TTL on the set so it eventually cleans up (7 days max)
        await this.client.expire(setKey, 7 * 24 * 60 * 60);
      }

      // Generate JWT token with room permissions
      const token = JWTAuth.generateToken({
        userId: hostUserId,
        name: request.hostName,
        roomId,
        role: 'host'
      });

      logger.info("Room created", { roomId, durationMin: request.duration });

      return { success: true, room, token };

    } catch (error) {
      logger.error('Failed to create room', { error });
      return { success: false, error: 'Failed to create room' };
    }
  }

  // Single source of truth for "user X should be a participant in room Y".
  // Idempotent: re-calling with same userId refreshes lastActivity but
  // preserves joinedAt + isHost. Used by both HTTP /api/join-room (after
  // login) and WS handleJoinRoom (after reconnect).
  public async ensureParticipant(
    roomId: string,
    userId: string,
    name: string,
  ): Promise<
    | { ok: true; room: Room; isNew: boolean }
    | { ok: false; reason: 'not-found' | 'expired' | 'locked' | 'full' }
  > {
    const roomKey = this.key(`room:${roomId}`);
    const roomData = await this.client.get(roomKey);
    if (!roomData) {
      return { ok: false, reason: 'not-found' };
    }

    const room = this.deserializeRoom(JSON.parse(roomData));

    if (Date.now() > room.expiresAt) {
      await this.deleteRoom(roomId);
      return { ok: false, reason: 'expired' };
    }

    const existing = room.participants.get(userId);
    const isNew = !existing;

    // Lock + full only matter for NEW joiners — re-joining existing
    // participants slip through (typical case for WS reconnect).
    if (isNew) {
      if (room.isLocked) return { ok: false, reason: 'locked' };
      if (room.participants.size >= room.maxParticipants) return { ok: false, reason: 'full' };
    }

    room.participants.set(userId, {
      sessionId: userId,
      name,
      joinedAt: existing?.joinedAt ?? Date.now(),
      lastActivity: Date.now(),
      isHost: existing?.isHost ?? false,
    });

    await this.writeRoomState(roomId, room);
    return { ok: true, room, isNew };
  }

  // Internal helper: serialize and persist both the room blob and the
  // participants-list-blob with the same TTL.
  private async writeRoomState(roomId: string, room: Room): Promise<void> {
    const roomKey = this.key(`room:${roomId}`);
    const ttl = await this.client.ttl(roomKey);
    if (ttl <= 0) return;
    await this.client.setEx(roomKey, ttl, JSON.stringify(this.serializeRoom(room)));
    const participants = Array.from(room.participants.values()).map(p => ({
      userId: p.sessionId,
      ...p,
    }));
    await this.client.setEx(
      this.key(`room:${roomId}:participants`),
      ttl,
      JSON.stringify(participants)
    );
  }

  // Join room with Redis lookup (HTTP path — wraps ensureParticipant +
  // mints JWT + publishes join event).
  async joinRoom(request: JoinRoomRequest, userId: string): Promise<{ success: boolean; room?: Room; token?: string; error?: string }> {
    try {
      const result = await this.ensureParticipant(request.roomId, userId, request.participantName);
      if (!result.ok) {
        return { success: false, error: errorForReason(result.reason) };
      }

      const token = JWTAuth.generateToken({
        userId,
        name: request.participantName,
        roomId: request.roomId,
        role: 'participant',
      });

      // Only publish a join event if this was a NEW participant — re-joins
      // (page-refresh, WS-reconnect after HTTP /api/join-room) shouldn't
      // emit duplicate "X joined the room" toasts.
      if (result.isNew) {
        await this.pubClient.publish(this.key(`room:${request.roomId}:events`), JSON.stringify({
          type: 'user_joined',
          userId,
          name: request.participantName,
          timestamp: Date.now(),
        }));
        logger.info("Participant joined room", { roomId: request.roomId });
      }

      return { success: true, room: result.room, token };
    } catch (error) {
      logger.error('Failed to join room', { error });
      return { success: false, error: 'Failed to join room' };
    }
  }

  // Cancel host grace period (called when host reconnects)
  public cancelHostGracePeriod(roomId: string): void {
    const timer = this.hostGraceTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.hostGraceTimers.delete(roomId);
      logger.info("Host grace period cancelled", { roomId, reason: "host reconnected" });
    }
  }

  // Leave room
  async leaveRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      const roomData = await this.client.get(this.key(`room:${roomId}`));
      if (!roomData) return false;

      const room = this.deserializeRoom(JSON.parse(roomData));
      const participant = room.participants.get(userId);
      if (!participant) return false;

      room.participants.delete(userId);

      // If room is empty, delete immediately
      if (room.participants.size === 0) {
        await this.deleteRoom(roomId);
        await this.pubClient.publish(this.key(`room:${roomId}:events`), JSON.stringify({
          type: 'room_closed',
          reason: 'empty',
          timestamp: Date.now()
        }));
        return true;
      }

      // If host left but room still has participants, start grace period
      if (participant.isHost) {
        // Update room without host first (so others can keep chatting)
        const remainingTtl = await this.client.ttl(this.key(`room:${roomId}`));
        if (remainingTtl > 0) {
          await this.client.setEx(
            this.key(`room:${roomId}`),
            remainingTtl,
            JSON.stringify(this.serializeRoom(room))
          );
          const participants = Array.from(room.participants.values()).map(p => ({
            userId: p.sessionId,
            ...p
          }));
          await this.client.setEx(
            this.key(`room:${roomId}:participants`),
            remainingTtl,
            JSON.stringify(participants)
          );
        }

        logger.info("Host left room, starting grace period", { roomId, graceSeconds: RedisRoomService.HOST_GRACE_PERIOD_MS / 1000 });

        // Clear any existing grace timer
        this.cancelHostGracePeriod(roomId);

        // Start grace period timer
        const timer = setTimeout(async () => {
          this.hostGraceTimers.delete(roomId);
          const stillExists = await this.client.get(this.key(`room:${roomId}`));
          if (stillExists) {
            const currentRoom = this.deserializeRoom(JSON.parse(stillExists));
            // Only delete if host hasn't rejoined
            const hostRejoined = Array.from(currentRoom.participants.values()).some(p => p.isHost);
            if (!hostRejoined) {
              logger.info("Host grace period expired, closing room", { roomId });
              await this.deleteRoom(roomId);
              await this.pubClient.publish(this.key(`room:${roomId}:events`), JSON.stringify({
                type: 'room_closed',
                reason: 'host_left',
                timestamp: Date.now()
              }));
            }
          }
        }, RedisRoomService.HOST_GRACE_PERIOD_MS);

        this.hostGraceTimers.set(roomId, timer);

        // Publish leave event (not room_closed yet)
        await this.pubClient.publish(this.key(`room:${roomId}:events`), JSON.stringify({
          type: 'user_left',
          userId,
          name: participant.name,
          timestamp: Date.now()
        }));

        return true;
      }

      // Regular participant left - update room in Redis
      const remainingTtl = await this.client.ttl(this.key(`room:${roomId}`));
      if (remainingTtl > 0) {
        await this.client.setEx(
          this.key(`room:${roomId}`),
          remainingTtl,
          JSON.stringify(this.serializeRoom(room))
        );

        const participants = Array.from(room.participants.values()).map(p => ({
          userId: p.sessionId,
          ...p
        }));
        await this.client.setEx(
          this.key(`room:${roomId}:participants`),
          remainingTtl,
          JSON.stringify(participants)
        );
      }

      // Publish leave event
      await this.pubClient.publish(this.key(`room:${roomId}:events`), JSON.stringify({
        type: 'user_left',
        userId,
        name: participant.name,
        timestamp: Date.now()
      }));

      logger.info("Participant left room", { roomId });
      return true;

    } catch (error) {
      logger.error('Failed to leave room', { error });
      return false;
    }
  }

  // Get room info
  async getRoom(roomId: string): Promise<Room | null> {
    try {
      const roomData = await this.client.get(this.key(`room:${roomId}`));
      if (!roomData) return null;
      
      return this.deserializeRoom(JSON.parse(roomData));
    } catch (error) {
      logger.error('Failed to get room', { error });
      return null;
    }
  }

  // Add message to room
  async addMessage(roomId: string, message: RoomMessage): Promise<void> {
    try {
      const room = await this.getRoom(roomId);
      if (!room) return;

      // Add to room messages
      room.messages.push(message);

      // Keep only last 100 messages
      if (room.messages.length > 100) {
        room.messages = room.messages.slice(-100);
      }

      // Update room in Redis
      const remainingTtl = await this.client.ttl(this.key(`room:${roomId}`));
      if (remainingTtl > 0) {
        await this.client.setEx(
          this.key(`room:${roomId}`),
          remainingTtl,
          JSON.stringify(this.serializeRoom(room))
        );
      }

      // Publish message for real-time delivery
      await this.pubClient.publish(this.key(`room:${roomId}:messages`), JSON.stringify(message));

    } catch (error) {
      logger.error('Failed to add message', { error });
    }
  }

  // Subscribe to room messages
  async subscribeToRoom(roomId: string, callback: (message: RoomMessage) => void): Promise<void> {
    await this.subClient.subscribe(this.key(`room:${roomId}:messages`), (data) => {
      try {
        const message = JSON.parse(data);
        callback(message);
      } catch (error) {
        logger.error('Failed to parse room message', { error });
      }
    });
  }

  // Subscribe to room events (join/leave/etc)
  async subscribeToRoomEvents(roomId: string, callback: (event: any) => void): Promise<void> {
    await this.subClient.subscribe(this.key(`room:${roomId}:events`), (data) => {
      try {
        const event = JSON.parse(data);
        callback(event);
      } catch (error) {
        logger.error('Failed to parse room event', { error });
      }
    });
  }

  // Delete room
  public async deleteRoom(roomId: string): Promise<void> {
    // Try to read hostEmailHash before deleting so we can clean up the rooms-by-email set
    try {
      const roomData = await this.client.get(this.key(`room:${roomId}`));
      if (roomData) {
        const parsed = JSON.parse(roomData);
        const emailHash = parsed.hostEmailHash as string | undefined;
        if (emailHash) {
          await this.client.sRem(`hushroom:rooms-by-email:${emailHash}`, roomId);
        }
      }
    } catch {
      // Best effort — don't block deletion
    }

    await Promise.all([
      this.client.del(this.key(`room:${roomId}`)),
      this.client.del(this.key(`room:${roomId}:participants`)),
      this.client.del(this.key(`room:${roomId}:messages`))
    ]);
    logger.info("Room deleted", { roomId });
  }

  // Count active rooms for a user (for Demo tier enforcement)
  public async countActiveRoomsForUser(emailHash: string): Promise<number> {
    const setKey = `hushroom:rooms-by-email:${emailHash}`;
    const roomIds = await this.client.sMembers(setKey);
    let count = 0;
    for (const roomId of roomIds) {
      const exists = await this.client.exists(this.key(`room:${roomId}`));
      if (exists) {
        count++;
      } else {
        // Clean up stale entry
        await this.client.sRem(setKey, roomId);
      }
    }
    return count;
  }

  // Serialize room for Redis storage
  private serializeRoom(room: Room): any {
    return {
      ...room,
      participants: Array.from(room.participants.entries()).map(([key, value]) => [key, value])
    };
  }

  // Deserialize room from Redis storage
  private deserializeRoom(data: any): Room {
    const room = { ...data };
    room.participants = new Map(data.participants);
    return room as Room;
  }

  // Generate room ID (same logic as before)
  private generateRoomId(): string {
    const adjectives = [
      'quiet', 'bright', 'calm', 'swift', 'warm', 'cool', 'deep', 'wide',
      'light', 'dark', 'soft', 'bold', 'fresh', 'clear', 'sharp', 'smooth'
    ];
    
    const nouns = [
      'sun', 'moon', 'star', 'wind', 'wave', 'fire', 'snow', 'rain',
      'cloud', 'tree', 'rock', 'bird', 'fish', 'bear', 'wolf', 'deer'
    ];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 9000) + 1000;
    
    return `${adjective}-${noun}-${number}`;
  }

  // Get room statistics
  async getStats(): Promise<{ totalRooms: number; totalParticipants: number }> {
    try {
      const keys = await this.client.keys(this.key('room:*'));
      const roomKeys = keys.filter(key => !key.includes(':participants') && !key.includes(':messages'));
      
      let totalParticipants = 0;
      
      for (const key of roomKeys) {
        const roomData = await this.client.get(key);
        if (roomData) {
          const room = this.deserializeRoom(JSON.parse(roomData));
          totalParticipants += room.participants.size;
        }
      }
      
      return {
        totalRooms: roomKeys.length,
        totalParticipants
      };
    } catch (error) {
      logger.error('Failed to get stats', { error });
      return { totalRooms: 0, totalParticipants: 0 };
    }
  }

  // Expose Redis client for rate limiting and auth services
  public getClient(): RedisClientType {
    return this.client;
  }

  // WebSocket integration methods
  public async roomExists(roomId: string): Promise<boolean> {
    try {
      const room = await this.client.get(this.key(`room:${roomId}`));
      return room !== null;
    } catch (error) {
      logger.error("Room exists check error", { error });
      return false;
    }
  }

  // Thin wrapper around ensureParticipant for the WS path. Throws so
  // existing handleJoinRoom error-handling stays compatible. The caller
  // already verified room existence + JWT-roomId-binding (Sprint 13.1),
  // but we still reject locked/full/expired here defensively.
  public async addParticipant(roomId: string, userId: string, name: string): Promise<void> {
    try {
      const result = await this.ensureParticipant(roomId, userId, name);
      if (!result.ok) {
        throw new Error(`addParticipant rejected: ${result.reason}`);
      }
    } catch (error) {
      logger.error("Add participant error", { error });
      throw error;
    }
  }

  public async removeParticipant(roomId: string, userId: string): Promise<void> {
    try {
      const roomKey = this.key(`room:${roomId}`);
      const roomData = await this.client.get(roomKey);
      
      if (!roomData) return;

      const room = this.deserializeRoom(JSON.parse(roomData));
      room.participants.delete(userId);

      await this.client.set(roomKey, JSON.stringify(this.serializeRoom(room)), {
        EX: Math.floor((room.expiresAt - Date.now()) / 1000)
      });
    } catch (error) {
      logger.error("Remove participant error", { error });
    }
  }

  public async updateRoomLock(roomId: string, isLocked: boolean): Promise<boolean> {
    try {
      const roomKey = this.key(`room:${roomId}`);
      const roomData = await this.client.get(roomKey);
      if (!roomData) return false;

      const room = this.deserializeRoom(JSON.parse(roomData));
      room.isLocked = isLocked;

      const ttl = await this.client.ttl(roomKey);
      if (ttl > 0) {
        await this.client.setEx(roomKey, ttl, JSON.stringify(this.serializeRoom(room)));
      }
      return true;
    } catch (error) {
      logger.error('Update room lock error', { error });
      return false;
    }
  }

  public async getRoomParticipants(roomId: string): Promise<Array<{id: string, name: string}>> {
    try {
      const roomKey = this.key(`room:${roomId}`);
      const roomData = await this.client.get(roomKey);
      
      if (!roomData) return [];

      const room = this.deserializeRoom(JSON.parse(roomData));
      return Array.from(room.participants.values()).map(p => ({id: p.sessionId, name: p.name}));
    } catch (error) {
      logger.error("Get room participants error", { error });
      return [];
    }
  }
}

// Singleton instance
export const redisRoomService = new RedisRoomService();
