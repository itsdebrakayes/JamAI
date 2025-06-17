
import React, { useState, useEffect } from 'react';
import { X, Languages, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatMessage from './ChatMessage';
import { geminiService } from '@/services/geminiService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface TranslationModeProps {
  messages: Message[];
  onClose: () => void;
  chatLanguage?: 'patois' | 'english'; // Add language context
}

const TranslationMode = ({ messages, onClose, chatLanguage = 'patois' }: TranslationModeProps) => {
  const [translatedMessages, setTranslatedMessages] = useState<Message[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    translateMessages();
  }, [messages, chatLanguage]);

  const translateMessages = async () => {
    setIsTranslating(true);
    const translated: Message[] = [];

    for (const message of messages) {
      if (!message.isUser) {
        try {
          let translatedText: string;
          
          if (chatLanguage === 'patois') {
            // Translate from Patois to English
            translatedText = await geminiService.translateToEnglish(message.text);
          } else {
            // Translate from English to Patois
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
        translated.push(message);
      }
    }

    setTranslatedMessages(translated);
    setIsTranslating(false);
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

  const originalLanguage = chatLanguage === 'patois' ? 'Patois' : 'English';
  const translatedLanguage = chatLanguage === 'patois' ? 'English' : 'Patois';
  const originalFlag = chatLanguage === 'patois' ? '🇯🇲' : '🇺🇸';
  const translatedFlag = chatLanguage === 'patois' ? '🇺🇸' : '🇯🇲';

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Languages className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Translation Mode</h2>
          <span className="text-sm text-muted-foreground">
            Side-by-side {originalLanguage} & {translatedLanguage}
          </span>
        </div>
        <Button onClick={onClose} variant="ghost" size="sm">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Original Language */}
        <div className="flex-1 border-r border-border">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-medium flex items-center gap-2">
              <span className="text-lg">{originalFlag}</span>
              Original ({originalLanguage})
            </h3>
          </div>
          <div className="p-4 overflow-y-auto h-full space-y-4">
            {messages.map((message) => (
              <div key={`original-${message.id}`} className="relative group">
                <ChatMessage
                  message={message.text}
                  isUser={message.isUser}
                  timestamp={message.timestamp}
                />
                {!message.isUser && (
                  <Button
                    onClick={() => copyToClipboard(message.text, `original-${message.id}`)}
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copiedId === `original-${message.id}` ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Translated Language */}
        <div className="flex-1">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-medium flex items-center gap-2">
              <span className="text-lg">{translatedFlag}</span>
              {translatedLanguage} Translation
              {isTranslating && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  Translating...
                </span>
              )}
            </h3>
          </div>
          <div className="p-4 overflow-y-auto h-full space-y-4">
            {translatedMessages.map((message) => (
              <div key={`translated-${message.id}`} className="relative group">
                <ChatMessage
                  message={message.text}
                  isUser={message.isUser}
                  timestamp={message.timestamp}
                />
                {!message.isUser && (
                  <Button
                    onClick={() => copyToClipboard(message.text, `translated-${message.id}`)}
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copiedId === `translated-${message.id}` ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationMode;
