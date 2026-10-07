// Call State Management Hook - WhatsApp/Telegram style
import { useState, useCallback } from 'react';

export type CallMode = 'inactive' | 'voice' | 'video' | 'minimized';

interface UseCallStateProps {
  onVoiceToggle: () => void;
  onVideoToggle: () => void;
  onCallEnd: () => void;
}

export function useCallState({ onVoiceToggle, onVideoToggle, onCallEnd }: UseCallStateProps) {
  const [callMode, setCallMode] = useState<CallMode>('inactive');
  
  const startVoiceCall = useCallback(() => {
    setCallMode('voice');
    onVoiceToggle();
  }, [onVoiceToggle]);
  
  const startVideoCall = useCallback(() => {
    setCallMode('video');
    onVideoToggle();
  }, [onVideoToggle]);
  
  const upgradeToVideo = useCallback(() => {
    setCallMode('video');
    onVideoToggle();
  }, [onVideoToggle]);
  
  const downgradeToVoice = useCallback(() => {
    setCallMode('voice');
    onVideoToggle();
  }, [onVideoToggle]);
  
  const minimizeCall = useCallback(() => {
    setCallMode('minimized');
  }, []);
  
  const expandCall = useCallback(() => {
    // Expand back to previous state
    setCallMode(callMode === 'minimized' ? 'voice' : callMode);
  }, [callMode]);
  
  const endCall = useCallback(() => {
    setCallMode('inactive');
    onCallEnd();
  }, [onCallEnd]);
  
  return {
    callMode,
    startVoiceCall,
    startVideoCall,
    upgradeToVideo,
    downgradeToVoice,
    minimizeCall,
    expandCall,
    endCall,
    isCallActive: callMode !== 'inactive'
  };
}