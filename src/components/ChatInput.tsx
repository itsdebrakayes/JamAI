
import React, { useState } from 'react';
import { Send, Plus, Upload, Image, FileText, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import VoiceControls from './VoiceControls';
import UploadedFilePreview from './UploadedFilePreview';

interface ChatInputProps {
  onSendMessage: (message: string, files?: Array<{file: File, type: 'file' | 'image', content?: string}>, imagePrompt?: string) => void;
  disabled?: boolean;
}

interface UploadedFile {
  file: File;
  type: 'file' | 'image';
  preview?: string;
  content?: string;
}

const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    
    if ((trimmedMessage || uploadedFiles.length > 0) && !disabled) {
      onSendMessage(trimmedMessage, uploadedFiles);
      setMessage('');
      setUploadedFiles([]);
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

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (file: File, type: 'file' | 'image') => {
    const newFile: UploadedFile = { file, type };
    
    try {
      if (type === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          newFile.preview = e.target?.result as string;
          setUploadedFiles(prev => [...prev, newFile]);
        };
        reader.readAsDataURL(file);
      } else {
        const content = await readFileContent(file);
        newFile.content = content;
        setUploadedFiles(prev => [...prev, newFile]);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      setUploadedFiles(prev => [...prev, newFile]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageGeneration = (prompt: string) => {
    onSendMessage(`Generate an image: ${prompt}`, [], prompt);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <UploadedFilePreview 
          files={uploadedFiles} 
          onRemoveFile={handleRemoveFile} 
        />
        
        <div className="flex items-end gap-3 glass-effect rounded-3xl p-4 modern-shadow-lg">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={disabled}
                className="h-10 w-10 rounded-2xl hover:bg-muted/50"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent side="top" align="start" className="w-48">
              <DropdownMenuItem
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.txt,.pdf,.doc,.docx,.json';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileUpload(file, 'file');
                  };
                  input.click();
                }}
                className="cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2" />
                Upload File
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileUpload(file, 'image');
                  };
                  input.click();
                }}
                className="cursor-pointer"
              >
                <Image className="w-4 h-4 mr-2" />
                Upload Image
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => {
                  const prompt = window.prompt('Describe the image you want to generate:');
                  if (prompt) handleImageGeneration(prompt);
                }}
                className="cursor-pointer"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Image
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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
