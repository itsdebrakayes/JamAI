
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
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t bg-card">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type yuh message here..."
        disabled={disabled}
        className="flex-1 border-2 border-border focus:border-primary transition-colors"
      />
      <Button 
        type="submit" 
        disabled={!message.trim() || disabled}
        className="jamaican-gradient hover:opacity-90 transition-opacity"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
};

export default ChatInput;
