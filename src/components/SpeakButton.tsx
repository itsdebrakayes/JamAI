
import React from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useElevenLabsSpeech } from '@/hooks/useElevenLabsSpeech';

interface SpeakButtonProps {
  text: string;
  className?: string;
}

const SpeakButton = ({ text, className = '' }: SpeakButtonProps) => {
  const { speak, stop, pause, resume, isSpeaking, isPaused, isSupported } = useElevenLabsSpeech();

  if (!isSupported) {
    console.log('ElevenLabs not supported');
    return null;
  }

  const handleSpeakClick = async () => {
    if (!isSpeaking && !isPaused) {
      await speak(text);
    }
  };

  const handlePauseResumeClick = () => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  const handleStopClick = () => {
    stop();
  };

  return (
    <div className={`flex items-center gap-1 ${className}`} role="group" aria-label="Audio controls">
      {/* Show volume icon when not speaking */}
      {!isSpeaking && !isPaused && (
        <Button
          onClick={handleSpeakClick}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Read aloud"
        >
          <Volume2 className="w-3 h-3" aria-hidden="true" />
        </Button>
      )}

      {/* Show controls when speaking or paused */}
      {(isSpeaking || isPaused) && (
        <>
          <Button
            onClick={handleStopClick}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Stop playback"
          >
            <VolumeX className="w-3 h-3" aria-hidden="true" />
          </Button>
          
          <Button
            onClick={handlePauseResumeClick}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
            aria-label={isPaused ? 'Resume playback' : 'Pause playback'}
          >
            {isPaused ? (
              <Play className="w-3 h-3" aria-hidden="true" />
            ) : (
              <Pause className="w-3 h-3" aria-hidden="true" />
            )}
          </Button>
        </>
      )}
    </div>
  );
};

export default SpeakButton;
