
import React from 'react';
import { formatMessageWithBold, hasAsteriskFormatting } from '@/utils/messageFormatter';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatMessage = ({ message, isUser, timestamp }: ChatMessageProps) => {
  const formattedMessage = !isUser && hasAsteriskFormatting(message) 
    ? formatMessageWithBold(message)
    : message;

  return (
    <div className={`flex gap-4 p-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-green-500 flex items-center justify-center text-white font-bold text-sm">
            🇯🇲
          </div>
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
      </div>
      
      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            U
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
