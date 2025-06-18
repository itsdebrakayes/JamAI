
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
      const audioElement = await elevenLabsService.textToSpeech(text, voiceId);
      audioRef.current = audioElement;
      
      // Set up event listeners before attempting to play
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
        setIsSpeaking(true);
      });

      audioElement.addEventListener('error', (e) => {
        console.error('Audio error in hook:', e);
        setIsSpeaking(false);
        setIsPaused(false);
        audioRef.current = null;
      });

      // Try to play the audio
      console.log('Attempting to play audio...');
      try {
        await audioElement.play();
        console.log('Audio play() resolved successfully');
        setIsSpeaking(true);
        setIsPaused(false);
      } catch (playError) {
        console.error('Audio play failed:', playError);
        // If autoplay fails, still set the state so user can manually trigger
        setIsSpeaking(true);
        setIsPaused(false);
        
        // Try clicking on the document to enable audio context
        const playWithUserGesture = () => {
          audioElement.play().then(() => {
            console.log('Audio started after user gesture');
          }).catch(console.error);
          document.removeEventListener('click', playWithUserGesture);
        };
        document.addEventListener('click', playWithUserGesture);
        
        console.log('Audio ready but may need user interaction - click anywhere to start');
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
