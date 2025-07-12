
import React, { useState } from 'react';
import { Send, Plus, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import VoiceControls from './VoiceControls';
import ToolsDropdown from './ToolsDropdown';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setMessage(transcript);
  };

  const handleFileUpload = (type: 'file' | 'image') => {
    if (type === 'file') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.txt,.pdf,.doc,.docx,.json';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          onSendMessage(`I've uploaded a file: ${file.name}. Please help me analyze it.`);
        }
      };
      input.click();
    } else if (type === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          onSendMessage(`I've uploaded an image: ${file.name}. Please help me analyze it.`);
        }
      };
      input.click();
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="flex items-end gap-3 glass-effect rounded-3xl p-4 modern-shadow-lg">
          <div className="flex gap-1">
            <ToolsDropdown 
              onToolSelect={onSendMessage}
              disabled={disabled}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={disabled}
                  className="h-10 w-10 rounded-2xl hover:bg-muted/50 transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent side="top" align="start" className="w-48 bg-background border shadow-lg">
                <DropdownMenuItem
                  onClick={() => handleFileUpload('file')}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Upload File
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={() => handleFileUpload('image')}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Upload Image
                </DropdownMenuItem>
                
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message JamAI..."
            disabled={disabled}
            className="flex-1 border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground text-base px-2 py-3 min-h-[24px] max-h-32"
            rows={1}
          />
          
          <div className="flex items-center gap-2">
            <VoiceControls 
              onTranscriptReady={handleVoiceTranscript}
              disabled={disabled}
            />
            
            <Button 
              type="submit" 
              disabled={!message.trim() || disabled}
              size="icon"
              className="h-10 w-10 rounded-2xl bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90 text-secondary-foreground disabled:from-muted disabled:to-muted disabled:text-muted-foreground modern-shadow transition-all duration-200 hover:scale-105"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
