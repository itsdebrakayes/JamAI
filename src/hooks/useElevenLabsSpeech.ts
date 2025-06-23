
import React, { useState, useRef, useCallback } from 'react';
import { elevenLabsService } from '@/services/elevenLabsService';

interface ElevenLabsSpeechHook {
  speak: (text: string, voiceId?: string) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  error: string | null;
}

export const useElevenLabsSpeech = (): ElevenLabsSpeechHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userInteractionRef = useRef<boolean>(false);

  // Enable user interaction tracking for mobile
  const enableUserInteraction = useCallback(() => {
    if (!userInteractionRef.current) {
      console.log('🖱️ User interaction enabled for mobile audio');
      userInteractionRef.current = true;
      
      // Remove event listeners after first interaction
      document.removeEventListener('touchstart', enableUserInteraction);
      document.removeEventListener('click', enableUserInteraction);
    }
  }, []);

  // Set up user interaction listeners on component mount
  React.useEffect(() => {
    document.addEventListener('touchstart', enableUserInteraction, { once: true });
    document.addEventListener('click', enableUserInteraction, { once: true });
    
    return () => {
      document.removeEventListener('touchstart', enableUserInteraction);
      document.removeEventListener('click', enableUserInteraction);
    };
  }, [enableUserInteraction]);

  const speak = async (text: string, voiceId: string = '9BWtsMINqrJLrRacOk9x') => {
    if (!text.trim()) {
      console.log('❌ Empty text provided to speak function');
      setError('No text provided');
      return;
    }

    setError(null);

    if (isSpeaking) {
      console.log('❌ Already speaking, stopping current and starting new');
      stop();
      // Small delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      console.log('🎙️ Starting speech synthesis for:', text.substring(0, 100) + '...');
      setIsSpeaking(true);
      setIsPaused(false);
      
      const audioElement = await elevenLabsService.textToSpeech(text, voiceId);
      audioRef.current = audioElement;
      
      console.log('🔊 Audio element received, attempting playback');
      
      // Set up event listeners
      audioElement.addEventListener('ended', () => {
        console.log('🏁 Audio ended - cleaning up state');
        setIsSpeaking(false);
        setIsPaused(false);
        audioRef.current = null;
      });

      audioElement.addEventListener('pause', () => {
        if (audioElement.currentTime > 0 && !audioElement.ended) {
          console.log('⏸️ Audio paused - updating state to paused');
          setIsPaused(true);
        }
      });

      audioElement.addEventListener('play', () => {
        console.log('▶️ Audio play event - updating state to playing');
        setIsPaused(false);
        setError(null);
      });

      audioElement.addEventListener('error', (e) => {
        console.error('❌ Audio error in hook:', e);
        console.error('❌ Audio error object:', audioElement.error);
        const errorMsg = 'Audio playback failed';
        setError(errorMsg);
        setIsSpeaking(false);
        setIsPaused(false);
        audioRef.current = null;
      });

      // Try to play the audio
      try {
        console.log('🎵 Attempting to play audio...');
        await audioElement.play();
        console.log('✅ Audio playing successfully');
      } catch (playError) {
        console.error('❌ Audio play failed:', playError);
        setError('Audio playback failed. Please try again.');
        setIsSpeaking(false);
        setIsPaused(false);
        throw playError;
      }

    } catch (error) {
      console.error('❌ Speech synthesis failed:', error);
      setError('Speech synthesis failed. Please check your connection.');
      setIsSpeaking(false);
      setIsPaused(false);
      audioRef.current = null;
    }
  };

  const stop = () => {
    console.log('🛑 Stop requested');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setError(null);
    elevenLabsService.stopCurrentAudio();
  };

  const pause = () => {
    console.log('⏸️ Pause requested');
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  };

  const resume = () => {
    console.log('▶️ Resume requested');
    if (audioRef.current && audioRef.current.paused && !audioRef.current.ended) {
      audioRef.current.play().then(() => {
        console.log('✅ Resume successful');
      }).catch((error) => {
        console.error('❌ Resume failed:', error);
        setError('Resume failed');
      });
    }
  };

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported: elevenLabsService.isSupported(),
    error
  };
};
