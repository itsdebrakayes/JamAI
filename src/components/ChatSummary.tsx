
import React, { useState } from 'react';
import { FileText, Languages, Loader2, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { geminiService } from '@/services/geminiService';
import { detectLanguage } from '@/utils/languageDetection';
import { Message } from '@/types/Message';

interface ChatSummaryProps {
  messages: Message[];
  onClose: () => void;
}

const ChatSummary = ({ messages, onClose }: ChatSummaryProps) => {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [translation, setTranslation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'translation'>('summary');
  const [copied, setCopied] = useState(false);

  const handleSummarize = async () => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    try {
      const prompt = `Please provide a concise summary of the following text in both English and Jamaican Patois:\n\n${inputText}`;
      const response = await geminiService.generateResponse(prompt, false, []);
      setSummary(response.message);
    } catch (error) {
      console.error('Summary error:', error);
      setSummary('Sorry, could not generate summary at this time.');
    }
    setIsProcessing(false);
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    try {
      const detectedLanguage = detectLanguage(inputText);
      let prompt: string;
      
      if (detectedLanguage === 'patois') {
        prompt = `Please translate the following Jamaican Patois text to English, maintaining the original meaning and tone:\n\n${inputText}`;
      } else {
        prompt = `Please translate the following English text to Jamaican Patois, maintaining the original meaning and tone:\n\n${inputText}`;
      }
      
      const response = await geminiService.generateResponse(prompt, detectedLanguage === 'english', []);
      setTranslation(response.message);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslation('Sorry, translation not available right now.');
    }
    setIsProcessing(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              Chat Summary & Translation
            </h2>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-muted-foreground mt-2">
            Paste text below to get summaries or translations (auto-detects language)
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col gap-6">
          {/* Input Area */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Text to Process
            </label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your text here for summary or translation..."
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSummarize}
              disabled={!inputText.trim() || isProcessing}
              className="flex-1"
            >
              {isProcessing && activeTab === 'summary' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Summarize
            </Button>
            <Button
              onClick={handleTranslate}
              disabled={!inputText.trim() || isProcessing}
              variant="outline"
              className="flex-1"
            >
              {isProcessing && activeTab === 'translation' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Languages className="w-4 h-4 mr-2" />
              )}
              Auto-Translate
            </Button>
          </div>

          {/* Results */}
          {(summary || translation) && (
            <div className="flex-1 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-border mb-4">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'summary'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab('translation')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'translation'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Translation
                </button>
              </div>

              {/* Result Content */}
              <div className="relative">
                <div className="bg-muted/30 rounded-lg p-4 overflow-y-auto max-h-[300px]">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {activeTab === 'summary' ? summary : translation}
                  </pre>
                </div>
                
                {((activeTab === 'summary' && summary) || (activeTab === 'translation' && translation)) && (
                  <Button
                    onClick={() => copyToClipboard(activeTab === 'summary' ? summary : translation)}
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSummary;
