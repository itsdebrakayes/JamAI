
import React, { useState } from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type AIService = 'gemini' | 'openai';

interface ApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void;
  onServiceChange: (service: AIService) => void;
}

const ApiKeyInput = ({ onApiKeySet, onServiceChange }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [selectedService, setSelectedService] = useState<AIService>('gemini');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySet(apiKey.trim());
      setApiKey('');
    }
  };

  const handleServiceChange = (service: AIService) => {
    setSelectedService(service);
    onServiceChange(service);
  };

  return (
    <div className="glass-effect rounded-2xl p-6 max-w-md mx-auto modern-shadow border border-border">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-jamaican-gold to-jamaican-green rounded-full flex items-center justify-center mx-auto mb-4">
          <Key className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-semibold mb-2">API Key Required</h2>
        <p className="text-muted-foreground text-sm">
          Enter your {selectedService.toUpperCase()} API key to enable AI-powered responses
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">AI Service</label>
          <Select value={selectedService} onValueChange={handleServiceChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini">Google Gemini</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={selectedService === 'gemini' ? 'AIza...' : 'sk-...'}
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
            className="w-full bg-gradient-to-r from-jamaican-gold to-jamaican-green hover:from-jamaican-gold/90 hover:to-jamaican-green/90"
            disabled={!apiKey.trim()}
          >
            Connect to {selectedService.toUpperCase()}
          </Button>
        </form>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Your API key is stored locally and never shared
      </p>
    </div>
  );
};

export default ApiKeyInput;
