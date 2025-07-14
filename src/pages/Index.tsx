
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from '@/components/ui/button';
import { Send, Plus, X, Copy, CheckCircle, Menu, Settings, Sun, Moon } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
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
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ChatMessage from '@/components/ChatMessage';
import TypingIndicator from '@/components/TypingIndicator';
import TypingMessage from '@/components/TypingMessage';
import chatSuggestionsData from '@/data/chatSuggestions.json';

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
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [typingMessage, setTypingMessage] = useState<Message | null>(null);
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
    // Scroll to the bottom when messages update or typing message changes
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingMessage]);

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
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Create or get current session ID
    let sessionId = currentChatId;
    if (!sessionId) {
      if (user) {
        // For authenticated users: create a new UUID session but link it to user_id
        sessionId = uuidv4();
        setCurrentChatId(sessionId);
        
        // Create new session in database
        try {
          const { error: sessionError } = await supabase
            .from('chat_sessions')
            .insert({
              id: sessionId,
              title: messageText.substring(0, 50) + '...',
              user_id: user.id,
              message_count: 0
            });

          if (sessionError) {
            console.error('Error creating chat session:', sessionError);
            setIsLoading(false);
            return; // Don't proceed if session creation fails
          }
        } catch (error) {
          console.error('Error creating chat session:', error);
          setIsLoading(false);
          return; // Don't proceed if session creation fails
        }
      } else {
        // For guests: use a temporary UUID and save only to localStorage
        sessionId = uuidv4();
        setCurrentChatId(sessionId);
      }
    }
    
    const userMessage = {
      id: uuidv4(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Save user message to database (only for authenticated users)
    if (user) {
      try {
        const { error: userMsgError } = await supabase
          .from('messages')
          .insert({
            id: userMessage.id,
            content: userMessage.text,
            is_user: true,
            session_id: sessionId,
            user_id: user.id
          });

        if (userMsgError) throw userMsgError;
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    } else {
      // For guests, save to localStorage only
      saveMessagesToLocalStorage(newMessages);
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
          id: uuidv4(),
          text: `Here's the image I generated for you: ![Generated Image](data:image/png;base64,${imageData})`,
          isUser: false,
          timestamp: new Date(),
          isPatois: false
        };
        
        // Set typing message for animation
        setTypingMessage(aiMessage);
        
        // Save AI message to database (only for authenticated users)
        if (user) {
          try {
            const { error: aiMsgError } = await supabase
              .from('messages')
              .insert({
                id: aiMessage.id,
                content: aiMessage.text,
                is_user: false,
                session_id: sessionId,
                user_id: user.id
              });

            if (aiMsgError) throw aiMsgError;
          } catch (error) {
            console.error('Error saving AI message:', error);
          }
        } else {
          // For guests, save to localStorage only
          saveMessagesToLocalStorage([...newMessages, aiMessage]);
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
          id: uuidv4(),
          text: response.message,
          isUser: false,
          timestamp: new Date(),
          isPatois: response.isPatois
        };

        // Set typing message for animation
        setTypingMessage(aiMessage);
        
        // Save AI message to database (only for authenticated users)
        if (user) {
          try {
            const { error: aiMsgError } = await supabase
              .from('messages')
              .insert({
                id: aiMessage.id,
                content: aiMessage.text,
                is_user: false,
                session_id: sessionId,
                user_id: user.id
              });

            if (aiMsgError) throw aiMsgError;
          } catch (error) {
            console.error('Error saving AI message:', error);
          }
        } else {
          // For guests, save to localStorage only
          saveMessagesToLocalStorage([...newMessages, aiMessage]);
        }
      }

      // Update session message count for both cases (only for authenticated users)
      if (user) {
        try {
          const { error: updateError } = await supabase
            .from('chat_sessions')
            .update({
              message_count: messages.length + 2, // +2 for user and AI messages
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionId)
            .eq('user_id', user.id);

          if (updateError) throw updateError;
        } catch (error) {
          console.error('Error updating session:', error);
        }
      }

      incrementUsageCount();
      
    } catch (error) {
      console.error('Error in sendMessage:', error);
      
      const errorMessage = {
        id: uuidv4(),
        text: "Mi sorry, but mi run inna some trouble right now. Try again inna likkle bit.",
        isUser: false,
        timestamp: new Date(),
        isPatois: true
      };

      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      
      // Save error message to database (only for authenticated users)
      if (user) {
        try {
          const { error: errorMsgError } = await supabase
            .from('messages')
            .insert({
              id: errorMessage.id,
              content: errorMessage.text,
              is_user: false,
              session_id: sessionId,
              user_id: user.id
            });

          if (errorMsgError) throw errorMsgError;
        } catch (error) {
          console.error('Error saving error message:', error);
        }
      } else {
        // For guests, save to localStorage only
        saveMessagesToLocalStorage(finalMessages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, isPositive: boolean) => {
    // Here you could save feedback to database or analytics
    console.log(`Feedback for message ${messageId}: ${isPositive ? 'positive' : 'negative'}`);
  };

  const handleFileUpload = async (files: any[], prompt: string) => {
    if (!files.length || !prompt.trim() || isLoading) return;

    setIsLoading(true);

    // Create user message outside try block so it's available in catch
    const userMessage: Message = {
      id: uuidv4(),
      text: `📎 Uploaded ${files.length} file(s): ${files.map(f => f.file.name).join(', ')}\n\n${prompt}`,
      isUser: true,
      timestamp: new Date()
    };

    try {
      console.log('Starting file upload with assistant API...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create or get current session ID
      let sessionId = currentChatId;
      if (!sessionId) {
        sessionId = uuidv4();
        setCurrentChatId(sessionId);
        
        // Create new session in database for authenticated users
        if (user) {
          const { error: sessionError } = await supabase
            .from('chat_sessions')
            .insert({
              id: sessionId,
              title: `File Upload: ${files.map(f => f.file.name).join(', ')}`,
              user_id: user.id,
              message_count: 0
            });

          if (sessionError) {
            console.error('Session creation error:', sessionError);
            throw sessionError;
          }
        }
      }

      // Add user message immediately to UI
      setMessages([...messages, userMessage]);

      // Extract actual File objects from the uploaded files
      const actualFiles: File[] = files.map(f => f.file);

      // Process files with the new assistant API
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('userId', user?.id || 'anonymous');
      
      if (sessionId) {
        formData.append('sessionId', sessionId);
      }
      
      // Add files to form data
      actualFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      console.log('Calling assistants-file-processor...');
      
      const response = await supabase.functions.invoke('assistants-file-processor', {
        body: formData,
      });

      if (response.error) {
        console.error('Assistant processing error:', response.error);
        throw new Error(`AI processing failed: ${response.error.message}`);
      }

      console.log('Assistant processing successful:', response.data);

      // Add AI response to UI
      const aiMessage: Message = {
        id: uuidv4(),
        text: response.data.message,
        isUser: false,
        timestamp: new Date(),
        isPatois: false
      };

      setMessages([...messages, userMessage, aiMessage]);

      // Store thread ID for future messages in this session
      if (response.data.threadId) {
        console.log('Thread ID stored:', response.data.threadId);
        // You could store this in session state if needed for continuity
      }

      toast({
        title: "Files processed successfully",
        description: `${files.length} file(s) analyzed by AI`,
        variant: "default"
      });

    } catch (error) {
      console.error('Error in file upload:', error);
      
      const errorMessage: Message = {
        id: uuidv4(),
        text: "Mi sorry, but mi cyaan process di files right now. Make sure yuh files dem not too big and try again.",
        isUser: false,
        timestamp: new Date(),
        isPatois: true
      };

      setMessages([...messages, userMessage, errorMessage]);
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Check if this is a predefined suggestion with responses
    const suggestionData = chatSuggestionsData.suggestions.find(s => s.text === suggestion);
    
    if (suggestionData && suggestionData.responses) {
      // Use predefined response instead of sending to AI
      const randomResponse = suggestionData.responses[Math.floor(Math.random() * suggestionData.responses.length)];
      
      // Create user message
      const userMessage = {
        id: uuidv4(),
        text: suggestion,
        isUser: true,
        timestamp: new Date()
      };

      // Create AI response message
      const aiMessage = {
        id: uuidv4(),
        text: randomResponse,
        isUser: false,
        timestamp: new Date(),
        isPatois: false
      };

      // Add both messages
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setTypingMessage(aiMessage);
    } else {
      // For suggestions without predefined responses, use normal AI flow
      sendMessage(suggestion);
    }
  };

  const handleTypingComplete = () => {
    if (typingMessage) {
      // Add the completed message to the messages array
      const finalMessages = [...messages, typingMessage];
      setMessages(finalMessages);
      setTypingMessage(null);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b glass-effect modern-shadow">
        <div className="flex items-center gap-4">
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
                    <div className="flex flex-col items-center gap-3 text-center">
                      <span className="text-2xl">👋</span>
                      <div>
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
                <ChatMessage
                  key={message.id}
                  message={message.text}
                  isUser={message.isUser}
                  timestamp={message.timestamp}
                  messageId={message.id}
                  onFeedback={handleFeedback}
                />
              ))}
              
              {/* Show typing indicator when loading and no typing message */}
              {isLoading && !typingMessage && <TypingIndicator />}
              
              {/* Show typing message when AI response is being typed */}
              {typingMessage && (
                <TypingMessage
                  fullMessage={typingMessage.text}
                  isUser={typingMessage.isUser}
                  timestamp={typingMessage.timestamp}
                  onComplete={handleTypingComplete}
                />
              )}
              
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t">
        <ChatInput 
          onSendMessage={sendMessage} 
          onFileUpload={handleFileUpload}
          disabled={isLoading} 
        />
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
  const { toast } = useToast();

  // Load chat history from Supabase
  const loadChatHistoryFromDB = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('No authenticated user, skipping chat history load');
        return;
      }

      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (sessions) {
        const historyData: ChatHistory[] = await Promise.all(
          sessions.map(async (session) => {
            const { data: sessionMessages, error: messagesError } = await supabase
              .from('messages')
              .select('*')
              .eq('session_id', session.id)
              .eq('user_id', user.id)
              .order('created_at', { ascending: true });

            if (messagesError) {
              console.error('Error loading messages for session:', session.id, messagesError);
              return {
                id: session.id,
                title: session.title || session.auto_title || 'New Chat',
                messages: [],
                createdAt: new Date(session.created_at),
                autoTitle: session.auto_title,
                keywords: session.keywords,
                summary: session.summary
              };
            }

            return {
              id: session.id,
              title: session.title || session.auto_title || 'New Chat',
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

        console.log(`✅ Loaded ${historyData.length} chat sessions for user`);
        setChatHistory(historyData);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  useEffect(() => {
    loadChatHistoryFromDB();
    
    // Set up real-time subscription for chat_sessions changes
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const channel = supabase
          .channel('chat_sessions_changes')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'chat_sessions',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              console.log('Real-time chat sessions change:', payload);
              // Reload chat history when changes occur
              loadChatHistoryFromDB();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    };

    setupRealtime();
  }, []);

  const saveChatHistory = async (history: ChatHistory[]) => {
    // Update local state
    setChatHistory(history);
  };

  const startNewChat = async () => {
    // Clear current messages and start fresh
    setMessages([]);
    setCurrentChatId(''); // Reset to empty, will be set based on user authentication in sendMessage
  };

  const loadChat = async (chatId: string) => {
    try {
      console.log('Loading chat with ID:', chatId);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('No authenticated user found');
        toast({
          title: "Authentication required",
          description: "Please sign in to load your chats.",
          variant: "destructive",
        });
        return;
      }
      
      const { data: sessionMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', chatId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Database error loading messages:', error);
        toast({
          title: "Error loading chat",
          description: "Failed to load chat messages. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('Raw session messages:', sessionMessages);

      if (sessionMessages && sessionMessages.length > 0) {
        const loadedMessages: Message[] = sessionMessages.map(msg => ({
          id: msg.id,
          text: msg.content,
          isUser: msg.is_user,
          timestamp: new Date(msg.created_at)
        }));
        
        console.log('Mapped messages:', loadedMessages);
        setMessages(loadedMessages);
        setCurrentChatId(chatId);
      } else {
        console.log('No messages found for chat ID:', chatId);
        // Check if the chat session exists but has no messages - this indicates a data inconsistency
        const { data: session } = await supabase
          .from('chat_sessions')
          .select('title, message_count')
          .eq('id', chatId)
          .eq('user_id', user.id)
          .single();
        
        if (session && session.message_count > 0) {
          console.warn('Chat session exists with message_count > 0 but no messages found. Data inconsistency detected.');
          toast({
            title: "Empty chat detected",
            description: "This chat appears to be empty or corrupted. Starting fresh.",
            variant: "default",
          });
        }
        
        setMessages([]);
        setCurrentChatId(chatId);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      toast({
        title: "Error",
        description: "Failed to load chat. Please try again.",
        variant: "destructive",
      });
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
      setCurrentChatId(''); // Reset to empty
    } catch (error) {
      console.error('Error clearing all history:', error);
    }
  };

  const renameChat = async (chatId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq('id', chatId);

      if (error) throw error;

      // Update local state
      setChatHistory(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      ));
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        <ChatHistorySidebar 
          chatHistory={chatHistory} 
          currentChatId={currentChatId}
          onNewChat={startNewChat}
          onLoadChat={loadChat}
          onDeleteChats={deleteChats}
          onClearAllHistory={clearAllHistory}
          onRenameChat={renameChat}
        />
        <main className="flex-1 min-w-0">
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
