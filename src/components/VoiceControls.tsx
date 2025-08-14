
import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, Pause, Play, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

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
    cancel,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported: speechSynthesisSupported
  } = useSpeechSynthesis();

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
      console.log('🎤 VoiceControls: Starting speech for message:', lastMessage.substring(0, 50));
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
    cancel();
  };

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
          className="text-xs text-red-500 max-w-32 truncate flex items-center gap-1"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-3 h-3" />
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
