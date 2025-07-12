import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import ChatSummary from '@/components/ChatSummary';
import TranslationMode from '@/components/TranslationMode';
import OnboardingTutorial from '@/components/OnboardingTutorial';
import ThemeToggle from '@/components/ThemeToggle';
import SubscriptionBadge from '@/components/SubscriptionBadge';
import UserProfileSettings from '@/components/UserProfileSettings';
import TranslationModeToggle from '@/components/TranslationModeToggle';
import TranslatedResponse from '@/components/TranslatedResponse';
import SummaryResponse from '@/components/SummaryResponse';
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
import { getChatSessions, getMessagesForSession, generateIntelligentTitle } from '@/utils/chatHistory';
import { locationAwareService } from '@/services/locationAwareService';
import { detectLanguage } from '@/utils/languageDetection';

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
  const [showTranslation, setShowTranslation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [isTranslationEnabled, setIsTranslationEnabled] = useState(false);
  const [translationDirection, setTranslationDirection] = useState<'auto' | 'to-english' | 'to-patois'>('auto');
  const [isSummaryEnabled, setIsSummaryEnabled] = useState(false);
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages]);

  // Load chat history from both localStorage and database
  useEffect(() => {
    const loadChatHistory = async () => {
      console.log('🔍 Loading chat history...');
      let loadedHistory: ChatHistory[] = [];

      // First, try localStorage
      try {
        const storedHistory = localStorage.getItem('chatHistory') || localStorage.getItem('jamai_chat_list');
        console.log('📦 Raw stored history:', storedHistory);
        
        if (storedHistory) {
          const parsedHistory = JSON.parse(storedHistory).map((chat: any) => ({
            ...chat,
            createdAt: new Date(chat.createdAt),
            messages: chat.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }));
          loadedHistory = parsedHistory;
          console.log('✅ Loaded from localStorage:', loadedHistory.length, 'chats');
        }
      } catch (error) {
        console.error('❌ Failed to parse localStorage history:', error);
      }

      // If user is logged in, also load from database
      if (user) {
        try {
          console.log('🔍 Loading chat sessions from database...');
          const sessions = await getChatSessions();
          console.log('📊 Database sessions:', sessions.length);

          // Convert database sessions to ChatHistory format
          const dbHistory: ChatHistory[] = await Promise.all(
            sessions.map(async (session) => {
              const messages = await getMessagesForSession(session.id);
              return {
                id: session.id,
                title: session.title,
                autoTitle: session.auto_title || undefined,
                messages: messages.map(msg => ({
                  id: msg.id,
                  content: msg.text,
                  role: msg.isUser ? 'user' : 'assistant',
                  timestamp: msg.timestamp
                })),
                createdAt: new Date(session.created_at),
                keywords: session.keywords || undefined,
                summary: session.summary || undefined
              };
            })
          );

          // Merge localStorage and database history (database takes precedence)
          const mergedHistory = [...loadedHistory];
          dbHistory.forEach(dbChat => {
            const existingIndex = mergedHistory.findIndex(chat => chat.id === dbChat.id);
            if (existingIndex >= 0) {
              mergedHistory[existingIndex] = dbChat; // Database version takes precedence
            } else {
              mergedHistory.push(dbChat);
            }
          });

          loadedHistory = mergedHistory;
          console.log('✅ Merged history:', loadedHistory.length, 'total chats');
        } catch (error) {
          console.error('❌ Failed to load database history:', error);
        }
      }

      setChatHistory(loadedHistory);
      console.log('📊 Final chat history:', loadedHistory.length, 'chats');
    };

    loadChatHistory();
  }, [user]);

  // Save chat history to local storage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
      console.log('💾 Saved chat history:', chatHistory.length, 'chats');
    }
  }, [chatHistory]);

  // Enhanced tutorial status check - fixed logic
  useEffect(() => {
    const checkTutorialStatus = async () => {
      let tutorialCompleted = false;

      if (user) {
        // For authenticated users, check database
        try {
          const { data } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();
          
          tutorialCompleted = data?.onboarding_completed === true;
          console.log('🎓 Database tutorial status:', tutorialCompleted);
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        }
      } else {
        // For guest users, always show tutorial (don't check localStorage)
        tutorialCompleted = false;
        console.log('🎓 Guest user - tutorial will be shown every session');
      }

      setHasCompletedTutorial(tutorialCompleted);

      // Only show tutorial if:
      // 1. User has never seen it before (tutorialCompleted is false)
      // 2. No existing chat activity
      // 3. Chat history has finished loading
      if (!tutorialCompleted && messages.length === 0 && chatHistory.length === 0) {
        setTimeout(() => {
          setShowOnboarding(true);
          console.log('🎓 Showing tutorial for first-time user');
        }, 500); // Small delay to ensure everything is loaded
      } else {
        console.log('🎓 Not showing tutorial - completed:', tutorialCompleted, 'messages:', messages.length, 'history:', chatHistory.length);
      }
    };

    // Only check after chat history loading is complete
    if (chatHistory.length >= 0) {
      checkTutorialStatus();
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

  // Enhanced handleSendMessage to include translation and summary features
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
      // Detect if user message is in Patois
      const detectedLanguage = detectLanguage(messageContent);
      const isPatois = detectedLanguage === 'patois';
      console.log('🗣️ Detected language - Patois:', isPatois);

      // Check if this is a proverb request
      const lowerMessage = messageContent.toLowerCase();
      const isProverbRequest = lowerMessage.includes('proverb') || lowerMessage.includes('saying') || 
                              lowerMessage.includes('wise word') || lowerMessage.includes('old time saying');

      // Convert current messages to the format expected by AI service
      const conversationHistory = messages.map(msg => ({
        id: msg.id,
        text: msg.content,
        isUser: msg.role === 'user',
        timestamp: msg.timestamp
      }));

      let enhancedMessage = messageContent;
      
      // Enhance proverb requests with specific instructions
      if (isProverbRequest) {
        enhancedMessage = isPatois 
          ? `${messageContent}. Please respond in Patois and include: the proverb in Patois, its English translation, the meaning, and how it's used.`
          : `${messageContent}. Please respond in English and include: the Jamaican proverb in Patois, its English translation, the meaning, and how it's used in Jamaican culture.`;
      }

      // Call the location-aware AI service
      const aiResponse = await locationAwareService.processQuery(
        enhancedMessage,
        isPatois,
        conversationHistory
      );

      // Add AI message to the chat
      const aiMessage: ChatMessageData = {
        id: uuidv4(),
        content: aiResponse.message,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);

      // Update chat history
      updateChatHistory(userMessage, aiMessage);
    } catch (error: any) {
      console.error('Error processing message:', error);
      
      // Detect language for error message
      const detectedLanguage = detectLanguage(messageContent);
      const isPatoisForError = detectedLanguage === 'patois';
      
      // Add fallback error message
      const errorMessage: ChatMessageData = {
        id: uuidv4(),
        content: isPatoisForError 
          ? "Mi sorry, mi having some trouble right now. Try again later, nuh?"
          : "I'm sorry, I'm having some technical difficulties right now. Please try again later.",
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      
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

  const updateChatHistory = (userMessage: ChatMessageData, aiMessage: ChatMessageData) => {
    setChatHistory((prevHistory) => {
      // Check if there's an existing chat
      const existingChatIndex = prevHistory.findIndex((chat) => chat.id === currentChatId);

      if (existingChatIndex !== -1) {
        // Update existing chat
        const updatedMessages = [...prevHistory[existingChatIndex].messages, userMessage, aiMessage];
        
        // Generate intelligent title if this is the first exchange
        let updatedChat = {
          ...prevHistory[existingChatIndex],
          messages: updatedMessages,
        };

        // If no auto title exists and we have enough messages, generate one
        if (!updatedChat.autoTitle && updatedMessages.length >= 2) {
          const intelligentTitle = generateIntelligentTitle(updatedMessages.map(msg => ({
            id: msg.id,
            text: msg.content,
            isUser: msg.role === 'user',
            timestamp: msg.timestamp
          })));
          updatedChat.autoTitle = intelligentTitle;
          updatedChat.title = intelligentTitle;
        }

        const newHistory = [...prevHistory];
        newHistory[existingChatIndex] = updatedChat;
        return newHistory;
      } else {
        // Create new chat with intelligent title
        const newMessages = [userMessage, aiMessage];
        const intelligentTitle = generateIntelligentTitle(newMessages.map(msg => ({
          id: msg.id,
          text: msg.content,
          isUser: msg.role === 'user',
          timestamp: msg.timestamp
        })));

        const newChat: ChatHistory = {
          id: currentChatId || uuidv4(),
          title: intelligentTitle,
          autoTitle: intelligentTitle,
          messages: newMessages,
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

  // Convert ChatMessageData to Message format for ChatSummary and TranslationMode
  const convertToMessages = (chatMessages: ChatMessageData[]) => {
    return chatMessages.map(msg => ({
      id: msg.id,
      text: msg.content,
      isUser: msg.role === 'user',
      timestamp: msg.timestamp
    }));
  };

  const hasExistingChats = chatHistory.length > 0 || messages.length > 0;

  console.log('🎯 Current state debug:', {
    messagesLength: messages.length,
    chatHistoryLength: chatHistory.length,
    showSummaryButton: messages.length > 0, // Show when current chat has messages
    hasExistingChats,
    currentChatId
  });

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
        
        <div className="flex-1 flex flex-col relative min-w-0">
          {/* Header */}
          <header className="border-b border-border/50 bg-background/95 backdrop-blur-md p-4 flex-shrink-0">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-0.5 flex-1 min-w-0">
                <button 
                  onClick={startNewChat}
                  className="flex items-center gap-0.5 hover:opacity-80 transition-opacity cursor-pointer min-w-0"
                  aria-label="Start new chat"
                >
                  <img 
                    src="/lovable-uploads/f7360586-ff1c-4d5e-b846-feaceed45e61.png" 
                    alt="JamAI Logo" 
                    className="w-14 h-14 object-contain flex-shrink-0"
                  />
                  <div className="text-left min-w-0 hidden sm:block">
                    <h1 className="text-lg font-bold jamaican-text-gradient truncate">JamAI</h1>
                    <p className="text-xs text-muted-foreground truncate">Jamaican AI Assistant</p>
                  </div>
                </button>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Summary button */}
                <Button
                  onClick={() => setShowSummary(true)}
                  className="h-9 px-3 rounded-lg font-medium text-sm border-0 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(90deg, #16a34a 0%, #ffffff 50%, #16a34a 100%)',
                    backgroundSize: '200% 100%',
                    color: '#000000'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #15803d 0%, #f0f0f0 50%, #15803d 100%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #16a34a 0%, #ffffff 50%, #16a34a 100%)';
                  }}
                >
                  <FileText className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Summary</span>
                </Button>

                {/* Translation split-screen button */}
                {messages.length > 0 && (
                  <Button
                    onClick={() => setShowTranslation(true)}
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    title="Split-screen translation"
                  >
                    <Languages className="w-4 h-4" />
                  </Button>
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
                      <div className="pr-6 space-y-6">
                        {/* Translation Mode Settings */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Languages className="w-4 h-4" />
                            Translation Mode
                          </h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">Auto-translate AI responses</p>
                                <p className="text-xs text-muted-foreground">
                                  Automatically translate AI responses between English and Patois
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="translation-mode"
                                  checked={isTranslationEnabled}
                                  onChange={(e) => setIsTranslationEnabled(e.target.checked)}
                                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                              </div>
                            </div>
                            
                            {isTranslationEnabled && (
                              <div className="ml-4 pt-2 border-t border-border">
                                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                                  Translation Direction:
                                </label>
                                <select
                                  value={translationDirection}
                                  onChange={(e) => setTranslationDirection(e.target.value as 'auto' | 'to-english' | 'to-patois')}
                                  className="w-full text-xs p-2 border border-border rounded bg-background"
                                >
                                  <option value="auto">🔄 Auto Detect & Flip</option>
                                  <option value="to-english">🇬🇧 Always to English</option>
                                  <option value="to-patois">🇯🇲 Always to Patois</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Summary Mode Settings */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Summary Mode
                          </h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">Auto-summarize long messages</p>
                                <p className="text-xs text-muted-foreground">
                                  Automatically summarize user messages that are longer than usual
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="summary-mode"
                                  checked={isSummaryEnabled}
                                  onChange={(e) => setIsSummaryEnabled(e.target.checked)}
                                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
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
          <div className="flex-1 flex flex-col overflow-hidden">
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
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                    <h1 className="text-3xl font-bold jamaican-text-gradient mb-4 text-center">
                      Welcome to JamAI
                    </h1>
                    <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed text-center">
                      Your friendly Jamaican AI assistant with location awareness. Ask me anything in English or Patois, find nearby places, and I'll respond in authentic Jamaican style!
                    </p>
                  </div>

                  {/* Conditional banner based on existing chats - smaller and centered */}
                  {hasExistingChats ? (
                    <div className="max-w-sm mx-auto bg-gradient-to-r from-green-100 to-yellow-100 dark:from-green-950/30 dark:to-yellow-900/30 border border-green-300 dark:border-green-700 rounded-lg p-3 mb-6">
                      <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-200 mb-1">
                        <span className="text-sm">🌟</span>
                        <span className="font-semibold text-sm">Ready for another chat?</span>
                      </div>
                      <p className="text-green-700 dark:text-green-300 text-xs text-center">
                        Welcome back! Ask me more about Jamaica or start fresh.
                      </p>
                    </div>
                  ) : (
                    <div className="max-w-sm mx-auto bg-gradient-to-r from-green-100 to-yellow-100 dark:from-green-950/30 dark:to-yellow-900/30 border border-green-300 dark:border-green-700 rounded-lg p-3 mb-6">
                      <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-200 mb-1">
                        <span className="text-sm">👋</span>
                        <span className="font-semibold text-sm">Start a new chat</span>
                      </div>
                      <p className="text-green-700 dark:text-green-300 text-xs text-center">
                        Get started by asking me anything about Jamaica!
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
                          className="p-3 text-center border-2 hover:shadow-md rounded-lg transition-all duration-200 group border-secondary/30 bg-transparent dark:hover:shadow-[0_0_20px_hsl(var(--secondary)/0.3)] dark:hover:border-secondary/80 hover:border-secondary"
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
                    {messages.map((message, index) => (
                      <div key={message.id}>
                        <ChatMessage
                          message={message.content}
                          isUser={message.role === 'user'}
                          timestamp={message.timestamp}
                        />
                        
                        {/* Show translation for AI responses */}
                        {message.role === 'assistant' && isTranslationEnabled && (
                          <TranslatedResponse
                            originalText={message.content}
                            translationDirection={translationDirection}
                          />
                        )}
                        
                        {/* Show summary for user messages */}
                        {message.role === 'user' && isSummaryEnabled && (
                          <SummaryResponse
                            originalText={message.content}
                          />
                        )}
                      </div>
                    ))}
                    {isTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area - Always show at bottom */}
          <div className="border-t border-border/50 bg-background/95 backdrop-blur-md p-4 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              <ChatInput 
                onSendMessage={handleSendMessage}
                disabled={isTyping}
              />
            </div>
          </div>

          {/* Translation Mode */}
          {showTranslation && (
            <TranslationMode
              messages={convertToMessages(messages)}
              onClose={() => setShowTranslation(false)}
            />
          )}

          {/* Onboarding Tutorial - only for first-time users */}
          <OnboardingTutorial
            isOpen={showOnboarding}
            onComplete={() => {
              setShowOnboarding(false);
              setHasCompletedTutorial(true);
            }}
          />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
