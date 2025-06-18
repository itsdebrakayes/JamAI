import React, { useState, useRef, useEffect } from 'react';
import { Menu, Languages, FileText } from 'lucide-react';
import ChatMessage from '@/components/ChatMessage';
import TypingMessage from '@/components/TypingMessage';
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
import { getChatHistory, addToHistory, clearHistory, saveChatHistory, loadChatHistory } from '@/utils/chatHistory';
import { detectLanguage } from '@/utils/languageDetection';
import { generatePatoisResponse } from '@/utils/patoisResponses';
import { geminiService } from '@/services/geminiService';
import { openaiService } from '@/services/openaiService';
import { locationAwareService } from '@/services/locationAwareService';

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

  const generateChatTitle = (firstMessage: string): string => {
    return firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage;
  };

  // ============================
  // MESSAGE HANDLING
  // ============================

  const handleTypingComplete = () => {
    if (typingMessage) {
      const finalMessages = [...messages, typingMessage];
      setMessages(finalMessages);
      addToHistory(messages[messages.length - 1], typingMessage);

      // Save chat history if this is the first message
      if (messages.length === 1) {
        const chatTitle = generateChatTitle(messages[0].text);
        const newChat: ChatHistory = {
          id: currentChatId,
          title: chatTitle,
          messages: finalMessages,
          createdAt: new Date()
        };
        const updatedHistory = [newChat, ...chatHistory];
        setChatHistory(updatedHistory);
        saveChatHistory(updatedHistory);
      } else {
        // Update existing chat
        const updatedHistory = chatHistory.map(chat => 
          chat.id === currentChatId 
            ? { ...chat, messages: finalMessages }
            : chat
        );
        setChatHistory(updatedHistory);
        saveChatHistory(updatedHistory);
      }
      
      setTypingMessage(null);
    }
    setIsTyping(false);
    scrollToBottom();
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

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

    try {
      const language = await detectLanguage(text);
      
      // Use location-aware service for all responses
      const response = await locationAwareService.processQuery(
        text, 
        language === 'patois', 
        newMessages, 
        currentService
      );

      const aiMessage: Message = {
        id: generateMessageId(),
        text: response.message,
        isUser: false,
        timestamp: new Date(),
      };

      setTypingMessage(aiMessage);
    } catch (error: any) {
      console.error('Error sending message:', error);
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

  const handleClearHistory = () => {
    setMessages([]);
    setTypingMessage(null);
    clearHistory();
    setChatHistory([]);
    saveChatHistory([]);
  };

  const handleNewChat = () => {
    const newChatId = generateChatId();
    setCurrentChatId(newChatId);
    setMessages([]);
    setTypingMessage(null);
  };

  const handleLoadChat = (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages);
      setTypingMessage(null);
    }
  };

  const handleDeleteChats = (chatIds: string[]) => {
    const updatedHistory = chatHistory.filter(chat => !chatIds.includes(chat.id));
    setChatHistory(updatedHistory);
    saveChatHistory(updatedHistory);
    if (chatIds.includes(currentChatId)) {
      handleNewChat();
    }
  };

  const handleClearAllHistory = () => {
    setChatHistory([]);
    saveChatHistory([]);
    handleNewChat();
    clearHistory();
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
    // Set the API key in the gemini service
    geminiService.setApiKey(apiKey);
    setHasValidApiKey(!!apiKey);
  }, [apiKey, currentService]);

  useEffect(() => {
    // Load chat history on component mount
    const savedHistory = loadChatHistory();
    setChatHistory(savedHistory);
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
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={handleHeaderClick}
                    title="Start new chat"
                  >
                    <span className="text-lg font-bold">🇯🇲</span>
                    <div>
                      <h1 className="font-bold text-lg jamaican-text-gradient">JamAI</h1>
                      <p className="text-xs text-muted-foreground">Jamaican AI Assistant</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
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
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50 group-hover:opacity-30 transition-opacity duration-300" />
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
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50 group-hover:opacity-30 transition-opacity duration-300" />
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
                  {messages.length === 0 && !typingMessage && (
                    <>
                      <div className="text-center py-12">
                        <span className="text-6xl font-bold block mb-6">🇯🇲</span>
                        <h2 className="text-3xl font-bold mb-4 jamaican-text-gradient">
                          Welcome to JamAI
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                          Your friendly Jamaican AI assistant with location awareness. Ask me anything in English or Patois, 
                          find nearby places, and I'll respond in authentic Jamaican style!
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
                    disabled={isTyping}
                  />
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
  );
};

export default Index;
