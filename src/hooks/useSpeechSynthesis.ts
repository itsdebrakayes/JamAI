
import { useState, useEffect, useRef } from 'react';

interface SpeechSynthesisHook {
  speak: (text: string, options?: SpeechSynthesisOptions) => void;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
}

interface SpeechSynthesisOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export const useSpeechSynthesis = (): SpeechSynthesisHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      console.log('Available voices:', availableVoices.length);
    };

    // Load voices immediately
    loadVoices();
    
    // Also load when voices change (some browsers load them asynchronously)
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isSupported]);

  const speak = (text: string, options: SpeechSynthesisOptions = {}) => {
    if (!isSupported || !text.trim()) {
      console.log('Speech synthesis not supported or empty text');
      return;
    }

    console.log('Starting speech synthesis for:', text.substring(0, 50) + '...');

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Set options with defaults
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    // Try to find a suitable voice
    if (options.voice) {
      utterance.voice = options.voice;
    } else if (voices.length > 0) {
      // Try to find an English voice
      const englishVoice = voices.find(voice => 
        voice.lang.startsWith('en-') && voice.localService
      ) || voices.find(voice => 
        voice.lang.startsWith('en-')
      ) || voices[0];
      
      utterance.voice = englishVoice;
      console.log('Selected voice:', englishVoice?.name, englishVoice?.lang);
    }

    // Event handlers
    utterance.onstart = () => {
      console.log('Speech started');
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      console.log('Speech ended');
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onpause = () => {
      console.log('Speech paused');
      setIsPaused(true);
    };

    utterance.onresume = () => {
      console.log('Speech resumed');
      setIsPaused(false);
    };

    try {
      speechSynthesis.speak(utterance);
      console.log('Speech synthesis command sent');
    } catch (error) {
      console.error('Error starting speech synthesis:', error);
    }
  };

  const cancel = () => {
    if (isSupported) {
      console.log('Cancelling speech');
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  const pause = () => {
    if (isSupported && isSpeaking && !isPaused) {
      console.log('Pausing speech');
      speechSynthesis.pause();
    }
  };

  const resume = () => {
    if (isSupported && isPaused) {
      console.log('Resuming speech');
      speechSynthesis.resume();
    }
  };

  return {
    speak,
    cancel,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    voices
  };
};
