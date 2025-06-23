import React, { useState, useRef, useEffect } from 'react';
import { Menu, Languages, FileText, Settings, Key } from 'lucide-react';
import ChatMessage from '@/components/ChatMessage';
import TypingMessage from '@/components/TypingMessage';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';
import ChatSuggestions from '@/components/ChatSuggestions';
import ChatSummary from '@/components/ChatSummary';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import ThemeToggle from '@/components/ThemeToggle';
import TranslationMode from '@/components/TranslationMode';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionBadge from '@/components/SubscriptionBadge';
import UsageMeter from '@/components/UsageMeter';
import ApiKeyManager from '@/components/ApiKeyManager';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/sonner';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/Message';
import { 
  getChatSessions, 
  createChatSession, 
  saveMessageToDatabase, 
  getMessagesForSession,
  deleteChatSession,
  updateChatSessionTitle
} from '@/utils/chatHistory';
import { migrateLocalStorageToSupabase, shouldRunMigration } from '@/utils/migrationUtils';
import { detectLanguage } from '@/utils/languageDetection';
import { locationAwareService } from '@/services/locationAwareService';
import { useAuth } from '@/contexts/AuthContext';
import { Users } from 'lucide-react';
import UserProfileSettings from '@/components/UserProfileSettings';

// Define the structure of a suggestion item
interface SuggestionItem {
  id: number;
  label: string;
  query: string;
}

// Type definition for the AI service
type AIService = 'gemini' | 'openai';

// Chat history interface for sidebar
interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

// Initial suggestions for the chat
const initialSuggestions: SuggestionItem[] = [
  { id: 1, label: 'Explain Jamaica', query: 'Explain Jamaica in a nutshell' },
  { id: 2, label: 'Patois phrases', query: 'Give me some common Patois phrases and their meanings' },
  { id: 3, label: 'Best Jamaican food', query: 'What are the best Jamaican foods to try?' },
  { id: 4, label: 'Talk like a Jamaican', query: 'Respond to this message in a Jamaican Patois style' },
];

