
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
      isUser ? "bg-transparent" : "bg-muted/20"
    )}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            {isUser ? (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-foreground to-foreground/80 text-background flex items-center justify-center text-sm font-semibold modern-shadow">
                You
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-accent text-secondary-foreground flex items-center justify-center text-lg font-medium modern-shadow">
                🇯🇲
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-foreground leading-relaxed whitespace-pre-wrap text-base">
              {message}
            </div>
            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
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
