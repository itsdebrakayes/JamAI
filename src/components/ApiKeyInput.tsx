import React, { useState } from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void;
  isVisible: boolean;
}

const ApiKeyInput = ({ onApiKeySet, isVisible }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySet(apiKey.trim());
      setApiKey('');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl p-6 max-w-md w-full modern-shadow-lg border border-border">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-6 h-6 text-secondary-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Gemini API Key Required</h2>
          <p className="text-muted-foreground text-sm">
            Enter your Google Gemini API key to enable AI-powered responses
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-8 w-8"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={!apiKey.trim()}
          >
            Connect to Gemini
          </Button>
        </form>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Your API key is stored locally and never shared
        </p>
      </div>
    </div>
  );
};

export default ApiKeyInput;
