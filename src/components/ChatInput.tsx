
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex items-end gap-2 bg-background border border-border rounded-2xl p-3 shadow-sm focus-within:shadow-md transition-shadow">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message JamAI..."
          disabled={disabled}
          className="flex-1 border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground text-sm"
        />
        <Button 
          type="submit" 
          disabled={!message.trim() || disabled}
          size="icon"
          className="h-8 w-8 rounded-lg bg-foreground hover:bg-foreground/90 text-background disabled:bg-muted disabled:text-muted-foreground"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;
