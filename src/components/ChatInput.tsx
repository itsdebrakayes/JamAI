
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    
    console.log('ChatInput: Attempting to send message:', trimmedMessage);
    console.log('ChatInput: Disabled state:', disabled);
    
    if (trimmedMessage && !disabled) {
      console.log('ChatInput: Calling onSendMessage with:', trimmedMessage);
      onSendMessage(trimmedMessage);
      setMessage('');
      console.log('ChatInput: Message sent and input cleared');
    } else {
      console.log('ChatInput: Message not sent - empty or disabled');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex items-end gap-3 glass-effect rounded-3xl p-4 modern-shadow-lg transition-all duration-300 hover:shadow-xl">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message JamAI..."
          disabled={disabled}
          className="flex-1 border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground text-base px-2 py-3 min-h-[24px] max-h-32"
          rows={1}
        />
        <Button 
          type="submit" 
          disabled={!message.trim() || disabled}
          size="icon"
          className="h-10 w-10 rounded-2xl bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90 text-secondary-foreground disabled:from-muted disabled:to-muted disabled:text-muted-foreground modern-shadow transition-all duration-200 hover:scale-105"
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;
