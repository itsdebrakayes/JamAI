
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
      await elevenLabsService.textToSpeech(text, voiceId);
    } catch (error) {
      console.error('Speech error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  return {
    speak,
    isSpeaking,
    isSupported: elevenLabsService.isSupported()
  };
};
