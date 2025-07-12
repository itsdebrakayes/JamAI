
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from '@/components/ui/button';
import { Send, Plus, X, Copy, CheckCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { detectLanguage } from '@/utils/languageDetection';
import { locationAwareService } from '@/services/locationAwareService';
import ChatInput from '@/components/ChatInput';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isPatois?: boolean;
  files?: { name: string; type: 'file' | 'image' }[];
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
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

  const sendMessage = async (
    messageText: string, 
    attachedFiles?: Array<{file: File, type: 'file' | 'image', content?: string}>, 
    imagePrompt?: string
  ) => {
    console.log('Index: sendMessage called with:', messageText, attachedFiles?.length || 0, 'files');
    
    if ((!messageText.trim() && (!attachedFiles || attachedFiles.length === 0)) || isLoading) return;

    console.log('Index: Proceeding with message send');
    
    setIsLoading(true);
    
    // Build the complete message including file contents
    let completeMessage = messageText;
    
    if (attachedFiles && attachedFiles.length > 0) {
      const fileContents = attachedFiles.map(file => {
        if (file.type === 'file' && file.content) {
          return `\n\n[File: ${file.file.name}]\n${file.content}`;
        } else if (file.type === 'image') {
          return `\n\n[Image uploaded: ${file.file.name}]`;
        }
        return `\n\n[File uploaded: ${file.file.name}]`;
      }).join('');
      
      completeMessage = messageText + fileContents;
    }

    const userMessage = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
      files: attachedFiles?.map(f => ({ name: f.file.name, type: f.type }))
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    saveMessagesToLocalStorage(newMessages);

    try {
      console.log('Index: Calling AI service with complete message');
      let response;
      
      if (imagePrompt) {
        // Handle image generation
        console.log('Index: Processing image generation request');
        response = await locationAwareService.processQuery(
          `Generate an image with this description: ${imagePrompt}`,
          detectLanguage(completeMessage) === 'patois',
          newMessages
        );
      } else {
        // Regular message processing with file contents
        const isPatois = detectLanguage(completeMessage) === 'patois';
        console.log('Index: Detected language is patois:', isPatois);
        
        response = await locationAwareService.processQuery(
          completeMessage,
          isPatois,
          newMessages
        );
      }

      console.log('Index: AI response received:', response.message.substring(0, 100) + '...');

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        isUser: false,
        timestamp: new Date(),
        isPatois: response.isPatois
      };

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);

      saveMessagesToLocalStorage(finalMessages);
      incrementUsageCount();
      
    } catch (error) {
      console.error('Index: Error in sendMessage:', error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Mi sorry, but mi run inna some trouble right now. Try again inna likkle bit.",
        isUser: false,
        timestamp: new Date(),
        isPatois: true
      };

      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      
      saveMessagesToLocalStorage(finalMessages);
    } finally {
      setIsLoading(false);
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
          <h1 className="text-lg font-semibold">JamAI Assistant</h1>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <ScrollArea className="h-full">
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
                    
                    {/* File attachments display */}
                    {message.files && message.files.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {message.files.map((file, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="flex items-center gap-1 p-2"
                          >
                            {file.type === 'image' ? '🖼️' : '📄'} {file.name}
                          </Badge>
                        ))}
                      </div>
                    )}
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
        </ScrollArea>
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t">
        <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
};

export default Index;
