
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
      console.log('Starting speech synthesis...');
      setIsSpeaking(true); // Set this immediately so buttons appear
      setIsPaused(false);
      
      const audioElement = await elevenLabsService.textToSpeech(text, voiceId);
      audioRef.current = audioElement;
      
      // Ensure maximum volume
      audioElement.volume = 1.0;
      console.log('Audio element volume set to:', audioElement.volume);
      
      // Set up event listeners
      audioElement.addEventListener('ended', () => {
        console.log('Audio ended - updating state');
        setIsSpeaking(false);
        setIsPaused(false);
        audioRef.current = null;
      });

      audioElement.addEventListener('pause', () => {
        if (audioElement.currentTime > 0 && !audioElement.ended) {
          console.log('Audio paused - updating state');
          setIsPaused(true);
        }
      });

      audioElement.addEventListener('play', () => {
        console.log('Audio playing - updating state');
        setIsPaused(false);
      });

      audioElement.addEventListener('error', (e) => {
        console.error('Audio error in hook:', e);
        setIsSpeaking(false);
        setIsPaused(false);
        audioRef.current = null;
      });

      // Try to play the audio with user interaction fallback
      console.log('Attempting to play audio at volume:', audioElement.volume);
      try {
        await audioElement.play();
        console.log('Audio play() resolved successfully at volume:', audioElement.volume);
      } catch (playError) {
        console.error('Audio play failed, setting up click handler:', playError);
        
        // Create a one-time click handler to enable audio
        const enableAudio = async () => {
          try {
            await audioElement.play();
            console.log('Audio started after user interaction at volume:', audioElement.volume);
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('touchstart', enableAudio);
          } catch (retryError) {
            console.error('Audio still failed after user interaction:', retryError);
          }
        };
        
        document.addEventListener('click', enableAudio, { once: true });
        document.addEventListener('touchstart', enableAudio, { once: true });
        
        console.log('Audio ready but needs user interaction - click anywhere to start playback');
      }

    } catch (error) {
      console.error('Speech synthesis error:', error);
      setIsSpeaking(false);
      setIsPaused(false);
      audioRef.current = null;
      throw error;
    }
  };

  const stop = () => {
    console.log('Stopping audio playback');
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
    console.log('Pausing audio playback');
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  };

  const resume = () => {
    console.log('Resuming audio playback');
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().then(() => {
        setIsPaused(false);
      }).catch(console.error);
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
