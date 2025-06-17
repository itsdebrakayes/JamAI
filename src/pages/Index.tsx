import React, { useState, useRef, useEffect } from 'react';
import { Menu, Languages, FileText } from 'lucide-react';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import ChatSuggestions from '@/components/ChatSuggestions';
import TypingIndicator from '@/components/TypingIndicator';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import TypingMessage from '@/components/TypingMessage';
import TranslationMode from '@/components/TranslationMode';
import ChatSummary from '@/components/ChatSummary';
import { generatePatoisResponse, getPatoisGreeting } from '@/utils/patoisResponses';
import { Button } from '@/components/ui/button';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { detectLanguage } from '@/utils/languageDetection';
import { geminiService } from '@/services/geminiService';
import { Toaster } from '@/components/ui/toaster';
import ThemeToggle from '@/components/ThemeToggle';

/**
 * Interface defining the structure of a chat message
 * This ensures type safety throughout the application
 */
interface Message {
  id: string;          // Unique identifier for each message
  text: string;        // The actual message content
  isUser: boolean;     // True if message is from user, false if from AI
  timestamp: Date;     // When the message was created
}

/**
 * Interface defining the structure of chat history entries
 * Used for storing and retrieving previous conversations
 */
interface ChatHistory {
  id: string;          // Unique identifier for the chat session
  title: string;       // Display title (usually first user message, truncated)
  messages: Message[]; // Array of all messages in this chat
  createdAt: Date;     // When this chat was created
}

/**
 * Main Index component - The core chat interface
 * This is the primary page component that handles all chat functionality
 */
