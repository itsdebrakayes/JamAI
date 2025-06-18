
import { useState } from 'react';
import { elevenLabsService } from '@/services/elevenLabsService';

interface ElevenLabsSpeechHook {
  speak: (text: string, voiceId?: string) => Promise<void>;
  isSpeaking: boolean;
  isSupported: boolean;
}

export const useElevenLabsSpeech = (): ElevenLabsSpeechHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = async (text: string, voiceId: string = '9BWtsMINqrJLrRacOk9x') => {
    if (!text.trim() || isSpeaking) {
      console.log('Empty text or already speaking');
      return;
    }

    try {
      setIsSpeaking(true);
      const audioElement = await elevenLabsService.textToSpeech(text, voiceId);
      
      // Listen for when audio actually ends to update state
      audioElement.addEventListener('ended', () => {
        setIsSpeaking(false);
      });

      audioElement.addEventListener('error', () => {
        setIsSpeaking(false);
      });

    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  };

  return {
    speak,
    isSpeaking,
    isSupported: elevenLabsService.isSupported()
  };
};
