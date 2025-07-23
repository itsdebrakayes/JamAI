import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Menu, MessageSquare, FileText, X } from 'lucide-react';
import { openaiService } from '@/services/openaiService';
import { locationAwareService } from '@/services/locationAwareService';
import { geminiService } from '@/services/geminiService';
import { detectLanguage } from '@/utils/languageDetection';
import { v4 as uuidv4 } from 'uuid';
import { useChatHistory } from '@/utils/chatHistory';
import { useChatGrouping } from '@/utils/chatGrouping';
import { useFileUpload } from '@/hooks/useFileUpload';
import EmptyStateCard from '@/components/EmptyStateCard';
import ChatSuggestions from '@/components/ChatSuggestions';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  files?: File[];
}

interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  lastMessageTime: Date;
}

interface MainContentProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  currentChatId: string | null;
  setCurrentChatId: React.Dispatch<React.SetStateAction<string | null>>;
  chatHistory: ChatHistory[];
  saveChatHistory: (history: ChatHistory[]) => void;
  startNewChat: () => void;
  refreshChatHistory: () => void;
}

const MainContent = ({ 
  messages, 
  setMessages, 
  currentChatId, 
  setCurrentChatId, 
  chatHistory, 
  saveChatHistory, 
  startNewChat,
  refreshChatHistory
}: MainContentProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<'openai' | 'gemini' | 'location-aware'>('openai');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { uploadFiles, isUploading } = useFileUpload();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (
    messageText: string,
    files?: File[]
  ) => {
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
      // Ensure we have a chat session
      if (!currentChatId) {
        try {
          const { data: sessionData, error: sessionError } = await supabase
            .from('chat_sessions')
            .insert({
              user_id: user?.id,
              title: messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              message_count: 0
            })
            .select('id')
            .single();

          if (sessionError) {
            console.error('Session creation error:', sessionError);
            setIsLoading(false);
            return;
          }
          
          setCurrentChatId(sessionData.id);
          
          // Manually refresh chat history after creating new session
          setTimeout(() => refreshChatHistory(), 200);
        } catch (error) {
          console.error('Error creating chat session:', error);
          setIsLoading(false);
          return;
        }
      }

      // Handle file uploads first if present
      if (files && files.length > 0) {
        try {
          const response = await uploadFiles(files, messageText, user?.id || '', currentChatId);
          
          const aiMessage: Message = {
            id: uuidv4(),
            text: response.message,
            isUser: false,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, aiMessage]);
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

      // Regular text message handling
      const isUserMessagePatois = detectLanguage(messageText) === 'patois';
      
      let aiResponse;
      switch (selectedService) {
        case 'openai':
          aiResponse = await openaiService.generateResponse(
            messageText, 
            isUserMessagePatois, 
            messages,
            currentChatId
          );
          break;
        case 'gemini':
          aiResponse = await geminiService.generateResponse(
            messageText, 
            isUserMessagePatois, 
            messages
          );
          break;
        case 'location-aware':
          aiResponse = await locationAwareService.processQuery(
            messageText, 
            isUserMessagePatois, 
            messages
          );
          break;
        default:
          aiResponse = await openaiService.generateResponse(
            messageText, 
            isUserMessagePatois, 
            messages,
            currentChatId
          );
      }

      const aiMessage: Message = {
        id: uuidv4(),
        text: aiResponse.message,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save messages to database
      if (currentChatId) {
        try {
          await supabase.from('messages').insert([
            {
              content: userMessage.text,
              is_user: true,
              session_id: currentChatId,
              user_id: user?.id,
              message_type: files && files.length > 0 ? 'file_upload' : 'text',
              metadata: files && files.length > 0 ? { file_count: files.length } : null
            },
            {
              content: aiMessage.text,
              is_user: false,
              session_id: currentChatId,
              user_id: user?.id,
              message_type: 'text'
            }
          ]);

          // Update session message count
          await supabase
            .from('chat_sessions')
            .update({
              message_count: messages.length + 2,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentChatId);
        } catch (error) {
          console.error('Error saving messages:', error);
        }
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
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload files.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Create a new chat session if we don't have one
      let sessionId = currentChatId;
      if (!sessionId) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            title: `File Upload - ${files[0]?.name || 'Multiple Files'}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            message_count: 0
          })
          .select('id')
          .single();

        if (sessionError) {
          console.error('Session creation error:', sessionError);
          throw sessionError;
        }
        
        sessionId = sessionData.id;
        setCurrentChatId(sessionId);
        
        // Manually refresh chat history after creating new session
        setTimeout(() => refreshChatHistory(), 200);
      }

      // Create user message for file upload
      const userMessage: Message = {
        id: uuidv4(),
        text: prompt || `Uploaded ${files.length} file(s)`,
        isUser: true,
        timestamp: new Date(),
        files: files
      };

      setMessages(prev => [...prev, userMessage]);

      // Process files using the file upload service
      const response = await uploadFiles(files, prompt, user.id, sessionId);
      
      const aiMessage: Message = {
        id: uuidv4(),
        text: response.message,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save messages to database
      await supabase.from('messages').insert([
        {
          content: userMessage.text,
          is_user: true,
          session_id: sessionId,
          user_id: user.id,
          message_type: 'file_upload',
          metadata: { 
            file_count: files.length,
            file_names: files.map(f => f.name)
          }
        },
        {
          content: aiMessage.text,
          is_user: false,
          session_id: sessionId,
          user_id: user.id,
          message_type: 'text'
        }
      ]);

      // Update session message count
      await supabase
        .from('chat_sessions')
        .update({
          message_count: messages.length + 2,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload Error",
        description: "Failed to process uploaded files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleServiceChange = (service: 'openai' | 'gemini' | 'location-aware') => {
    setSelectedService(service);
    toast({
      title: "Service Changed",
      description: `Now using ${service === 'location-aware' ? 'Location-Aware' : service.charAt(0).toUpperCase() + service.slice(1)} service`,
    });
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-yellow-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">JamAI</h1>
                <p className="text-sm text-muted-foreground">Yuh cultural AI assistant</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={selectedService === 'openai' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleServiceChange('openai')}
            >
              OpenAI
            </Button>
            <Button
              variant={selectedService === 'gemini' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleServiceChange('gemini')}
            >
              Gemini
            </Button>
            <Button
              variant={selectedService === 'location-aware' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleServiceChange('location-aware')}
            >
              Smart
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 bg-black/50 transition-opacity md:hidden",
        isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className={cn(
          "fixed left-0 top-0 h-full w-80 bg-background border-r transition-transform",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Chat History</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ChatHistorySidebar
            chatHistory={chatHistory}
            currentChatId={currentChatId}
            onChatSelect={(chatId) => {
              setCurrentChatId(chatId);
              setIsSidebarOpen(false);
            }}
            onStartNewChat={() => {
              startNewChat();
              setIsSidebarOpen(false);
            }}
            onDeleteChat={(chatId) => {
              // Handle chat deletion
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-80 border-r border-border bg-muted/30">
          <ChatHistorySidebar
            chatHistory={chatHistory}
            currentChatId={currentChatId}
            onChatSelect={setCurrentChatId}
            onStartNewChat={startNewChat}
            onDeleteChat={(chatId) => {
              // Handle chat deletion
            }}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            {isEmpty ? (
              <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto">
                <EmptyStateCard onSuggestionClick={handleSuggestionClick} />
                <ChatSuggestions onSuggestionClick={handleSuggestionClick} />
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-4">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message.text}
                    isUser={message.isUser}
                    timestamp={message.timestamp}
                    files={message.files}
                  />
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Chat Input */}
          <div className="border-t border-border bg-background p-4">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                onSendMessage={handleSendMessage}
                onFileUpload={handleFileUpload}
                disabled={isLoading || isUploading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { chatHistory, saveChatHistory, loadChatHistoryFromDB } = useChatHistory();
  const { toast } = useToast();

  // Load chat history from database on mount
  useEffect(() => {
    if (user) {
      loadChatHistoryFromDB();
    }
  }, [user]);

  // Set up real-time subscription for chat sessions
  useEffect(() => {
    if (!user) return;

    const setupRealtime = async () => {
      if (user) {
        const channel = supabase
          .channel('chat_sessions_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'chat_sessions',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log('Real-time chat sessions change:', payload);
              // Reload chat history when changes occur with a small delay to ensure DB consistency
              setTimeout(() => {
                loadChatHistoryFromDB();
              }, 100);
            }
          )
          .subscribe();

        return channel;
      }
      return null;
    };

    // Store the cleanup function
    let channelCleanup: any = null;
    
    setupRealtime().then(channel => {
      channelCleanup = channel;
    });

    // Cleanup function
    return () => {
      if (channelCleanup) {
        supabase.removeChannel(channelCleanup);
      }
    };
  }, [user]);

  const saveChatHistory = async (history: ChatHistory[]) => {
    // This function is now handled by the database
    // We'll keep it for compatibility but it's mostly a no-op
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
  };

  const loadChatForId = async (chatId: string) => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', chatId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error loading chat messages:', messagesError);
        return;
      }

      const loadedMessages: Message[] = messagesData.map(msg => ({
        id: msg.id,
        text: msg.content,
        isUser: msg.is_user,
        timestamp: new Date(msg.created_at)
      }));

      setMessages(loadedMessages);
      setCurrentChatId(chatId);
    } catch (error) {
      console.error('Error loading chat:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history.",
        variant: "destructive"
      });
    }
  };

  // Load chat when currentChatId changes
  useEffect(() => {
    if (currentChatId) {
      loadChatForId(currentChatId);
    }
  }, [currentChatId]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to JamAI</h1>
          <p className="text-muted-foreground mb-8">Please sign in to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background">
      <MainContent
        messages={messages}
        setMessages={setMessages}
        currentChatId={currentChatId}
        setCurrentChatId={setCurrentChatId}
        chatHistory={chatHistory}
        saveChatHistory={saveChatHistory}
        startNewChat={startNewChat}
        refreshChatHistory={loadChatHistoryFromDB}
      />
    </div>
  );
};

export default Index;
