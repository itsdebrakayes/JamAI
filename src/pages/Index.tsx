import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useToast } from "@/components/ui/use-toast"
import { MessageSquare, Plus } from 'lucide-react';

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

// Suggestion type
type ChatSuggestion = {
  title: string;
  text: string;
  icon: string;
};

// Mock chat suggestions
const CHAT_SUGGESTIONS: ChatSuggestion[] = [
  {
    title: "Explain Patois",
    text: "Explain Jamaican Patois and its origins.",
    icon: "🇯🇲",
  },
  {
    title: "Local Proverbs",
    text: "Tell me a Jamaican proverb and its meaning.",
    icon: "📜",
  },
  {
    title: "Reggae History",
    text: "Give me a brief history of Reggae music.",
    icon: "🎶",
  },
  {
    title: "Jamaican Cuisine",
    text: "What are some popular Jamaican dishes?",
    icon: "🍽️",
  },
];

const Index = () => {
  // Initialize state variables
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages]);

  // Load chat history from local storage on component mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('chatHistory');
    if (storedHistory) {
      setChatHistory(JSON.parse(storedHistory));
    }
  }, []);

  // Save chat history to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Function to start a new chat
  const startNewChat = () => {
    const newChatId = uuidv4();
    setCurrentChatId(newChatId);
    setMessages([]);
  };

  // Function to load a specific chat from history
  const loadChat = (chatId: string) => {
    const chatToLoad = chatHistory.find((chat) => chat.id === chatId);
    if (chatToLoad) {
      setMessages(chatToLoad.messages);
      setCurrentChatId(chatId);
    }
  };

  // Function to delete specific chats from history
  const deleteChats = (chatIds: string[]) => {
    const updatedHistory = chatHistory.filter((chat) => !chatIds.includes(chat.id));
    setChatHistory(updatedHistory);
    if (chatIds.includes(currentChatId || '')) {
      startNewChat(); // Start a new chat if the current chat is deleted
    }
  };

  // Function to clear all chat history
  const clearAllHistory = () => {
    setChatHistory([]);
    startNewChat();
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
      // Set typing indicator to false
      setIsTyping(false);
    }
  };

  // Simulate AI response (replace with actual API call)
  const simulateAIResponse = async (userMessage: string): Promise<string> => {
    // Basic Patois translation simulation
    const patoisResponse = `Mi understand seh yu say "${userMessage}" ennit. Mek mi tink 'bout dat...`;
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
    return patoisResponse;
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
        <ChatHistorySidebar 
          chatHistory={chatHistory} 
          currentChatId={currentChatId}
          onNewChat={startNewChat}
          onLoadChat={loadChat}
          onDeleteChats={deleteChats}
          onClearAllHistory={clearAllHistory}
          onRenameChat={renameChat}
        />
        
        <div className="flex-1 flex flex-col relative">
          {/* Main content area */}
          <div className="flex-1 flex flex-col">
            {messages.length === 0 ? (
              // Empty state with enhanced welcome message
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full space-y-8 text-center">
                  {/* Welcome header */}
                  <div className="space-y-4">
                    <div className="flex justify-center items-center gap-3 mb-6">
                      <span className="text-4xl font-bold">🇯🇲</span>
                      <h1 className="text-4xl font-bold jamaican-text-gradient">
                        Welcome to JamAI
                      </h1>
                    </div>
                    <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                      Your AI assistant with a Jamaican twist. Ask me anything in English or Patois!
                    </p>
                  </div>

                  {/* Enhanced Start New Chat button - larger than "Ready for another chat" */}
                  <div className="space-y-6">
                    <button
                      onClick={startNewChat}
                      className="w-full max-w-md mx-auto bg-gradient-to-r from-green-500 via-yellow-500 to-green-600 hover:from-green-600 hover:via-yellow-600 hover:to-green-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 text-lg"
                    >
                      <MessageSquare className="w-6 h-6" />
                      Start a New Chat
                    </button>
                    
                    {/* Chat suggestions */}
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground font-medium">Try asking me about:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                        {CHAT_SUGGESTIONS.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion.text)}
                            className="p-4 text-left bg-card hover:bg-accent rounded-xl border border-border hover:border-accent-foreground/20 transition-all duration-200 group"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-xl flex-shrink-0 mt-1">{suggestion.icon}</span>
                              <div>
                                <h3 className="font-medium text-sm mb-1 group-hover:text-accent-foreground">
                                  {suggestion.title}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {suggestion.text}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
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

                {/* Ready for another chat section - smaller than "Start a new chat" */}
                {messages.length > 0 && (
                  <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm p-4">
                    <div className="max-w-4xl mx-auto flex justify-center">
                      <button
                        onClick={startNewChat}
                        className="bg-gradient-to-r from-green-500 via-yellow-500 to-green-600 hover:from-green-600 hover:via-yellow-600 hover:to-green-700 text-white font-medium py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Ready for another chat?
                      </button>
                    </div>
                  </div>
                )}

                {/* Input area */}
                <div className="border-t border-border/50 bg-background/95 backdrop-blur-md p-4">
                  <div className="max-w-4xl mx-auto">
                    <ChatInput 
                      onSendMessage={handleSendMessage}
                      disabled={isTyping}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
