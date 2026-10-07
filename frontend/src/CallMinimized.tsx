// Floating Minimized Call Bubble - WhatsApp/Telegram style
import { Phone, MicOff, Video, VideoOff, Lock } from 'lucide-react';

interface CallMinimizedProps {
  callMode: 'voice' | 'video';
  isMuted: boolean;
  isVideoEnabled?: boolean;
  participantName?: string;
  onExpand: () => void;
  onEndCall: () => void;
  isE2EE?: boolean;
  timeRemaining?: string;
  timerWarning?: string;
}

export function CallMinimized({
  callMode,
  isMuted,
  isVideoEnabled = false,
  participantName = "Room",
  onExpand,
  onEndCall,
  isE2EE,
  timeRemaining,
  timerWarning
}: CallMinimizedProps) {
  return (
    <div className="fixed top-20 right-4 z-40 bg-green-500 rounded-full shadow-lg flex items-center gap-2 px-4 py-2 min-w-[120px]" title={participantName}>
      {/* Call info - clickable area to expand */}
      <button
        onClick={onExpand}
        className="flex items-center gap-2 flex-1 text-white"
        aria-label="Expand call"
      >
        {/* Call type icon */}
        {callMode === 'video' ? (
          <Video className="h-4 w-4" />
        ) : (
          <Phone className="h-4 w-4" />
        )}

        {/* Participant info + timer */}
        <div className="text-left">
          <div className="text-xs font-medium truncate max-w-[80px]">
            {callMode === 'video' ? 'Video' : 'Voice'}
            {timeRemaining && (
              <span className={`ml-1 font-mono ${
                timerWarning === '1min' ? 'text-red-200' :
                timerWarning === '5min' ? 'text-amber-200' : ''
              }`}>
                · {timeRemaining}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Status indicators */}
      <div className="flex items-center gap-1">
        {/* E2EE indicator */}
        {isE2EE && (
          <Lock className="h-3 w-3 text-white opacity-80" />
        )}
        {/* Mute indicator */}
        {isMuted && (
          <MicOff className="h-3 w-3 text-white opacity-80" />
        )}

        {/* Video off indicator for video calls */}
        {callMode === 'video' && !isVideoEnabled && (
          <VideoOff className="h-3 w-3 text-white opacity-80" />
        )}
      </div>

      {/* End call button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEndCall();
        }}
        className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
        aria-label="End call"
      >
        <Phone className="h-3 w-3 text-white transform rotate-[135deg]" />
      </button>
    </div>
  );
}
