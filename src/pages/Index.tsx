import React, { useState, useRef, useEffect } from 'react';
import { Menu } from 'lucide-react';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import ChatSuggestions from '@/components/ChatSuggestions';
import TypingIndicator from '@/components/TypingIndicator';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import { generatePatoisResponse, getPatoisGreeting } from '@/utils/patoisResponses';
import { Button } from '@/components/ui/button';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('jamAI-chat-history');
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory).map((chat: any) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      setChatHistory(parsedHistory);
    }
  }, []);

  // Save current chat to history
  const saveCurrentChatToHistory = () => {
    if (messages.length > 1 && currentChatId) {
      const chatToSave: ChatHistory = {
        id: currentChatId,
        title: messages.find(m => m.isUser)?.text.slice(0, 50) + '...' || 'New Chat',
        messages: messages,
        createdAt: new Date()
      };

      const updatedHistory = chatHistory.filter(chat => chat.id !== currentChatId);
      updatedHistory.unshift(chatToSave);
      
      // Keep only last 20 chats
      const limitedHistory = updatedHistory.slice(0, 20);
      setChatHistory(limitedHistory);
      localStorage.setItem('jamAI-chat-history', JSON.stringify(limitedHistory));
    }
  };

  const initializeChat = () => {
    // Save current chat before starting new one
    if (messages.length > 1) {
      saveCurrentChatToHistory();
    }

    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);

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

  const loadChatFromHistory = (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages);
      setShowSuggestions(false);
      setIsTyping(false);
    }
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

  // Save chat when messages change (except initial load)
  useEffect(() => {
    if (messages.length > 1 && currentChatId) {
      // Debounce saving to avoid too frequent saves
      const timeoutId = setTimeout(() => {
        saveCurrentChatToHistory();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [messages]);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex w-full">
        <ChatHistorySidebar
          chatHistory={chatHistory}
          currentChatId={currentChatId}
          onNewChat={handleNewChat}
          onLoadChat={loadChatFromHistory}
        />
        
        <SidebarInset className="flex-1">
          <div className="flex flex-col min-h-screen">
            {/* Modern Header with mobile menu */}
            <header className="glass-effect sticky top-0 z-50 border-b border-border/30">
              <div className="max-w-4xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger className="md:hidden" />
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
                  
                  {/* AI Greeting - Left aligned */}
                  <div className="max-w-2xl">
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
