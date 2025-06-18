
import React from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

interface SpeakButtonProps {
  text: string;
  className?: string;
}

const SpeakButton = ({ text, className = '' }: SpeakButtonProps) => {
  const {
    speak,
    cancel,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported
  } = useSpeechSynthesis();

  if (!isSupported) return null;

  const handleClick = () => {
    if (isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      speak(text);
    }
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    cancel();
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        onClick={handleClick}
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
        title={
          isSpeaking 
            ? (isPaused ? 'Resume' : 'Pause') 
            : 'Read aloud'
        }
      >
        {isSpeaking ? (
          isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />
        ) : (
          <Volume2 className="w-3 h-3" />
        )}
      </Button>
      
      {isSpeaking && (
        <Button
          onClick={handleStop}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
          title="Stop"
        >
          <VolumeX className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};

export default SpeakButton;
