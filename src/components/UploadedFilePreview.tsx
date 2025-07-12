
import React from 'react';
import { X, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadedFile {
  file: File;
  type: 'file' | 'image';
  preview?: string;
}

interface UploadedFilePreviewProps {
  files: UploadedFile[];
  onRemoveFile: (index: number) => void;
}

const UploadedFilePreview = ({ files, onRemoveFile }: UploadedFilePreviewProps) => {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {files.map((uploadedFile, index) => (
        <div
          key={index}
          className="relative flex items-center gap-2 bg-muted rounded-lg p-2 max-w-xs"
        >
          {uploadedFile.type === 'image' && uploadedFile.preview ? (
            <img
              src={uploadedFile.preview}
              alt={uploadedFile.file.name}
              className="w-8 h-8 object-cover rounded"
            />
          ) : uploadedFile.type === 'image' ? (
            <Image className="w-4 h-4 text-muted-foreground" />
          ) : (
            <FileText className="w-4 h-4 text-muted-foreground" />
          )}
          
          <span className="text-sm truncate flex-1">
            {uploadedFile.file.name}
          </span>
          
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => onRemoveFile(index)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default UploadedFilePreview;
