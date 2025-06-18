
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import SpeakButton from './SpeakButton';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatMessage = ({ message, isUser, timestamp }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast({
        description: "Message copied to clipboard",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        description: "Failed to copy message",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  return (
    <div className={cn(
      "group w-full",
      isUser ? "bg-transparent" : "bg-muted/20"
    )}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className={cn(
          "flex gap-4",
          isUser ? "justify-end" : "justify-start"
        )}>
          {!isUser && (
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-accent text-secondary-foreground flex items-center justify-center text-lg font-medium modern-shadow">
                🇯🇲
              </div>
            </div>
          )}
          <div className={cn(
            "min-w-0 max-w-[80%] relative",
            isUser ? "order-1" : "order-2"
          )}>
            <div className={cn(
              "text-foreground leading-relaxed whitespace-pre-wrap text-base p-4 rounded-2xl relative group/message",
              isUser 
                ? "bg-gradient-to-r from-secondary to-accent text-secondary-foreground modern-shadow ml-auto" 
                : "bg-card/60 backdrop-blur-sm border border-secondary/20"
            )}>
              {message}
              
              {/* Copy button - only show for AI messages */}
              {!isUser && (
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 opacity-0 group-hover/message:opacity-100 transition-opacity duration-200 p-1.5 rounded-lg bg-background/80 hover:bg-background border border-border/50 hover:border-border"
                  title="Copy message"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              )}
            </div>

            {/* Speaker button for AI messages - positioned like ChatGPT */}
            {!isUser && (
              <div className="flex items-center justify-between mt-2">
                <div className={cn(
                  "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                )}>
                  <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
                    {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <SpeakButton text={message} />
                </div>
              </div>
            )}

            {/* Timestamp for user messages */}
            {isUser && (
              <div className={cn(
                "mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-right"
              )}>
                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
                  {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
          {isUser && (
            <div className="flex-shrink-0 order-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-foreground to-foreground/80 text-background flex items-center justify-center text-sm font-semibold modern-shadow">
                You
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
