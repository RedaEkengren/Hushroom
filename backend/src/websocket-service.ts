import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { JWTAuth, JWTPayload } from './jwt-auth.js';
import { redisRoomService } from './redis-room-service.js';
import { logger } from './logger.js';
import { randomUUID } from 'crypto';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM("").window;
const purify = DOMPurify(window as any);

interface WebSocketConnection {
  socket: WebSocket;
  user: JWTPayload;
  lastActivity: number;
  currentRoomId?: string;
  messageCount: number;
  messagePeriodStart: number;
  bytesCount: number;
  bytesPeriodStart: number;
}

const MAX_FRAME_BYTES = 8 * 1024; // 8KB per message (E2EE ciphertext ~1-2KB)
const MAX_BYTES_PER_WINDOW = 256 * 1024; // 256KB / 10s cumulative per connection

export class StatelessWebSocketService {
  private wss: WebSocketServer;
  private connections = new Map<string, WebSocketConnection>();

  constructor(server: any) {
    this.wss = new WebSocketServer({
      server,
      path: "/ws",
      perMessageDeflate: false,
      maxPayload: MAX_FRAME_BYTES,
    });

    this.wss.on("connection", this.handleConnection.bind(this));
    this.setupCleanupInterval();
  }

  private async handleConnection(socket: WebSocket, req: IncomingMessage) {
    try {
      const token = await this.resolveToken(req);
      if (!token) {
        this.rejectConnection(socket, "No token provided");
        return;
      }

      const user = JWTAuth.verifyToken(token);
      const connectionId = randomUUID();

      const connection: WebSocketConnection = {
        socket,
        user,
        lastActivity: Date.now(),
        currentRoomId: user.roomId,
        messageCount: 0,
        messagePeriodStart: Date.now(),
        bytesCount: 0,
        bytesPeriodStart: Date.now()
      };
      
      this.connections.set(connectionId, connection);

      logger.info("WebSocket connected", { connectionId, room: user.roomId || "none" });

      // Set up message handler
      socket.on("message", (raw) => this.handleMessage(connectionId, raw));
      
      socket.on("close", (code) => {
        logger.info("WebSocket disconnected", { connectionId, code });

        const conn = this.connections.get(connectionId);
        if (conn?.currentRoomId) {
          this.leaveRoomCleanup(connectionId, conn.currentRoomId);
        }
        this.connections.delete(connectionId);
      });

      socket.on("error", (error) => {
        logger.error("WebSocket error", { connectionId, error });
        this.connections.delete(connectionId);
      });

      // If user has roomId in JWT, automatically join WebSocket room
      if (user.roomId) {
        logger.info("Auto-joining room", { connectionId, roomId: user.roomId });
        this.handleJoinRoom(connectionId, { roomId: user.roomId, name: user.name });
      }

      // Send connection confirmation
      this.sendToConnection(connectionId, {
        type: "connected",
        user: { name: user.name, userId: user.userId },
        roomId: user.roomId
      });

    } catch (error) {
      logger.error("WebSocket connection error", { error });
      this.rejectConnection(socket, "Invalid token");
    }
  }

  private async resolveToken(req: IncomingMessage): Promise<string | null> {
    if (!req.url) return null;
    const url = new URL(req.url, `http://${req.headers.host}`);

    const ticket = url.searchParams.get('ticket');
    if (ticket) {
      const ticketKey = `hushroom:ws-ticket:${ticket}`;
      const client = redisRoomService.getClient();
      const token = await client.get(ticketKey);
      if (!token) return null;
      await client.del(ticketKey); // one-time use
      return token;
    }

    return null; // no fallback to ?token= for security
  }

  private checkMessageRate(connection: WebSocketConnection): boolean {
    const now = Date.now();
    if (now - connection.messagePeriodStart > 10000) {
      connection.messageCount = 0;
      connection.messagePeriodStart = now;
    }
    connection.messageCount++;
    return connection.messageCount <= 30; // max 30 msgs per 10s
  }

