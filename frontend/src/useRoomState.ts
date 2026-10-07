import { useState, useRef, useMemo } from 'react';
import { deriveKey } from './crypto';

export type Message = {
  id: string;
  user: string;
  text: string;
  timestamp: number;
  sanitized?: boolean;
  encrypted?: boolean;
  ciphertext?: string;
  nonce?: string;
};

/**
 * All room-scoped state in one hook so HushroomLandingPage doesn't have to
 * manage 12 useStates + 2 useRefs + 1 useMemo by hand. Extracted from
 * HushroomLandingPage in Sprint 17.2 (= 14.1b realisering, part 2).
 *
 * Caller destructures the returned object — call sites stay unchanged.
 */
export function useRoomState() {
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [roomDisplayName, setRoomDisplayName] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  const [e2eePassphrase, setE2eePassphrase] = useState<string | null>(null);
  const e2eeKey = useMemo(() => (e2eePassphrase ? deriveKey(e2eePassphrase) : null), [e2eePassphrase]);
  // e2eeKeyRef shadows e2eeKey for read-from-callback access (the WS
  // onmessage closure can't depend on a render-time value).
  const e2eeKeyRef = useRef<Uint8Array | null>(null);
  e2eeKeyRef.current = e2eeKey;

  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [roomExpiresAt, setRoomExpiresAt] = useState<number | null>(null);
  const [roomJoinedAt, setRoomJoinedAt] = useState<number | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const prevOnlineUsersRef = useRef<string[]>([]);

  return {
    currentRoomId, setCurrentRoomId,
    roomDisplayName, setRoomDisplayName,
    isHost, setIsHost,
    e2eePassphrase, setE2eePassphrase,
    e2eeKey, e2eeKeyRef,
    isRoomLocked, setIsRoomLocked,
    roomExpiresAt, setRoomExpiresAt,
    roomJoinedAt, setRoomJoinedAt,
    messages, setMessages,
    onlineUsers, setOnlineUsers,
    typingUsers, setTypingUsers,
    prevOnlineUsersRef,
  };
}
