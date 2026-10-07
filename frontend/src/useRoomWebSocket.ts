import { useCallback, useEffect, useRef, useState } from 'react';

export type WSStatus = 'connected' | 'reconnecting' | 'disconnected';
export type ToastType = 'success' | 'error' | 'info';

export interface UseRoomWebSocketProps {
  sessionId: string | null;
  currentRoomId: string | null;
  name: string;
  /** Called for every parsed JSON message received over the WebSocket. */
  onMessage: (data: any) => void;
  /** Used by the hook to surface "Reconnected" after a successful re-open. */
  showToast: (msg: string, type: ToastType) => void;
}

export interface UseRoomWebSocketReturn {
  ws: WebSocket | null;
  wsStatus: WSStatus;
  /** Manual reconnect — bypasses backoff. Used by the "Reconnect" button. */
  reconnect: () => void;
  /** Returns true if the payload was sent (socket OPEN), false otherwise. */
  sendMessage: (payload: unknown) => boolean;
}

const MAX_RECONNECT_ATTEMPTS = 15;
const MAX_BACKOFF_MS = 30_000;
const HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Owns the room-WebSocket lifecycle: ticket-fetch, connect, reconnect with
 * exponential backoff, visibilitychange-driven re-open, and heartbeat. The
 * caller passes an onMessage callback that handles every dispatched JSON
 * message — this hook deliberately does NOT decode or react to message
 * content, so the dispatch table can change without touching lifecycle code.
 *
 * Extracted from HushroomLandingPage in Sprint 17.1 (= 14.1b realisering).
 */
export function useRoomWebSocket(props: UseRoomWebSocketProps): UseRoomWebSocketReturn {
  const { sessionId, currentRoomId, name, onMessage, showToast } = props;

  const [ws, setWs] = useState<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<WSStatus>('disconnected');
  const heartbeatInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Latest callbacks held in refs so the connectWebSocket useCallback doesn't
  // need to re-create itself on every render. Without this, a parent that
  // declares onMessage inline would force a reconnect every render.
  const onMessageRef = useRef(onMessage);
  const showToastRef = useRef(showToast);
  const currentRoomIdRef = useRef(currentRoomId);
  const nameRef = useRef(name);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);
  useEffect(() => { currentRoomIdRef.current = currentRoomId; }, [currentRoomId]);
  useEffect(() => { nameRef.current = name; }, [name]);

  const connectWebSocket = useCallback(() => {
    if (!sessionId) return;
    let reconnectAttempts = 0;

    async function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

      let ticket: string;
      try {
        const res = await fetch('/api/ws-ticket', { method: 'POST' });
        if (!res.ok) {
          console.error('Failed to get WS ticket');
          return;
        }
        const data = await res.json();
        ticket = data.ticket;
      } catch {
        console.error('Failed to get WS ticket');
        return;
      }

      const wsUrl = `${protocol}//${window.location.host}/ws?ticket=${encodeURIComponent(ticket)}`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        const wasReconnecting = reconnectAttempts > 0;
        setWsStatus('connected');
        reconnectAttempts = 0;

        // If we have a room, join it
        const roomNow = currentRoomIdRef.current;
        const nameNow = nameRef.current;
        if (roomNow && nameNow) {
          socket.send(JSON.stringify({
            type: 'join_room',
            roomId: roomNow,
            name: nameNow,
          }));
        }

        if (wasReconnecting) {
          showToastRef.current('Reconnected', 'success');
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current(data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };

      socket.onclose = () => {
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && sessionId) {
          setWsStatus('reconnecting');
          reconnectAttempts++;
          setTimeout(connect, Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_BACKOFF_MS));
        } else {
          setWsStatus('disconnected');
        }

        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = null;
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        // onclose will fire next and drive the actual state transition.
      };

      setWs(socket);

      heartbeatInterval.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'heartbeat' }));
        }
      }, HEARTBEAT_INTERVAL_MS);
    }

    connect();
  }, [sessionId]);

  // Connect when logged in; tear down on unmount or sessionId loss.
  useEffect(() => {
    if (sessionId) {
      connectWebSocket();
    }
    return () => {
      if (ws) {
        ws.close();
      }
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, connectWebSocket]);

  // Sprint 16.1 — visibilitychange forces reconnect on tab-resume.
  useEffect(() => {
    if (!sessionId) return;
    const handler = () => {
      if (document.visibilityState !== 'visible') return;
      if (!ws) {
        connectWebSocket();
        return;
      }
      if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        connectWebSocket();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [ws, sessionId, connectWebSocket]);

  const reconnect = useCallback(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  const sendMessage = useCallback((payload: unknown): boolean => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(payload));
    return true;
  }, [ws]);

  return { ws, wsStatus, reconnect, sendMessage };
}
