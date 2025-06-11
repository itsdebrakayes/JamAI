
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
        <div className={cn(
          "flex gap-4",
          isUser ? "justify-end" : "justify-start"
        )}>
          {!isUser && (
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-accent text-secondary-foreground flex items-center justify-center text-lg font-medium modern-shadow">
                🇯🇦
              </div>
            </div>
          )}
          <div className={cn(
            "min-w-0 max-w-[80%]",
            isUser ? "order-1" : "order-2"
          )}>
            <div className={cn(
              "text-foreground leading-relaxed whitespace-pre-wrap text-base p-4 rounded-2xl",
              isUser 
                ? "bg-gradient-to-r from-secondary to-accent text-secondary-foreground modern-shadow ml-auto" 
                : "bg-card/60 backdrop-blur-sm border border-secondary/20"
            )}>
              {message}
            </div>
            <div className={cn(
              "mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
              isUser ? "text-right" : "text-left"
            )}>
              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
                {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
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
