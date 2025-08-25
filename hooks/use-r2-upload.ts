import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UploadOptions {
  projectId: string;
  type?: 'video' | 'image' | 'audio' | 'overlay';
  onSuccess?: (material: any) => void;
  onError?: (error: string) => void;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'idle' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

export function useR2Upload(options: UploadOptions) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    fileName: '',
    progress: 0,
    status: 'idle',
  });
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    if (!options.projectId) {
      toast.error('Project ID is required');
      return null;
    }

    setIsUploading(true);
    setUploadProgress({
      fileName: file.name,
      progress: 0,
      status: 'uploading',
    });

    try {
      // Option 1: Direct upload to API route
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', options.projectId);
      formData.append('type', options.type || 'video');
      formData.append('name', file.name);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      if (result.success) {
        setUploadProgress({
          fileName: file.name,
          progress: 100,
          status: 'completed',
          url: result.material.url,
        });

        toast.success(`${file.name} uploaded successfully`);
        options.onSuccess?.(result.material);
        
        return result.material;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: errorMessage,
      });

      toast.error(errorMessage);
      options.onError?.(errorMessage);
      
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [options]);

  const uploadDirectToR2 = useCallback(async (file: File) => {
    if (!options.projectId) {
      toast.error('Project ID is required');
      return null;
    }

    setIsUploading(true);
    setUploadProgress({
      fileName: file.name,
      progress: 0,
      status: 'uploading',
    });

    try {
      // Step 1: Get presigned URL
      const params = new URLSearchParams({
        fileName: file.name,
        projectId: options.projectId,
        type: options.type || 'video',
      });

      const presignedResponse = await fetch(`/api/upload?${params}`);
      if (!presignedResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, key, publicUrl } = await presignedResponse.json();

      // Step 2: Upload directly to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Direct upload to R2 failed');
      }

      // Step 3: Save metadata to database (optional)
      const material = {
        url: publicUrl,
        key,
        name: file.name,
        type: options.type || 'video',
      };

      setUploadProgress({
        fileName: file.name,
        progress: 100,
        status: 'completed',
        url: publicUrl,
      });

      toast.success(`${file.name} uploaded successfully`);
      options.onSuccess?.(material);
      
      return material;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: errorMessage,
      });

      toast.error(errorMessage);
      options.onError?.(errorMessage);
      
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [options]);

  const reset = useCallback(() => {
    setUploadProgress({
      fileName: '',
      progress: 0,
      status: 'idle',
    });
    setIsUploading(false);
  }, []);

  return {
    uploadFile,
    uploadDirectToR2,
    uploadProgress,
    isUploading,
    reset,
  };
}