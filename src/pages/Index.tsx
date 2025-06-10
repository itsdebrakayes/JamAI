
import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import ChatSuggestions from '@/components/ChatSuggestions';
import TypingIndicator from '@/components/TypingIndicator';
import { generatePatoisResponse, getPatoisGreeting } from '@/utils/patoisResponses';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Send initial greeting
    const initialMessage: Message = {
      id: '1',
      text: getPatoisGreeting(),
      isUser: false,
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  }, []);

  const handleSendMessage = async (messageText: string) => {
    // Hide suggestions after first message
    setShowSuggestions(false);
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generatePatoisResponse(messageText),
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  const handleSuggestionClick = (suggestionText: string) => {
    handleSendMessage(suggestionText);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - more ChatGPT-like */}
      <header className="bg-background border-b border-border/20 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇯🇲</span>
              <h1 className="text-lg font-medium text-foreground">
                JamAI Chat
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
        {/* Welcome area with suggestions */}
        {showSuggestions && messages.length === 1 && (
          <div className="flex-1 flex flex-col justify-center px-4 pb-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <span className="text-6xl">🇯🇲</span>
              </div>
              <h2 className="text-2xl font-medium text-foreground mb-2">
                How can I help you today?
              </h2>
              <p className="text-muted-foreground">
                Chat with me in Jamaican Patois!
              </p>
            </div>
            <ChatSuggestions onSuggestionClick={handleSuggestionClick} />
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 px-4">
          {/* Show greeting only if suggestions are hidden or there are more messages */}
          {(!showSuggestions || messages.length > 1) && (
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message.text}
                  isUser={message.isUser}
                  timestamp={message.timestamp}
                />
              ))}
              {isTyping && <TypingIndicator />}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area - ChatGPT style */}
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
            <p className="text-xs text-muted-foreground text-center mt-2">
              JamAI can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