const Index = () => {
  // ============================
  // STATE VARIABLES
  // ============================

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState<Message | null>(null);
  const [showTranslationMode, setShowTranslationMode] = useState(false);
  const [showChatSummary, setShowChatSummary] = useState(false);
  const [currentService, setCurrentService] = useState<AIService>('gemini');
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [migrationCompleted, setMigrationCompleted] = useState(false);

  // ============================
  // HOOKS
  // ============================

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { limits, usage, loading, checkLimit, incrementUsage, refetch } = useSubscription();
  const { user, isGuest, guestMessagesRemaining, useGuestMessage } = useAuth();

  // ============================
  // UTILITY FUNCTIONS
  // ============================

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateMessageId = (): string => {
    return `message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const generateChatId = (): string => {
    return `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const loadChatHistory = async () => {
    try {
      const sessions = await getChatSessions();
      const chatHistoryData = sessions.map(session => ({
        id: session.id,
        title: session.auto_title || session.title,
        messages: [] as Message[], // Messages loaded on demand
        createdAt: new Date(session.created_at)
      }));
      setChatHistory(chatHistoryData);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  // ============================
  // MESSAGE HANDLING
  // ============================

  const handleTypingComplete = () => {
    if (typingMessage) {
      const finalMessages = [...messages, typingMessage];
      setMessages(finalMessages);
      setTypingMessage(null);
    }
    setIsTyping(false);
    scrollToBottom();
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Handle guest mode message limit
    if (isGuest) {
      if (guestMessagesRemaining <= 0) {
        toast({
          title: 'Guest Limit Reached',
          description: 'You have used all 10 free messages. Please sign up to continue using JamAI!',
          variant: 'destructive'
        });
        return;
      }
      
      const canUseMessage = useGuestMessage();
      if (!canUseMessage) {
        toast({
          title: 'Guest Limit Reached',
          description: 'You have used all 10 free messages. Please sign up to continue using JamAI!',
          variant: 'destructive'
        });
        return;
      }
      
      // Show remaining messages for guest
      if (guestMessagesRemaining <= 3) {
        toast({
          title: `${guestMessagesRemaining - 1} messages remaining`,
          description: 'Sign up for unlimited messages!',
        });
      }
    } else {
      // Check message limit for authenticated users
      const canSendMessage = await checkLimit('messages');
      if (!canSendMessage) {
        toast({
          title: 'Message Limit Reached',
          description: 'You have reached your daily message limit. Please upgrade your plan or wait until tomorrow.',
          variant: 'destructive'
        });
        return;
      }
    }

    const userMessage: Message = {
      id: generateMessageId(),
      text: text,
      isUser: true,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    scrollToBottom();
    setIsTyping(true);

    // Only create chat session for authenticated users
    let sessionId = currentChatId;
    if (!isGuest && !sessionId) {
      sessionId = await createChatSession('New Chat');
      if (sessionId) {
        setCurrentChatId(sessionId);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create new chat session',
          variant: 'destructive'
        });
        return;
      }
    }

    // Save user message to database (only for authenticated users)
    if (!isGuest && sessionId) {
      await saveMessageToDatabase(sessionId, text, true, 'text', {});
    }

    // Set timeout for request
    requestTimeoutRef.current = setTimeout(() => {
      console.warn('Request timed out, stopping typing indicator');
      setIsTyping(false);
      toast({
        title: 'Request Timeout',
        description: 'The request took too long to complete. Please try again.',
        duration: 5000,
      });
    }, 30000);

    try {
      const language = await detectLanguage(text);
      
      const response = await locationAwareService.processQuery(
        text, 
        language === 'patois', 
        newMessages, 
        'gemini' // Using default service
      );

      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
        requestTimeoutRef.current = null;
      }

      const aiMessage: Message = {
        id: generateMessageId(),
        text: response.message,
        isUser: false,
        timestamp: new Date(),
      };

      setTypingMessage(aiMessage);
      
      // Save AI message to database (only for authenticated users)
      if (!isGuest && sessionId) {
        await saveMessageToDatabase(sessionId, response.message, false, 'text', {});
        
        // Increment usage count for authenticated users
        await incrementUsage('messages');

        // Generate intelligent title if this is a new chat
        if (messages.length === 0) {
          await supabase.rpc('generate_chat_title', { session_id: sessionId });
          await loadChatHistory(); // Refresh chat list
        }
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
        requestTimeoutRef.current = null;
      }
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
        duration: 5000,
      });
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleNewChat = () => {
    const newChatId = generateChatId();
    setCurrentChatId(newChatId);
    setMessages([]);
    setTypingMessage(null);
  };

  const handleLoadChat = async (chatId: string) => {
    try {
      const messages = await getMessagesForSession(chatId);
      setCurrentChatId(chatId);
      setMessages(messages);
      setTypingMessage(null);
    } catch (error) {
      console.error('Error loading chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteChats = async (chatIds: string[]) => {
    try {
      for (const chatId of chatIds) {
        await deleteChatSession(chatId);
      }
      await loadChatHistory();
      if (chatIds.includes(currentChatId)) {
        handleNewChat();
      }
      toast({
        title: 'Success',
        description: `Deleted ${chatIds.length} chat${chatIds.length > 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error('Error deleting chats:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete chats',
        variant: 'destructive'
      });
    }
  };

  const handleClearAllHistory = async () => {
    try {
      const sessions = await getChatSessions();
      for (const session of sessions) {
        await deleteChatSession(session.id);
      }
      await loadChatHistory();
      handleNewChat();
      toast({
        title: 'Success',
        description: 'All chat history cleared',
      });
    } catch (error) {
      console.error('Error clearing history:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear history',
        variant: 'destructive'
      });
    }
  };

  const handleHeaderClick = () => {
    handleNewChat();
  };

  const handleOpenChatSummary = () => {
    setShowChatSummary(true);
  };

  const handleCloseChatSummary = () => {
    setShowChatSummary(false);
  };

  const handleOpenTranslationMode = () => {
    setShowTranslationMode(true);
  };

  const handleCloseTranslationMode = () => {
    setShowTranslationMode(false);
  };

  // ============================
  // EFFECTS
  // ============================

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load chat history on component mount and set up new chat
    const initializeApp = async () => {
      // Check if migration is needed
      const needsMigration = await shouldRunMigration();
      if (needsMigration) {
        console.log('Running localStorage to Supabase migration...');
        const migrationSuccess = await migrateLocalStorageToSupabase();
        if (migrationSuccess) {
          toast({
            title: 'Data Migrated',
            description: 'Your chat history has been migrated to your account!',
          });
        }
      }
      
      setMigrationCompleted(true);
      await loadChatHistory();
      handleNewChat();
    };

    initializeApp();
  }, []);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
    };
  }, []);

  // ============================
  // RENDER
  // ============================

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex h-screen w-full relative">
          {/* Chat History Sidebar - only show for authenticated users */}
          {!isGuest && (
            <Sidebar>
              <SidebarHeader className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-jamaican-green" />
                  <span className="font-semibold text-jamaican-green">Chat History</span>
                </div>
              </SidebarHeader>
              <SidebarContent>
                <ChatHistorySidebar
                  chatHistory={chatHistory}
                  currentChatId={currentChatId}
                  onNewChat={handleNewChat}
                  onLoadChat={handleLoadChat}
                  onDeleteChats={handleDeleteChats}
                  onClearAllHistory={handleClearAllHistory}
                />
              </SidebarContent>
            </Sidebar>
          )}

          {/* Main Content Area */}
          <SidebarInset className="flex-1">
            <div className="flex flex-col h-full relative">
              {/* Header with navigation and controls */}
              <header className="glass-effect border-b px-4 py-3 modern-shadow">
                <div className="flex items-center justify-between max-w-6xl mx-auto">
                  <div className="flex items-center gap-3">
                    {!isGuest && <SidebarTrigger />}
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={handleHeaderClick}
                      title="Start new chat"
                    >
                      <img 
                        src="/lovable-uploads/f7360586-ff1c-4d5e-b846-feaceed45e61.png" 
                        alt="JamAI Logo" 
                        className="w-12 h-12 object-contain"
                      />
                      <div>
                        <h1 className="font-bold text-lg jamaican-text-gradient">JamAI</h1>
                        <p className="text-xs text-muted-foreground">Jamaican AI Assistant</p>
                      </div>
                    </div>
                  </div>
                  {/* Guest status indicator with Sign Up button */}
                  {isGuest && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-full">
                        <Users className="w-4 h-4 text-yellow-700" />
                        <span className="text-sm font-medium text-yellow-700">
                          Guest: {guestMessagesRemaining} messages left
                        </span>
                      </div>
                      <Button
                        onClick={() => window.location.href = '/auth'}
                        size="sm"
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold"
                      >
                        Sign Up / Log In
                      </Button>
                    </div>
                  )}

                  {/* Desktop controls */}
                  <div className="hidden md:flex items-center gap-3">
                    <Button
                      onClick={handleOpenChatSummary}
                      variant="ghost"
                      size="sm"
                      className="group relative overflow-hidden bg-gradient-to-r from-green-400 via-green-300 to-green-500 hover:from-green-500 hover:via-green-400 hover:to-green-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 border border-white/30 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-2 relative z-10">
                        <FileText className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                        <span className="hidden sm:inline font-medium">Summary</span>
                      </div>
                    </Button>
                    {messages.length > 0 && (
                      <Button
                        onClick={handleOpenTranslationMode}
                        variant="ghost"
                        size="sm"
                        className="group relative overflow-hidden bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-600 text-black font-medium shadow-lg hover:shadow-xl transition-all duration-300 border border-white/30 backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-2 relative z-10">
                          <Languages className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                          <span className="hidden sm:inline font-medium">Translation</span>
                        </div>
                      </Button>
                    )}
                    {/* Settings Sheet - now visible for all users */}
                    <Sheet open={showSettings} onOpenChange={setShowSettings}>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-96 overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle>Settings & Profile</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6">
                          {isGuest ? (
                            <div className="text-center py-12">
                              <div className="mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 via-yellow-400 to-green-600 rounded-2xl mb-4">
                                  <span className="text-2xl">🇯🇲</span>
                                </div>
                                <h3 className="text-xl font-bold mb-2">Sign Up for Full Access</h3>
                                <p className="text-muted-foreground mb-6">
                                  Create an account to access settings, unlimited messages, and more features!
                                </p>
                              </div>
                              <div className="space-y-3">
                                <Button
                                  onClick={() => window.location.href = '/auth'}
                                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold"
                                >
                                  Sign Up Now
                                </Button>
                                <div className="text-sm text-muted-foreground">
                                  <p>You have {guestMessagesRemaining} messages remaining</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <UserProfileSettings />
                          )}
                        </div>
                      </SheetContent>
                    </Sheet>
                    
                    <ThemeToggle />
                    <SubscriptionBadge />
                  </div>
                </div>
              </header>

              {/* Main chat area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-4 py-6">
                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* Welcome message and suggestions */}
                    {messages.length === 0 && !typingMessage && (
                      <>
                        <div className="text-center py-12">
                          <div className="mb-6 flex justify-center">
                            <img 
                              src="/lovable-uploads/f7360586-ff1c-4d5e-b846-feaceed45e61.png" 
                              alt="JamAI Logo" 
                              className="w-32 h-32 object-contain"
                            />
                          </div>
                          <h2 className="text-3xl font-bold mb-4 jamaican-text-gradient">
                            Welcome to JamAI
                          </h2>
                          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Your friendly Jamaican AI assistant with location awareness. Ask me anything in English or Patois, 
                            find nearby places, and I'll respond in authentic Jamaican style!
                          </p>
                          {isGuest && (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
                              <p className="text-yellow-800 font-medium">
                                👋 You're trying JamAI as a guest!
                              </p>
                              <p className="text-yellow-700 text-sm mt-1">
                                You have {guestMessagesRemaining} free messages. Sign up for unlimited access!
                              </p>
                              <Button
                                onClick={() => window.location.href = '/auth'}
                                size="sm"
                                className="mt-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold"
                              >
                                Sign Up Now
                              </Button>
                            </div>
                          )}
                        </div>
                        <ChatSuggestions onSuggestionClick={handleSuggestionClick} />
                      </>
                    )}

                    {/* Chat messages */}
                    {messages.map((message) => (
                      <ChatMessage 
                        key={message.id} 
                        message={message.text}
                        isUser={message.isUser}
                        timestamp={message.timestamp}
                      />
                    ))}

                    {/* Typing message */}
                    {typingMessage && (
                      <TypingMessage
                        key={typingMessage.id}
                        fullMessage={typingMessage.text}
                        isUser={typingMessage.isUser}
                        timestamp={typingMessage.timestamp}
                        onComplete={handleTypingComplete}
                      />
                    )}

                    {/* Typing indicator */}
                    {isTyping && !typingMessage && <TypingIndicator />}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Chat input area */}
                <div className="px-4 pb-4">
                  <div className="max-w-4xl mx-auto">
                    <ChatInput 
                      onSendMessage={handleSendMessage} 
                      disabled={isTyping || (isGuest && guestMessagesRemaining <= 0)}
                    />
                    {isGuest && guestMessagesRemaining <= 0 && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                        <p className="text-red-800 font-medium">Guest limit reached!</p>
                        <p className="text-red-700 text-sm mb-3">
                          Sign up now for unlimited messages and features.
                        </p>
                        <Button
                          onClick={() => window.location.href = '/auth'}
                          size="sm"
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold"
                        >
                          Sign Up Now
                        </Button>
                      </div>
                    )}
                    {/* Show sign up prompt when getting close to limit */}
                    {isGuest && guestMessagesRemaining <= 3 && guestMessagesRemaining > 0 && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                        <p className="text-yellow-800 font-medium">Only {guestMessagesRemaining} messages left!</p>
                        <p className="text-yellow-700 text-sm mb-3">
                          Sign up now to get unlimited messages and keep the conversation going.
                        </p>
                        <Button
                          onClick={() => window.location.href = '/auth'}
                          size="sm"
                          variant="outline"
                          className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                        >
                          Sign Up for Unlimited Messages
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>

          {/* Chat Summary Overlay */}
          {showChatSummary && (
            <ChatSummary
              messages={messages}
              onClose={handleCloseChatSummary}
            />
          )}

          {/* Translation Mode Overlay */}
          {showTranslationMode && (
            <TranslationMode
              messages={messages}
              onClose={handleCloseTranslationMode}
            />
          )}
        </div>
        <Toaster />
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default Index;
