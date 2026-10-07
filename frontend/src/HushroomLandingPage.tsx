import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { LANDING_COPY, langFromPath } from './landing-copy';
import { useLayoutContext } from './LayoutContext';
import { usePricingState } from './usePricingState';
import DOMPurify from "dompurify";
import { useLiveKitVoice } from './useLiveKitVoice';
import { useCallState } from './useCallState';
import { EmailVerification } from './EmailVerification';
import { CreateRoomForm } from './CreateRoomForm';
import { isCreatorVerified, getRole, clearToken } from './jwt-wrapper';
import { generatePassphrase, encryptMessage, decryptMessage } from './crypto';
import { saveRecentRoom, getRecentRooms, removeRecentRoom, type RecentRoom } from './recent-rooms';
import { LandingMarketingSections } from './LandingMarketingSections';
import { PricingSection } from './PricingSection';
import { LandingHero } from './LandingHero';
import { SocialProofRow } from './SocialProofRow';
import { CtaBanner } from './CtaBanner';
import { useRoomWebSocket } from './useRoomWebSocket';
import { useRoomState, type Message } from './useRoomState';
import { Toast } from './Toast';
import { RoomView } from './RoomView';

// CreateRoomForm lives in ./CreateRoomForm.tsx (extracted 2026-08-23).

// Join Room Modal Component
// Secure API utilities - now uses JWT from wrapper
class SecureAPI {
  static async secureRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // JWT token is added automatically by jwt-wrapper.ts
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  }

  static clearToken() {
    // JWT handled by wrapper
  }
}

function playJoinSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

