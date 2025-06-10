
import React from 'react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatMessage = ({ message, isUser, timestamp }: ChatMessageProps) => {
  return (
    <div className={cn(
      "group w-full",
      isUser ? "bg-background" : "bg-muted/30"
    )}>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            {isUser ? (
              <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium">
                You
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-lg">
                🇯🇲
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {message}
            </div>
            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-muted-foreground">
                {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
