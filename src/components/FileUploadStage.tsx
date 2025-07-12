import React, { useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

interface UploadedFile {
  file: File;
  preview?: string;
  id: string;
}

interface FileUploadStageProps {
  onSubmit: (files: UploadedFile[], prompt: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

const FileUploadStage = ({ onSubmit, onCancel, disabled }: FileUploadStageProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { checkLimit, incrementUsage } = useSubscription();
  const { toast } = useToast();

  const handleFileSelect = async (selectedFiles: FileList) => {
    if (!user) return;

    // Check media upload limit
    const canUpload = await checkLimit('media');
    if (!canUpload) {
      toast({
        title: "Upload limit reached",
        description: "You've reached your daily media upload limit.",
        variant: "destructive"
      });
      return;
    }

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
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleSubmit = async () => {
    if (!files.length || !prompt.trim()) return;
    
    setIsUploading(true);
    try {
      await onSubmit(files, prompt.trim());
      await incrementUsage('media', files.length);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to process files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (file.type === 'application/pdf') return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4 p-4 bg-background/95 backdrop-blur-sm rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Upload Files</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* File Drop Zone */}
      <div 
        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.accept = 'image/*,.pdf,.txt,.doc,.docx,.json,.csv';
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) handleFileSelect(files);
          };
          input.click();
        }}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Click to upload files or drag and drop
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Images, PDF, TXT, DOC, JSON, CSV (max 50MB each)
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected Files ({files.length})</p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {files.map((uploadedFile) => (
              <Card key={uploadedFile.id} className="p-2">
                <div className="flex items-center gap-3">
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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadedFile.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Prompt Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">What would you like me to do with these files?</label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want me to analyze, extract, or do with the uploaded files..."
          className="min-h-[80px]"
          disabled={disabled || isUploading}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel} disabled={isUploading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!files.length || !prompt.trim() || disabled || isUploading}
        >
          {isUploading ? 'Processing...' : `Process ${files.length} file${files.length > 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
};

export default FileUploadStage;