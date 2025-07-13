
import React, { useState, useRef } from 'react';
import { Send, Plus, FileText, Image, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import VoiceControls from './VoiceControls';
import ToolsDropdown from './ToolsDropdown';
import SuggestionDropdown from './SuggestionDropdown';

interface UploadedFile {
  file: File;
  preview?: string;
  id: string;
}

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFileUpload: (files: UploadedFile[], prompt: string) => void;
  disabled?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}

const ChatInput = ({ onSendMessage, onFileUpload, disabled, value, onValueChange }: ChatInputProps) => {
  const [message, setMessage] = useState(value || '');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (value !== undefined) {
      setMessage(value);
    }
  }, [value]);

  const handleMessageChange = (newMessage: string) => {
    setMessage(newMessage);
    onValueChange?.(newMessage);
  };

  const handleToolSelect = (toolPrompt: string) => {
    const newMessage = message + toolPrompt;
    handleMessageChange(newMessage);
  };

  const getSuggestions = () => {
    if (message.toLowerCase().includes('generate an image')) {
      return ['a sunset over the Blue Mountains', 'Jamaican flag colors', 'traditional Jamaican food', 'reggae music scene'];
    }
    if (message.toLowerCase().includes('search the web')) {
      return ['latest news about Jamaica', 'Jamaican music festivals 2025', 'best beaches in Jamaica', 'Jamaican culture facts'];
    }
    if (message.toLowerCase().includes('deep web search')) {
      return ['Jamaican economic trends', 'climate change impact on Jamaica', 'historical documents about Jamaica', 'academic research on Caribbean culture'];
    }
    if (message.toLowerCase().includes('translate')) {
      return ['this English phrase to Patois', 'this Patois to English', 'this to Spanish', 'this to French'];
    }
    if (message.toLowerCase().includes('brainstorm ideas')) {
      return ['a Jamaican-themed business', 'promoting Jamaican culture', 'sustainable tourism in Jamaica', 'Caribbean food fusion'];
    }
    if (message.toLowerCase().includes('teach me patois')) {
      return ['greetings and basic phrases', 'food and cooking terms', 'family and relationships', 'music and entertainment'];
    }
    return [];
  };

  const handleSuggestionSelect = (suggestion: string) => {
    const newMessage = message + suggestion;
    handleMessageChange(newMessage);
  };

  const handleSubmit = (e: React.FormEvent) => {
    handleSubmitWithFiles(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    handleMessageChange(transcript);
  };

  const handleFileSelect = (selectedFiles: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const id = `${Date.now()}-${i}`;
      
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }
      
      newFiles.push({ file, preview, id });
    }
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmitWithFiles = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    
    if (uploadedFiles.length > 0 && trimmedMessage) {
      await onFileUpload(uploadedFiles, trimmedMessage);
      setUploadedFiles([]);
      handleMessageChange('');
    } else if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      handleMessageChange('');
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="relative">
      {/* Uploaded Files Display */}
      {uploadedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {uploadedFiles.map((uploadedFile) => (
            <div key={uploadedFile.id} className="relative group">
              <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2 pr-8">
                {uploadedFile.preview ? (
                  <img 
                    src={uploadedFile.preview} 
                    alt={uploadedFile.file.name}
                    className="w-8 h-8 object-cover rounded"
                  />
                ) : (
                  <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                    {getFileIcon(uploadedFile.file)}
                  </div>
                )}
                <span className="text-sm font-medium truncate max-w-32">
                  {uploadedFile.file.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(uploadedFile.id)}
                className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex items-end gap-3 glass-effect rounded-3xl p-4 modern-shadow-lg">
          <div className="flex gap-1">
            <ToolsDropdown 
              onToolSelect={handleToolSelect}
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
              <DropdownMenuContent align="start" className="w-56 bg-background border shadow-lg z-50">
                <DropdownMenuItem onClick={handleFileUpload} className="cursor-pointer">
                  <Image className="w-4 h-4 mr-2" />
                  Upload photos or files
                </DropdownMenuItem>
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer">
                    <Plus className="w-4 h-4 mr-2" />
                    Add from other app
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-background border shadow-lg z-50">
                    <DropdownMenuItem className="cursor-pointer">
                      <FileText className="w-4 h-4 mr-2" />
                      Google Docs
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <FileText className="w-4 h-4 mr-2" />
                      Google Drive
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <FileText className="w-4 h-4 mr-2" />
                      OneDrive
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <Textarea
            value={message}
            onChange={(e) => handleMessageChange(e.target.value)}
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

        {/* Suggestion Dropdown */}
        {message && getSuggestions().length > 0 && (
          <div className="mt-2 flex justify-start">
            <SuggestionDropdown 
              suggestions={getSuggestions()}
              onSuggestionSelect={handleSuggestionSelect}
              disabled={disabled}
            />
          </div>
        )}
      </form>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.doc,.docx,.json,.csv"
        onChange={(e) => {
          const files = e.target.files;
          if (files) handleFileSelect(files);
        }}
        className="hidden"
      />
    </div>
  );
};

export default ChatInput;
