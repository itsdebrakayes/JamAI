import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const processFilesWithAI = async (
    files: File[], 
    prompt: string, 
    userId: string, 
    sessionId?: string,
    threadId?: string
  ): Promise<{ message: string; threadId: string; assistantId: string } | null> => {
    setIsProcessing(true);
    
    try {
      console.log('Processing files with AI assistant...');
      
      // Create FormData for the assistant API
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('userId', userId);
      
      if (sessionId) {
        formData.append('sessionId', sessionId);
      }
      
      if (threadId) {
        formData.append('threadId', threadId);
      }
      
      // Add files to form data
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      // Call the assistants API
      const response = await supabase.functions.invoke('assistants-file-processor', {
        body: formData,
      });

      if (response.error) {
        console.error('Assistant processing error:', response.error);
        throw new Error(response.error.message || 'Failed to process files with AI');
      }

      console.log('AI processing successful:', response.data);
      
      toast({
        title: "Files processed successfully",
        description: `${files.length} file(s) analyzed by AI`,
        variant: "default"
      });

      return response.data;
    } catch (error) {
      console.error('AI file processing error:', error);
      toast({
        title: "AI processing failed",
        description: "Failed to process files with AI. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    processFilesWithAI,
    isUploading,
    isProcessing
  };
};