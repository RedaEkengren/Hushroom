import React, { useState } from 'react';
import {
  Send, X, AlertCircle, LogOut, Share2, Copy, Lock, LockOpen,
  Timer, Phone, MoreHorizontal, ChevronDown, Mic, Flag, MessageSquare
} from 'lucide-react';
import { Toast, type ToastType } from './Toast';
import { VoiceControls } from './VoiceControls';
import { VoiceCallOverlay } from './VoiceCallOverlay';
import { VideoCallOverlay } from './VideoCallOverlay';
import { CallMinimized } from './CallMinimized';
import { FeedbackModal } from './FeedbackModal';
import { ReportButton, REPORT_TYPES, submitReport, type ReportType } from './ReportButton';
import { NAME_HINT } from './CreateRoomForm';
import type { Message } from './useRoomState';
import type { WSStatus } from './useRoomWebSocket';
import type { CallMode } from './useCallState';

const JoinRoomModal: React.FC<{
  roomId: string;
  roomName: string | null;
  // Resolves to an error message (shown inline) or null/void on success.
  onJoin: (userName: string) => Promise<string | null | void>;
  onCancel: () => void;
}> = ({ roomId, roomName, onJoin, onCancel }) => {
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim().length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const result = await onJoin(userName.trim());
      if (typeof result === 'string' && result) setError(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Room</h2>
        <p className="text-gray-600 mb-6">
          {roomName && roomName !== roomId ? (
            <>Room: <span className="font-medium text-gray-900">{roomName}</span></>
          ) : (
            <>Room ID: {roomId}</>
          )}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="join-room-name-input" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              id="join-room-name-input"
              type="text"
              value={userName}
              onChange={(e) => { setUserName(e.target.value); if (error) setError(null); }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                error ? 'border-red-400' : 'border-gray-300'
              }`}
              aria-invalid={!!error}
              aria-describedby="join-room-name-hint"
              placeholder="Enter your name..."
              required
              minLength={2}
              maxLength={50}
              autoFocus
            />
            <p
              id="join-room-name-hint"
              role={error ? 'alert' : undefined}
              className={`text-xs mt-1 ${error ? 'text-red-600' : 'text-gray-400'}`}
            >
              {error || NAME_HINT}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || userName.trim().length < 2}
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export type TimerWarning = 'none' | '5min' | '1min' | 'expired';

export interface RoomViewProps {
  // Identity
  name: string;
  isHost: boolean;

  // Room
  currentRoomId: string | null;
  roomDisplayName: string | null;
  e2eePassphrase: string | null;
  roomExpiresAt: number | null;
  roomJoinedAt: number | null;
  isRoomLocked: boolean;
  toggleRoomLock: () => void;

  // Messaging
  messages: Message[];
  visibleMessages: Message[];
  onlineUsers: string[];
  typingUsers: string[];
  input: string;
  setInput: (v: string) => void;

  // WebSocket
  ws: WebSocket | null;
  wsStatus: WSStatus;
  wsConnected: boolean;
  reconnectWS: () => void;

  // Voice/Video
  voiceConnected: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isE2EEEnabled: boolean;
  callMode: CallMode;

  // Toast
  toast: { message: string; type: ToastType } | null;
  setToast: (t: { message: string; type: ToastType } | null) => void;

  // Modals + UI
  showJoinRoomModal: boolean;
  setShowJoinRoomModal: (v: boolean) => void;
  showMobileMenu: boolean;
  setShowMobileMenu: (v: boolean) => void;
  showOnlineExpanded: boolean;
  setShowOnlineExpanded: (v: boolean) => void;
  showFeedbackModal: boolean;
  setShowFeedbackModal: (v: boolean) => void;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (v: boolean) => void;
  upgradeReason: string;

  // Timer
  timerWarning: TimerWarning;
  timeRemaining: string;

  // Room expired
  roomExpired: boolean;
  setRoomExpired: (v: boolean) => void;
  setCurrentRoomId: (v: string | null) => void;
  setSessionId: (v: string | null) => void;
  setMessages: (m: Message[]) => void;
  setOnlineUsers: (u: string[]) => void;

  // Refs — RefObject<T | null> is what useRef<T | null>(null) returns in React 18
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement>;

  // Handlers
  handleJoinRoom: (userName: string) => Promise<string | null | void>;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  copyRoomLink: () => void | Promise<void>;
  shareRoom: () => void | Promise<void>;
  handleToggleVoice: () => void | Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  handleLogout: () => void;
  sendMessage: () => void;
  sendTypingIndicator: () => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  upgradeToVideo: () => void;
  downgradeToVoice: () => void;
  endCall: () => void;
  minimizeCall: () => void;
  expandCall: () => void;
  handleStartTrial: () => void | Promise<void>;
  handleScroll: () => void;
  showToast: (msg: string, type?: ToastType) => void;
}

export const RoomView: React.FC<RoomViewProps> = ({
  name, isHost,
  currentRoomId, roomDisplayName, e2eePassphrase, roomExpiresAt, roomJoinedAt,
  isRoomLocked, toggleRoomLock,
  messages, visibleMessages, onlineUsers, typingUsers, input, setInput,
  ws, wsStatus, wsConnected, reconnectWS,
  voiceConnected, isMuted, isVideoEnabled, isE2EEEnabled, callMode,
  toast, setToast,
  showJoinRoomModal, setShowJoinRoomModal,
  showMobileMenu, setShowMobileMenu,
  showOnlineExpanded, setShowOnlineExpanded,
  showFeedbackModal, setShowFeedbackModal,
  showUpgradeModal, setShowUpgradeModal,
  upgradeReason,
  timerWarning, timeRemaining,
  roomExpired, setRoomExpired,
  setCurrentRoomId, setSessionId, setMessages, setOnlineUsers,
  containerRef, inputRef,
  handleJoinRoom, navigate,
  copyRoomLink, shareRoom,
  handleToggleVoice, toggleMute, toggleVideo,
  handleLogout,
  sendMessage, sendTypingIndicator, handleKeyPress,
  upgradeToVideo, downgradeToVoice, endCall, minimizeCall, expandCall,
  handleStartTrial, handleScroll, showToast,
}) => {
  // Desktop overflow menu (Report / Send feedback) + the mobile "…" menu's
  // inline report-type picker. Local UI state only — nothing to persist.
  const [showDesktopMenu, setShowDesktopMenu] = useState(false);
  const [showReportTypes, setShowReportTypes] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const closeMenus = () => {
    setShowMobileMenu(false);
    setShowDesktopMenu(false);
    setShowReportTypes(false);
  };

  const reportFromMenu = async (type: ReportType) => {
    if (!currentRoomId) return;
    setReportSubmitting(true);
    try {
      await submitReport(currentRoomId, type, showToast);
    } finally {
      setReportSubmitting(false);
      closeMenus();
    }
  };

  // Menu entries shared by the desktop overflow menu and the mobile "…" menu.
  const menuItemClass = 'w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50';
  const renderCommonMenuItems = () => (
    <>
      {currentRoomId && (
        <button
          onClick={() => { shareRoom(); closeMenus(); }}
          className={`${menuItemClass} sm:hidden`}
        >
          <Share2 size={15} /> Share
        </button>
      )}
      {currentRoomId && isHost && (
        <button
          onClick={() => { toggleRoomLock(); closeMenus(); }}
          className={`${menuItemClass} sm:hidden`}
          aria-pressed={isRoomLocked}
        >
          {isRoomLocked ? <LockOpen size={15} /> : <Lock size={15} />}
          {isRoomLocked ? 'Unlock room' : 'Lock room'}
        </button>
      )}
      {currentRoomId && !showReportTypes && (
        <button
          onClick={() => setShowReportTypes(true)}
          className={menuItemClass}
          aria-haspopup="menu"
        >
          <Flag size={15} /> Report abuse
        </button>
      )}
      {currentRoomId && showReportTypes && (
        <div className="border-y border-gray-100 py-1" role="menu" aria-label="Report as">
          <p className="px-4 py-1 text-xs text-gray-400 font-medium">Report as:</p>
          {REPORT_TYPES.map(({ value, label }) => (
            <button
              key={value}
              role="menuitem"
              onClick={() => reportFromMenu(value)}
              disabled={reportSubmitting}
              className="w-full text-left px-6 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => { setShowFeedbackModal(true); closeMenus(); }}
        className={menuItemClass}
      >
        <MessageSquare size={15} /> Send feedback
      </button>
    </>
  );

  return (
    // Fixed-height app shell: only the message list scrolls. 100dvh tracks
    // the mobile browser chrome; h-screen is the fallback for browsers
    // without dvh (the inline style is ignored there).
    <div
      className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-yellow-50"
      style={{ height: '100dvh' }}
    >
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Join Room Modal */}
      {showJoinRoomModal && currentRoomId && (
        <JoinRoomModal
          roomId={currentRoomId}
          roomName={roomDisplayName}
          onJoin={handleJoinRoom}
          onCancel={() => {
            setShowJoinRoomModal(false);
            navigate('/');
          }}
        />
      )}

      {/* Header */}
      <header className="flex-shrink-0 bg-white/90 backdrop-blur-sm shadow-sm border-b border-emerald-100 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Logo + Room name */}
            <div className="flex items-center gap-2 min-w-0">
              <img
                src="/logo.webp"
                alt="Hushroom"
                className="h-8 w-auto rounded-xl shadow-lg ring-2 ring-white/50 flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm lg:text-lg font-bold text-gray-900 truncate max-w-[120px] sm:max-w-none">
                    {roomDisplayName || currentRoomId || "Hushroom"}
                  </h1>
                  {e2eePassphrase && (
                    <Lock size={14} className="text-emerald-600 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate flex items-center gap-1.5">
                  <span>{e2eePassphrase ? 'End-to-end encrypted' : `Welcome ${name}`}</span>
                  {isRoomLocked && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold leading-none"
                      title="The host locked this room. No new participants can join"
                    >
                      <Lock size={10} aria-hidden="true" />
                      <span className="hidden sm:inline">Locked: no new participants</span>
                      <span className="sm:hidden">Locked</span>
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Right: Timer ring + actions */}
            <div className="flex items-center gap-2">
              {/* Timer: progress ring + legible mm:ss beside it (the old
                  9px label inside a 36px ring was unreadable). */}
              {roomExpiresAt && roomJoinedAt && (() => {
                const totalDuration = roomExpiresAt - roomJoinedAt;
                const now = Date.now();
                const remaining = Math.max(0, roomExpiresAt - now);
                const progress = totalDuration > 0 ? (remaining / totalDuration) * 100 : 0;
                const radius = 14;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference - (progress / 100) * circumference;
                const color = timerWarning === '1min' ? '#dc2626' : timerWarning === '5min' ? '#d97706' : '#16a34a';
                const textColor = timerWarning === '1min' ? 'text-red-600' : timerWarning === '5min' ? 'text-amber-600' : 'text-gray-700';
                return (
                  <div
                    className="flex items-center gap-1.5 flex-shrink-0 pr-1"
                    title={`Room expires in ${timeRemaining}`}
                    aria-label={`Room expires in ${timeRemaining}`}
                    role="timer"
                  >
                    <svg className="w-7 h-7 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                      <circle cx="18" cy="18" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="4" />
                      <circle
                        cx="18" cy="18" r={radius} fill="none"
                        stroke={color}
                        strokeWidth="4"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className={timerWarning === '1min' ? 'animate-pulse' : ''}
                      />
                    </svg>
                    <span className={`text-sm font-mono font-semibold tabular-nums ${textColor} ${timerWarning === '1min' ? 'animate-pulse' : ''}`}>
                      {timeRemaining}
                    </span>
                  </div>
                );
              })()}

              {/* Desktop actions */}
              <div className="hidden sm:flex items-center gap-1">
                {wsStatus === 'connected' && (
                  <div className="flex items-center gap-1.5 px-2 py-1" title="Connected">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                )}
                {wsStatus === 'reconnecting' && (
                  <div className="flex items-center gap-1.5 px-2 py-1 text-amber-600" title="Reconnecting">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs">Reconnecting…</span>
                  </div>
                )}
                {wsStatus === 'disconnected' && (
                  <button
                    onClick={() => reconnectWS()}
                    className="flex items-center gap-1.5 px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Reconnect"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs underline">Reconnect</span>
                  </button>
                )}

                {currentRoomId && (
                  <>
                    <button
                      onClick={copyRoomLink}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Copy room link"
                      aria-label="Copy room link"
                    >
                      <Copy size={15} />
                      <span>Copy Link</span>
                    </button>
                    <button
                      onClick={shareRoom}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Share room"
                      aria-label="Share room"
                    >
                      <Share2 size={15} />
                      <span>Share</span>
                    </button>
                    {isHost && (
                      <button
                        onClick={toggleRoomLock}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg transition-colors ${
                          isRoomLocked
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                        }`}
                        title={isRoomLocked ? 'Unlock room: allow new participants' : 'Lock room: block new participants'}
                        aria-label={isRoomLocked ? 'Unlock room' : 'Lock room'}
                        aria-pressed={isRoomLocked}
                      >
                        {isRoomLocked ? <LockOpen size={15} /> : <Lock size={15} />}
                        <span>{isRoomLocked ? 'Unlock' : 'Lock'}</span>
                      </button>
                    )}
                  </>
                )}

                {currentRoomId && (
                  <VoiceControls
                    isConnected={voiceConnected}
                    isMuted={isMuted}
                    isVideoEnabled={isVideoEnabled}
                    onToggleMute={toggleMute}
                    onToggleVoice={handleToggleVoice}
                    onToggleVideo={toggleVideo}
                    isPTT={false}
                  />
                )}

                {currentRoomId && (
                  <ReportButton roomId={currentRoomId} onToast={showToast} />
                )}

                <div className="relative">
                  <button
                    onClick={() => { setShowDesktopMenu(!showDesktopMenu); setShowReportTypes(false); }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="More options"
                    aria-haspopup="menu"
                    aria-expanded={showDesktopMenu}
                    title="More options"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {showDesktopMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={closeMenus} />
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-2xl border border-gray-200 py-1 z-50 min-w-[180px]">
                        {renderCommonMenuItems()}
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Log out"
                  title="Leave the room"
                >
                  <LogOut size={15} />
                  <span>Log out</span>
                </button>
              </div>

              {/* Mobile actions */}
              <div className="sm:hidden flex items-center gap-1">
                {currentRoomId && (
                  <>
                    <button
                      onClick={copyRoomLink}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Copy room link"
                      aria-label="Copy room link"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={handleToggleVoice}
                      className={`p-2 rounded-lg transition-colors ${
                        voiceConnected ? 'bg-emerald-100 text-emerald-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                      title={voiceConnected ? 'End call' : 'Start voice call'}
                      aria-label={voiceConnected ? 'End call' : 'Start voice call'}
                    >
                      <Phone size={18} />
                    </button>
                  </>
                )}

                <div className="relative">
                  <button
                    onClick={() => { setShowMobileMenu(!showMobileMenu); setShowReportTypes(false); }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="More options"
                    aria-haspopup="menu"
                    aria-expanded={showMobileMenu}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {showMobileMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={closeMenus} />
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-2xl border border-gray-200 py-1 z-50 min-w-[180px]">
                        {renderCommonMenuItems()}
                        <button
                          onClick={() => { handleLogout(); closeMenus(); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut size={15} /> Log out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Compact online bar (never grows the page — expanded list scrolls internally) */}
      <div className="flex-shrink-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm px-4 py-2">
          <button
            onClick={() => setShowOnlineExpanded(!showOnlineExpanded)}
            className="flex items-center gap-2 w-full"
            aria-label={showOnlineExpanded ? 'Collapse participants' : 'Expand participants'}
          >
            <div className="flex items-center -space-x-1.5">
              {onlineUsers.slice(0, 5).map((user) => (
                <div
                  key={user}
                  className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white"
                >
                  {user[0].toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-600 font-medium">
              {onlineUsers.length} online
            </span>
            <ChevronDown
              size={16}
              className={`text-gray-400 ml-auto transition-transform ${showOnlineExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {showOnlineExpanded && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 max-h-40 overflow-y-auto chat-scrollbar">
              {onlineUsers.map((user) => (
                <div key={user} className="flex items-center justify-between py-1.5 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-900">{user}</span>
                  </div>
                  {isHost && user !== name && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Remove ${user} from the room?`) && ws && ws.readyState === WebSocket.OPEN) {
                          ws.send(JSON.stringify({ type: "kick_participant", targetUserName: user }));
                        }
                      }}
                      className="text-red-400 hover:text-red-600 p-1"
                      title={`Remove ${user}`}
                      aria-label={`Remove ${user}`}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat — fills the remaining height; only the message list scrolls */}
      <div className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4 sm:pb-6 flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
          {/* Security status banner */}
          {currentRoomId && e2eePassphrase && (
            <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Lock size={14} />
              <span>End-to-end encrypted. Server cannot read messages or calls</span>
            </div>
          )}
          {currentRoomId && !e2eePassphrase && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle size={14} />
              <span>Encryption unavailable. Share the room link with the #key fragment</span>
            </div>
          )}
          {/* Timer warning banners */}
          {timerWarning === '5min' && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <Timer size={14} />
              <span>Room expires in 5 minutes</span>
            </div>
          )}
          {timerWarning === '1min' && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-800 text-xs flex items-center gap-2 animate-pulse">
              <Timer size={14} />
              <span>Room expires in 1 minute</span>
            </div>
          )}

          {/* Messages */}
          <div
            ref={containerRef}
            className="flex-1 min-h-0 overflow-auto chat-scrollbar"
            onScroll={handleScroll}
          >
            {messages.length === 0 && !showJoinRoomModal ? (
              onlineUsers.length <= 1 && !isHost ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 px-6 text-center">
                  <div className="text-3xl mb-3">⏳</div>
                  <p className="text-sm font-medium">Waiting for host…</p>
                  <p className="text-xs text-gray-400 mt-1">You'll be notified when the host joins. Stay on this page.</p>
                </div>
              ) : onlineUsers.length <= 1 && isHost ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 px-6 text-center">
                  <div className="text-3xl mb-3">🔗</div>
                  <p className="text-sm font-medium">Share the room link to invite others</p>
                  <p className="text-xs text-gray-400 mt-1">Use the Copy link button above. Your guest lands directly here.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Lock size={32} className="text-gray-400 mb-3" />
                  <p className="text-sm font-medium">This room is end-to-end encrypted</p>
                  <p className="text-xs text-gray-400 mt-1">Messages disappear when the room expires</p>
                </div>
              )
            ) : (
              <div className="p-4 space-y-3">
                {visibleMessages.map((message) => {
                  const isOwn = message.user === name;
                  return (
                    <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[75%]">
                        {!isOwn && (
                          <span className="text-xs font-semibold text-gray-500 ml-1 mb-0.5 block">{message.user}</span>
                        )}
                        <div className={`px-3.5 py-2 ${
                          isOwn
                            ? 'bg-emerald-500 text-white rounded-2xl rounded-tr-sm'
                            : 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                        </div>
                        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'} px-1`}>
                          <span className="text-[10px] text-gray-400">
                            {new Date(message.timestamp).toLocaleTimeString('sv-SE', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {message.encrypted && <Lock size={10} className="text-gray-400" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="px-4 py-1.5 flex items-center gap-1.5 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                {typingUsers.length === 1 ? typingUsers[0] : typingUsers.join(' & ')}
              </span>
              <div className="flex gap-0.5">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Room expiry footer */}
          {roomExpiresAt && (
            <div className="px-4 py-1.5 text-xs text-gray-400 text-center border-t border-gray-100">
              Room expires in {timeRemaining}
            </div>
          )}

          {/* Input */}
          <div className="p-3 lg:p-4 border-t border-gray-200">
            <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm px-2 py-1">
              {e2eePassphrase && (
                <Lock size={16} className="text-emerald-600 flex-shrink-0 ml-1" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  sendTypingIndicator();
                }}
                onKeyPress={handleKeyPress}
                placeholder={e2eePassphrase ? "Encrypted message..." : "Type your message..."}
                className="flex-1 px-2 py-2 focus:outline-none text-sm bg-transparent"
                maxLength={500}
                disabled={!wsConnected}
              />
              <button
                onClick={handleToggleVoice}
                className={`p-2 rounded-lg transition-colors ${
                  voiceConnected ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
                title="Voice call"
                aria-label={voiceConnected ? 'End voice call' : 'Start voice call'}
              >
                <Mic size={16} />
              </button>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || !wsConnected}
                className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 text-sm"
                aria-label="Send message"
              >
                <Send size={15} />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Call Overlays - WhatsApp/Telegram style */}
      {callMode === 'voice' && (
        <VoiceCallOverlay
          isConnected={voiceConnected}
          isMuted={isMuted}
          participantName={roomDisplayName || currentRoomId || "Voice Room"}
          onToggleMute={toggleMute}
          onUpgradeToVideo={upgradeToVideo}
          onEndCall={endCall}
          onMinimize={minimizeCall}
          isE2EE={isE2EEEnabled}
          timeRemaining={timeRemaining}
          timerWarning={timerWarning}
        />
      )}

      {callMode === 'video' && (
        <VideoCallOverlay
          isConnected={voiceConnected}
          isMuted={isMuted}
          isVideoEnabled={isVideoEnabled}
          participantName={roomDisplayName || currentRoomId || "Video Room"}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onDowngradeToVoice={downgradeToVoice}
          onEndCall={endCall}
          onMinimize={minimizeCall}
          isE2EE={isE2EEEnabled}
          timeRemaining={timeRemaining}
          timerWarning={timerWarning}
        />
      )}

      {callMode === 'minimized' && (
        <CallMinimized
          callMode={isVideoEnabled ? 'video' : 'voice'}
          isMuted={isMuted}
          isVideoEnabled={isVideoEnabled}
          participantName={roomDisplayName || currentRoomId || "Room"}
          onExpand={expandCall}
          onEndCall={endCall}
          isE2EE={isE2EEEnabled}
          timeRemaining={timeRemaining}
          timerWarning={timerWarning}
        />
      )}

      {showFeedbackModal && (
        <FeedbackModal
          onClose={() => setShowFeedbackModal(false)}
          onToast={showToast}
        />
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Free plan limit</h3>
            <p className="text-gray-500 mb-6">{upgradeReason}</p>
            <button
              onClick={handleStartTrial}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 rounded-xl mb-3 hover:from-emerald-600 hover:to-green-700 transition-all"
            >
              Start free 14-day Pro trial
            </button>
            <p className="text-xs text-gray-400 mb-4">No credit card required</p>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="text-gray-400 text-sm hover:text-gray-600"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Room Expired Overlay */}
      {roomExpired && (
        <div className="fixed inset-0 bg-gray-950/95 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full text-center">
            <div className="text-5xl mb-4">⏱</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Room ended</h2>
            <p className="text-gray-500 mb-6">This room has expired. All messages have been permanently deleted.</p>
            <button
              onClick={() => {
                setRoomExpired(false);
                setCurrentRoomId(null);
                setSessionId(null);
                setMessages([]);
                setOnlineUsers([]);
                setShowJoinRoomModal(false);
                navigate('/', { replace: true });
              }}
              className="w-full bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Back to home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
