
/**
 * ChatMessage Component
 * 
 * This component displays individual chat messages in the conversation.
 * It handles both user messages and AI responses with different styling.
 * 
 * Features:
 * - Markdown rendering for AI responses
 * - File display parsing and rendering
 * - Timestamp display
 * - Message actions (copy, feedback)
 * - Different styling for user vs AI messages
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatMessageWithBold, hasMarkdownFormatting } from '@/utils/messageFormatter';
import MessageActions from './MessageActions';
import FileDisplay from './FileDisplay';

// Define the props this component expects
interface ChatMessageProps {
  message: string;                                                      // The message content
  isUser: boolean;                                                      // Whether this is a user message or AI response
  timestamp: Date;                                                      // When the message was sent
  messageId?: string;                                                   // Unique identifier for the message
  onFeedback?: (messageId: string, isPositive: boolean) => void;       // Callback for user feedback on AI messages
}

/**
 * ChatMessage Component
 * 
 * Renders a single message in the chat conversation with appropriate styling and features.
 */
const ChatMessage = ({ message, isUser, timestamp, messageId, onFeedback }: ChatMessageProps) => {
  // Check if the AI message contains markdown formatting for proper rendering
  const hasMarkdown = !isUser && hasMarkdownFormatting(message);
  
  // Ensure timestamp is a proper Date object (defensive programming)
  const dateTimestamp = timestamp instanceof Date ? timestamp : new Date(timestamp);

  /**
   * Parses file upload messages to extract file information and actual message content
   * @param msg - The raw message string
   * @returns Object containing files array and the actual message content
   */
  const parseFileMessage = (msg: string) => {
    // Regular expression to match file upload format: "📎 Uploaded X file(s): filename1, filename2\n\nActual message"
    const fileUploadRegex = /📎 Uploaded (\d+) file\(s\): (.+?)\n\n(.+)/s;
    const match = msg.match(fileUploadRegex);
    
    if (match) {
      const [, count, fileNames, actualMessage] = match;
      
      // Convert file names string into structured file objects
      const files = fileNames.split(', ').map(name => ({
        name: name.trim(),
        type: name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 
              name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? 'image/' + name.split('.').pop() :
              'application/octet-stream' // Default for unknown file types
      }));
      
      return { files, message: actualMessage };
    }
    
    // If no file upload pattern found, return empty files array and original message
    return { files: [], message: msg };
  };

  // Parse the message to extract any file information
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
