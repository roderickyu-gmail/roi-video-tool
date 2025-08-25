"use client";

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Film, Image, Music, Layers, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface R2UploaderProps {
  projectId: string;
  onUploadComplete?: (material: any) => void;
  materialType?: 'video' | 'image' | 'audio' | 'overlay';
  maxFileSize?: number; // in MB
  acceptedFormats?: Record<string, string[]>;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

const DEFAULT_ACCEPTED_FORMATS = {
  video: {
    'video/mp4': ['.mp4'],
    'video/quicktime': ['.mov'],
    'video/x-msvideo': ['.avi'],
    'video/webm': ['.webm'],
  },
  image: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
  },
  audio: {
    'audio/mpeg': ['.mp3'],
    'audio/wav': ['.wav'],
    'audio/ogg': ['.ogg'],
    'audio/webm': ['.weba'],
  },
  overlay: {
    'image/png': ['.png'],
    'image/svg+xml': ['.svg'],
  },
};

const TYPE_ICONS = {
  video: Film,
  image: Image,
  audio: Music,
  overlay: Layers,
};

export function R2Uploader({
  projectId,
  onUploadComplete,
  materialType = 'video',
  maxFileSize = 500, // 500MB default
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS[materialType],
}: R2UploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map());
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File) => {
    const fileId = `${file.name}-${Date.now()}`;
    
    // Add file to uploading list
    setUploadingFiles(prev => new Map(prev).set(fileId, {
      file,
      progress: 0,
      status: 'uploading',
    }));

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      formData.append('type', materialType);
      formData.append('name', file.name);

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            const fileData = newMap.get(fileId);
            if (fileData) {
              newMap.set(fileId, { ...fileData, progress });
            }
            return newMap;
          });
        }
      };

      // Handle completion
      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              setUploadingFiles(prev => {
                const newMap = new Map(prev);
                newMap.set(fileId, {
                  file,
                  progress: 100,
                  status: 'completed',
                  url: response.material.url,
                });
                return newMap;
              });
              
              toast.success(`${file.name} uploaded successfully`);
              onUploadComplete?.(response.material);
              resolve(response);
            } else {
              reject(new Error(response.error));
            }
          } else {
            reject(new Error('Upload failed'));
          }
        };

        xhr.onerror = () => reject(new Error('Network error'));
        
        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.set(fileId, {
          file,
          progress: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        });
        return newMap;
      });
      
      toast.error(`Failed to upload ${file.name}`);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Validate file sizes
    const oversizedFiles = acceptedFiles.filter(file => file.size > maxFileSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`Files exceed ${maxFileSize}MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setIsUploading(true);
    
    // Upload files in parallel
    await Promise.all(acceptedFiles.map(uploadFile));
    
    setIsUploading(false);
  }, [projectId, materialType, maxFileSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats,
    maxSize: maxFileSize * 1024 * 1024,
    multiple: true,
  });

  const removeFile = (fileId: string) => {
    setUploadingFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
  };

  const Icon = TYPE_ICONS[materialType];

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-colors cursor-pointer
          ${isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          
          <div>
            <p className="text-sm font-medium">
              {isDragActive ? 'Drop files here' : `Upload ${materialType}s`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max size: {maxFileSize}MB
            </p>
          </div>
          
          <Button size="sm" variant="secondary">
            <Upload className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
        </div>
      </div>

      {/* Uploading Files List */}
      {uploadingFiles.size > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploading Files</h4>
          
          {Array.from(uploadingFiles.entries()).map(([fileId, fileData]) => (
            <div
              key={fileId}
              className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg"
            >
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {fileData.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              
              <div className="flex-1">
                {fileData.status === 'uploading' && (
                  <Progress value={fileData.progress} className="h-1" />
                )}
                {fileData.status === 'completed' && (
                  <p className="text-xs text-green-600">Completed</p>
                )}
                {fileData.status === 'error' && (
                  <p className="text-xs text-red-600">{fileData.error}</p>
                )}
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeFile(fileId)}
                disabled={fileData.status === 'uploading'}
              >
                {fileData.status === 'uploading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}