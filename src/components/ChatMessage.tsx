
import React from 'react';
import { formatMessageWithBold, hasAsteriskFormatting } from '@/utils/messageFormatter';
import MessageActions from './MessageActions';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  messageId?: string;
  onFeedback?: (messageId: string, isPositive: boolean) => void;
}

const ChatMessage = ({ message, isUser, timestamp, messageId, onFeedback }: ChatMessageProps) => {
  const formattedMessage = !isUser && hasAsteriskFormatting(message) 
    ? formatMessageWithBold(message)
    : message;

  return (
    <div className={`flex gap-4 p-4 group ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0">
          <img 
            src="/lovable-uploads/f7360586-ff1c-4d5e-b846-feaceed45e61.png" 
            alt="JamAI Logo" 
            className="w-8 h-8 object-contain rounded-full"
          />
        </div>
      )}
      
      <div className={`max-w-[80%] ${isUser ? 'order-1' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white ml-auto' 
            : 'bg-muted text-foreground'
        }`}>
          <div className="whitespace-pre-wrap break-words">
            {formattedMessage}
          </div>
        </div>
        <div className={`text-xs text-muted-foreground mt-1 ${
          isUser ? 'text-right' : 'text-left'
        }`}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        
        {/* Add action buttons for AI messages */}
        {!isUser && messageId && onFeedback && (
          <MessageActions
            messageId={messageId}
            messageContent={message}
            onFeedback={onFeedback}
          />
        )}
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 order-2">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-bold text-xs">
            YOU
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
