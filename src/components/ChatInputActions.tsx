
import React, { useState, useRef } from 'react';
import { Plus, Upload, Image, FileText, Wand2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface ChatInputActionsProps {
  onFileUpload: (file: File, type: 'file' | 'image') => void;
  onImageGeneration: (prompt: string) => void;
  disabled?: boolean;
}

const ChatInputActions = ({ onFileUpload, onImageGeneration, disabled }: ChatInputActionsProps) => {
  const [showImageGenDialog, setShowImageGenDialog] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      // Check file type for images
      if (type === 'image' && !file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      onFileUpload(file, type);
      
      toast({
        title: "File uploaded",
        description: `${file.name} has been attached to your message.`,
      });
    }
  };

  const handleImageGeneration = async () => {
    if (!imagePrompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for the image you want to generate.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('openai-image-generation', {
        body: { prompt: imagePrompt }
      });

      if (error) throw error;

      onImageGeneration(imagePrompt);
      setShowImageGenDialog(false);
      setImagePrompt('');
      
      toast({
        title: "Image generation started",
        description: "Your image is being generated...",
      });
    } catch (error) {
      console.error('Image generation error:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={disabled}
            className="h-10 w-10 rounded-2xl hover:bg-muted transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent side="top" align="start" className="w-48">
          <DropdownMenuItem
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer"
          >
            <FileText className="w-4 h-4 mr-2" />
            Upload File
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => imageInputRef.current?.click()}
            className="cursor-pointer"
          >
            <Image className="w-4 h-4 mr-2" />
            Upload Image
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => setShowImageGenDialog(true)}
            className="cursor-pointer"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Image
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.pdf,.doc,.docx,.json"
        onChange={(e) => handleFileUpload(e, 'file')}
        className="hidden"
      />
      
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'image')}
        className="hidden"
      />

      {/* Image Generation Dialog */}
      <Dialog open={showImageGenDialog} onOpenChange={setShowImageGenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Image</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-prompt">Describe the image you want to create</Label>
              <Textarea
                id="image-prompt"
                placeholder="A beautiful Jamaican beach at sunset..."
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowImageGenDialog(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              
              <Button
                type="button"
                onClick={handleImageGeneration}
                disabled={isGenerating || !imagePrompt.trim()}
                className="bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatInputActions;
