import React, { useState } from 'react';
import { Copy, Volume2, Share2, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MessageActionsProps {
  messageId: string;
  messageContent: string;
  onFeedback: (messageId: string, isPositive: boolean) => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({ 
  messageId, 
  messageContent, 
  onFeedback 
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      toast({
        description: "Message copied to clipboard",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        description: "Failed to copy message",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const handleReadAloud = async () => {
    if (isPlaying) {
      // Stop current audio
      speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    try {
      setIsPlaying(true);
      
      // Try ElevenLabs first for better quality
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: messageContent,
          voice: 'Aria' // Using a nice voice for Jamaican content
        }
      });

      if (!error && data?.audioContent) {
        // Play the ElevenLabs audio
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          fallbackToWebSpeech();
        };
        await audio.play();
      } else {
        // Fallback to Web Speech API
        fallbackToWebSpeech();
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
      fallbackToWebSpeech();
    }
  };

  const fallbackToWebSpeech = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(messageContent);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      // Try to find a voice that works well with Jamaican content
      const voices = speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Female')
      ) || voices.find(voice => voice.lang.startsWith('en'));
      
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      speechSynthesis.speak(utterance);
    } else {
      setIsPlaying(false);
      toast({
        description: "Text-to-speech not supported in this browser",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'JamAI Response',
      text: messageContent,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying link
        await navigator.clipboard.writeText(`${messageContent}\n\n- From JamAI: ${window.location.href}`);
        toast({
          description: "Response copied to clipboard for sharing",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({
        description: "Failed to share message",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const handleFeedback = (isPositive: boolean) => {
    const newFeedback = isPositive ? 'positive' : 'negative';
    setFeedback(newFeedback);
    onFeedback(messageId, isPositive);
    
    toast({
      description: isPositive 
        ? "Thanks! This helps me provide better responses." 
        : "Thanks for the feedback! I'll try to improve.",
      duration: 3000,
    });
  };

  return (
    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      {/* Copy Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-8 w-8 p-0 hover:bg-muted"
        title="Copy message"
      >
        {copied ? (
          <Check className="w-3 h-3 text-green-600" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </Button>

      {/* Read Aloud Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReadAloud}
        className={`h-8 w-8 p-0 hover:bg-muted ${isPlaying ? 'bg-muted' : ''}`}
        title={isPlaying ? "Stop reading" : "Read aloud"}
      >
        <Volume2 className={`w-3 h-3 ${isPlaying ? 'text-primary animate-pulse' : ''}`} />
      </Button>

      {/* Share Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        className="h-8 w-8 p-0 hover:bg-muted"
        title="Share response"
      >
        <Share2 className="w-3 h-3" />
      </Button>

      {/* Feedback Buttons */}
      <div className="flex items-center gap-1 ml-1 border-l pl-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback(true)}
          className={`h-8 w-8 p-0 hover:bg-muted ${
            feedback === 'positive' ? 'bg-green-100 text-green-600' : ''
          }`}
          title="Good response"
        >
          <ThumbsUp className="w-3 h-3" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback(false)}
          className={`h-8 w-8 p-0 hover:bg-muted ${
            feedback === 'negative' ? 'bg-red-100 text-red-600' : ''
          }`}
          title="Could be better"
        >
          <ThumbsDown className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default MessageActions;