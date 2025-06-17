import React, { useState, useRef, useEffect } from 'react';
import { Menu, Languages, FileText } from 'lucide-react';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';
import ChatSuggestions from '@/components/ChatSuggestions';
import ChatSummary from '@/components/ChatSummary';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import ThemeToggle from '@/components/ThemeToggle';
import TranslationMode from '@/components/TranslationMode';
import ApiKeyInput from '@/components/ApiKeyInput';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/types/Message';
import { getChatHistory, addToHistory, clearHistory } from '@/utils/chatHistory';
import { detectLanguage } from '@/utils/languageDetection';
import { generatePatoisResponse } from '@/utils/patoisResponses';
import { geminiService } from '@/services/geminiService';
import { openaiService } from '@/services/openaiService';

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
  const [showTranslationMode, setShowTranslationMode] = useState(false);
  const [currentService, setCurrentService] = useState<AIService>('gemini');
  const [apiKey, setApiKey] = useState<string>('AIzaSyDOhgop270EBYX5seQfbevXp3f8hfIYQfU');
  const [hasValidApiKey, setHasValidApiKey] = useState<boolean>(true);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');

  // ============================
  // REFS
  // ============================

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  // ============================
  // MESSAGE HANDLING
  // ============================

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: generateMessageId(),
      text: text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    scrollToBottom();
    setIsTyping(true);

    try {
      const language = await detectLanguage(text);
      let responseText: string;

      if (language === 'patois') {
        responseText = await (currentService === 'gemini' 
          ? geminiService.generateResponse(text, false, [])
          : openaiService.generateResponse(text, false, [])
        ).then(response => response.message);
      } else {
        responseText = await generatePatoisResponse(text);
      }

      const aiMessage: Message = {
        id: generateMessageId(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, aiMessage]);
      addToHistory(userMessage, aiMessage);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleClearHistory = () => {
    setMessages([]);
    clearHistory();
    setChatHistory([]);
  };

  const handleNewChat = () => {
    const newChatId = generateChatId();
    setCurrentChatId(newChatId);
    setMessages([]);
  };

  const handleLoadChat = (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages);
    }
  };

  const handleDeleteChats = (chatIds: string[]) => {
    setChatHistory(prev => prev.filter(chat => !chatIds.includes(chat.id)));
    if (chatIds.includes(currentChatId)) {
      handleNewChat();
    }
  };

  const handleClearAllHistory = () => {
    setChatHistory([]);
    handleNewChat();
    clearHistory();
  };

  // ============================
  // EFFECTS
  // ============================

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Set the API key in the gemini service
    geminiService.setApiKey(apiKey);
    setHasValidApiKey(!!apiKey);
  }, [apiKey, currentService]);

  useEffect(() => {
    const newChatId = generateChatId();
    setCurrentChatId(newChatId);
  }, []);

  // ============================
  // API KEY HANDLERS
  // ============================

  const handleApiKeySet = (newApiKey: string) => {
    if (newApiKey) {
      setApiKey(newApiKey);
      localStorage.setItem(`${currentService}ApiKey`, newApiKey);
      setHasValidApiKey(true);
      toast({
        title: 'API Key Set',
        description: `API Key for ${currentService.toUpperCase()} has been successfully set.`,
      });
    } else {
      setHasValidApiKey(false);
      localStorage.removeItem(`${currentService}ApiKey`);
      toast({
        title: 'API Key Removed',
        description: `API Key for ${currentService.toUpperCase()} has been successfully removed.`,
      });
    }
  };
  
  const handleOpenTranslationMode = () => {
    setShowTranslationMode(true);
  };

  const handleCloseTranslationMode = () => {
    setShowTranslationMode(false);
  };

  // ============================
  // RENDER
  // ============================

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full relative">
        {/* Chat History Sidebar */}
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

        {/* Main Content Area */}
        <SidebarInset className="flex-1">
          <div className="flex flex-col h-full relative">
            {/* Header with navigation and controls */}
            <header className="glass-effect border-b px-4 py-3 modern-shadow">
              <div className="flex items-center justify-between max-w-6xl mx-auto">
                <div className="flex items-center gap-3">
                  <SidebarTrigger />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-jamaican-gold to-jamaican-green rounded-lg flex items-center justify-center">
                      <span className="text-lg">🇯🇲</span>
                    </div>
                    <div>
                      <h1 className="font-bold text-lg jamaican-text-gradient">JamAI</h1>
                      <p className="text-xs text-muted-foreground">Jamaican AI Assistant</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {messages.length > 1 && (
                    <Button
                      onClick={handleOpenTranslationMode}
                      variant="ghost"
                      size="sm"
                      className="group relative overflow-hidden backdrop-blur-sm border border-border/50 bg-background/50 hover:bg-background/80 dark:bg-gradient-to-r dark:from-jamaican-green/20 dark:to-jamaican-gold/20 dark:hover:from-jamaican-green/30 dark:hover:to-jamaican-gold/30 dark:border-jamaican-gold/30 transition-all duration-300 ease-out shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-2 relative z-10">
                        <Languages className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                        <span className="hidden sm:inline font-medium">Translation</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-jamaican-gold/10 to-jamaican-green/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Button>
                  )}
                  <ThemeToggle />
                  <Badge 
                    variant="secondary" 
                    className="bg-blue-100 text-blue-800 border-blue-200 rounded-md pointer-events-none"
                  >
                    {currentService.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </header>

            {/* Main chat area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Welcome message and suggestions */}
                  {messages.length === 0 && (
                    <>
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gradient-to-br from-jamaican-gold to-jamaican-green rounded-2xl flex items-center justify-center mx-auto mb-6 modern-shadow">
                          <span className="text-3xl">🇯🇲</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-4 jamaican-text-gradient">
                          Welcome to JamAI
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                          Your friendly Jamaican AI assistant. Ask me anything in English or Patois, 
                          and I'll respond in authentic Jamaican style!
                        </p>
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

                  {/* Typing indicator */}
                  {isTyping && <TypingIndicator />}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Chat input area */}
              <div className="px-4 pb-4">
                <div className="max-w-4xl mx-auto">
                  <ChatInput 
                    onSendMessage={handleSendMessage} 
                    disabled={isTyping}
                  />
                  {messages.length > 4 && (
                    <div className="mt-4">
                      <ChatSummary onClose={() => {}} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>

        {/* Floating Translation Button */}
        {messages.length > 1 && !showTranslationMode && (
          <Button
            onClick={handleOpenTranslationMode}
            className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full shadow-xl hover:shadow-2xl bg-gradient-to-br from-jamaican-gold via-jamaican-gold/90 to-jamaican-green hover:from-jamaican-gold/95 hover:via-jamaican-gold/85 hover:to-jamaican-green/95 transition-all duration-300 ease-out transform hover:scale-105 border border-white/20 backdrop-blur-sm group"
            size="icon"
            title="Open Translation Mode"
          >
            <Languages className="w-6 h-6 text-white transition-transform duration-200 group-hover:scale-110" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-50" />
          </Button>
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
  );
};

export default Index;
