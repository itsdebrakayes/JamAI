
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
    if (!text.trim()) {
      console.log('❌ Empty text provided to speak function');
      return;
    }

    if (isSpeaking) {
      console.log('❌ Already speaking, ignoring new request');
      return;
    }

    try {
      console.log('🎙️ Starting speech synthesis for:', text.substring(0, 100) + '...');
      setIsSpeaking(true);
      setIsPaused(false);
      
      const audioElement = await elevenLabsService.textToSpeech(text, voiceId);
      audioRef.current = audioElement;
      
      console.log('🔊 Audio element received, setting up event listeners');
      
      // Set up event listeners with detailed logging
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
      });

      audioElement.addEventListener('error', (e) => {
        console.error('❌ Audio error in hook:', e);
        console.error('❌ Audio error object:', audioElement.error);
        setIsSpeaking(false);
        setIsPaused(false);
        audioRef.current = null;
      });

      // Multiple attempt strategy to play audio
      console.log('🎵 Attempting to play audio...');
      
      try {
        // First attempt - direct play
        const playPromise = audioElement.play();
        await playPromise;
        console.log('✅ Audio playing successfully via direct play');
      } catch (playError) {
        console.warn('⚠️ Direct play failed:', playError);
        console.log('🖱️ Setting up user interaction handler...');
        
        // Second attempt - wait for user interaction
        const playAfterInteraction = async (event: Event) => {
          console.log('🖱️ User interaction detected:', event.type);
          try {
            await audioElement.play();
            console.log('✅ Audio playing after user interaction');
            document.removeEventListener('click', playAfterInteraction);
            document.removeEventListener('keydown', playAfterInteraction);
            document.removeEventListener('touchstart', playAfterInteraction);
          } catch (interactionError) {
            console.error('❌ Audio still failed after user interaction:', interactionError);
          }
        };
        
        // Listen for multiple types of user interaction
        document.addEventListener('click', playAfterInteraction, { once: true });
        document.addEventListener('keydown', playAfterInteraction, { once: true });
        document.addEventListener('touchstart', playAfterInteraction, { once: true });
        
        console.log('⏳ Audio ready but waiting for user interaction - click, tap, or press any key');
      }

    } catch (error) {
      console.error('❌ Speech synthesis failed:', error);
      setIsSpeaking(false);
      setIsPaused(false);
      audioRef.current = null;
      throw error;
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
    elevenLabsService.stopCurrentAudio();
  };

  const pause = () => {
    console.log('⏸️ Pause requested');
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      // State will be updated by the pause event listener
    }
  };

  const resume = () => {
    console.log('▶️ Resume requested');
    if (audioRef.current && audioRef.current.paused && !audioRef.current.ended) {
      audioRef.current.play().then(() => {
        console.log('✅ Resume successful');
        // State will be updated by the play event listener
      }).catch((error) => {
        console.error('❌ Resume failed:', error);
      });
    }
  };

  // Debug current state
  console.log('🔍 Hook state - isSpeaking:', isSpeaking, 'isPaused:', isPaused, 'hasAudio:', !!audioRef.current);

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
