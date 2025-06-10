
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

  const initializeChat = () => {
    const initialMessage: Message = {
      id: '1',
      text: getPatoisGreeting(),
      isUser: false,
      timestamp: new Date()
    };
    setMessages([initialMessage]);
    setShowSuggestions(true);
    setIsTyping(false);
  };

  useEffect(() => {
    // Send initial greeting
    initializeChat();
  }, []);

  const handleNewChat = () => {
    initializeChat();
  };

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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex flex-col">
      {/* Modern Header with Jamaican flag colors */}
      <header className="glass-effect sticky top-0 z-50 border-b border-border/30">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center">
            <button 
              onClick={handleNewChat}
              className="flex items-center gap-3 hover:scale-105 transition-transform duration-200 cursor-pointer"
            >
              <div className="relative">
                <span className="text-3xl filter drop-shadow-sm">🇯🇲</span>
                <div className="absolute inset-0 bg-gradient-to-r from-jamaican-gold/20 to-jamaican-green/20 rounded-full blur-xl"></div>
              </div>
              <h1 className="text-xl font-semibold jamaican-text-gradient">
                JamAI Chat
              </h1>
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Welcome area with suggestions */}
        {showSuggestions && messages.length === 1 && (
          <div className="flex-1 flex flex-col justify-center px-6 pb-8 pt-12">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6 relative">
                <div className="relative">
                  <span className="text-7xl filter drop-shadow-lg">🇯🇲</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-jamaican-gold/30 to-jamaican-green/30 rounded-full blur-2xl scale-150"></div>
                </div>
              </div>
              <button 
                onClick={handleNewChat}
                className="text-6xl font-bold jamaican-text-gradient mb-6 tracking-tight hover:scale-105 transition-transform duration-200 cursor-pointer"
              >
                JamAI
              </button>
              <p className="text-muted-foreground text-lg">
                Chat with me in Jamaican Patois!
              </p>
            </div>
            
            {/* Suggestions above greeting */}
            <div className="mb-8">
              <ChatSuggestions onSuggestionClick={handleSuggestionClick} />
            </div>
            
            {/* AI Greeting */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-6 modern-shadow border border-secondary/20">
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-accent text-secondary-foreground flex items-center justify-center text-lg font-medium modern-shadow">
                      🇯🇲
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-foreground leading-relaxed">
                      {messages[0]?.text}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 px-6">
          {/* Show messages only if suggestions are hidden or there are more messages */}
          {(!showSuggestions || messages.length > 1) && (
            <div className="space-y-6 py-6">
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

        {/* Modern Input area */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
            <p className="text-xs text-muted-foreground text-center mt-3 opacity-70">
              JamAI can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
