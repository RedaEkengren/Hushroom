// WhatsApp/Telegram Style Voice Call Overlay
import { PhoneOff, Mic, MicOff, Video, Minimize2, Lock, Timer } from 'lucide-react';

interface VoiceCallOverlayProps {
  isConnected: boolean;
  isMuted: boolean;
  participantName?: string;
  onToggleMute: () => void;
  onUpgradeToVideo: () => void;
  onEndCall: () => void;
  onMinimize: () => void;
  isE2EE?: boolean;
  timeRemaining?: string;
  timerWarning?: string;
}

export function VoiceCallOverlay({
  isConnected,
  isMuted,
  participantName = "Voice Room",
  onToggleMute,
  onUpgradeToVideo,
  onEndCall,
  onMinimize,
  isE2EE,
  timeRemaining,
  timerWarning
}: VoiceCallOverlayProps) {
  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 md:p-6 text-white">
        <button
          onClick={onMinimize}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          aria-label="Minimize call"
        >
          <Minimize2 className="h-5 w-5" />
        </button>
        <div className="text-center">
          <div className="text-sm text-gray-300 flex items-center justify-center gap-1.5">
            {isE2EE && <Lock className="h-3 w-3 text-green-400" />}
            Voice Call
          </div>
          <div className="text-xs text-gray-400">
            {isE2EE ? 'End-to-end encrypted' : isConnected ? 'Connected' : 'Connecting...'}
          </div>
          {timeRemaining && (
            <div className={`text-xs font-mono mt-1 flex items-center justify-center gap-1 ${
              timerWarning === '1min' ? 'text-red-400 animate-pulse' :
              timerWarning === '5min' ? 'text-amber-400' : 'text-gray-400'
            }`}>
              <Timer className="h-3 w-3" />
              {timeRemaining}
            </div>
          )}
        </div>
        <div className="w-9 h-9" /> {/* Spacer */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Avatar with connecting animation */}
        <div className="relative">
          {!isConnected && (
            <div className="absolute inset-0 rounded-full border-4 border-green-400/30 animate-ping" />
          )}
          <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-8">
            <span className="text-3xl font-bold text-white">
              {participantName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Participant Name */}
        <h2 className="text-2xl font-semibold text-white mb-2">{participantName}</h2>

        {/* Status */}
        <div className="text-gray-300 text-sm mb-8">
          {isConnected ? 'Voice active' : 'Connecting...'}
        </div>

        {/* Connection indicator */}
        {isConnected && (
          <div className="flex items-center gap-2 text-green-400 mb-8">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Connected</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 md:p-6 pb-safe">
        <div className="flex justify-center items-center gap-4 md:gap-6">
          {/* Mute/Unmute */}
          <button
            onClick={onToggleMute}
            className={`p-4 rounded-full transition-all ${
              isMuted
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? (
              <MicOff className="h-6 w-6 text-white" />
            ) : (
              <Mic className="h-6 w-6 text-white" />
            )}
          </button>

          {/* End Call */}
          <button
            onClick={onEndCall}
            className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
            aria-label="End call"
          >
            <PhoneOff className="h-6 w-6 text-white" />
          </button>

          {/* Upgrade to Video */}
          <button
            onClick={onUpgradeToVideo}
            className="p-4 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
            aria-label="Enable video"
          >
            <Video className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Control Labels */}
        <div className="flex justify-center items-center gap-4 md:gap-6 mt-2">
          <span className="text-xs text-gray-400 w-14 text-center">
            {isMuted ? 'Unmute' : 'Mute'}
          </span>
          <span className="text-xs text-gray-400 w-14 text-center">End</span>
          <span className="text-xs text-gray-400 w-14 text-center">Video</span>
        </div>
      </div>
    </div>
  );
}
