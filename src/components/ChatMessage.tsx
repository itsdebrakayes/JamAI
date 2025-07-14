
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatMessageWithBold, hasMarkdownFormatting } from '@/utils/messageFormatter';
import MessageActions from './MessageActions';
import FileDisplay from './FileDisplay';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  messageId?: string;
  onFeedback?: (messageId: string, isPositive: boolean) => void;
}

const ChatMessage = ({ message, isUser, timestamp, messageId, onFeedback }: ChatMessageProps) => {
  // Check if the message contains markdown formatting
  const hasMarkdown = !isUser && hasMarkdownFormatting(message);
  
  // Ensure timestamp is a Date object
  const dateTimestamp = timestamp instanceof Date ? timestamp : new Date(timestamp);

  // Parse file upload messages
  const parseFileMessage = (msg: string) => {
    const fileUploadRegex = /📎 Uploaded (\d+) file\(s\): (.+?)\n\n(.+)/s;
    const match = msg.match(fileUploadRegex);
    
    if (match) {
      const [, count, fileNames, actualMessage] = match;
      const files = fileNames.split(', ').map(name => ({
        name: name.trim(),
        type: name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 
              name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? 'image/' + name.split('.').pop() :
              'application/octet-stream'
      }));
      return { files, message: actualMessage };
    }
    
    return { files: [], message: msg };
  };

  const { files, message: displayMessage } = parseFileMessage(message);

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
        {/* Display files if present */}
        {files.length > 0 && (
          <div className="mb-3">
            <FileDisplay files={files} />
          </div>
        )}
        
        <div className={`rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white ml-auto' 
            : 'bg-muted text-foreground'
        }`}>
          <div className="break-words">
            {hasMarkdown ? (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom styling for markdown elements
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-bold mb-2">{children}</h3>,
                  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children, className }) => {
                    const isInline = !className;
                    if (isInline) {
                      return <code className="bg-muted/50 px-1 py-0.5 rounded text-sm font-mono">{children}</code>;
                    }
                    return <code className={className}>{children}</code>;
                  },
                  pre: ({ children }) => (
                    <pre className="bg-muted/50 p-3 rounded-lg overflow-x-auto my-2 text-sm">
                      {children}
                    </pre>
                  ),
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="ml-2">{children}</li>,
                  a: ({ children, href }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline"
                    >
                      {children}
                    </a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary/30 pl-4 italic my-2">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {displayMessage}
              </ReactMarkdown>
            ) : (
              <div className="whitespace-pre-wrap">{displayMessage}</div>
            )}
          </div>
        </div>
        <div className={`text-xs text-muted-foreground mt-1 ${
          isUser ? 'text-right' : 'text-left'
        }`}>
          {dateTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
