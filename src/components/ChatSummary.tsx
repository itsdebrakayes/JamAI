
import React, { useState } from 'react';
import { FileText, Languages, Loader2, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
      const prompt = `Please provide a concise summary of the following text. Respond in both English and Jamaican Patois for comparison:\n\n${inputText}`;
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
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent 
        className="w-full max-w-4xl max-h-[90vh] flex flex-col"
        aria-describedby="chat-summary-description"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/f7360586-ff1c-4d5e-b846-feaceed45e61.png" 
              alt="JamAI Crest" 
              className="w-6 h-6 object-contain"
            />
            <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" aria-hidden="true" />
              Text Summary & Translation
            </DialogTitle>
          </div>
          <p id="chat-summary-description" className="text-muted-foreground mt-2">
            Paste any large text below to get quick summaries in English and Patois, or translate between languages
          </p>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col gap-6">
          {/* Input Area */}
          <div>
            <label htmlFor="text-input" className="text-sm font-medium mb-2 block">
              Large Text to Process
            </label>
            <Textarea
              id="text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your large text here for summarization or translation..."
              className="min-h-[120px] resize-none"
              aria-describedby="text-input-help"
            />
            <div id="text-input-help" className="sr-only">
              Enter or paste large text to summarize or translate
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSummarize}
              disabled={!inputText.trim() || isProcessing}
              className="flex-1"
              aria-describedby="summarize-help"
            >
              {isProcessing && activeTab === 'summary' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
                  <span className="sr-only">Generating summary...</span>
                </>
              ) : (
                <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
              )}
              Summarize Text
            </Button>
            <div id="summarize-help" className="sr-only">
              Generate a concise summary of large text in both English and Patois
            </div>
            
            <Button
              onClick={handleTranslate}
              disabled={!inputText.trim() || isProcessing}
              variant="outline"
              className="flex-1"
              aria-describedby="translate-help"
            >
              {isProcessing && activeTab === 'translation' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
                  <span className="sr-only">Translating...</span>
                </>
              ) : (
                <Languages className="w-4 h-4 mr-2" aria-hidden="true" />
              )}
              Auto-Translate
            </Button>
            <div id="translate-help" className="sr-only">
              Automatically translate text between English and Jamaican Patois
            </div>
          </div>

          {/* Results */}
          {(summary || translation) && (
            <div className="flex-1 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-border mb-4" role="tablist" aria-label="Results">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'summary'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  role="tab"
                  aria-selected={activeTab === 'summary'}
                  aria-controls="summary-panel"
                  id="summary-tab"
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
                  role="tab"
                  aria-selected={activeTab === 'translation'}
                  aria-controls="translation-panel"
                  id="translation-tab"
                >
                  Translation
                </button>
              </div>

              {/* Result Content */}
              <div className="relative">
                <div 
                  className="bg-muted/30 rounded-lg p-4 overflow-y-auto max-h-[300px]"
                  role="tabpanel"
                  aria-labelledby={activeTab === 'summary' ? 'summary-tab' : 'translation-tab'}
                  id={activeTab === 'summary' ? 'summary-panel' : 'translation-panel'}
                >
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
                    aria-label={`Copy ${activeTab} to clipboard`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" aria-hidden="true" />
                        <span className="sr-only">Copied to clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" aria-hidden="true" />
                        <span className="sr-only">Copy to clipboard</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatSummary;
