
import React, { useState, useEffect } from 'react';
import { X, Languages, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from './ChatMessage';
import { supabase } from '@/integrations/supabase/client';
import { detectLanguage } from '@/utils/languageDetection';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface TranslationModeProps {
  messages: Message[];
  onClose: () => void;
}

const TranslationMode = ({ messages, onClose }: TranslationModeProps) => {
  const [translatedMessages, setTranslatedMessages] = useState<Message[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    translateAIMessages();
  }, [messages]);

  const translateAIMessages = async () => {
    setIsTranslating(true);
    const translated: Message[] = [];

    for (const message of messages) {
      if (!message.isUser) {
        // Only translate AI messages
        try {
          const detectedLanguage = detectLanguage(message.text);
          let translatedText: string;
          
          if (detectedLanguage === 'patois') {
            translatedText = await translateToEnglish(message.text);
          } else {
            // If it's English (or detected as English), translate to Patois
            translatedText = await translateToPatois(message.text);
          }
          
          translated.push({
            ...message,
            text: translatedText
          });
        } catch (error) {
          console.error('Translation error:', error);
          translated.push({
            ...message,
            text: 'Translation not available'
          });
        }
      } else {
        // Keep user messages as is
        translated.push(message);
      }
    }

    setTranslatedMessages(translated);
    setIsTranslating(false);
  };

  const translateToEnglish = async (patoisText: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          userMessage: `Translate the following Jamaican Patois text to natural English. Keep the meaning and tone intact: "${patoisText}"`,
          isUserMessagePatois: false,
          conversationHistory: [],
          storedKnowledge: ''
        }
      });

      if (error) throw error;
      return data?.message || 'Translation not available.';
    } catch (error) {
      console.error('English Translation Error:', error);
      return 'Sorry, translation is not available right now.';
    }
  };

  const translateToPatois = async (englishText: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          userMessage: `Translate the following English text to authentic Jamaican Patois. Use natural Patois expressions, grammar, and vocabulary. Keep the meaning and tone intact: "${englishText}"`,
          isUserMessagePatois: true,
          conversationHistory: [],
          storedKnowledge: ''
        }
      });

      if (error) throw error;
      return data?.message || 'Translation not available.';
    } catch (error) {
      console.error('Patois Translation Error:', error);
      return 'Sorry, translation is not available right now.';
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-3 md:p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <Languages className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-semibold truncate">Translation Mode</h2>
            {!isMobile && (
              <span className="text-xs md:text-sm text-muted-foreground">
                AI responses translated between English & Patois
              </span>
            )}
          </div>
        </div>
        <Button onClick={onClose} variant="ghost" size="sm" className="flex-shrink-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content - Always split view with proper scrolling */}
      <div className={`flex-1 flex overflow-hidden ${isMobile ? 'flex-col' : 'flex-row'} min-h-0`}>
        {/* Original Messages */}
        <div className={`${isMobile ? 'flex-1 min-h-0' : 'flex-1 border-r'} border-border flex flex-col`}>
          <div className="p-2 md:p-3 border-b border-border bg-muted/30 flex-shrink-0">
            <h3 className="font-medium flex items-center gap-2 text-sm">
              <span className="text-sm">📝</span>
              Original Chat
            </h3>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-2 md:p-4 space-y-3">
              {messages.map((message) => (
                <div key={`original-${message.id}`} className="relative group">
                  <div className={isMobile ? 'scale-90 origin-top-left' : ''}>
                    <ChatMessage
                      message={message.text}
                      isUser={message.isUser}
                      timestamp={message.timestamp}
                    />
                  </div>
                  <Button
                    onClick={() => copyToClipboard(message.text, `original-${message.id}`)}
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-1"
                  >
                    {copiedId === `original-${message.id}` ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Separator for mobile */}
        {isMobile && <div className="border-b border-border flex-shrink-0" />}

        {/* Translated Messages */}
        <div className={`${isMobile ? 'flex-1 min-h-0' : 'flex-1'} flex flex-col`}>
          <div className="p-2 md:p-3 border-b border-border bg-muted/30 flex-shrink-0">
            <h3 className="font-medium flex items-center gap-2 text-sm">
              <span className="text-sm">🔄</span>
              AI Translated
              {isTranslating && (
                <span className="text-xs text-muted-foreground animate-pulse ml-2">
                  Translating...
                </span>
              )}
            </h3>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-2 md:p-4 space-y-3">
              {translatedMessages.map((message) => (
                <div key={`translated-${message.id}`} className="relative group">
                  <div className={isMobile ? 'scale-90 origin-top-left' : ''}>
                    <ChatMessage
                      message={message.text}
                      isUser={message.isUser}
                      timestamp={message.timestamp}
                    />
                  </div>
                  <Button
                    onClick={() => copyToClipboard(message.text, `translated-${message.id}`)}
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-1"
                  >
                    {copiedId === `translated-${message.id}` ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default TranslationMode;
