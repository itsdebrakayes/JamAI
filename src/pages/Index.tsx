
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import ChatSummary from '@/components/ChatSummary';
import ThemeToggle from '@/components/ThemeToggle';
import SubscriptionBadge from '@/components/SubscriptionBadge';
import UserProfileSettings from '@/components/UserProfileSettings';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useToast } from "@/hooks/use-toast"
import { MessageSquare, Plus, Settings, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import chatSuggestionsData from '@/data/chatSuggestions.json';

// Define the structure for chat messages
type ChatMessageData = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

// Define the structure for chat history items
type ChatHistory = {
  id: string;
  title: string;
  messages: ChatMessageData[];
  createdAt: Date;
  autoTitle?: string;
  keywords?: string[];
  summary?: string;
};

// Chat suggestions from the JSON data
const CHAT_SUGGESTIONS = chatSuggestionsData.suggestions.slice(0, 6);

const Index = () => {
  // Initialize state variables
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages]);

  // Load chat history from local storage on component mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('chatHistory');
    if (storedHistory) {
      setChatHistory(JSON.parse(storedHistory));
    }
  }, []);

  // Save chat history to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Function to start a new chat
  const startNewChat = () => {
    const newChatId = uuidv4();
    setCurrentChatId(newChatId);
    setMessages([]);
  };

  // Function to load a specific chat from history
  const loadChat = (chatId: string) => {
    const chatToLoad = chatHistory.find((chat) => chat.id === chatId);
    if (chatToLoad) {
      setMessages(chatToLoad.messages);
      setCurrentChatId(chatId);
    }
  };

  // Function to delete specific chats from history
  const deleteChats = (chatIds: string[]) => {
    const updatedHistory = chatHistory.filter((chat) => !chatIds.includes(chat.id));
    setChatHistory(updatedHistory);
    if (chatIds.includes(currentChatId || '')) {
      startNewChat(); // Start a new chat if the current chat is deleted
    }
  };

  // Function to clear all chat history
  const clearAllHistory = () => {
    setChatHistory([]);
    startNewChat();
  };

  // Function to rename a chat
  const renameChat = (chatId: string, newTitle: string) => {
    const updatedHistory = chatHistory.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, title: newTitle };
      }
      return chat;
    });
    setChatHistory(updatedHistory);
  };

  // Core function to handle sending messages
  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim()) return;

    // Add user message to the chat
    const userMessage: ChatMessageData = {
      id: uuidv4(),
      content: messageContent,
      role: 'user',
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    // Set typing indicator to true
    setIsTyping(true);

    try {
      // Simulate AI response (replace with actual API call)
      const aiResponse = await simulateAIResponse(messageContent);

      // Add AI message to the chat
      const aiMessage: ChatMessageData = {
        id: uuidv4(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);

      // Update chat history
      updateChatHistory(userMessage, aiMessage);
    } catch (error: any) {
      console.error('Error processing message:', error);
      toast({
        title: "Uh oh! Something went wrong.",
        description: error.message || "There was a problem processing your request.",
        variant: "destructive",
      })
    } finally {
      // Always set typing indicator to false, even if there's an error
      setIsTyping(false);
    }
  };

  // Enhanced AI response simulation with proper error handling
  const simulateAIResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Handle proverb requests
      if (lowerMessage.includes('proverb') || lowerMessage.includes('saying')) {
        const proverbSuggestion = chatSuggestionsData.suggestions.find(s => s.id === 'proverbs');
        if (proverbSuggestion && proverbSuggestion.responses) {
          const randomResponse = proverbSuggestion.responses[Math.floor(Math.random() * proverbSuggestion.responses.length)];
          return randomResponse;
        }
      }
      
      // Handle weather queries
      if (lowerMessage.includes('weather')) {
        return `🌴 Weather inna Jamaica nice today! Sunny and warm, bout 28°C (82°F). Perfect weather fi go beach or just lime outside. Di trade winds a blow nice breeze too! What else yuh waan know bout Jamaica weather?`;
      }
      
      // Handle food queries
      if (lowerMessage.includes('food') || lowerMessage.includes('eat') || lowerMessage.includes('hungry')) {
        return `Yow! Mi know some nice Jamaican food fi yuh! Try some jerk chicken, rice and peas, curry goat, or ackee and saltfish. All a dem taste real good! Which one yuh waan learn bout?`;
      }
      
      // Handle patois teaching
      if (lowerMessage.includes('patois') || lowerMessage.includes('teach')) {
        return `Big up! Mi ago teach yuh some patois. "Wah gwaan" means "What's going on?" and "Irie" means everything good. "Big up yuself" means respect yuself. Want fi learn more?`;
      }
      
      // Default response
      return `Mi understand seh yu say "${userMessage}" ennit. Dat interesting! Tell mi more bout what yuh waan know, mi here fi help yuh learn bout Jamaica culture and language.`;
      
    } catch (error) {
      console.error('Error in simulateAIResponse:', error);
      throw new Error('Failed to generate response');
    }
  };

  const updateChatHistory = (userMessage: ChatMessageData, aiMessage: ChatMessageData) => {
    setChatHistory((prevHistory) => {
      // Check if there's an existing chat
      const existingChatIndex = prevHistory.findIndex((chat) => chat.id === currentChatId);

      if (existingChatIndex !== -1) {
        // Update existing chat
        const updatedChat = {
          ...prevHistory[existingChatIndex],
          messages: [...prevHistory[existingChatIndex].messages, userMessage, aiMessage],
        };
        const newHistory = [...prevHistory];
        newHistory[existingChatIndex] = updatedChat;
        return newHistory;
      } else {
        // Create new chat
        const newChat: ChatHistory = {
          id: currentChatId || uuidv4(),
          title: `Chat started on ${new Date().toLocaleDateString()}`,
          messages: [userMessage, aiMessage],
          createdAt: new Date(),
        };
        return [...prevHistory, newChat];
      }
    });
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestionText: string) => {
    handleSendMessage(suggestionText);
  };

  // Convert ChatMessageData to Message format for ChatSummary
  const convertToMessages = (chatMessages: ChatMessageData[]) => {
    return chatMessages.map(msg => ({
      id: msg.id,
      text: msg.content,
      isUser: msg.role === 'user',
      timestamp: msg.timestamp
    }));
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
        <ChatHistorySidebar 
          chatHistory={chatHistory} 
          currentChatId={currentChatId}
          onNewChat={startNewChat}
          onLoadChat={loadChat}
          onDeleteChats={deleteChats}
          onClearAllHistory={clearAllHistory}
          onRenameChat={renameChat}
        />
        
        <div className="flex-1 flex flex-col relative">
          {/* Header */}
          <header className="border-b border-border/50 bg-background/95 backdrop-blur-md p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/f7360586-ff1c-4d5e-b846-feaceed45e61.png" 
                  alt="JamAI Logo" 
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold jamaican-text-gradient">JamAI</h1>
                  <p className="text-xs text-muted-foreground">Jamaican AI Assistant</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <SubscriptionBadge />
                
                {messages.length > 0 && (
                  <Button
                    onClick={() => setShowSummary(true)}
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Summary
                  </Button>
                )}
                
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Main content area */}
          <div className="flex-1 flex flex-col">
            {messages.length === 0 ? (
              // Empty state with welcome message
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full space-y-8 text-center">
                  {/* Welcome header */}
                  <div className="space-y-4">
                    <div className="flex justify-center items-center gap-3 mb-6">
                      <img 
                        src="/lovable-uploads/f7360586-ff1c-4d5e-b846-feaceed45e61.png" 
                        alt="JamAI Logo" 
                        className="w-16 h-16 object-contain"
                      />
                    </div>
                    <h1 className="text-4xl font-bold jamaican-text-gradient mb-4">
                      Welcome to JamAI
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                      Your friendly Jamaican AI assistant with location awareness. Ask me anything in English or Patois, find nearby places, and I'll respond in authentic Jamaican style!
                    </p>
                  </div>

                  {/* Chat suggestions */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                      {CHAT_SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSuggestionClick(suggestion.text)}
                          className="p-4 text-left bg-card/60 backdrop-blur-sm hover:bg-card border border-border/50 hover:border-border rounded-2xl transition-all duration-200 group"
                        >
                          <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {suggestion.text}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Chat interface
              <div className="flex-1 flex flex-col">
                {/* Messages area */}
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                    {messages.map((message) => (
                      <ChatMessage
                        key={message.id}
                        message={message.content}
                        isUser={message.role === 'user'}
                        timestamp={message.timestamp}
                      />
                    ))}
                    {isTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Ready for another chat section */}
                {messages.length > 0 && (
                  <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm p-4">
                    <div className="max-w-4xl mx-auto flex justify-center">
                      <button
                        onClick={startNewChat}
                        className="bg-gradient-to-r from-green-500 via-yellow-500 to-green-600 hover:from-green-600 hover:via-yellow-600 hover:to-green-700 text-white font-medium py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Ready for another chat?
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input area - Always show at bottom */}
          <div className="border-t border-border/50 bg-background/95 backdrop-blur-md p-4">
            <div className="max-w-4xl mx-auto">
              <ChatInput 
                onSendMessage={handleSendMessage}
                disabled={isTyping}
              />
            </div>
          </div>

          {/* Summary Modal */}
          {showSummary && (
            <ChatSummary
              messages={convertToMessages(messages)}
              onClose={() => setShowSummary(false)}
            />
          )}

          {/* Settings Modal */}
          {showSettings && (
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <Settings className="w-6 h-6" />
                    Settings
                  </DialogTitle>
                </DialogHeader>
                <UserProfileSettings />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
