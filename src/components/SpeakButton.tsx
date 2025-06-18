
import React from 'react';
import { Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useElevenLabsSpeech } from '@/hooks/useElevenLabsSpeech';

interface SpeakButtonProps {
  text: string;
  className?: string;
}

const SpeakButton = ({ text, className = '' }: SpeakButtonProps) => {
  const { speak, isSpeaking, isSupported } = useElevenLabsSpeech();

  if (!isSupported) {
    console.log('ElevenLabs not supported');
    return null;
  }

  const handleClick = async () => {
    if (!isSpeaking) {
      await speak(text);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        onClick={handleClick}
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
        disabled={isSpeaking}
        title={isSpeaking ? 'Speaking...' : 'Read aloud'}
      >
        {isSpeaking ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Volume2 className="w-3 h-3" />
        )}
      </Button>
    </div>
  );
};

export default SpeakButton;
