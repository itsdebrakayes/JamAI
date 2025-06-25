
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import ChatSummary from '@/components/ChatSummary';
import OnboardingTutorial from '@/components/OnboardingTutorial';
import ThemeToggle from '@/components/ThemeToggle';
import SubscriptionBadge from '@/components/SubscriptionBadge';
import UserProfileSettings from '@/components/UserProfileSettings';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast"
import { MessageSquare, Plus, Settings, FileText, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages]);

  // Load chat history from local storage on component mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('chatHistory');
    if (storedHistory) {
      try {
        const parsedHistory = JSON.parse(storedHistory).map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChatHistory(parsedHistory);
        console.log('🗂️ Loaded chat history:', parsedHistory.length, 'chats');
      } catch (error) {
        console.error('Failed to parse chat history:', error);
      }
    }
  }, []);

  // Save chat history to local storage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
      console.log('💾 Saved chat history:', chatHistory.length, 'chats');
    }
  }, [chatHistory]);

  // Check for onboarding on mount
  useEffect(() => {
    const checkOnboarding = async () => {
      if (user) {
        // For authenticated users, check database
        try {
          const { data } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();
          
          if (!data?.onboarding_completed) {
            setShowOnboarding(true);
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        }
      } else {
        // For guests, check localStorage
        const completed = localStorage.getItem('jamai_onboarding_completed');
        if (!completed) {
          setShowOnboarding(true);
        }
      }
    };

    // Only check onboarding if there are no existing messages or chat history
    if (messages.length === 0 && chatHistory.length === 0) {
      checkOnboarding();
    }
  }, [user, messages.length, chatHistory.length]);

  // Function to start a new chat
  const startNewChat = () => {
    const newChatId = uuidv4();
    setCurrentChatId(newChatId);
    setMessages([]);
    console.log('🆕 Started new chat:', newChatId);
  };

  // Function to load a specific chat from history
  const loadChat = (chatId: string) => {
    const chatToLoad = chatHistory.find((chat) => chat.id === chatId);
    if (chatToLoad) {
      setMessages(chatToLoad.messages);
      setCurrentChatId(chatId);
      console.log('📂 Loaded chat:', chatId, 'with', chatToLoad.messages.length, 'messages');
    }
  };

  // Function to delete specific chats from history
  const deleteChats = (chatIds: string[]) => {
    const updatedHistory = chatHistory.filter((chat) => !chatIds.includes(chat.id));
    setChatHistory(updatedHistory);
    if (chatIds.includes(currentChatId || '')) {
      startNewChat(); // Start a new chat if the current chat is deleted
    }
    console.log('🗑️ Deleted chats:', chatIds);
  };

  // Function to clear all chat history
  const clearAllHistory = () => {
    setChatHistory([]);
    localStorage.removeItem('chatHistory');
    startNewChat();
    console.log('🧹 Cleared all chat history');
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
    console.log('✏️ Renamed chat:', chatId, 'to:', newTitle);
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

  const hasExistingChats = chatHistory.length > 0 || messages.length > 0;
  const showSummaryButton = messages.length > 0; // Always show if there are messages

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ChatHistorySidebar 
          chatHistory={chatHistory} 
          currentChatId={currentChatId || ''}
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
              <div className="flex items-center gap-4">
                <SidebarTrigger className="h-8 w-8" />
                <button 
                  onClick={startNewChat}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                  aria-label="Start new chat"
                >
                  <img 
                    src="/lovable-uploads/f7360586-ff1c-4d5e-b846-feaceed45e61.png" 
                    alt="JamAI Logo" 
                    className="w-10 h-10 object-contain"
                  />
                  <div className="text-left">
                    <h1 className="text-lg font-bold jamaican-text-gradient">JamAI</h1>
                    <p className="text-xs text-muted-foreground">Jamaican AI Assistant</p>
                  </div>
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                {showSummaryButton && (
                  <>
                    <Button
                      onClick={() => setShowSummary(true)}
                      variant="default"
                      size="sm"
                      className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-xs"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Summary
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 px-3 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-medium text-xs"
                    >
                      <Languages className="w-3 h-3 mr-1" />
                      Translation
                    </Button>
                  </>
                )}
                
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm" 
                      className="h-8 w-8 p-0"
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[400px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-3">
                        <Settings className="w-6 h-6" />
                        Settings & Profile
                      </SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-100px)] mt-6">
                      <div className="pr-6">
                        <UserProfileSettings />
                      </div>
                    </ScrollArea>
                  </SheetContent>
                </Sheet>

                <ThemeToggle />
                
                <SubscriptionBadge />
              </div>
            </div>
          </header>

          {/* Main content area */}
          <div className="flex-1 flex flex-col">
            {messages.length === 0 ? (
              // Empty state with welcome message
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-3xl w-full space-y-6 text-center">
                  {/* Welcome header */}
                  <div className="space-y-4">
                    <div className="flex justify-center items-center gap-3 mb-4">
                      <img 
                        src="/lovable-uploads/f7360586-ff1c-4d5e-b846-feaceed45e61.png" 
                        alt="JamAI Logo" 
                        className="w-16 h-16 object-contain"
                      />
                    </div>
                    <h1 className="text-3xl font-bold jamaican-text-gradient mb-4 text-center">
                      Welcome to JamAI
                    </h1>
                    <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed text-center">
                      Your friendly Jamaican AI assistant with location awareness. Ask me anything in English or Patois, find nearby places, and I'll respond in authentic Jamaican style!
                    </p>
                  </div>

                  {/* Conditional section based on existing chats */}
                  {hasExistingChats ? (
                    <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-200 mb-2">
                        <span className="text-lg">🌟</span>
                        <span className="font-semibold">Ready for another chat?</span>
                      </div>
                      <p className="text-green-700 dark:text-green-300 text-sm">
                        Welcome back! Ask me more about Jamaica or start a fresh conversation.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                        <span className="text-lg">👋</span>
                        <span className="font-semibold">Start a new chat</span>
                      </div>
                      <p className="text-blue-600 dark:text-blue-400 text-sm">
                        Get started by asking me anything about Jamaica, language, or general questions!
                      </p>
                    </div>
                  )}

                  {/* Chat suggestions */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
                      {CHAT_SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSuggestionClick(suggestion.text)}
                          className="p-3 text-center bg-white dark:bg-black border-2 hover:shadow-md rounded-lg transition-all duration-200 group"
                          style={{
                            borderColor: '#D1E7D7'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#E6F2EB';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '';
                          }}
                        >
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-green-800 dark:group-hover:text-green-200 transition-colors">
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
                        className="bg-gradient-to-r from-green-600 via-green-500 to-green-600 hover:from-green-700 hover:via-green-600 hover:to-green-700 text-white font-medium py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 text-sm"
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

          {/* Onboarding Tutorial */}
          <OnboardingTutorial
            isOpen={showOnboarding}
            onComplete={() => setShowOnboarding(false)}
          />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