  private checkByteRate(connection: WebSocketConnection, bytes: number): boolean {
    const now = Date.now();
    if (now - connection.bytesPeriodStart > 10000) {
      connection.bytesCount = 0;
      connection.bytesPeriodStart = now;
    }
    connection.bytesCount += bytes;
    return connection.bytesCount <= MAX_BYTES_PER_WINDOW;
  }

  private rejectConnection(socket: WebSocket, reason: string) {
    logger.info("WebSocket rejected", { reason });
    socket.close(1008, reason);
  }

  private async handleMessage(connectionId: string, raw: any) {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }

    try {
      connection.lastActivity = Date.now();

      const bytes = Buffer.isBuffer(raw) ? raw.length : Buffer.byteLength(String(raw));
      if (!this.checkByteRate(connection, bytes)) {
        this.sendToConnection(connectionId, { type: "error", error: "Byte rate exceeded" });
        connection.socket.close(1009, "byte rate exceeded");
        return;
      }

      const msg = JSON.parse(raw.toString());

      switch (msg.type) {
        case "heartbeat":
        case "ping":
          this.sendToConnection(connectionId, { type: "pong" });
          break;
          
        case "send_message":
          await this.handleSendMessage(connectionId, msg);
          break;

        case "send_message_encrypted":
          await this.handleSendEncryptedMessage(connectionId, msg);
          break;
          
        case "join_room":
          await this.handleJoinRoom(connectionId, msg);
          break;
          
        case "leave_room":
          await this.handleLeaveRoom(connectionId);
          break;

        case "kick_participant":
          await this.handleKickParticipant(connectionId, msg);
          break;

        case "lock_room":
          await this.handleLockRoom(connectionId, true);
          break;

        case "unlock_room":
          await this.handleLockRoom(connectionId, false);
          break;

        case "typing_start":
          this.handleTypingIndicator(connectionId, "typing_start");
          break;

        case "typing_stop":
          this.handleTypingIndicator(connectionId, "typing_stop");
          break;

        default:
          this.sendToConnection(connectionId, {
            type: "error",
            error: "Unknown message type"
          });
      }

    } catch (error) {
      logger.error("WebSocket message error", { connectionId, error });
      this.sendToConnection(connectionId, {
        type: "error",
        error: "Invalid message format"
      });
    }
  }

  private async handleSendMessage(connectionId: string, msg: any) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { user } = connection;
    const roomId = connection.currentRoomId;

    if (!roomId) {
      this.sendToConnection(connectionId, { type: "error", error: "Must be in a room to send messages" });
      return;
    }

    if (!this.checkMessageRate(connection)) {
      this.sendToConnection(connectionId, { type: "error", error: "Too many messages" });
      return;
    }

    const text = String(msg.text || "").trim();
    if (!text || text.length > 500) {
      this.sendToConnection(connectionId, { type: "error", error: "Invalid message content" });
      return;
    }

    const sanitizedText = purify.sanitize(text, { ALLOWED_TAGS: [] });

    const roomMessage = {
      id: randomUUID(),
      user: user.name,
      text: sanitizedText,
      timestamp: Date.now(),
      sanitized: true
    };

    // Broadcast to all room participants
    await this.broadcastToRoom(roomId, {
      type: "message",
      message: roomMessage
    });

    await redisRoomService.addMessage(roomId, {
      ...roomMessage,
      roomId,
      sessionId: user.userId
    });

    logger.info("Message sent", { roomId });
  }

  private async handleSendEncryptedMessage(connectionId: string, msg: any) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { user } = connection;
    const roomId = connection.currentRoomId;

    if (!roomId) {
      this.sendToConnection(connectionId, { type: "error", error: "Must be in a room to send messages" });
      return;
    }

    if (!this.checkMessageRate(connection)) {
      this.sendToConnection(connectionId, { type: "error", error: "Too many messages" });
      return;
    }

    const ciphertext = msg.ciphertext;
    const nonce = msg.nonce;

    if (!ciphertext || typeof ciphertext !== 'string' || !nonce || typeof nonce !== 'string') {
      this.sendToConnection(connectionId, { type: "error", error: "Invalid encrypted message: missing ciphertext or nonce" });
      return;
    }

    if (ciphertext.length > 1500) {
      this.sendToConnection(connectionId, { type: "error", error: "Encrypted message too large" });
      return;
    }

    if (nonce.length > 64) {
      this.sendToConnection(connectionId, { type: "error", error: "Invalid nonce" });
      return;
    }

    const roomMessage = {
      id: randomUUID(),
      user: user.name,
      ciphertext,
      nonce,
      encrypted: true,
      timestamp: Date.now(),
    };

    await this.broadcastToRoom(roomId, {
      type: "message",
      message: roomMessage
    });

    await redisRoomService.addMessage(roomId, {
      ...roomMessage,
      text: '[encrypted]',
      roomId,
      sessionId: user.userId
    });

    logger.info("Encrypted message sent", { roomId });
  }

  private async handleJoinRoom(connectionId: string, msg: any) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      const { roomId, name } = msg;
      const { user } = connection;

      // The JWT must already grant access to this specific room. /api/create-room
      // and /api/join-room set user.roomId; without it, this WS upgrade has no
      // business asking to join a room over WebSocket.
      if (!user.roomId || user.roomId !== roomId) {
        logger.warn("WS join_room denied", { jwtRoomId: user.roomId, requestedRoomId: roomId });
        this.sendToConnection(connectionId, {
          type: "error",
          error: "Not authorized for this room"
        });
        connection.socket.close(4003, "not authorized for room");
        return;
      }

      logger.info("Joining room", { roomId });

      // Check if room exists
      const roomExists = await redisRoomService.roomExists(roomId);
      if (!roomExists) {
        this.sendToConnection(connectionId, {
          type: "error",
          error: "Room not found"
        });
        return;
      }

      // Update connection room
      connection.currentRoomId = roomId;

      // If host is reconnecting, cancel grace period timer
      if (user.role === 'host') {
        redisRoomService.cancelHostGracePeriod(roomId);
      }

      // Add to room participants
      const participantName = purify.sanitize(name || user.name, { ALLOWED_TAGS: [] });
      logger.info("Adding participant", { roomId });
      await redisRoomService.addParticipant(roomId, user.userId, participantName);

      // Confirm room join
      this.sendToConnection(connectionId, {
        type: "joined_room",
        roomId: roomId,
        success: true
      });

      // Send participants update to all room members
      await this.sendParticipantsUpdate(roomId);

      logger.info("User joined room", { roomId });

    } catch (error) {
      logger.error("Join room error", { error });
      this.sendToConnection(connectionId, {
        type: "error",
        error: "Failed to join room"
      });
    }
  }

  private async handleLeaveRoom(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.currentRoomId) return;

    await this.leaveRoomCleanup(connectionId, connection.currentRoomId);
  }

  private async leaveRoomCleanup(connectionId: string, roomId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      // Only remove participant from room — never delete the room on disconnect.
      // Room lives until its Redis TTL expires (the configured duration).
      await redisRoomService.removeParticipant(roomId, connection.user.userId);
      connection.currentRoomId = undefined;
      await this.sendParticipantsUpdate(roomId);
      logger.info("User left room", { roomId });
    } catch (error) {
      logger.error("Leave room cleanup error", { error });
    }
  }

  private async handleKickParticipant(connectionId: string, msg: any) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    if (connection.user.role !== 'host') {
      this.sendToConnection(connectionId, { type: "error", error: "Only host can kick participants" });
      return;
    }

    const roomId = connection.currentRoomId;
    if (!roomId) return;

    const targetUserId = msg.targetUserId;
    const targetUserName = msg.targetUserName;
    if ((!targetUserId || typeof targetUserId !== 'string') && (!targetUserName || typeof targetUserName !== 'string')) {
      this.sendToConnection(connectionId, { type: "error", error: "Invalid target user" });
      return;
    }

    // Find target connection and kick (by userId or name)
    let kickedUserId: string | null = null;
    for (const [connId, conn] of this.connections.entries()) {
      if (conn.currentRoomId === roomId &&
          (conn.user.userId === targetUserId || conn.user.name === targetUserName) &&
          conn.user.userId !== connection.user.userId) {
        kickedUserId = conn.user.userId;
        this.sendToConnection(connId, { type: "kicked" });
        conn.socket.close(4001, "Kicked by host");
        break;
      }
    }

    if (kickedUserId) {
      await redisRoomService.removeParticipant(roomId, kickedUserId);
    }
    await this.sendParticipantsUpdate(roomId);
    logger.info("Participant kicked", { roomId });
  }

  private async handleLockRoom(connectionId: string, isLocked: boolean) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    if (connection.user.role !== 'host') {
      this.sendToConnection(connectionId, { type: "error", error: "Only host can lock/unlock room" });
      return;
    }

    const roomId = connection.currentRoomId;
    if (!roomId) return;

    const success = await redisRoomService.updateRoomLock(roomId, isLocked);
    if (success) {
      await this.broadcastToRoom(roomId, { type: "room_locked", isLocked });
      logger.info("Room lock changed", { roomId, isLocked });
    }
  }

  private handleTypingIndicator(connectionId: string, type: "typing_start" | "typing_stop") {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.currentRoomId) return;

    this.broadcastToRoom(connection.currentRoomId, {
      type,
      user: connection.user.name
    }, connection.user.userId);
  }

  private async sendParticipantsUpdate(roomId: string) {
    try {
      const participants = await redisRoomService.getRoomParticipants(roomId);
      const userNames = participants.map(p => p.name);
      logger.info("Participants updated", { roomId, count: participants.length });
      
      await this.broadcastToRoom(roomId, {
        type: "participants_update",
        users: userNames,
        count: participants.length
      });
    } catch (error) {
      logger.error("Send participants update error", { error });
    }
  }

  private async broadcastToRoom(roomId: string, message: any, excludeUserId?: string) {
    let broadcastCount = 0;

    for (const [connId, connection] of this.connections.entries()) {
      if (connection.currentRoomId === roomId &&
          connection.socket.readyState === WebSocket.OPEN &&
          (!excludeUserId || connection.user.userId !== excludeUserId)) {
        this.sendToConnection(connId, message);
        broadcastCount++;
      }
    }

    logger.info("Broadcast", { type: message.type, roomId, recipients: broadcastCount });
  }

  private sendToConnection(connectionId: string, message: any) {
    const connection = this.connections.get(connectionId);
    if (connection && connection.socket.readyState === WebSocket.OPEN) {
      connection.socket.send(JSON.stringify(message));
    }
  }

  private setupCleanupInterval() {
    // Sweep idle WS connections every minute and close any that have not
    // sent a frame in the last 5 min. The frontend sends a heartbeat every
    // 30s, so a healthy client keeps lastActivity fresh on its own. The
    // 5-min threshold lets a backgrounded mobile tab miss ~10 heartbeats
    // before we tear it down — generous enough that brief Safari pauses
    // don't kick a real user, tight enough that abandoned sockets get
    // reclaimed without blowing memory.
    setInterval(() => {
      const now = Date.now();
      for (const [connId, connection] of this.connections.entries()) {
        if (now - connection.lastActivity > 300000) {
          connection.socket.close();
          this.connections.delete(connId);
        }
      }
    }, 60000);
  }

  public getConnectionCount(): number {
    return this.connections.size;
  }

  public getStats() {
    return {
      connections: this.connections.size
    };
  }

  // Close all connections gracefully (for shutdown)
  public closeAll() {
    logger.info("Closing all WebSocket connections", { count: this.connections.size });

    for (const [connId, connection] of this.connections.entries()) {
      try {
        connection.socket.close(1001, 'Server shutting down');
      } catch (error) {
        logger.error("Error closing connection", { connId, error });
      }
    }

    this.connections.clear();
    logger.info("All WebSocket connections closed");
  }
}
