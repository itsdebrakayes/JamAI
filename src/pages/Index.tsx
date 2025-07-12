
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from '@/components/ui/button';
import { Send, Plus, X, Copy, CheckCircle, Menu, Settings, Sun, Moon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { detectLanguage } from '@/utils/languageDetection';
import { locationAwareService } from '@/services/locationAwareService';
import ChatInput from '@/components/ChatInput';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import ChatSuggestions from '@/components/ChatSuggestions';
import SubscriptionBadge from '@/components/SubscriptionBadge';
import ThemeToggle from '@/components/ThemeToggle';
import UserProfileSettings from '@/components/UserProfileSettings';
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isPatois?: boolean;
}

interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  autoTitle?: string;
  keywords?: string[];
  summary?: string;
}

interface MainContentProps {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  currentChatId: string;
  setCurrentChatId: (id: string) => void;
  chatHistory: ChatHistory[];
  saveChatHistory: (history: ChatHistory[]) => void;
  startNewChat: () => void;
}

const MainContent = ({ 
  messages, 
  setMessages, 
  currentChatId, 
  setCurrentChatId, 
  chatHistory, 
  saveChatHistory, 
  startNewChat 
}: MainContentProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast()
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load messages from local storage on initial load
    const storedMessages = localStorage.getItem('chat-messages');
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }

    // Load usage count from local storage
    const storedUsageCount = localStorage.getItem('usage-count');
    if (storedUsageCount) {
      setUsageCount(parseInt(storedUsageCount, 10));
    }

    // Check if the service is configured
    setIsConfigured(true);
  }, []);

  useEffect(() => {
    // Save messages to local storage whenever messages change
    localStorage.setItem('chat-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    // Save usage count to local storage whenever it changes
    localStorage.setItem('usage-count', usageCount.toString());
  }, [usageCount]);

  useEffect(() => {
    // Scroll to the bottom when messages update
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveMessagesToLocalStorage = (newMessages: Message[]) => {
    localStorage.setItem('chat-messages', JSON.stringify(newMessages));
  };

  const incrementUsageCount = () => {
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    localStorage.setItem('usage-count', newCount.toString());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setIsCopied(true);
        toast({
          title: "Copied!",
          description: "The message has been copied to your clipboard.",
        })
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy text: ", err);
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: "Failed to copy the message to your clipboard.",
        })
      });
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    setIsLoading(true);
    
    // Create or get current session ID
    let sessionId = currentChatId;
    if (!sessionId) {
      sessionId = uuidv4();
      setCurrentChatId(sessionId);
      
      // Create new session in database
      try {
        const { error: sessionError } = await supabase
          .from('chat_sessions')
          .insert({
            id: sessionId,
            title: messageText.substring(0, 50) + '...',
            user_id: (await supabase.auth.getUser()).data.user?.id || '',
            message_count: 0
          });

        if (sessionError) throw sessionError;
      } catch (error) {
        console.error('Error creating chat session:', error);
      }
    }
    
    const userMessage = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Save user message to database
    try {
      const { error: userMsgError } = await supabase
        .from('messages')
        .insert({
          id: userMessage.id,
          content: userMessage.text,
          is_user: true,
          session_id: sessionId,
          user_id: (await supabase.auth.getUser()).data.user?.id || ''
        });

      if (userMsgError) throw userMsgError;
    } catch (error) {
      console.error('Error saving user message:', error);
    }

    try {
      // Check if this is an image generation request
      const isImageGenRequest = /\b(generate|create|make|draw|design)\b.*\b(image|picture|photo|art|artwork|illustration|graphic)\b/i.test(messageText) ||
                               /\b(image|picture|photo|art|artwork|illustration|graphic)\b.*\b(generate|create|make|draw|design)\b/i.test(messageText);
      
      if (isImageGenRequest) {
        // Handle image generation
        const imageResponse = await supabase.functions.invoke('image-generation', {
          body: { prompt: messageText }
        });
        
        if (imageResponse.error) {
          throw new Error(`Image generation failed: ${imageResponse.error.message}`);
        }
        
        const { imageData } = imageResponse.data;
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: `Here's the image I generated for you: ![Generated Image](data:image/png;base64,${imageData})`,
          isUser: false,
          timestamp: new Date(),
          isPatois: false
        };
        
        const finalMessages = [...newMessages, aiMessage];
        setMessages(finalMessages);
        
        // Save AI message to database
        try {
          const { error: aiMsgError } = await supabase
            .from('messages')
            .insert({
              id: aiMessage.id,
              content: aiMessage.text,
              is_user: false,
              session_id: sessionId,
              user_id: (await supabase.auth.getUser()).data.user?.id || ''
            });

          if (aiMsgError) throw aiMsgError;
        } catch (error) {
          console.error('Error saving AI message:', error);
        }
      } else {
        // Handle regular chat
        const isPatois = detectLanguage(messageText) === 'patois';
        
        const response = await locationAwareService.processQuery(
          messageText,
          isPatois,
          newMessages
        );

        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: response.message,
          isUser: false,
          timestamp: new Date(),
          isPatois: response.isPatois
        };

        const finalMessages = [...newMessages, aiMessage];
        setMessages(finalMessages);
        
        // Save AI message to database
        try {
          const { error: aiMsgError } = await supabase
            .from('messages')
            .insert({
              id: aiMessage.id,
              content: aiMessage.text,
              is_user: false,
              session_id: sessionId,
              user_id: (await supabase.auth.getUser()).data.user?.id || ''
            });

          if (aiMsgError) throw aiMsgError;
        } catch (error) {
          console.error('Error saving AI message:', error);
        }
      }

      // Update session message count for both cases
      try {
        const { error: updateError } = await supabase
          .from('chat_sessions')
          .update({
            message_count: messages.length + 2, // +2 for user and AI messages
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        if (updateError) throw updateError;
      } catch (error) {
        console.error('Error updating session:', error);
      }

      incrementUsageCount();
      
    } catch (error) {
      console.error('Error in sendMessage:', error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Mi sorry, but mi run inna some trouble right now. Try again inna likkle bit.",
        isUser: false,
        timestamp: new Date(),
        isPatois: true
      };

      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      
      // Save error message to database
      try {
        const { error: errorMsgError } = await supabase
          .from('messages')
          .insert({
            id: errorMessage.id,
            content: errorMessage.text,
            is_user: false,
            session_id: sessionId,
            user_id: (await supabase.auth.getUser()).data.user?.id || ''
          });

        if (errorMsgError) throw errorMsgError;
      } catch (error) {
        console.error('Error saving error message:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b glass-effect modern-shadow">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="lg:hidden" />
          <Avatar>
            <AvatarImage src="/lovable-uploads/f7360586-ff1c-4d5e-b846-feaceed45e61.png" />
            <AvatarFallback>JA</AvatarFallback>
          </Avatar>
          <div className="cursor-pointer" onClick={startNewChat}>
            <h1 className="text-lg font-semibold bg-gradient-to-r from-yellow-500 to-green-600 bg-clip-text text-transparent hover:from-yellow-400 hover:to-green-500 transition-all duration-200">JamAI</h1>
            <p className="text-sm text-muted-foreground">Jamaican AI Assistant</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-green-800 via-white to-green-800 hover:from-green-900 hover:via-gray-100 hover:to-green-900 text-black border-0 rounded-full px-4 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <FileText className="w-4 h-4" />
            Summary
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <ThemeToggle />
          <SubscriptionBadge />
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <ScrollArea className="h-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-8">
              {/* Welcome Section */}
              <div className="text-center space-y-4 max-w-2xl">
                <div className="w-32 h-32 mx-auto mb-6">
                  <Avatar className="w-full h-full">
                    <AvatarImage src="/lovable-uploads/f7360586-ff1c-4d5e-b846-feaceed45e61.png" />
                    <AvatarFallback className="text-4xl">🇯🇲</AvatarFallback>
                  </Avatar>
                </div>
                
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Welcome to JamAI
                </h1>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Your friendly Jamaican AI assistant with location awareness. Ask me anything in 
                  English or Patois, find nearby places, and I'll respond in authentic Jamaican style!
                </p>
                
                <Card className="bg-gradient-to-r from-secondary/10 to-accent/10 border-secondary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👋</span>
                    <div className="text-center">
                      <p className="font-semibold text-secondary">Ready for another chat?</p>
                      <p className="text-sm text-muted-foreground">Welcome back! Ask me more about Jamaica or start fresh.</p>
                    </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Chat Suggestions */}
              <ChatSuggestions onSuggestionClick={handleSuggestionClick} />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex flex-col ${message.isUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-start gap-2 max-w-[80%]">
                    {!message.isUser && (
                      <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                        <AvatarImage src="/lovable-uploads/f7360586-ff1c-4d5e-b846-feaceed45e61.png" />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex flex-col gap-2 w-full">
                      <Card className="w-fit">
                        <CardContent className="p-3">
                          <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
                        </CardContent>
                        <CardFooter className="text-xs text-muted-foreground justify-between items-center p-3 pt-0">
                          <span>{message.timestamp.toLocaleTimeString()}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-secondary/50 h-6 w-6"
                            onClick={() => copyToClipboard(message.text)}
                            disabled={isCopied}
                          >
                            {isCopied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                    
                    {message.isUser && (
                      <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          YOU
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t">
        <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
      </div>

      {/* Settings Modal */}
      <UserProfileSettings 
        open={showSettings} 
        onOpenChange={setShowSettings} 
      />
    </div>
  );
};

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');

  // Load chat history from Supabase
  const loadChatHistoryFromDB = async () => {
    try {
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (sessions) {
        const historyData: ChatHistory[] = await Promise.all(
          sessions.map(async (session) => {
            const { data: sessionMessages, error: messagesError } = await supabase
              .from('messages')
              .select('*')
              .eq('session_id', session.id)
              .order('created_at', { ascending: true });

            if (messagesError) throw messagesError;

            return {
              id: session.id,
              title: session.title,
              messages: sessionMessages?.map(msg => ({
                id: msg.id,
                text: msg.content,
                isUser: msg.is_user,
                timestamp: new Date(msg.created_at)
              })) || [],
              createdAt: new Date(session.created_at),
              autoTitle: session.auto_title,
              keywords: session.keywords,
              summary: session.summary
            };
          })
        );

        setChatHistory(historyData);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  useEffect(() => {
    loadChatHistoryFromDB();
  }, []);

  const saveChatHistory = async (history: ChatHistory[]) => {
    // Update local state
    setChatHistory(history);
  };

  const startNewChat = async () => {
    if (messages.length > 0 && currentChatId) {
      // Save current chat to database
      try {
        const { error: sessionError } = await supabase
          .from('chat_sessions')
          .update({
            title: messages.find(m => m.isUser)?.text?.substring(0, 50) + '...' || 'New Chat',
            message_count: messages.length,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentChatId);

        if (sessionError) throw sessionError;
      } catch (error) {
        console.error('Error updating chat session:', error);
      }
    }
    
    // Clear current messages and start fresh
    setMessages([]);
    setCurrentChatId(uuidv4());
  };

  const loadChat = async (chatId: string) => {
    try {
      const { data: sessionMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (sessionMessages) {
        const loadedMessages: Message[] = sessionMessages.map(msg => ({
          id: msg.id,
          text: msg.content,
          isUser: msg.is_user,
          timestamp: new Date(msg.created_at)
        }));
        
        setMessages(loadedMessages);
        setCurrentChatId(chatId);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const deleteChats = async (chatIds: string[]) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .in('id', chatIds);

      if (error) throw error;

      // Refresh chat history
      await loadChatHistoryFromDB();
    } catch (error) {
      console.error('Error deleting chats:', error);
    }
  };

  const clearAllHistory = async () => {
    try {
      // Delete all chat sessions for the user
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      // Clear local state
      setChatHistory([]);
      setMessages([]);
      setCurrentChatId(uuidv4());
    } catch (error) {
      console.error('Error clearing all history:', error);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <ChatHistorySidebar 
          chatHistory={chatHistory} 
          currentChatId={currentChatId}
          onNewChat={startNewChat}
          onLoadChat={loadChat}
          onDeleteChats={deleteChats}
          onClearAllHistory={clearAllHistory}
        />
        <main className="flex-1">
          <MainContent 
            messages={messages}
            setMessages={setMessages}
            currentChatId={currentChatId}
            setCurrentChatId={setCurrentChatId}
            chatHistory={chatHistory}
            saveChatHistory={saveChatHistory}
            startNewChat={startNewChat}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
