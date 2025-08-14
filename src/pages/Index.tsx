import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';
import { Button } from '@/components/ui/button';
import { Menu, MessageSquare, Settings } from 'lucide-react';
import { apiService } from '@/services/apiService';
import { detectLanguage } from '@/utils/languageDetection';
import { v4 as uuidv4 } from 'uuid';
import { loadChatHistory, saveChatHistory, createChatSession, saveMessageToDatabase, getChatSessions, deleteChatSession, clearHistory, updateChatSessionTitle } from '@/utils/chatHistory';
import { groupChatsByTime } from '@/utils/chatGrouping';
import { useFileUpload } from '@/hooks/useFileUpload';
import EmptyStateCard from '@/components/EmptyStateCard';
import ChatSuggestions from '@/components/ChatSuggestions';
import SubscriptionBadge from '@/components/SubscriptionBadge';
import UserProfileSettings from '@/components/UserProfileSettings';
import ThemeToggle from '@/components/ThemeToggle';
import JamAILogo from '@/assets/JAMAi Logo.png';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  files?: File[];
}

interface ChatHistoryItem {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  autoTitle?: string;
  keywords?: string[];
  summary?: string;
}

const Index = () => {
  const { user, isGuest, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [groupedChatHistory, setGroupedChatHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { uploadMultipleFiles, isUploading, isProcessing, processFilesWithAI } = useFileUpload();

  const scrollToBottom = () => {
    // Only scroll when there are messages and enough to warrant scrolling
    if (messages.length > 3) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when user changes
  useEffect(() => {
    const loadHistory = async () => {
      console.log('🔄 Starting to load chat history...');
      console.log('👤 User:', user ? 'authenticated' : 'not authenticated');
      console.log('🏠 isGuest:', isGuest);
      
      if (user && !isGuest) {
        try {
          console.log('🔄 Fetching chat sessions from database...');
          const sessions = await getChatSessions();
          console.log('📚 Retrieved sessions:', sessions.length, sessions);
          
          const chats: ChatHistoryItem[] = sessions.map(session => ({
            id: session.id,
            title: session.auto_title || session.title,
            messages: [],
            createdAt: new Date(session.created_at),
            autoTitle: session.auto_title || undefined,
            keywords: session.keywords || undefined,
            summary: session.summary || undefined
          }));
          
          console.log('🗂️ Processed chats:', chats);
          setChatHistory(chats);
          const groupedChats = groupChatsByTime(chats);
          console.log('📊 Grouped chats:', groupedChats);
          setGroupedChatHistory(groupedChats);
        } catch (error) {
          console.error('❌ Error loading chat history:', error);
        }
      } else {
        // Load from localStorage for guests
        const localChats = loadChatHistory();
        setChatHistory(localChats);
        const groupedChats = groupChatsByTime(localChats);
        setGroupedChatHistory(groupedChats);
      }
    };

    if (!authLoading) {
      loadHistory();
    }
  }, [user, isGuest, authLoading]);

  const handleSendMessage = async (messageText: string, files?: File[]) => {
    if (!messageText.trim() && (!files || files.length === 0)) return;

    setIsLoading(true);
    const userMessage: Message = {
      id: uuidv4(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
      files: files || []
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Create session if needed
      if (!currentChatId) {
        const sessionId = await createChatSession(messageText.substring(0, 50));
        if (sessionId) {
          setCurrentChatId(sessionId);
        }
      }

      // Handle file uploads if present
      if (files && files.length > 0) {
        try {
          const response = await processFilesWithAI(files, messageText, user?.id || 'guest', currentChatId || undefined);
          
          if (response) {
            const aiMessage: Message = {
              id: uuidv4(),
              text: response.message,
              isUser: false,
              timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
          }
          
          setIsLoading(false);
          return;
        } catch (error) {
          console.error('File upload error:', error);
          toast({
            title: "Upload Error",
            description: "Failed to process uploaded files. Please try again.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
      }

      // Regular text message handling using OpenAI Assistant
      const isUserMessagePatois = detectLanguage(messageText) === 'patois';
      
      const aiResponse = await apiService.generateOpenAIResponse(
        messageText, 
        isUserMessagePatois, 
        messages,
        currentChatId || undefined,
        user?.id
      );

      const aiMessage: Message = {
        id: uuidv4(),
        text: aiResponse.message,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save to database if authenticated
      if (currentChatId && user && !isGuest) {
        await saveMessageToDatabase(currentChatId, userMessage.text, true);
        await saveMessageToDatabase(currentChatId, aiMessage.text, false);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (files: File[], prompt: string) => {
    await handleSendMessage(prompt, files);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
  };

  const isEmpty = messages.length === 0;

  // Show auth page for unauthenticated users
  if (!authLoading && !user && !isGuest) {
    window.location.href = '/auth';
    return null;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <ChatHistorySidebar
        chatHistory={groupedChatHistory}
        currentChatId={currentChatId}
        onLoadChat={async (chatId) => {
          try {
            setCurrentChatId(chatId);
            const { data: chatMessages } = user && !isGuest 
              ? await supabase.from('messages').select('*').eq('session_id', chatId).order('created_at')
              : { data: null };
            
            if (chatMessages) {
              const formattedMessages: Message[] = chatMessages.map(msg => ({
                id: msg.id,
                text: msg.content,
                isUser: msg.is_user,
                timestamp: new Date(msg.created_at)
              }));
              setMessages(formattedMessages);
            }
          } catch (error) {
            console.error('Error loading chat:', error);
          }
        }}
        onDeleteChats={async (chatIds) => {
          try {
            if (user && !isGuest) {
              for (const chatId of chatIds) {
                await deleteChatSession(chatId);
              }
            } else {
              const currentHistory = loadChatHistory();
              const updatedHistory = currentHistory.filter(chat => !chatIds.includes(chat.id));
              saveChatHistory(updatedHistory);
            }
            
            const updatedChats = chatHistory.filter(chat => !chatIds.includes(chat.id));
            setChatHistory(updatedChats);
            const groupedChats = groupChatsByTime(updatedChats);
            setGroupedChatHistory(groupedChats);
            
            if (chatIds.includes(currentChatId)) {
              startNewChat();
            }
            
            if (user) {
              const sessions = await getChatSessions();
              const chats: ChatHistoryItem[] = sessions.map(session => ({
                id: session.id,
                title: session.auto_title || session.title,
                messages: [],
                createdAt: new Date(session.created_at),
                autoTitle: session.auto_title || undefined,
                keywords: session.keywords || undefined,
                summary: session.summary || undefined
              }));
              setGroupedChatHistory(groupChatsByTime(chats));
            }
          } catch (error) {
            console.error('Error deleting chats:', error);
          }
        }}
        onClearAllHistory={async () => {
          try {
            if (user) {
              const sessions = await getChatSessions();
              for (const session of sessions) {
                await deleteChatSession(session.id);
              }
            } else {
              clearHistory();
            }
            
            setChatHistory([]);
            setGroupedChatHistory([]);
            startNewChat();
            
            toast({
              title: "History Cleared",
              description: "All chat history has been cleared.",
            });
          } catch (error) {
            console.error('Error clearing history:', error);
            toast({
              title: "Error",
              description: "Failed to clear chat history.",
              variant: "destructive"
            });
          }
        }}
        onNewChat={startNewChat}
        onRenameChat={async (chatId: string, newTitle: string) => {
          try {
            if (user && !isGuest) {
              const success = await updateChatSessionTitle(chatId, newTitle);
              if (success) {
                const updatedChats = chatHistory.map(chat => 
                  chat.id === chatId ? { ...chat, title: newTitle } : chat
                );
                setChatHistory(updatedChats);
                const groupedChats = groupChatsByTime(updatedChats);
                setGroupedChatHistory(groupedChats);
              } else {
                console.error('Failed to update chat title in database');
              }
            } else {
              const currentHistory = loadChatHistory();
              const updatedHistory = currentHistory.map(chat => 
                chat.id === chatId ? { ...chat, title: newTitle } : chat
              );
              saveChatHistory(updatedHistory);
              setChatHistory(updatedHistory);
              const groupedChats = groupChatsByTime(updatedHistory);
              setGroupedChatHistory(groupedChats);
            }
          } catch (error) {
            console.error('Error renaming chat:', error);
          }
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Logo - Make clickable for new chat */}
              <Button
                variant="ghost"
                onClick={startNewChat}
                className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg"
              >
                <img 
                  src={JamAILogo}
                  alt="JamAI Logo" 
                  className="w-8 h-8 rounded-lg"
                />
                <div className="text-left">
                  <h1 className="text-lg font-semibold text-foreground">JamAI</h1>
                  <p className="text-sm text-muted-foreground">Jamaican AI Assistant</p>
                </div>
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <SubscriptionBadge />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Chat Area - Fixed height with proper scrolling */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="h-full">
              {isEmpty ? (
                <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto p-8">
                  <EmptyStateCard
                    icon={MessageSquare}
                    title="Welcome to JamAI!"
                    description="Start a conversation with your AI assistant. You can ask questions, get help with tasks, or have a casual chat!"
                  />
                  <ChatSuggestions onSuggestionClick={handleSuggestionClick} />
                </div>
              ) : (
                <div className="p-4">
                  <div className="max-w-4xl mx-auto space-y-4">
                    {messages.map((message) => (
                      <ChatMessage
                        key={message.id}
                        message={message.text}
                        isUser={message.isUser}
                        timestamp={message.timestamp}
                      />
                    ))}
                    {isLoading && <TypingIndicator />}
                    <div ref={messagesEndRef} className="h-4" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Input - Fixed at bottom */}
          <div className="border-t border-border bg-background shrink-0">
            <div className="p-4">
              <div className="max-w-4xl mx-auto">
                <ChatInput
                  onSendMessage={handleSendMessage}
                  onFileUpload={(files, prompt) => handleFileUpload(files.map(f => f.file), prompt)}
                  disabled={isLoading || isUploading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <UserProfileSettings
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
};

export default Index;