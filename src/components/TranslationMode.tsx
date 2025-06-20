import React, { useState, useEffect } from 'react';
import { X, Languages, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatMessage from './ChatMessage';
import { geminiService } from '@/services/geminiService';
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
      const model = geminiService['genAI'].getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Translate the following Jamaican Patois text to natural English. Keep the meaning and tone intact:

"${patoisText}"

Provide only the English translation, nothing else.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || 'Translation not available.';
    } catch (error) {
      console.error('English Translation Error:', error);
      return 'Sorry, translation is not available right now.';
    }
  };

  const translateToPatois = async (englishText: string): Promise<string> => {
    try {
      const model = geminiService['genAI'].getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Translate the following English text to natural Jamaican Patois. Keep the meaning and tone intact:

"${englishText}"

Provide only the Patois translation, nothing else.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || 'Translation not available.';
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
      <div className="border-b border-border p-3 md:p-4 flex items-center justify-between">
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

      {/* Content - Mobile: Stack vertically, Desktop: Side by side */}
      <div className={`flex-1 flex overflow-hidden ${isMobile ? 'flex-col' : 'flex-row'}`}>
        {/* Original Messages */}
        <div className={`${isMobile ? 'flex-1 border-b' : 'flex-1 border-r'} border-border flex flex-col`}>
          <div className="p-3 md:p-4 border-b border-border bg-muted/30 flex-shrink-0">
            <h3 className="font-medium flex items-center gap-2 text-sm md:text-base">
              <span className="text-base md:text-lg">📝</span>
              Original Chat
            </h3>
          </div>
          <div className="flex-1 p-2 md:p-4 overflow-y-auto space-y-2 md:space-y-4">
            {messages.map((message) => (
              <div key={`original-${message.id}`} className="relative group">
                <div className="scale-90 md:scale-100 origin-top-left">
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
                  className="absolute top-1 right-1 md:top-2 md:right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 md:w-auto md:h-auto p-1 md:p-2"
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
        </div>

        {/* Translated Messages */}
        <div className={`${isMobile ? 'flex-1' : 'flex-1'} flex flex-col`}>
          <div className="p-3 md:p-4 border-b border-border bg-muted/30 flex-shrink-0">
            <h3 className="font-medium flex items-center gap-2 text-sm md:text-base">
              <span className="text-base md:text-lg">🔄</span>
              AI Translated
              {isTranslating && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  Translating...
                </span>
              )}
            </h3>
          </div>
          <div className="flex-1 p-2 md:p-4 overflow-y-auto space-y-2 md:space-y-4">
            {translatedMessages.map((message) => (
              <div key={`translated-${message.id}`} className="relative group">
                <div className="scale-90 md:scale-100 origin-top-left">
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
                  className="absolute top-1 right-1 md:top-2 md:right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 md:w-auto md:h-auto p-1 md:p-2"
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
        </div>
      </div>
    </div>
  );
};

export default TranslationMode;
