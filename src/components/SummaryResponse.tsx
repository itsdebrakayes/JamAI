
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Copy, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SummaryResponseProps {
  originalText: string;
  onSummaryComplete?: (summary: string) => void;
}

const SummaryResponse: React.FC<SummaryResponseProps> = ({
  originalText,
  onSummaryComplete
}) => {
  const [summary, setSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showTranslationOptions, setShowTranslationOptions] = useState(false);
  const [englishTranslation, setEnglishTranslation] = useState<string>('');
  const [patoisTranslation, setPatoisTranslation] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<'english' | 'patois' | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedEnglish, setCopiedEnglish] = useState(false);
  const [copiedPatois, setCopiedPatois] = useState(false);

  useEffect(() => {
    if (originalText.length > 100) { // Only summarize longer texts
      generateSummary();
    }
  }, [originalText]);

  const generateSummary = async () => {
    if (!originalText.trim()) return;
    
    setIsSummarizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          userMessage: `Please summarize the following text in 1-3 clear, concise sentences. Focus on the key points and main message: "${originalText}"`,
          isUserMessagePatois: false,
          conversationHistory: [],
          storedKnowledge: ''
        }
      });

      if (error) throw error;
      
      const summaryText = data?.message || 'Summary generation failed';
      setSummary(summaryText);
      setShowTranslationOptions(true);
      onSummaryComplete?.(summaryText);
    } catch (error) {
      console.error('Summary error:', error);
      setSummary('Summary generation failed. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const translateSummary = async (targetLanguage: 'english' | 'patois') => {
    if (!summary) return;
    
    setIsTranslating(targetLanguage);
    try {
      const translationPrompt = targetLanguage === 'english' 
        ? `Please translate this text to clear, natural English: "${summary}"`
        : `Please translate this text to authentic Jamaican Patois: "${summary}"`;

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
      
      if (targetLanguage === 'english') {
        setEnglishTranslation(translation);
      } else {
        setPatoisTranslation(translation);
      }
    } catch (error) {
      console.error('Translation error:', error);
      if (targetLanguage === 'english') {
        setEnglishTranslation('Translation failed');
      } else {
        setPatoisTranslation('Translation failed');
      }
    } finally {
      setIsTranslating(null);
    }
  };

  const copyToClipboard = async (text: string, type: 'summary' | 'english' | 'patois') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'summary') {
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
      } else if (type === 'english') {
        setCopiedEnglish(true);
        setTimeout(() => setCopiedEnglish(false), 2000);
      } else {
        setCopiedPatois(true);
        setTimeout(() => setCopiedPatois(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (originalText.length <= 100) return null;

  return (
    <div className="space-y-4 border-l-4 border-purple-200 pl-4 ml-4 mt-4">
      <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
        <FileText className="w-4 h-4" />
        Summary Mode Active
      </div>
      
      {/* Summary */}
      <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              <span className="font-medium text-sm">Summary:</span>
            </div>
            {!isSummarizing && summary && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(summary, 'summary')}
                className="h-8 w-8 p-0"
              >
                {copiedSummary ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
          {isSummarizing ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating summary...
            </div>
          ) : (
            <p className="text-sm font-medium">{summary}</p>
          )}
        </CardContent>
      </Card>

      {/* Translation Options */}
      {showTranslationOptions && !isSummarizing && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>🌍</span>
            <span>Translate summary to:</span>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => translateSummary('english')}
              disabled={isTranslating === 'english'}
              className="flex items-center gap-2"
            >
              {isTranslating === 'english' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>🇬🇧</span>
              )}
              English
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => translateSummary('patois')}
              disabled={isTranslating === 'patois'}
              className="flex items-center gap-2"
            >
              {isTranslating === 'patois' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>🇯🇲</span>
              )}
              Patois
            </Button>
          </div>

          {/* English Translation */}
          {englishTranslation && (
            <Card className="bg-muted/30">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>🇬🇧</span>
                    <span className="font-medium text-sm">English:</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(englishTranslation, 'english')}
                    className="h-8 w-8 p-0"
                  >
                    {copiedEnglish ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm">{englishTranslation}</p>
              </CardContent>
            </Card>
          )}

          {/* Patois Translation */}
          {patoisTranslation && (
            <Card className="bg-muted/30">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>🇯🇲</span>
                    <span className="font-medium text-sm">Patois:</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(patoisTranslation, 'patois')}
                    className="h-8 w-8 p-0"
                  >
                    {copiedPatois ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm">{patoisTranslation}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default SummaryResponse;
