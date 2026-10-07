// Phase 2: Voice + Video Controls (preserves design)
import { Mic, MicOff, PhoneOff, Phone, Video, VideoOff } from 'lucide-react';

interface VoiceControlsProps {
  isConnected: boolean;
  isMuted: boolean;
  isVideoEnabled?: boolean;
  onToggleMute: () => void;
  onToggleVoice: () => void;
  onToggleVideo?: () => void;
  isPTT: boolean;
  compact?: boolean;
}

export function VoiceControls({ 
  isConnected, 
  isMuted, 
  isVideoEnabled = false,
  onToggleMute, 
  onToggleVoice,
  onToggleVideo,
  isPTT,
  compact = false 
}: VoiceControlsProps) {
  if (compact) {
    // Mobile-friendly compact version
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleVoice}
          className={`p-2 rounded-lg transition-all ${
            isConnected 
              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={isConnected ? 'Leave voice' : 'Join voice'}
        >
          {isConnected ? <PhoneOff className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
        </button>
        
        {isConnected && (
          <>
            <button
              onClick={onToggleMute}
              className={`p-2 rounded-lg transition-all ${
                isMuted 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            
            {onToggleVideo && (
              <button
                onClick={onToggleVideo}
                className={`p-2 rounded-lg transition-all ${
                  isVideoEnabled 
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  // Desktop version - still minimal
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
      <button
        onClick={onToggleVoice}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm ${
          isConnected 
            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
        }`}
      >
        {isConnected ? <PhoneOff className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
        <span>{isConnected ? 'Leave Voice' : 'Join Voice'}</span>
      </button>
      
      {isConnected && (
        <>
          <button
            onClick={onToggleMute}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm ${
              isMuted 
                ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>
          
          {onToggleVideo && (
            <button
              onClick={onToggleVideo}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm ${
                isVideoEnabled 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              <span>{isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}</span>
            </button>
          )}
          
          {isPTT && (
            <span className="text-xs text-gray-500 ml-2">
              Hold SPACE to talk
            </span>
          )}
        </>
      )}
    </div>
  );
}