export default function HushroomLandingPage() {
  const params = useParams<{ roomId?: string; token?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // "/" is Swedish, "/en" is English (docs/GO-TO-MARKET-EU-ROOM.md). The room
  // UI itself stays English for now — only the marketing landing is localised.
  const landingLang = langFromPath(location.pathname);
  const copy = LANDING_COPY[landingLang];

  useEffect(() => {
    if (params.roomId) return;              // room view keeps the room title
    document.documentElement.lang = copy.htmlLang;
    document.title = copy.documentTitle;
    return () => { document.documentElement.lang = 'en'; };
  }, [params.roomId, copy]);

  // Core state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>(() => getRecentRooms());
  const [name, setName] = useState("");

  // Sprint 17.2 — all room-scoped state lives in useRoomState. Destructured
  // so existing call sites (currentRoomId, messages, etc.) stay unchanged.
  const {
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
  } = useRoomState();

  // COMMENTED OUT FOR MVP — feedback modal state is UI-local, not room state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Room timer state — derived from roomExpiresAt + roomJoinedAt, kept here
  // so the timer-tick effect doesn't have to thread through useRoomState.
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [timerWarning, setTimerWarning] = useState<'none' | '5min' | '1min' | 'expired'>('none');
  const [roomExpired, setRoomExpired] = useState(false);

  // UI state
  const [showOnlineExpanded, setShowOnlineExpanded] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Typing indicator state — typingUsers comes from useRoomState (above)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  // Modal states
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  // Plan label for email verification context
  const [emailPlanLabel, setEmailPlanLabel] = useState<string | undefined>(undefined);

  // Tier / upgrade state
  const { userTier, startTrial, checkout } = usePricingState();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');
  const [pendingTrialAfterVerify, setPendingTrialAfterVerify] = useState(false);

  // Layout context — hide navbar/footer in chat mode
  const { setHideLayout } = useLayoutContext();
  
  // Chat state — messages + onlineUsers come from useRoomState (above).
  // ws + wsStatus owned by useRoomWebSocket hook (below).
  const [input, setInput] = useState("");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Voice chat state
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const {
    isMuted,
    isConnected: voiceConnected,
    isVideoEnabled,
    isE2EEEnabled,
    toggleMute,
    toggleVideo,
    leaveVoice
  } = useLiveKitVoice({
    roomId: currentRoomId,
    enabled: voiceEnabled,
    e2eePassphrase
  });

  // Call state management (new overlay system)
  const {
    callMode,
    startVoiceCall,
    upgradeToVideo,
    downgradeToVoice,
    minimizeCall,
    expandCall,
    endCall
  } = useCallState({
    onVoiceToggle: () => setVoiceEnabled(true),
    onVideoToggle: toggleVideo,
    onCallEnd: () => {
      setVoiceEnabled(false);
      leaveVoice();
    }
  });

  // Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // heartbeatInterval owned by useRoomWebSocket hook.
  // e2eeKeyRef + prevOnlineUsersRef owned by useRoomState hook.

  // All messages shown (no virtual scroll)
  const visibleMessages = messages;

  const handleScroll = useCallback(() => {}, []);

  // Hide navbar/footer when in chat mode
  useEffect(() => {
    const inChat = !!(sessionId || currentRoomId);
    setHideLayout(inChat);
    return () => setHideLayout(false);
  }, [sessionId, currentRoomId, setHideLayout]);

  // Warn before unload while in an active room
  useEffect(() => {
    if (!currentRoomId) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [currentRoomId]);

  // Disable pull-to-refresh / overscroll bounce while in an active room
  useEffect(() => {
    if (!currentRoomId) return;
    document.body.classList.add('in-room');
    return () => document.body.classList.remove('in-room');
  }, [currentRoomId]);

  // Refresh recent rooms when returning to the landing page (prunes expired)
  useEffect(() => {
    if (!sessionId && !currentRoomId) {
      setRecentRooms(getRecentRooms());
    }
  }, [sessionId, currentRoomId]);

  // Check for room URL on mount / URL change
  useEffect(() => {
    if (params.roomId) {
      setCurrentRoomId(params.roomId);

      // Extract E2EE passphrase from URL fragment (#key=...). If the URL has
      // no hash (e.g. user returned via "recent rooms" or browser back after
      // an in-app navigate), fall back to a per-tab cache. sessionStorage is
      // tab-scoped + ephemeral, so the key never reaches the server and dies
      // when the tab closes — the same security profile as the URL fragment.
      const hash = window.location.hash;
      const keyMatch = hash.match(/^#key=([a-f0-9]{64})$/);
      const cacheKey = `hushroom:room-key:${params.roomId}`;
      if (keyMatch) {
        setE2eePassphrase(keyMatch[1]);
        try { sessionStorage.setItem(cacheKey, keyMatch[1]); } catch {}
      } else {
        try {
          const cached = sessionStorage.getItem(cacheKey);
          if (cached && /^[a-f0-9]{64}$/.test(cached)) {
            setE2eePassphrase(cached);
          }
        } catch {}
      }

      // Room metadata (name, expiry, lock state) is public via GET /api/room/:id.
      // Fetch it on every entry so (a) a reload / second tab as host shows the
      // real room name + timer instead of the bare room ID (the create/join
      // responses used to be the only source of this state — bug seen
      // 2026-08-23), and (b) the JoinRoomModal can show the room name.
      // create/join responses still overwrite these on success.
      fetch(`/api/room/${encodeURIComponent(params.roomId)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((info) => {
          if (!info) return;
          if (info.name) setRoomDisplayName(info.name);
          if (typeof info.expiresAt === 'number') {
            setRoomExpiresAt(info.expiresAt);
            setRoomJoinedAt((prev) => prev ?? Date.now());
          }
          if (typeof info.isLocked === 'boolean') setIsRoomLocked(info.isLocked);
        })
        .catch(() => { /* offline / expired — join/create paths surface errors */ });

      // If not logged in, three fallbacks in priority order:
      //   1) localStorage has a JWT bound to THIS roomId → restore session
      //      directly. Survives reload + browser-back without a modal.
      //   2) sessionStorage has a saved joiner name (Sprint 16.3) → auto-
      //      run handleJoinRoom which mints a fresh JWT for this room.
      //   3) Show JoinRoomModal so the user can enter a name.
      if (!sessionId) {
        let restored = false;
        try {
          const tok = localStorage.getItem('hushroom_token');
          if (tok) {
            const payload = JSON.parse(atob(tok.split('.')[1]));
            if (payload?.roomId === params.roomId) {
              setSessionId(tok);
              if (payload.name) setName(payload.name);
              // Host badge must follow the JWT's role on reload — without
              // this, a host who closes + reopens the tab is silently
              // demoted to a regular participant in the UI (no kick/lock
              // controls). Real production bug seen 2026-05-06.
              setIsHost(payload.role === 'host');
              restored = true;
            }
          }
        } catch {
          // Malformed token — ignore and fall through.
        }

        if (!restored) {
          let savedName: string | null = null;
          try { savedName = sessionStorage.getItem('hushroom:joiner-name'); } catch {}
          if (savedName && savedName.trim().length >= 2) {
            // Defer to next tick so handleJoinRoom is fully defined.
            setTimeout(() => { handleJoinRoom(savedName!); }, 0);
          } else {
            setShowJoinRoomModal(true);
          }
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.roomId]);
  
  // Update URL when room changes (for sharing)
  useEffect(() => {
    if (currentRoomId && sessionId) {
      const fragment = e2eePassphrase ? `#key=${e2eePassphrase}` : '';
      const newUrl = `/r/${currentRoomId}${fragment}`;
      if (window.location.pathname + window.location.hash !== newUrl) {
        navigate(newUrl, { replace: true });
      }
    }
  }, [currentRoomId, sessionId, e2eePassphrase]);


  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current && messages.length > 0) {
      const container = containerRef.current;
      const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 200;
      
      if (isNearBottom) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages]);

  // Room timer countdown
  useEffect(() => {
    if (!roomExpiresAt) return;

    const tick = () => {
      const now = Date.now();
      const remaining = roomExpiresAt - now;

      if (remaining <= 0) {
        setTimerWarning('expired');
        setTimeRemaining('0:00');
        setRoomExpired(true);
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);

      if (remaining <= 60000) {
        setTimerWarning('1min');
      } else if (remaining <= 300000) {
        setTimerWarning('5min');
      } else {
        setTimerWarning('none');
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [roomExpiresAt]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStartTrial = async () => {
    // Kräver verifierad e-post — visa OTP-modal om inte verifierad
    if (!isCreatorVerified()) {
      setPendingTrialAfterVerify(true);
      setShowUpgradeModal(false);
      setEmailPlanLabel('Pro – 14-day free trial');
      setShowEmailVerification(true);
      return;
    }
    const result = await startTrial();
    if (result.success) {
      setShowUpgradeModal(false);
      showToast('14-day Pro trial started! Enjoy unlimited rooms.', 'success');
    } else {
      showToast(result.error || 'Failed to start trial', 'error');
    }
  };

  const handleCheckout = async (tier: 'pro' | 'firm') => {
    const result = await checkout(tier);
    if (!result.success) {
      showToast(result.error || 'Failed to start checkout', 'error');
    }
  };

  const copyRoomLink = async () => {
    if (!currentRoomId) return;

    const fragment = e2eePassphrase ? `#key=${e2eePassphrase}` : '';
    const roomUrl = `${window.location.origin}/r/${currentRoomId}${fragment}`;

    try {
      await navigator.clipboard.writeText(roomUrl);
      showToast("Room link copied to clipboard!", "success");
    } catch (error) {
      console.error("Failed to copy:", error);
      showToast("Failed to copy link", "error");
    }
  };

  const shareRoom = async () => {
    if (!currentRoomId) return;

    const fragment = e2eePassphrase ? `#key=${e2eePassphrase}` : '';
    const roomUrl = `${window.location.origin}/r/${currentRoomId}${fragment}`;
    const shareData = {
      title: 'Join my Hushroom',
      text: `Join me in this instant room for a quick chat!`,
      url: roomUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copy
        await copyRoomLink();
      }
    } catch (error) {
      console.error("Share failed:", error);
      // Fallback to copy
      await copyRoomLink();
    }
  };

  const handleLogout = () => {
    // Navigate home FIRST to clear params.roomId before state updates trigger useEffect
    navigate('/', { replace: true });

    // WebSocket teardown handled by useRoomWebSocket cleanup when sessionId
    // becomes null below.

    // Clear JWT token from localStorage
    clearToken();

    // Clear sessionStorage room-key cache for the current room (don't leak
    // across logouts even within the same tab).
    if (currentRoomId) {
      try { sessionStorage.removeItem(`hushroom:room-key:${currentRoomId}`); } catch {}
    }
    try { sessionStorage.removeItem('hushroom:joiner-name'); } catch {}

    // Clear local state
    setSessionId(null);
    setName("");
    setMessages([]);
    setOnlineUsers([]);
    setCurrentRoomId(null);
    setRoomDisplayName(null);
    setE2eePassphrase(null);
    setRoomExpiresAt(null);
    setRoomJoinedAt(null);
    setShowOnlineExpanded(false);
    setShowJoinRoomModal(false);
    // Sprint 16.3 — explicit logout/leave clears the saved name so the
    // next visit starts fresh.
    try { sessionStorage.removeItem('hushroom:joiner-name'); } catch {}

    showToast("Left the room", "success");
  };

  // Store voice enabled in ref to avoid stale closure

  // Sprint 17.1 — WS lifecycle delegated to useRoomWebSocket hook;
  // this callback handles dispatch of every parsed JSON message.
  const handleWSMessage = useCallback((data: any) => {
    if (data.type === "message") {
      const msg = data.message;
      let displayText: string;
      let displayUser: string = msg.user;
      let displayTimestamp: number = msg.timestamp;

      if (msg.encrypted && msg.ciphertext && msg.nonce) {
        if (e2eeKeyRef.current) {
          const decrypted = decryptMessage(msg.ciphertext, msg.nonce, e2eeKeyRef.current);
          if (decrypted) {
            displayText = decrypted.text;
            displayUser = decrypted.sender;
            displayTimestamp = decrypted.timestamp;
            if (msg.user && msg.user !== decrypted.sender) {
              displayText = `[Tampered] ${decrypted.text}`;
            }
          } else {
            displayText = '[Decryption failed]';
          }
        } else {
          displayText = '[Encrypted message]';
        }
      } else {
        displayText = DOMPurify.sanitize(msg.text || '');
      }

      const sanitizedMessage: Message = {
        id: msg.id,
        user: DOMPurify.sanitize(displayUser),
        text: displayText,
        timestamp: displayTimestamp,
        encrypted: msg.encrypted,
        sanitized: true,
      };
      setMessages(prev => [...prev, sanitizedMessage].sort((a, b) => a.timestamp - b.timestamp));
    } else if (data.type === "participants_update") {
      const sanitizedUsers = data.users.map((user: string) => DOMPurify.sanitize(user));
      setOnlineUsers(prev => {
        if (prev.length > 0) {
          const joined = sanitizedUsers.filter((u: string) => !prev.includes(u) && u !== name);
          const left = prev.filter(u => !sanitizedUsers.includes(u) && u !== name);
          joined.forEach((u: string) => showToast(`👤 ${u} joined the room`, "info"));
          left.forEach((u: string) => showToast(`👋 ${u} left the room`, "info"));
        }
        return sanitizedUsers;
      });
    } else if (data.type === "room_event") {
      if (data.event.type === "participants_update") {
        const participants = data.event.participants || [];
        setOnlineUsers(participants.map((p: any) => p.name || p));
      }
    } else if (data.type === "kicked") {
      showToast("You were removed from the room", "error");
      // Full session teardown: the user's token is bound to the room they
      // were just kicked from, so leaving sessionId set would land them in
      // RoomView limbo (chat input but no real room). Clear everything.
      clearToken();
      if (currentRoomId) {
        try { sessionStorage.removeItem(`hushroom:room-key:${currentRoomId}`); } catch {}
      }
      try { sessionStorage.removeItem('hushroom:joiner-name'); } catch {}
      setSessionId(null);
      setName("");
      setIsHost(false);
      setE2eePassphrase(null);
      setCurrentRoomId(null);
      setMessages([]);
      setOnlineUsers([]);
      setRoomExpiresAt(null);
      navigate('/',  { replace: true });
    } else if (data.type === "room_locked") {
      setIsRoomLocked(data.isLocked);
      showToast(
        data.isLocked ? "🔒 Room locked. No new participants can join" : "🔓 Room unlocked",
        "info"
      );
    } else if (data.type === "typing_start") {
      setTypingUsers(prev => prev.includes(data.user) ? prev : [...prev, data.user]);
    } else if (data.type === "typing_stop") {
      setTypingUsers(prev => prev.filter(u => u !== data.user));
    } else if (data.type === "error") {
      showToast(data.error, "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, navigate]);

  const { ws, wsStatus, reconnect: reconnectWS } = useRoomWebSocket({
    sessionId,
    currentRoomId,
    name,
    onMessage: handleWSMessage,
    showToast,
  });
  const wsConnected = wsStatus === 'connected';

  // Load initial messages
  useEffect(() => {
    if (sessionId) {
      // Room messages come through WebSocket, no need to fetch
      setMessages([]);
      setOnlineUsers([]);
    }
  }, [sessionId]);

  // Join sound + browser notification when a new participant arrives
  useEffect(() => {
    const prev = prevOnlineUsersRef.current;
    const added = onlineUsers.filter(u => !prev.includes(u));
    if (added.length > 0 && currentRoomId) {
      playJoinSound();
      if (document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Hushroom', {
          body: `${added[0]} joined the room`,
          icon: '/logo.webp',
          silent: true,
        });
      }
    }
    prevOnlineUsersRef.current = onlineUsers;
  }, [onlineUsers, currentRoomId]);

  // Backend validation failures come back as { error, details: [msg, ...] }.
  // Surface the specific message (e.g. "Name may only contain …") so the
  // modals can show it inline under the field.
  const extractError = (errorData: any, fallback: string): string =>
    (Array.isArray(errorData?.details) && errorData.details[0]) || errorData?.error || fallback;

  // Resolves to an error message (shown inline by CreateRoomForm) or null.
  const handleCreateRoom = async (userName: string, roomName: string, maxParticipants: number, duration: number): Promise<string | null> => {
    try {
      // First login the user
      const loginResponse = await SecureAPI.secureRequest("/api/login", {
        method: "POST",
        body: JSON.stringify({ name: userName }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json().catch(() => ({}));
        return extractError(errorData, "Failed to login");
      }
      
      const loginData = await loginResponse.json();
      // JWT token is saved by wrapper, just set logged in state
      setSessionId(loginData.token || 'logged-in');
      setName(userName);
      // Sprint 16.3 — persist for reload-restoration
      try { sessionStorage.setItem('hushroom:joiner-name', userName); } catch {}
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission();

      // Update CSRF token after login
      // JWT token managed by wrapper

      // Now create the room with the new session
      const response = await SecureAPI.secureRequest('/api/create-room', {
        method: 'POST',
        body: JSON.stringify({ 
          name: roomName,
          maxParticipants,
          duration,
          hostName: userName
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const passphrase = generatePassphrase();
        setE2eePassphrase(passphrase);
        setShowCreateRoomModal(false);
        setCurrentRoomId(data.roomId);
        setRoomDisplayName(data.room?.name || data.roomId);
        setIsHost(true);
        if (data.room?.expiresAt) {
          setRoomExpiresAt(data.room.expiresAt);
          setRoomJoinedAt(Date.now());
          saveRecentRoom({
            roomId: data.roomId,
            name: data.room?.name || data.roomId,
            expiresAt: data.room.expiresAt,
          });
        }
        showToast("Room created with end-to-end encryption!", "success");
        return null;
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.upgrade) {
          setUpgradeReason(errorData.error);
          setShowCreateRoomModal(false);
          setShowUpgradeModal(true);
          return null;
        }
        return extractError(errorData, "Failed to create room");
      }
    } catch (error) {
      console.error("Room creation error:", error);
      showToast("Network error creating room", "error");
      return "Network error creating room";
    }
  };

  // Resolves to an error message (shown inline by JoinRoomModal) or null.
  // Also called from the auto-rejoin path (saved joiner name) where no modal
  // is open, so errors are toasted as well.
  const handleJoinRoom = async (userName: string): Promise<string | null> => {
    try {
      // First login the user. We deliberately do NOT call setSessionId yet —
      // doing so triggers useRoomWebSocket to connect with this pre-join JWT
      // (no roomId), which Sprint 13.1's binding rejects with close 4003.
      const loginResponse = await SecureAPI.secureRequest("/api/login", {
        method: "POST",
        body: JSON.stringify({ name: userName }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json().catch(() => ({}));
        const msg = extractError(errorData, "Failed to login");
        showToast(msg, "error");
        return msg;
      }
      // The login token (now in localStorage via jwt-wrapper) is needed for
      // /api/join-room's requireJWT. We don't bind it to React state yet.

      // Now join the room — backend rebinds JWT with roomId + role and
      // jwt-wrapper persists the rebound token. Only after this do we flip
      // sessionId so WS opens with the correct token first try.
      const response = await SecureAPI.secureRequest("/api/join-room", {
        method: "POST",
        body: JSON.stringify({
          roomId: currentRoomId,
          participantName: userName,
        }),
      });

      if (response.ok) {
        const joinData = await response.json();
        setSessionId(joinData.token || 'logged-in');
        setName(userName);
        // Sprint 16.3 — persist for reload-restoration
        try { sessionStorage.setItem('hushroom:joiner-name', userName); } catch {}
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission();

        setShowJoinRoomModal(false);
        setRoomDisplayName(joinData.room?.name || currentRoomId);
        setIsHost(getRole() === 'host');
        if (joinData.room?.expiresAt) {
          setRoomExpiresAt(joinData.room.expiresAt);
          setRoomJoinedAt(Date.now());
          if (currentRoomId) {
            saveRecentRoom({
              roomId: currentRoomId,
              name: joinData.room?.name || currentRoomId,
              expiresAt: joinData.room.expiresAt,
            });
          }
        }
        showToast("Joined room successfully!", "success");
        return null;
      } else {
        const errorData = await response.json().catch(() => ({}));
        // Login leaked a token into localStorage but join failed — clean it up
        // so a retry with a different name doesn't carry stale state.
        clearToken();
        const msg = extractError(errorData, "Failed to join room");
        showToast(msg, "error");
        return msg;
      }
    } catch (error) {
      console.error("Join room error:", error);
      clearToken();
      showToast("Network error joining room", "error");
      return "Network error joining room";
    }
  };

  // Host-only: toggles the room lock via the WS lock_room/unlock_room types.
  // The backend broadcasts room_locked to everyone (handled in handleWSMessage),
  // which is what flips isRoomLocked + shows the toast — no optimistic update.
  const toggleRoomLock = () => {
    if (!isHost) return;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      showToast("Not connected, try again in a moment", "error");
      return;
    }
    ws.send(JSON.stringify({ type: isRoomLocked ? "unlock_room" : "lock_room" }));
  };

  const sendTypingIndicator = useCallback(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;

    lastTypingSentRef.current = now;
    ws.send(JSON.stringify({ type: "typing_start" }));

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "typing_stop" }));
      }
    }, 2000);
  }, [ws]);

  const sendMessage = () => {
    if (!input.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;

    // Stop typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    ws.send(JSON.stringify({ type: "typing_stop" }));

    const sanitizedInput = DOMPurify.sanitize(input.trim());

    if (e2eeKey) {
      // Bind sender + timestamp into the ciphertext (Sprint 15.5) so a
      // compromised relay can't rewrite the from-name or shift timestamps.
      const { ciphertext, nonce } = encryptMessage(sanitizedInput, e2eeKey, name, Date.now());
      ws.send(JSON.stringify({
        type: "send_message_encrypted",
        roomId: currentRoomId,
        ciphertext,
        nonce
      }));
    } else {
      ws.send(JSON.stringify({
        type: "send_message",
        roomId: currentRoomId,
        text: sanitizedInput
      }));
    }

    setInput("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Voice toggle function (using new overlay system)
  const handleToggleVoice = async () => {
    if (!voiceConnected) {
      try {
        startVoiceCall();
        console.log('🎙️ Starting voice call with overlay');
        showToast('Connecting to voice room...', 'info');
      } catch (error) {
        console.error('Failed to join voice:', error);
        showToast('Failed to join voice room', 'error');
      }
    } else {
      endCall();
      console.log('🎙️ Ended voice call');
      showToast('Left voice room', 'info');
    }
  };

  // Primary CTA (hero + bottom banner): verified creators go straight to the
  // Create Room form, everyone else through the one-time email verification.
  const openCreateFlow = () => {
    if (isCreatorVerified()) {
      setShowCreateRoomModal(true);
    } else {
      setEmailPlanLabel('Free room');
      setShowEmailVerification(true);
    }
  };

  // Show landing page if not logged in and not on room URL
  if (!sessionId && !currentRoomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-yellow-50 pt-16">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Hero (photo + overlay + the link-flow animation) — LandingHero.tsx */}
        <LandingHero
          copy={copy}
          onCreateClick={openCreateFlow}
          recentRooms={recentRooms}
          onRemoveRecent={(roomId) => {
            removeRecentRoom(roomId);
            setRecentRooms(getRecentRooms());
          }}
        />
        <SocialProofRow items={copy.social} />

        <LandingMarketingSections copy={copy} />

        <PricingSection
          copy={copy}
          userTier={userTier}
          isCreatorVerified={isCreatorVerified}
          onStartTrial={handleStartTrial}
          onCheckout={handleCheckout}
          onCreateRoomClick={() => setShowCreateRoomModal(true)}
          onEmailVerifyDemo={() => { setEmailPlanLabel("Free room"); setShowEmailVerification(true); }}
        />
        <CtaBanner
          lang={landingLang}
          heading={copy.cta.heading}
          sub={copy.cta.sub}
          onPrimary={openCreateFlow}
          primaryLabel={copy.cta.primary}
          secondaryLabel={copy.cta.secondary}
        />

        {/* Room Creation Modal */}
        {showCreateRoomModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Room</h2>

              <CreateRoomForm
                onCreateRoom={handleCreateRoom}
                onCancel={() => setShowCreateRoomModal(false)}
              />
            </div>
          </div>
        )}

        {/* Email Verification Modal */}
        {showEmailVerification && (
          <EmailVerification
            planLabel={emailPlanLabel}
            onVerified={async () => {
              setShowEmailVerification(false);
              if (pendingTrialAfterVerify) {
                setPendingTrialAfterVerify(false);
                const result = await startTrial();
                if (result.success) {
                  showToast('14-day Pro trial started! Enjoy unlimited rooms.', 'success');
                } else {
                  showToast(result.error || 'Failed to start trial', 'error');
                }
              } else {
                setShowCreateRoomModal(true);
              }
            }}
            onCancel={() => {
              setPendingTrialAfterVerify(false);
              setEmailPlanLabel(undefined);
              setShowEmailVerification(false);
            }}
          />
        )}
      </div>
    );
  }


  // Chat interface for logged in users OR room URLs.
  // All chat-render JSX lives in RoomView (Sprint 17.3); this page just wires
  // hook state + handlers into props.
  return (
    <RoomView
      name={name}
      isHost={isHost}
      currentRoomId={currentRoomId}
      roomDisplayName={roomDisplayName}
      e2eePassphrase={e2eePassphrase}
      roomExpiresAt={roomExpiresAt}
      roomJoinedAt={roomJoinedAt}
      isRoomLocked={isRoomLocked}
      toggleRoomLock={toggleRoomLock}
      messages={messages}
      visibleMessages={visibleMessages}
      onlineUsers={onlineUsers}
      typingUsers={typingUsers}
      input={input}
      setInput={setInput}
      ws={ws}
      wsStatus={wsStatus}
      wsConnected={wsConnected}
      reconnectWS={reconnectWS}
      voiceConnected={voiceConnected}
      isMuted={isMuted}
      isVideoEnabled={isVideoEnabled}
      isE2EEEnabled={isE2EEEnabled}
      callMode={callMode}
      toast={toast}
      setToast={setToast}
      showJoinRoomModal={showJoinRoomModal}
      setShowJoinRoomModal={setShowJoinRoomModal}
      showMobileMenu={showMobileMenu}
      setShowMobileMenu={setShowMobileMenu}
      showOnlineExpanded={showOnlineExpanded}
      setShowOnlineExpanded={setShowOnlineExpanded}
      showFeedbackModal={showFeedbackModal}
      setShowFeedbackModal={setShowFeedbackModal}
      showUpgradeModal={showUpgradeModal}
      setShowUpgradeModal={setShowUpgradeModal}
      upgradeReason={upgradeReason}
      timerWarning={timerWarning}
      timeRemaining={timeRemaining}
      roomExpired={roomExpired}
      setRoomExpired={setRoomExpired}
      setCurrentRoomId={setCurrentRoomId}
      setSessionId={setSessionId}
      setMessages={setMessages}
      setOnlineUsers={setOnlineUsers}
      containerRef={containerRef}
      inputRef={inputRef}
      handleJoinRoom={handleJoinRoom}
      navigate={navigate}
      copyRoomLink={copyRoomLink}
      shareRoom={shareRoom}
      handleToggleVoice={handleToggleVoice}
      toggleMute={toggleMute}
      toggleVideo={toggleVideo}
      handleLogout={handleLogout}
      sendMessage={sendMessage}
      sendTypingIndicator={sendTypingIndicator}
      handleKeyPress={handleKeyPress}
      upgradeToVideo={upgradeToVideo}
      downgradeToVoice={downgradeToVoice}
      endCall={endCall}
      minimizeCall={minimizeCall}
      expandCall={expandCall}
      handleStartTrial={handleStartTrial}
      handleScroll={handleScroll}
      showToast={showToast}
    />
  );
}
