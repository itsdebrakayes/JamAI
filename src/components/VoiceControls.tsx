
import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, Pause, Play } from 'lucide-react';
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

  const handleSpeakClick = () => {
    if (isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else if (lastMessage) {
      speak(lastMessage);
    }
  };

  const handleStopSpeaking = () => {
    cancel();
  };

  if (!speechRecognitionSupported && !speechSynthesisSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
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
          title={isListening ? 'Stop recording' : 'Start voice input'}
        >
          {isListening ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </Button>
      )}

      {/* Current transcript display */}
      {isListening && transcript && (
        <div className="text-xs text-muted-foreground max-w-32 truncate">
          "{transcript}"
        </div>
      )}

      {/* Speech error display */}
      {speechError && (
        <div className="text-xs text-red-500 max-w-32 truncate">
          {speechError}
        </div>
      )}

      {/* Text-to-Speech Controls */}
      {speechSynthesisSupported && lastMessage && (
        <>
          <Button
            onClick={handleSpeakClick}
            disabled={disabled || !lastMessage}
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 hover:bg-muted transition-all duration-200"
            title={
              isSpeaking 
                ? (isPaused ? 'Resume speaking' : 'Pause speaking')
                : 'Read message aloud'
            }
          >
            {isSpeaking ? (
              isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>

          {isSpeaking && (
            <Button
              onClick={handleStopSpeaking}
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 hover:bg-muted transition-all duration-200"
              title="Stop speaking"
            >
              <VolumeX className="w-4 h-4" />
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default VoiceControls;
