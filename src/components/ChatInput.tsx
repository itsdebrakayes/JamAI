
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import VoiceControls from './VoiceControls';
import ChatInputActions from './ChatInputActions';
import UploadedFilePreview from './UploadedFilePreview';

interface ChatInputProps {
  onSendMessage: (message: string, files?: Array<{file: File, type: 'file' | 'image'}>, imagePrompt?: string) => void;
  disabled?: boolean;
}

interface UploadedFile {
  file: File;
  type: 'file' | 'image';
  preview?: string;
}

const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    
    console.log('ChatInput: Attempting to send message:', trimmedMessage);
    console.log('ChatInput: Disabled state:', disabled);
    console.log('ChatInput: Uploaded files:', uploadedFiles.length);
    
    if ((trimmedMessage || uploadedFiles.length > 0) && !disabled) {
      console.log('ChatInput: Calling onSendMessage');
      onSendMessage(trimmedMessage, uploadedFiles);
      setMessage('');
      setUploadedFiles([]);
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

  const handleVoiceTranscript = (transcript: string) => {
    setMessage(transcript);
  };

  const handleFileUpload = (file: File, type: 'file' | 'image') => {
    const newFile: UploadedFile = { file, type };
    
    // Create preview for images
    if (type === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        newFile.preview = e.target?.result as string;
        setUploadedFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedFiles(prev => [...prev, newFile]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageGeneration = (prompt: string) => {
    // Send image generation request as a message
    onSendMessage(`Generate an image: ${prompt}`, [], prompt);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <UploadedFilePreview 
          files={uploadedFiles} 
          onRemoveFile={handleRemoveFile} 
        />
        
        <div className="flex items-end gap-3 glass-effect rounded-3xl p-4 modern-shadow-lg transition-all duration-300 hover:shadow-xl">
          <ChatInputActions
            onFileUpload={handleFileUpload}
            onImageGeneration={handleImageGeneration}
            disabled={disabled}
          />
          
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
              disabled={(!message.trim() && uploadedFiles.length === 0) || disabled}
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
