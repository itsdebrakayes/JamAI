
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Languages, Copy, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { detectLanguage } from '@/utils/languageDetection';

interface TranslatedResponseProps {
  originalText: string;
  translationDirection: 'auto' | 'to-english' | 'to-patois';
  onTranslationComplete?: (translation: string) => void;
}

const TranslatedResponse: React.FC<TranslatedResponseProps> = ({
  originalText,
  translationDirection,
  onTranslationComplete
}) => {
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedTranslated, setCopiedTranslated] = useState(false);

  useEffect(() => {
    translateText();
  }, [originalText, translationDirection]);

  const translateText = async () => {
    if (!originalText.trim()) return;
    
    setIsTranslating(true);
    try {
      const detectedLanguage = detectLanguage(originalText);
      let targetLanguage: 'english' | 'patois';
      
      if (translationDirection === 'auto') {
        targetLanguage = detectedLanguage === 'patois' ? 'english' : 'patois';
      } else if (translationDirection === 'to-english') {
        targetLanguage = 'english';
      } else {
        targetLanguage = 'patois';
      }

      // Don't translate if already in target language and auto mode
      if (translationDirection === 'auto' && 
          ((detectedLanguage === 'english' && targetLanguage === 'english') ||
           (detectedLanguage === 'patois' && targetLanguage === 'patois'))) {
        setTranslatedText('Already in the target language');
        setIsTranslating(false);
        return;
      }

      const translationPrompt = targetLanguage === 'english' 
        ? `Please translate this Jamaican Patois text to clear, natural English while preserving the meaning and tone. Only provide the translation, no explanation: "${originalText}"`
        : `Please translate this English text to authentic Jamaican Patois while keeping the meaning and tone. Only provide the translation, no explanation: "${originalText}"`;

      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          userMessage: translationPrompt,
          isUserMessagePatois: targetLanguage === 'patois',
          conversationHistory: [],
          storedKnowledge: ''
        }
      });

      if (error) throw error;
      
      const translation = data?.message || 'Translation failed';
      setTranslatedText(translation);
      onTranslationComplete?.(translation);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'original' | 'translated') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'original') {
        setCopiedOriginal(true);
        setTimeout(() => setCopiedOriginal(false), 2000);
      } else {
        setCopiedTranslated(true);
        setTimeout(() => setCopiedTranslated(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getLanguageFlag = (isOriginal: boolean) => {
    if (isOriginal) {
      const detectedLanguage = detectLanguage(originalText);
      return detectedLanguage === 'patois' ? '🇯🇲' : '🇬🇧';
    } else {
      if (translationDirection === 'to-english') return '🇬🇧';
      if (translationDirection === 'to-patois') return '🇯🇲';
      const detectedLanguage = detectLanguage(originalText);
      return detectedLanguage === 'patois' ? '🇬🇧' : '🇯🇲';
    }
  };

  const getLanguageLabel = (isOriginal: boolean) => {
    if (isOriginal) {
      const detectedLanguage = detectLanguage(originalText);
      return detectedLanguage === 'patois' ? 'Patois Version' : 'English Version';
    } else {
      if (translationDirection === 'to-english') return 'English Version';
      if (translationDirection === 'to-patois') return 'Patois Version';
      const detectedLanguage = detectLanguage(originalText);
      return detectedLanguage === 'patois' ? 'English Version' : 'Patois Version';
    }
  };

  return (
    <div className="space-y-4 border-l-4 border-blue-200 pl-4 ml-4 mt-4">
      <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
        <Languages className="w-4 h-4" />
        Translation Mode Active
      </div>
      
      {/* Original Version */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getLanguageFlag(true)}</span>
              <span className="font-medium text-sm">{getLanguageLabel(true)}:</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(originalText, 'original')}
              className="h-8 w-8 p-0"
            >
              {copiedOriginal ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-sm">{originalText}</p>
        </CardContent>
      </Card>

      {/* Translated Version */}
      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getLanguageFlag(false)}</span>
              <span className="font-medium text-sm">{getLanguageLabel(false)}:</span>
            </div>
            {!isTranslating && translatedText && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(translatedText, 'translated')}
                className="h-8 w-8 p-0"
              >
                {copiedTranslated ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
          {isTranslating ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Translating...
            </div>
          ) : (
            <p className="text-sm">{translatedText}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TranslatedResponse;
