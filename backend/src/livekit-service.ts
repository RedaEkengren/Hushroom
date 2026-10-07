import { AccessToken } from 'livekit-server-sdk';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';
const LIVEKIT_URL = process.env.LIVEKIT_URL || '';

export function isLiveKitConfigured(): boolean {
  return !!(LIVEKIT_API_KEY && LIVEKIT_API_SECRET && LIVEKIT_URL);
}

export function getLiveKitUrl(): string {
  return LIVEKIT_URL;
}

export async function createLiveKitToken(
  roomName: string,
  userId: string,
  displayName: string
): Promise<string> {
  if (!isLiveKitConfigured()) {
    throw new Error('LiveKit is not configured');
  }

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: userId,
    name: displayName,
    ttl: '1h',
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  return await at.toJwt();
}
