
import { useState, useRef } from 'react';
import { elevenLabsService } from '@/services/elevenLabsService';

interface ElevenLabsSpeechHook {
  speak: (text: string, voiceId?: string) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
}

export const useElevenLabsSpeech = (): ElevenLabsSpeechHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = async (text: string, voiceId: string = '9BWtsMINqrJLrRacOk9x') => {
    if (!text.trim() || isSpeaking) {
      console.log('Empty text or already speaking');
      return;
    }

    try {
      setIsSpeaking(true);
      setIsPaused(false);
      
      const audioElement = await elevenLabsService.textToSpeech(text, voiceId);
      audioRef.current = audioElement;
      
      // Listen for when audio actually ends
      audioElement.addEventListener('ended', () => {
        setIsSpeaking(false);
        setIsPaused(false);
        audioRef.current = null;
      });

      audioElement.addEventListener('pause', () => {
        if (audioElement.currentTime > 0 && !audioElement.ended) {
          setIsPaused(true);
        }
      });

      audioElement.addEventListener('play', () => {
        setIsPaused(false);
      });

      audioElement.addEventListener('error', () => {
        setIsSpeaking(false);
        setIsPaused(false);
        audioRef.current = null;
      });

    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
      setIsPaused(false);
      audioRef.current = null;
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
      setIsPaused(false);
      audioRef.current = null;
    }
    elevenLabsService.stopCurrentAudio();
  };

  const pause = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  };

  const resume = () => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(console.error);
      setIsPaused(false);
    }
  };

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported: elevenLabsService.isSupported()
  };
};
