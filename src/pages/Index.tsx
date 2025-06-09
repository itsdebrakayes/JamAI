
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
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
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 rounded-full jamaican-gradient">
              <MessageCircle className="w-5 h-5 text-jamaican-black" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-semibold jamaican-text-gradient">
                JamAI Chat
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 max-w-3xl mx-auto w-full flex flex-col">
        {/* Suggestions - shown at top when no user messages yet */}
        {showSuggestions && messages.length === 1 && (
          <div className="pt-8 pb-4">
            <ChatSuggestions onSuggestionClick={handleSuggestionClick} />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.text}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          ))}
          {isTyping && <TypingIndicator />}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4">
          <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
        </div>
      </div>
    </div>
  );
};

export default Index;
