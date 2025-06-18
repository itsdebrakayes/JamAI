
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
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  const speak = (text: string, options: SpeechSynthesisOptions = {}) => {
    if (!isSupported || !text.trim()) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Set options
    utterance.voice = options.voice || null;
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    speechSynthesis.speak(utterance);
  };

  const cancel = () => {
    if (isSupported) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  const pause = () => {
    if (isSupported && isSpeaking) {
      speechSynthesis.pause();
    }
  };

  const resume = () => {
    if (isSupported && isPaused) {
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
