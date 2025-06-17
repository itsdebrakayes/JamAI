
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Props interface for the TypingMessage component
 * Defines all the data and callbacks needed for the typing animation
 */
interface TypingMessageProps {
  fullMessage: string;    // Complete message text to be typed out
  isUser: boolean;       // Whether this message is from user (true) or AI (false)
  timestamp: Date;       // When the message was created
  onComplete: () => void; // Callback function when typing animation finishes
}

/**
 * TypingMessage Component - Optimized for smooth performance
 */
const TypingMessage = ({ fullMessage, isUser, timestamp, onComplete }: TypingMessageProps) => {
  // ============================
  // STATE MANAGEMENT
  // ============================
  
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const { toast } = useToast();
  const messageRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastScrollTime = useRef<number>(0);

  // ============================
  // OPTIMIZED TYPING ANIMATION
  // ============================
  
  const scrollToMessage = useCallback(() => {
    const now = Date.now();
    // Throttle scrolling to every 100ms to reduce stuttering
    if (now - lastScrollTime.current > 100 && messageRef.current) {
      messageRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end'
      });
      lastScrollTime.current = now;
    }
  }, []);

  useEffect(() => {
    // User messages don't need typing animation
    if (isUser) {
      setDisplayedMessage(fullMessage);
      setIsComplete(true);
      onComplete();
      return;
    }

    let currentIndex = 0;
    const typingSpeed = 20;

    const typeMessage = () => {
      if (currentIndex < fullMessage.length) {
        // Batch character updates for smoother performance
        const batchSize = Math.random() > 0.7 ? 2 : 1; // Occasionally type 2 chars
        const nextIndex = Math.min(currentIndex + batchSize, fullMessage.length);
        
        setDisplayedMessage(fullMessage.slice(0, nextIndex));
        currentIndex = nextIndex;
        
        // Use requestAnimationFrame for smoother scrolling
        if (currentIndex % 5 === 0) { // Scroll every 5 characters
          requestAnimationFrame(scrollToMessage);
        }
        
        animationRef.current = requestAnimationFrame(() => {
          setTimeout(typeMessage, typingSpeed);
        });
      } else {
        setIsComplete(true);
        onComplete();
      }
    };

    const initialDelay = setTimeout(() => {
      typeMessage();
    }, 500);
    
    return () => {
      clearTimeout(initialDelay);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [fullMessage, isUser, onComplete, scrollToMessage]);

  // ============================
  // COPY FUNCTIONALITY
  // ============================
  
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullMessage);
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
  }, [fullMessage, toast]);

  // ============================
  // RENDER
  // ============================
  
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
            <div 
              ref={messageRef}
              className={cn(
                "text-foreground leading-relaxed whitespace-pre-wrap text-base p-4 rounded-2xl relative group/message will-change-transform",
                isUser 
                  ? "bg-gradient-to-r from-secondary to-accent text-secondary-foreground modern-shadow ml-auto" 
                  : "bg-card/60 backdrop-blur-sm border border-secondary/20"
              )}
            >
              {displayedMessage}
              
              {!isComplete && !isUser && (
                <span className="inline-block w-2 h-5 bg-secondary ml-1 animate-pulse will-change-opacity"></span>
              )}
              
              {!isUser && isComplete && (
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
            
            {isComplete && (
              <div className={cn(
                "mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                isUser ? "text-right" : "text-left"
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

export default TypingMessage;
