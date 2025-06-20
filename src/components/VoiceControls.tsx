
import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useElevenLabsSpeech } from '@/hooks/useElevenLabsSpeech';

interface VoiceControlsProps {
  onTranscriptReady: (transcript: string) => void;
  lastMessage?: string;
  disabled?: boolean;
}

const VoiceControls = ({ onTranscriptReady, lastMessage, disabled }: VoiceControlsProps) => {
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: speechRecognitionSupported,
    error: speechError
  } = useSpeechRecognition();

  const {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported: speechSynthesisSupported
  } = useElevenLabsSpeech();

  // Handle transcript completion
  React.useEffect(() => {
    if (transcript && !isListening) {
      const finalTranscript = transcript.trim();
      if (finalTranscript) {
        onTranscriptReady(finalTranscript);
        resetTranscript();
      }
    }
  }, [transcript, isListening, onTranscriptReady, resetTranscript]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSpeakClick = async () => {
    if (!isSpeaking && !isPaused && lastMessage) {
      await speak(lastMessage);
    }
  };

  const handlePauseResumeClick = () => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  const handleStopClick = () => {
    stop();
  };

  // Detect if user is on iOS/Mac
  const isAppleDevice = /iPad|iPhone|iPod|Mac/.test(navigator.userAgent);

  if (!speechRecognitionSupported && !speechSynthesisSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Voice controls">
      {/* Speech Recognition Controls */}
      {speechRecognitionSupported && (
        <Button
          onClick={handleMicClick}
          disabled={disabled}
          variant={isListening ? "default" : "ghost"}
          size="sm"
          className={`h-9 w-9 p-0 transition-all duration-200 ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
              : 'hover:bg-muted'
          }`}
          aria-label={isListening ? 'Stop recording voice input' : 'Start voice input'}
          aria-pressed={isListening}
        >
          {isListening ? (
            <MicOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Mic className="w-4 h-4" aria-hidden="true" />
          )}
        </Button>
      )}

      {/* Show message for unsupported devices */}
      {!speechRecognitionSupported && isAppleDevice && (
        <div 
          className="text-xs text-muted-foreground max-w-40 truncate"
          role="status"
        >
          Voice input not available on this device
        </div>
      )}

      {/* Current transcript display */}
      {isListening && transcript && (
        <div 
          className="text-xs text-muted-foreground max-w-32 truncate"
          aria-live="polite"
          aria-label={`Current transcript: ${transcript}`}
        >
          "{transcript}"
        </div>
      )}

      {/* Speech error display */}
      {speechError && (
        <div 
          className="text-xs text-red-500 max-w-32 truncate"
          role="alert"
          aria-live="assertive"
        >
          {speechError}
        </div>
      )}

      {/* Text-to-Speech Controls */}
      {speechSynthesisSupported && lastMessage && (
        <div className="flex items-center gap-1" role="group" aria-label="Audio playback controls">
          {/* Show volume icon when not speaking */}
          {!isSpeaking && !isPaused && (
            <Button
              onClick={handleSpeakClick}
              disabled={disabled || !lastMessage}
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 hover:bg-muted transition-all duration-200"
              aria-label="Read last message aloud"
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
          
          {/* Show controls when speaking or paused */}
          {(isSpeaking || isPaused) && (
            <>
              <Button
                onClick={handleStopClick}
                disabled={disabled}
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 hover:bg-muted transition-all duration-200"
                aria-label="Stop audio playback"
              >
                <VolumeX className="w-4 h-4" aria-hidden="true" />
              </Button>
              
              <Button
                onClick={handlePauseResumeClick}
                disabled={disabled}
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 hover:bg-muted transition-all duration-200"
                aria-label={isPaused ? 'Resume audio playback' : 'Pause audio playback'}
                aria-pressed={!isPaused}
              >
                {isPaused ? (
                  <Play className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Pause className="w-4 h-4" aria-hidden="true" />
                )}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceControls;
