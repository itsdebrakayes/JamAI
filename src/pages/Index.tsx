
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
    <div className="min-h-screen bg-gradient-to-br from-muted to-background flex flex-col">
      {/* Header */}
      <header className="bg-card shadow-lg border-b-2 border-primary">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 rounded-full jamaican-gradient">
              <MessageCircle className="w-6 h-6 text-jamaican-black" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold jamaican-text-gradient">
                JamAI Chat
              </h1>
              <p className="text-sm text-muted-foreground">
                Yuh AI assistant wid di Jamaican vibes
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.text}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          ))}
          {isTyping && <TypingIndicator />}
          
          {/* Show suggestions only when no user messages yet */}
          {showSuggestions && messages.length === 1 && (
            <ChatSuggestions onSuggestionClick={handleSuggestionClick} />
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>

      {/* Footer */}
      <footer className="bg-card border-t py-4">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Built with love and irie vibes 🇯🇲
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
