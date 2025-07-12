import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileName = `${userId}/${Date.now()}-${file.name}`;
      
      const { error } = await supabase.storage
        .from('user-uploads')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      return fileName;
    } catch (error) {
      console.error('File upload error:', error);
      return null;
    }
  };

  const uploadMultipleFiles = async (files: File[], userId: string) => {
    setIsUploading(true);
    
    try {
      const uploadPromises = files.map(file => uploadFile(file, userId));
      const results = await Promise.all(uploadPromises);
      
      const successfulUploads = results.filter(result => result !== null) as string[];
      
      if (successfulUploads.length === 0) {
        throw new Error('No files were uploaded successfully');
      }
      
      return successfulUploads;
    } catch (error) {
      console.error('Multiple file upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    isUploading
  };
};