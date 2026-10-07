// Room Management Types for MVP Implementation with JWT Auth

export interface Participant {
  sessionId: string;
  name: string;
  joinedAt: number;
  lastActivity: number;
  isHost: boolean;
}

export interface Room {
  id: string;           // "quiet-sun-5821" 
  name: string;         // User-friendly room name
  hostId: string;       // Creator userId (from JWT)
  maxParticipants: number; // 2-12 per MVP.md
  duration: number;     // 15/30/60/120 min per MVP.md
  createdAt: number;    // timestamp
  expiresAt: number;    // auto-calculated
  participants: Map<string, Participant>;
  messages: RoomMessage[];
  isLocked: boolean;    // Host can lock room
  settings: RoomSettings;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  user: string;
  text: string;
  timestamp: number;
  sessionId: string;   // From JWT userId
  encrypted?: boolean;
  ciphertext?: string;
  nonce?: string;
}

export interface RoomSettings {
  allowGuests: boolean;     // Join without name
  requireApproval: boolean; // Host approves joins
  maxMessageLength: number; // Per room limit
}

export interface CreateRoomRequest {
  name: string;
  duration: 15 | 30 | 60 | 120 | 180 | 240; // Minutes
  maxParticipants: number;       // 2-12, per MVP.md
  hostName: string;
  settings?: Partial<RoomSettings>;
}

export interface JoinRoomRequest {
  roomId: string;
  participantName: string;
}

// Generate room ID in format "adjective-noun-number"
export function generateRoomId(): string {
  const adjectives = ['quiet', 'bright', 'swift', 'calm', 'wise', 'bold', 'cool', 'warm'];
  const nouns = ['sun', 'moon', 'star', 'bird', 'tree', 'wave', 'cloud', 'wind'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}-${noun}-${num}`;
}

// Room validation
export function validateRoomSettings(settings: CreateRoomRequest): string[] {
  const errors: string[] = [];
  
  if (!settings.name || settings.name.trim().length < 2) {
    errors.push('Room name must be at least 2 characters');
  }
  
  if (settings.name.length > 50) {
    errors.push('Room name must be less than 50 characters');
  }
  
  if (![15, 30, 60, 120, 180, 240].includes(settings.duration)) {
    errors.push('Duration must be 15, 30, 60, 120, 180, or 240 minutes');
  }
  
  if (settings.maxParticipants < 2 || settings.maxParticipants > 12) {
    errors.push('Max participants must be between 2 and 12');
  }
  
  if (!settings.hostName || settings.hostName.trim().length < 2) {
    errors.push('Host name must be at least 2 characters');
  }
  
  return errors;
}

// Phase 2: WebRTC Extensions
export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: string;
  to: string;
  data: any;
}

export interface ParticipantVoiceState {
  connectionId: string;
  peerState: 'disconnected' | 'connecting' | 'connected';
  isMuted: boolean;
  isPTT: boolean;
}

// Extend Room interface in implementation
export interface RoomVoiceSettings {
  voiceEnabled: boolean;
  passcode?: string;
  maxVoiceParticipants: number;
}
