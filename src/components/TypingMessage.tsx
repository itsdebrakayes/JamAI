import React, { useState, useEffect, useRef } from 'react';
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
 * TypingMessage Component
 * 
 * This component creates a typewriter effect for AI responses, making the chat
 * feel more natural and engaging. User messages appear instantly, while AI
 * messages are typed out character by character with smooth scrolling.
 * 
 * Features:
 * - Typewriter animation for AI messages
 * - Instant display for user messages
 * - Copy functionality for completed AI messages
 * - Smooth auto-scrolling during typing
 * - Visual typing cursor during animation
 */
const TypingMessage = ({ fullMessage, isUser, timestamp, onComplete }: TypingMessageProps) => {
  // ============================
  // STATE MANAGEMENT
  // ============================
  
  /**
   * The portion of the message currently displayed
   * Starts empty and grows as typing animation progresses
   */
  const [displayedMessage, setDisplayedMessage] = useState('');
  
  /**
   * Whether the typing animation has finished
   * Used to show copy button and timestamp
   */
  const [isComplete, setIsComplete] = useState(false);
  
  /**
   * Tracks if copy button was recently clicked (for visual feedback)
   * Automatically resets after 2 seconds
   */
  const [copied, setCopied] = useState(false);
  
  /**
   * Toast notification hook for user feedback
   */
  const { toast } = useToast();
  
  /**
   * Reference to the message container for auto-scrolling
   * Keeps the growing message visible as it types
   */
  const messageRef = useRef<HTMLDivElement>(null);

  // ============================
  // TYPING ANIMATION LOGIC
  // ============================
  
  /**
   * Main effect that handles the typing animation
   * User messages appear instantly, AI messages type out gradually
   */
  useEffect(() => {
    // User messages don't need typing animation - show immediately
    if (isUser) {
      setDisplayedMessage(fullMessage);
      setIsComplete(true);
      onComplete();
      return;
    }

    // AI message typing animation setup
    let currentIndex = 0;
    const typingSpeed = 20; // Milliseconds between each character (adjust for speed)

    /**
     * Recursive function that adds one character at a time
     * Creates the typewriter effect by gradually revealing the message
     */
    const typeMessage = () => {
      if (currentIndex < fullMessage.length) {
        // Add next character to displayed message
        setDisplayedMessage(fullMessage.slice(0, currentIndex + 1));
        currentIndex++;
        
        // Smooth scroll to keep the growing message in view
        // This ensures users can always see the text being typed
        if (messageRef.current) {
          messageRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'end'  // Scroll to bottom of the message
          });
        }
        
        // Schedule next character after typing delay
        setTimeout(typeMessage, typingSpeed);
      } else {
        // Animation complete - show final state
        setIsComplete(true);
        onComplete(); // Notify parent component
      }
    };

    // Start typing animation after brief initial delay
    // This gives a natural pause before AI starts "typing"
    const initialDelay = setTimeout(typeMessage, 500);
    
    // Cleanup function to prevent memory leaks
    return () => clearTimeout(initialDelay);
  }, [fullMessage, isUser, onComplete]);

  // ============================
  // COPY FUNCTIONALITY
  // ============================
  
  /**
   * Handles copying message text to clipboard
   * Provides visual feedback and shows toast notifications
   */
  const handleCopy = async () => {
    try {
      // Use modern clipboard API to copy full message text
      await navigator.clipboard.writeText(fullMessage);
      setCopied(true); // Show success state on copy button
      
      // Show success toast notification
      toast({
        description: "Message copied to clipboard",
        duration: 2000,
      });
      
      // Reset copy button state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Handle copy failures (permissions, old browsers, etc.)
      console.error('Failed to copy:', error);
      toast({
        description: "Failed to copy message",
        variant: "destructive", // Red/error styling
        duration: 2000,
      });
    }
  };

  // ============================
  // RENDER
  // ============================
  
  return (
    <div className={cn(
      "group w-full",
      // Different background for AI vs user messages
      isUser ? "bg-transparent" : "bg-muted/20"
    )}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className={cn(
          "flex gap-4",
          // User messages align right, AI messages align left
          isUser ? "justify-end" : "justify-start"
        )}>
          {/* AI avatar - only shown for AI messages */}
          {!isUser && (
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-accent text-secondary-foreground flex items-center justify-center text-lg font-medium modern-shadow">
                🇯🇲
              </div>
            </div>
          )}
          
          {/* Main message content area */}
          <div className={cn(
            "min-w-0 max-w-[80%] relative",
            isUser ? "order-1" : "order-2"
          )}>
            <div 
              ref={messageRef}
              className={cn(
                "text-foreground leading-relaxed whitespace-pre-wrap text-base p-4 rounded-2xl relative group/message",
                isUser 
                  ? "bg-gradient-to-r from-secondary to-accent text-secondary-foreground modern-shadow ml-auto" 
                  : "bg-card/60 backdrop-blur-sm border border-secondary/20"
              )}
            >
              {/* The actual message text being displayed */}
              {displayedMessage}
              
              {/* Animated typing cursor - only shown during AI typing */}
              {!isComplete && !isUser && (
                <span className="inline-block w-2 h-5 bg-secondary ml-1 animate-pulse"></span>
              )}
              
              {/* Copy button - only shown for completed AI messages on hover */}
              {!isUser && isComplete && (
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 opacity-0 group-hover/message:opacity-100 transition-opacity duration-200 p-1.5 rounded-lg bg-background/80 hover:bg-background border border-border/50 hover:border-border"
                  title="Copy message"
                >
                  {copied ? (
                    // Success state - green checkmark
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    // Default state - copy icon
                    <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              )}
            </div>
            
            {/* Timestamp - only shown when typing is complete and on hover */}
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
          
          {/* User avatar - only shown for user messages */}
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