const Index = () => {
  // ============================
  // STATE MANAGEMENT
  // ============================
  
  /**
   * Array of messages in the current chat conversation
   * Each message contains id, text, isUser flag, and timestamp
   */
  const [messages, setMessages] = useState<Message[]>([]);
  
  /**
   * Boolean flag to show typing indicator when AI is generating response
   * Provides visual feedback that the system is processing
   */
  const [isTyping, setIsTyping] = useState(false);
  
  /**
   * Controls whether to show suggestion chips on the welcome screen
   * Hidden after user sends their first message
   */
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  /**
   * Array storing all previous chat conversations
   * Persisted in localStorage for cross-session memory
   */
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  
  /**
   * ID of the currently active chat session
   * Used to identify which chat is being viewed/edited
   */
  const [currentChatId, setCurrentChatId] = useState<string>('');
  
  /**
   * ID of message currently being typed out with animation
   * Null when no typing animation is active
   */
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  
  /**
   * Reference to the bottom of the messages container
   * Used for automatic scrolling when new messages arrive
   */
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Controls whether translation mode is visible
   * When true, shows side-by-side Patois and English translations
   */
  const [showTranslationMode, setShowTranslationMode] = useState(false);

  // ============================
  // UTILITY FUNCTIONS
  // ============================
  
  /**
   * Smoothly scrolls the chat to the bottom to show latest messages
   * Called when new messages are added or typing begins
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Effect hook to automatically scroll to bottom when messages change
   * Ensures users always see the latest message without manual scrolling
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ============================
  // CHAT HISTORY MANAGEMENT
  // ============================
  
  /**
   * Effect hook to load saved chat history from browser storage on app startup
   * Also performs cleanup of chats older than 30 days to prevent storage bloat
   */
  useEffect(() => {
    const savedHistory = localStorage.getItem('jamAI-chat-history');
    if (savedHistory) {
      // Parse stored JSON and convert date strings back to Date objects
      const parsedHistory = JSON.parse(savedHistory).map((chat: any) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      
      // Clean up chats older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const filteredHistory = parsedHistory.filter((chat: ChatHistory) => 
        chat.createdAt > thirtyDaysAgo
      );
      
      setChatHistory(filteredHistory);
      
      // Save cleaned history back to storage if any chats were removed
      if (filteredHistory.length !== parsedHistory.length) {
        localStorage.setItem('jamAI-chat-history', JSON.stringify(filteredHistory));
        console.log(`Cleaned up ${parsedHistory.length - filteredHistory.length} chats older than 30 days`);
      }
    }
  }, []);

  /**
   * Saves the current active chat to history storage
   * Only saves if there are actual messages (more than just the greeting)
   */
  const saveCurrentChatToHistory = () => {
    if (messages.length > 1 && currentChatId) {
      // Create chat history entry with truncated title from first user message
      const chatToSave: ChatHistory = {
        id: currentChatId,
        title: messages.find(m => m.isUser)?.text.slice(0, 50) + '...' || 'New Chat',
        messages: messages,
        createdAt: new Date()
      };

      // Remove any existing entry with same ID and add updated version to front
      const updatedHistory = chatHistory.filter(chat => chat.id !== currentChatId);
      updatedHistory.unshift(chatToSave);
      
      // Keep only last 20 chats
      const limitedHistory = updatedHistory.slice(0, 20);
      setChatHistory(limitedHistory);
      localStorage.setItem('jamAI-chat-history', JSON.stringify(limitedHistory));
    }
  };

  /**
   * Deletes specified chats from history
   * @param chatIds - Array of chat IDs to delete
   */
  const handleDeleteChats = (chatIds: string[]) => {
    const updatedHistory = chatHistory.filter(chat => !chatIds.includes(chat.id));
    setChatHistory(updatedHistory);
    localStorage.setItem('jamAI-chat-history', JSON.stringify(updatedHistory));
    
    // If the currently active chat is being deleted, start a fresh chat
    if (chatIds.includes(currentChatId)) {
      initializeChat();
    }
    
    console.log(`Deleted ${chatIds.length} chat(s)`);
  };

  /**
   * Clears all chat history from storage and memory
   * Starts a fresh chat session after clearing
   */
  const handleClearAllHistory = () => {
    setChatHistory([]);
    localStorage.removeItem('jamAI-chat-history');
    
    // Start a new chat since all history is cleared
    initializeChat();
    
    console.log('Cleared all chat history');
  };

  // ============================
  // CHAT SESSION MANAGEMENT
  // ============================
  
  /**
   * Initializes a new chat session with a greeting message
   * Saves current chat before starting new one if it has content
   */
  const initializeChat = () => {
    // Save current chat before starting new one if it has messages
    if (messages.length > 1) {
      saveCurrentChatToHistory();
    }

    // Generate unique ID for new chat session
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);

    // Create initial AI greeting message
    const initialMessage: Message = {
      id: '1',
      text: getPatoisGreeting(), // Get random Jamaican Patois greeting
      isUser: false,
      timestamp: new Date()
    };
    
    // Reset chat state for new conversation
    setMessages([initialMessage]);
    setShowSuggestions(true);  // Show suggestion chips again
    setIsTyping(false);        // Stop any typing indicators
  };

  /**
   * Effect hook to send initial greeting when component first mounts
   * This creates the welcome experience for new users
   */
  useEffect(() => {
    initializeChat();
  }, []);

  /**
   * Handler for starting a new chat session
   * Triggered by "New Chat" button clicks
   */
  const handleNewChat = () => {
    initializeChat();
  };

  /**
   * Loads a specific chat from history and makes it the active conversation
   * @param chatId - The ID of the chat to load
   */
  const loadChatFromHistory = (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages);
      setShowSuggestions(false); // Hide suggestions for loaded chats
      setIsTyping(false);        // Ensure no typing indicators
    }
  };

  // ============================
  // MESSAGE HANDLING
  // ============================
  
  /**
   * Main handler for processing user messages and generating AI responses
   * @param messageText - The text content of the user's message
   */
  const handleSendMessage = async (messageText: string) => {
    console.log('Index: handleSendMessage called with:', messageText);
    
    // Hide suggestion chips after first user message
    setShowSuggestions(false);
    
    // Create and add user message to conversation
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    console.log('Index: Adding user message:', userMessage);
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true); // Show typing indicator while AI processes

    // Detect if user wrote in Jamaican Patois to determine response style
    const isUserMessagePatois = detectLanguage(messageText) === 'patois';
    
    try {
      // Generate AI response using Gemini service with conversation context
      const aiResponse = await geminiService.generateResponse(messageText, isUserMessagePatois, messages);
      const responseText = aiResponse.message;

      console.log('Index: Got AI response:', responseText);

      // Add AI response with slight delay for natural feel, then start typing animation
      setTimeout(() => {
        const aiResponseId = (Date.now() + 1).toString();
        const aiResponse: Message = {
          id: aiResponseId,
          text: responseText,
          isUser: false,
          timestamp: new Date()
        };

        console.log('Index: Adding AI response:', aiResponse);
        setMessages(prev => [...prev, aiResponse]);
        setTypingMessageId(aiResponseId); // Start typing animation for this message
        setIsTyping(false); // Hide general typing indicator
      }, 800 + Math.random() * 1000); // Random delay for natural variation
      
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Show fallback response if AI service fails
      setTimeout(() => {
        const fallbackResponseId = (Date.now() + 1).toString();
        const fallbackResponse: Message = {
          id: fallbackResponseId,
          text: isUserMessagePatois 
            ? "Zeen! Mi have some trouble right now, but mi deh yah fi help yuh still!"
            : "I'm having some connection issues right now, but I'm here to help you!",
          isUser: false,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, fallbackResponse]);
        setTypingMessageId(fallbackResponseId);
        setIsTyping(false);
      }, 800);
    }
  };

  /**
   * Called when a typing animation completes
   * @param messageId - ID of the message that finished typing
   */
  const handleTypingComplete = (messageId: string) => {
    if (typingMessageId === messageId) {
      setTypingMessageId(null); // Clear typing animation state
    }
  };

  /**
   * Handler for suggestion chip clicks
   * @param suggestionText - The text of the clicked suggestion
   */
  const handleSuggestionClick = (suggestionText: string) => {
    handleSendMessage(suggestionText);
  };

  // ============================
  // AUTO-SAVE FUNCTIONALITY
  // ============================
  
  /**
   * Effect hook to automatically save chat when messages change
   * Uses debouncing to avoid excessive saves during rapid message exchanges
   */
  useEffect(() => {
    if (messages.length > 1 && currentChatId) {
      // Debounce saving to avoid too frequent localStorage writes
      const timeoutId = setTimeout(() => {
        saveCurrentChatToHistory();
      }, 2000); // Wait 2 seconds after last change before saving

      return () => clearTimeout(timeoutId); // Clean up timeout on next change
    }
  }, [messages]);

  // ============================
  // TRANSLATION MODE HANDLERS
  // ============================
  
  /**
   * Opens the translation mode overlay
   */
  const handleOpenTranslationMode = () => {
    setShowTranslationMode(true);
  };

  /**
   * Closes the translation mode overlay
   */
  const handleCloseTranslationMode = () => {
    setShowTranslationMode(false);
  };

  // ============================
  // RENDER
  // ============================
  
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex w-full">
        {/* Left sidebar with chat history and navigation */}
        <ChatHistorySidebar
          chatHistory={chatHistory}
          currentChatId={currentChatId}
          onNewChat={handleNewChat}
          onLoadChat={loadChatFromHistory}
          onDeleteChats={handleDeleteChats}
          onClearAllHistory={handleClearAllHistory}
        />
        
        <SidebarInset className="flex-1">
          <div className="flex flex-col min-h-screen">
            {/* Header with app branding and mobile menu toggle */}
            <header className="glass-effect sticky top-0 z-50 border-b border-border/30">
              <div className="max-w-4xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Mobile sidebar trigger */}
                    <SidebarTrigger />
                    {/* App logo and title - clickable to start new chat */}
                    <button 
                      onClick={handleNewChat}
                      className="flex items-center gap-3 hover:scale-105 transition-transform duration-200 cursor-pointer"
                    >
                      <div className="relative">
                        <span className="text-3xl filter drop-shadow-sm">🇯🇲</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-jamaican-gold/20 to-jamaican-green/20 rounded-full blur-xl"></div>
                      </div>
                      <h1 className="text-xl font-semibold jamaican-text-gradient">
                        JamAI Chat
                      </h1>
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Translation mode button */}
                    {messages.length > 1 && (
                      <Button
                        onClick={handleOpenTranslationMode}
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Languages className="w-4 h-4" />
                        <span className="hidden sm:inline">Translation</span>
                      </Button>
                    )}
                    {/* Theme toggle button */}
                    <ThemeToggle />
                    {/* AI service indicator */}
                    <div className="text-xs text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30 px-2 py-1 rounded-full">
                      Gemini AI
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* Main chat content area */}
            <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
              {/* Welcome screen with suggestions (shown only for new chats) */}
              {showSuggestions && messages.length === 1 && (
                <div className="flex-1 flex flex-col justify-center px-6 pb-8 pt-12">
                  {/* Large welcome banner */}
                  <div className="text-center mb-12">
                    <div className="flex justify-center mb-6 relative">
                      <div className="relative">
                        <span className="text-7xl filter drop-shadow-lg">🇯🇲</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-jamaican-gold/30 to-jamaican-green/30 rounded-full blur-2xl scale-150"></div>
                      </div>
                    </div>
                    <button 
                      onClick={handleNewChat}
                      className="text-6xl font-bold jamaican-text-gradient mb-6 tracking-tight hover:scale-105 transition-transform duration-200 cursor-pointer"
                    >
                      JamAI
                    </button>
                    <p className="text-muted-foreground text-lg">
                      Chat with me in Jamaican Patois!
                    </p>
                  </div>
                  
                  {/* Suggestion chips for quick start */}
                  <div className="mb-8">
                    <ChatSuggestions onSuggestionClick={handleSuggestionClick} />
                  </div>
                  
                  {/* AI greeting message displayed prominently */}
                  <div className="max-w-2xl">
                    <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-6 modern-shadow border border-secondary/20">
                      <div className="flex gap-4 items-start">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-accent text-secondary-foreground flex items-center justify-center text-lg font-medium modern-shadow">
                            🇯🇲
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-foreground leading-relaxed">
                            {messages[0]?.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages display area */}
              <div className="flex-1 px-6">
                {/* Show messages only if suggestions are hidden or there are multiple messages */}
                {(!showSuggestions || messages.length > 1) && (
                  <div className="space-y-6 py-6">
                    {messages.map((message) => (
                      // Check if this message should use typing animation
                      typingMessageId === message.id ? (
                        <TypingMessage
                          key={message.id}
                          fullMessage={message.text}
                          isUser={message.isUser}
                          timestamp={message.timestamp}
                          onComplete={() => handleTypingComplete(message.id)}
                        />
                      ) : (
                        // Regular message display for completed messages
                        <ChatMessage
                          key={message.id}
                          message={message.text}
                          isUser={message.isUser}
                          timestamp={message.timestamp}
                        />
                      )
                    ))}
                    {/* Show typing indicator when AI is processing but before response appears */}
                    {isTyping && <TypingIndicator />}
                  </div>
                )}
                {/* Invisible element used for auto-scrolling to bottom */}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input area at bottom */}
              <div className="p-6">
                <div className="max-w-4xl mx-auto">
                  <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
                  <p className="text-xs text-muted-foreground text-center mt-3 opacity-70">
                    JamAI can make mistakes. Consider checking important information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>

        {/* Floating Translation Button - only show when there are messages */}
        {messages.length > 1 && !showTranslationMode && (
          <Button
            onClick={handleOpenTranslationMode}
            className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-jamaican-gold to-jamaican-green hover:from-jamaican-gold/90 hover:to-jamaican-green/90 transition-all duration-200"
            size="icon"
            title="Open Translation Mode"
          >
            <Languages className="w-6 h-6" />
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
      {/* Toast notification system for user feedback */}
      <Toaster />
    </SidebarProvider>
  );
};

export default Index;
