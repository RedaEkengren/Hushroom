import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrackPublication,
  RemoteParticipant,
  ConnectionState,
  ExternalE2EEKeyProvider,
} from 'livekit-client';
import { getToken } from './jwt-wrapper';

interface UseLiveKitVoiceProps {
  roomId: string | null;
  enabled: boolean;
  e2eePassphrase: string | null;
}

export function useLiveKitVoice({ roomId, enabled, e2eePassphrase }: UseLiveKitVoiceProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isE2EEEnabled, setIsE2EEEnabled] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const connectingRef = useRef(false);

  // Fetch LiveKit token from our backend
  const fetchToken = useCallback(async (): Promise<{ token: string; url: string } | null> => {
    try {
      const jwt = getToken();
      if (!jwt) return null;

      const res = await fetch('/api/livekit-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify({ roomId }),
      });

      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('Failed to fetch LiveKit token:', err);
      return null;
    }
  }, [roomId]);

  // Attach a remote track to the DOM
  const attachRemoteTrack = useCallback(
    (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
      const track = publication.track;
      if (!track) return;

      if (track.kind === Track.Kind.Audio) {
        const el = track.attach();
        el.id = `lk-audio-${participant.identity}`;
        el.setAttribute('data-lk-participant', participant.identity);
        document.body.appendChild(el);
        console.log(`Audio attached for ${participant.identity}`);
      } else if (track.kind === Track.Kind.Video) {
        const attachVideo = (retryCount = 0) => {
          const mainSpeaker = document.getElementById('main-speaker-video');
          const thumbnailsBar = document.getElementById('video-thumbnails-bar');

          if (!mainSpeaker || !thumbnailsBar) {
            if (retryCount < 30) {
              setTimeout(() => attachVideo(retryCount + 1), 500);
            }
            return;
          }

          // Already attached
          if (document.getElementById(`lk-video-${participant.identity}`)) return;

          const existingVideos = mainSpeaker.querySelectorAll('.remote-video-element').length +
            thumbnailsBar.querySelectorAll('.remote-video-element').length;

          const videoEl = track.attach();
          videoEl.className = 'remote-video-element';
          videoEl.id = `lk-video-${participant.identity}`;
          videoEl.setAttribute('data-lk-participant', participant.identity);

          if (existingVideos === 0) {
            videoEl.classList.add('main-speaker');
            videoEl.style.cssText =
              'width:100%;height:100%;object-fit:contain;background:#000;position:absolute;top:0;left:0;z-index:1;';
            const placeholder = document.getElementById('speaker-placeholder');
            if (placeholder) placeholder.style.display = 'none';
            mainSpeaker.appendChild(videoEl);
          } else {
            videoEl.classList.add('thumbnail');
            videoEl.style.cssText = 'width:100%;height:100%;object-fit:cover;';
            const container = document.createElement('div');
            container.className = 'video-thumbnail-container';
            container.style.cssText =
              'width:60px;height:80px;border-radius:8px;overflow:hidden;border:2px solid rgba(255,255,255,0.3);cursor:pointer;flex-shrink:0;background:#1f2937;';
            container.appendChild(videoEl);
            thumbnailsBar.appendChild(container);
            thumbnailsBar.style.display = 'flex';
          }

          console.log(`Video attached for ${participant.identity}`);
        };
        attachVideo();
      }
    },
    []
  );

  // Detach a remote track from the DOM
  const detachRemoteTrack = useCallback(
    (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
      const track = publication.track;
      if (!track) return;

      if (track.kind === Track.Kind.Audio) {
        const el = document.getElementById(`lk-audio-${participant.identity}`);
        if (el) el.remove();
      } else if (track.kind === Track.Kind.Video) {
        const el = document.getElementById(`lk-video-${participant.identity}`);
        if (el) {
          const container = el.parentElement;
          if (container?.classList.contains('video-thumbnail-container')) {
            container.remove();
          } else {
            el.remove();
          }
        }
      }

      track.detach();
      console.log(`Track detached for ${participant.identity}`);
    },
    []
  );

  // Connect / disconnect effect
  useEffect(() => {
    if (!enabled || !roomId) {
      // Disconnect if disabled
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      setIsConnected(false);
      setIsMuted(true);
      setIsVideoEnabled(false);
      return;
    }

    let cancelled = false;

    const connect = async () => {
      if (connectingRef.current) return;
      connectingRef.current = true;

      try {
        const data = await fetchToken();
        if (!data || cancelled) return;

        let keyProvider: ExternalE2EEKeyProvider | undefined;
        const roomOptions: ConstructorParameters<typeof Room>[0] = {
          adaptiveStream: true,
          dynacast: true,
        };

        if (e2eePassphrase) {
          keyProvider = new ExternalE2EEKeyProvider();
          roomOptions.e2ee = {
            keyProvider,
            worker: new Worker(
              new URL('livekit-client/e2ee-worker', import.meta.url)
            ),
          };
        }

        const room = new Room(roomOptions);

        // Connection state changes
        room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
          const connected = state === ConnectionState.Connected;
          setIsConnected(connected);
          console.log(`LiveKit connection: ${state}`);
        });

        // E2EE encryption status tracking
        room.on(RoomEvent.ParticipantEncryptionStatusChanged, () => {
          setIsE2EEEnabled(room.isE2EEEnabled);
        });

        // Remote tracks subscribed
        room.on(
          RoomEvent.TrackSubscribed,
          (_track, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
            attachRemoteTrack(publication, participant);
          }
        );

        // Remote tracks unsubscribed
        room.on(
          RoomEvent.TrackUnsubscribed,
          (_track, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
            detachRemoteTrack(publication, participant);
          }
        );

        // Connect to LiveKit
        await room.connect(data.url, data.token);
        if (cancelled) {
          room.disconnect();
          return;
        }

        roomRef.current = room;

        // Enable E2EE if passphrase was provided
        if (e2eePassphrase && keyProvider) {
          await keyProvider.setKey(e2eePassphrase);
          await room.setE2EEEnabled(true);
          setIsE2EEEnabled(true);
          console.log('LiveKit E2EE enabled');
        }

        // Publish microphone (start muted)
        await room.localParticipant.setMicrophoneEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(false);
        setIsMuted(true);

        console.log('LiveKit connected, mic starts muted');
      } catch (err) {
        console.error('LiveKit connect error:', err);
      } finally {
        connectingRef.current = false;
      }
    };

    connect();

    // Periodic scan: re-attach any remote video tracks missing from DOM
    const rescanInterval = setInterval(() => {
      const room = roomRef.current;
      if (!room) return;
      const mainSpeaker = document.getElementById('main-speaker-video');
      if (!mainSpeaker) return;

      for (const participant of room.remoteParticipants.values()) {
        for (const pub of participant.trackPublications.values()) {
          if (pub.track && pub.track.kind === Track.Kind.Video && pub.isSubscribed) {
            if (!document.getElementById(`lk-video-${participant.identity}`)) {
              console.log(`Re-attaching missing video for ${participant.identity}`);
              attachRemoteTrack(pub as RemoteTrackPublication, participant as RemoteParticipant);
            }
          }
        }
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(rescanInterval);
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      // Clean up any remaining audio/video elements
      document.querySelectorAll('[id^="lk-audio-"]').forEach((el) => el.remove());
      document.querySelectorAll('[id^="lk-video-"]').forEach((el) => {
        const container = el.parentElement;
        if (container?.classList.contains('video-thumbnail-container')) {
          container.remove();
        } else {
          el.remove();
        }
      });
      setIsConnected(false);
      setIsMuted(true);
      setIsVideoEnabled(false);
      setIsE2EEEnabled(false);
    };
  }, [enabled, roomId, e2eePassphrase, fetchToken, attachRemoteTrack, detachRemoteTrack]);

  // Toggle mute
  const toggleMute = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;

    const newMuted = !isMuted;
    await room.localParticipant.setMicrophoneEnabled(!newMuted);
    setIsMuted(newMuted);
    console.log(newMuted ? 'Muted' : 'Unmuted');
  }, [isMuted]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;

    const newEnabled = !isVideoEnabled;

    try {
      await room.localParticipant.setCameraEnabled(newEnabled);
    } catch {
      alert('Camera access denied or not available.');
      return;
    }
    setIsVideoEnabled(newEnabled);

    // Attach/detach local video preview
    if (newEnabled) {
      const attachLocal = (retry = 0) => {
        const pip = document.getElementById('local-video-pip');
        if (!pip) {
          if (retry < 10) setTimeout(() => attachLocal(retry + 1), 200);
          return;
        }

        const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
        if (camPub?.track) {
          const el = camPub.track.attach();
          el.id = 'local-video-element';
          el.style.cssText = 'width:100%;height:100%;object-fit:cover;transform:scaleX(-1);';
          pip.innerHTML = '';
          pip.appendChild(el);
        }
      };
      attachLocal();
    } else {
      const el = document.getElementById('local-video-element');
      if (el) el.remove();
    }

    console.log(newEnabled ? 'Camera enabled' : 'Camera disabled');
  }, [isVideoEnabled]);

  // Leave voice
  const leaveVoice = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setIsConnected(false);
    setIsMuted(true);
    setIsVideoEnabled(false);
  }, []);

  return {
    isConnected,
    isMuted,
    isVideoEnabled,
    isE2EEEnabled,
    toggleMute,
    toggleVideo,
    leaveVoice,
  };
}
