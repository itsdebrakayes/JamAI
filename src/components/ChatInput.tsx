
/**
 * ChatInput Component
 * 
 * This component provides the chat input interface where users can:
 * - Type messages
 * - Upload files (images, documents)
 * - Use voice input
 * - Select from AI tools and suggestions
 * - Submit messages to the chat
 * 
 * Features:
 * - File upload with preview
 * - Voice recognition
 * - Dynamic suggestions
 * - Tool integration
 * - Keyboard shortcuts (Enter to send)
 */

import React, { useState, useRef } from 'react';
import { Send, Plus, FileText, Image, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import VoiceControls from './VoiceControls';
import ToolsDropdown from './ToolsDropdown';
import SuggestionDropdown from './SuggestionDropdown';

// Define the structure of an uploaded file with its metadata
interface UploadedFile {
  file: File;        // The actual File object from the browser
  preview?: string;  // Optional preview URL for images
  id: string;        // Unique identifier for the file
}

// Define what props this component expects from its parent
interface ChatInputProps {
  onSendMessage: (message: string) => void;                           // Callback when user sends a text message
  onFileUpload: (files: UploadedFile[], prompt: string) => void;     // Callback when user uploads files with a prompt
  disabled?: boolean;                                                 // Whether the input should be disabled
  value?: string;                                                     // Controlled value for the input
  onValueChange?: (value: string) => void;                           // Callback when input value changes
}

/**
 * ChatInput Component
 * 
 * Main chat input interface that handles user interactions and message submission.
 */
const ChatInput = ({ onSendMessage, onFileUpload, disabled, value, onValueChange }: ChatInputProps) => {
  // State for the current message being typed
  const [message, setMessage] = useState(value || '');
  
  // State for files that have been uploaded but not yet sent
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  // Reference to the hidden file input element for programmatic file selection
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local state when controlled value changes from parent
  React.useEffect(() => {
    if (value !== undefined) {
      setMessage(value);
    }
  }, [value]);

  /**
   * Handles changes to the message input
   * @param newMessage - The new message text
   */
  const handleMessageChange = (newMessage: string) => {
    setMessage(newMessage);
    onValueChange?.(newMessage); // Notify parent of the change if callback provided
  };

  /**
   * Adds a tool prompt to the current message
   * @param toolPrompt - The prompt text from the selected tool
   */
  const handleToolSelect = (toolPrompt: string) => {
    const newMessage = message + toolPrompt;
    handleMessageChange(newMessage);
  };

  /**
   * Provides contextual suggestions based on the current message content
   * @returns Array of suggestion strings relevant to the current message
   */
  const getSuggestions = () => {
    // If user mentions image generation, suggest image-related prompts
    if (message.toLowerCase().includes('generate an image')) {
      return ['a sunset over the Blue Mountains', 'Jamaican flag colors', 'traditional Jamaican food', 'reggae music scene'];
    }
    
    // If user mentions web search, suggest search topics
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

  /**
   * Handles selection of a suggestion from the dropdown
   * @param suggestion - The selected suggestion text
   */
  const handleSuggestionSelect = (suggestion: string) => {
    const newMessage = message + suggestion;
    handleMessageChange(newMessage);
  };

  /**
   * Handles form submission
   * @param e - Form submission event
   */
  const handleSubmit = (e: React.FormEvent) => {
    handleSubmitWithFiles(e);
  };

  /**
   * Handles keyboard events in the textarea
   * @param e - Keyboard event
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send message when Enter is pressed (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Allow Shift+Enter for new lines
  };

  /**
   * Handles voice transcription results
   * @param transcript - The transcribed text from voice input
   */
  const handleVoiceTranscript = (transcript: string) => {
    handleMessageChange(transcript);
  };

  /**
   * Processes selected files and creates preview URLs for images
   * @param selectedFiles - FileList object from file input
   */
  const handleFileSelect = (selectedFiles: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    // Process each selected file
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const id = `${Date.now()}-${i}`; // Create unique ID using timestamp and index
      
      let preview: string | undefined;
      // Create preview URL only for image files
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file); // Creates a temporary URL for the file
      }
      
      newFiles.push({ file, preview, id });
    }
    
    // Add new files to existing uploaded files
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  /**
   * Removes a file from the uploaded files list and cleans up its preview URL
   * @param id - The unique identifier of the file to remove
   */
  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      // Find the file to remove and clean up its preview URL
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview); // Important: prevents memory leaks
      }
      // Return new array without the removed file
      return prev.filter(f => f.id !== id);
    });
  };

  /**
   * Triggers the hidden file input element to open file selection dialog
   */
  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * Handles form submission with files or text messages
   * @param e - Form submission event
   */
  const handleSubmitWithFiles = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    
    // If there are files and a message, upload files with the message as prompt
    if (uploadedFiles.length > 0 && trimmedMessage) {
      await onFileUpload(uploadedFiles, trimmedMessage);
      setUploadedFiles([]); // Clear uploaded files after sending
      handleMessageChange(''); // Clear message input
    } 
    // If there's only a text message (no files), send as regular message
    else if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      handleMessageChange(''); // Clear message input
    }
  };

  /**
   * Returns the appropriate icon for a file based on its type
   * @param file - The File object
   * @returns The corresponding Lucide icon component
   */
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  /**
   * Extracts and formats the file extension for display
   * @param file - The File object
   * @returns The file extension in uppercase
   */
  const getFileTypeLabel = (file: File) => {
    const extension = file.name.split('.').pop()?.toUpperCase();
    return extension || 'FILE';
  };

  return (
    <div className="relative">
      {/* Uploaded Files Display */}
      {uploadedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {uploadedFiles.map((uploadedFile) => (
            <div key={uploadedFile.id} className="relative group">
              {uploadedFile.preview ? (
                // Image preview with remove button
                <div className="relative">
                  <img 
                    src={uploadedFile.preview} 
                    alt={uploadedFile.file.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadedFile.id)}
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-black text-white hover:bg-gray-800 shadow-md"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                // File display
                <div className="relative">
                  <div className="flex items-center gap-3 bg-black text-white rounded-lg p-3 pr-8 min-w-[180px]">
                    <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center flex-shrink-0">
                      {getFileIcon(uploadedFile.file)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {uploadedFile.file.name}
                      </div>
                      <div className="text-xs text-gray-300">
                        {getFileTypeLabel(uploadedFile.file)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadedFile.id)}
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-black text-white hover:bg-gray-800 shadow-md"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
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
