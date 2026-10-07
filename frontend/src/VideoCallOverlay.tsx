// WhatsApp/Telegram Style Video Call Overlay
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Minimize2, Lock, Timer, Loader2 } from 'lucide-react';

interface VideoCallOverlayProps {
  isConnected: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  participantName?: string;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onDowngradeToVoice: () => void;
  onEndCall: () => void;
  onMinimize: () => void;
  isE2EE?: boolean;
  timeRemaining?: string;
  timerWarning?: string;
}

export function VideoCallOverlay({
  isConnected,
  isMuted,
  isVideoEnabled,
  participantName = "Video Room",
  onToggleMute,
  onToggleVideo,
  onDowngradeToVoice,
  onEndCall,
  onMinimize,
  isE2EE,
  timeRemaining,
  timerWarning
}: VideoCallOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 md:p-6 bg-gradient-to-b from-black/50 to-transparent">
        <button
          onClick={onMinimize}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Minimize call"
        >
          <Minimize2 className="h-5 w-5 text-white" />
        </button>
        <div className="text-center">
          <div className="text-sm text-white flex items-center justify-center gap-1.5">
            {isE2EE && <Lock className="h-3 w-3 text-green-400" />}
            {participantName}
            {timeRemaining && (
              <span className={`font-mono text-xs ml-1.5 ${
                timerWarning === '1min' ? 'text-red-400 animate-pulse' :
                timerWarning === '5min' ? 'text-amber-400' : 'text-white/70'
              }`}>
                <Timer className="h-3 w-3 inline mr-0.5" />
                {timeRemaining}
              </span>
            )}
          </div>
          <div className="text-xs text-white/70 flex items-center justify-center gap-1">
            {!isConnected && <Loader2 className="h-3 w-3 animate-spin" />}
            {isE2EE ? 'End-to-end encrypted' : isConnected ? 'Video call active' : 'Connecting...'}
          </div>
        </div>
        <div className="w-9 h-9" /> {/* Spacer */}
      </div>

      {/* Video Area - Speaker Focus Layout */}
      <div className="flex-1 relative">
        {/* Main Speaker Video - Full background */}
        <div
          id="main-speaker-video"
          className="absolute inset-0 w-full h-full bg-black"
          style={{ zIndex: 1 }}
        >
          {/* Placeholder for main speaker - will be replaced by active speaker video */}
          <div id="speaker-placeholder" className="w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl font-bold">
                  {participantName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-gray-300">
                {isVideoEnabled ? 'Waiting for video...' : 'Camera off'}
              </div>
            </div>
          </div>
        </div>

        {/* Video Thumbnails Bar - Top overlay for multiple users */}
        <div
          id="video-thumbnails-bar"
          className="absolute top-16 md:top-20 left-3 md:left-4 right-3 md:right-4 flex gap-2 overflow-x-auto"
          style={{ zIndex: 15, display: 'none' }}
        >
          {/* Thumbnails will be dynamically added here */}
        </div>

        {/* Local Video PIP - WhatsApp/Telegram style with proper responsive sizing */}
        <div
          id="local-video-pip"
          className="absolute top-16 md:top-20 right-3 md:right-4 bg-gray-800 rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl"
          style={{
            zIndex: 10,
            width: window.innerWidth < 768 ? '80px' : '120px',
            aspectRatio: window.innerWidth < 768 ? '9/16' : '16/9'
          }}
        >
          {/* Local video placeholder - will be replaced by actual video */}
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            {isVideoEnabled ? (
              <Video className="h-4 w-4 text-white/50" />
            ) : (
              <VideoOff className="h-4 w-4 text-white/50" />
            )}
          </div>
        </div>

        {/* Connection Status */}
        {isConnected && (
          <div
            className="absolute top-16 md:top-20 left-3 md:left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full"
            style={{ zIndex: 15 }}
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white text-xs">Connected</span>
          </div>
        )}
      </div>

      {/* Floating Controls - WhatsApp/Telegram floating island style */}
      <div
        className="absolute bottom-0 left-0 right-0 p-4 md:p-6 pb-safe"
        style={{ zIndex: 20 }}
      >
        {/* Control Background with backdrop blur */}
        <div className="flex justify-center mb-safe">
          <div className="bg-black/70 backdrop-blur-lg rounded-3xl px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 md:gap-4 shadow-2xl border border-white/10">
            {/* Mute/Unmute */}
            <button
              onClick={onToggleMute}
              className={`p-3 rounded-full transition-all min-h-[48px] min-w-[48px] flex items-center justify-center ${
                isMuted
                  ? 'bg-red-500 hover:bg-red-600 shadow-lg'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? (
                <MicOff className="h-5 w-5 text-white" />
              ) : (
                <Mic className="h-5 w-5 text-white" />
              )}
            </button>

            {/* End Call */}
            <button
              onClick={onEndCall}
              className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-all min-h-[56px] min-w-[56px] flex items-center justify-center shadow-lg"
              aria-label="End call"
            >
              <PhoneOff className="h-6 w-6 text-white" />
            </button>

            {/* Toggle Video */}
            <button
              onClick={onToggleVideo}
              className={`p-3 rounded-full transition-all min-h-[48px] min-w-[48px] flex items-center justify-center ${
                !isVideoEnabled
                  ? 'bg-red-500 hover:bg-red-600 shadow-lg'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
              aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? (
                <Video className="h-5 w-5 text-white" />
              ) : (
                <VideoOff className="h-5 w-5 text-white" />
              )}
            </button>

            {/* Downgrade to Voice */}
            <button
              onClick={onDowngradeToVoice}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all min-h-[48px] min-w-[48px] flex items-center justify-center"
              aria-label="Switch to voice only"
            >
              <Phone className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Control Labels - Mobile friendly */}
        <div className="flex justify-center">
          <div className="text-xs text-white/60 text-center max-w-sm">
            {isMuted ? 'Tap to unmute' : 'Tap to mute'} • Tap red to end call
          </div>
        </div>
      </div>
    </div>
  );
}
