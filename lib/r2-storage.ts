import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 Configuration
const R2_CONFIG = {
  accountId: '030298abc68b5168a2fa497e0ea60ddf',
  accessKeyId: '8237b05eda5578eb80be1ad8b613640a',
  secretAccessKey: 'bff46424f5d6e403e3efe9b9b7cd9dce21d68a13d7797e8cf32d8f3679b94eb9',
  bucketName: 'r1vd',
  publicDomain: 'https://030298abc68b5168a2fa497e0ea60ddf.r2.cloudflarestorage.com'
};

// Initialize S3 Client for R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey,
  },
});

export interface UploadOptions {
  folder?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
}

/**
 * Generate a unique file key with optional folder structure
 */
function generateFileKey(fileName: string, folder?: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${timestamp}_${randomString}_${cleanFileName}`;
  
  return folder ? `${folder}/${key}` : key;
}

/**
 * Get public URL for an R2 object
 */
export function getPublicUrl(key: string): string {
  return `${R2_CONFIG.publicDomain}/${R2_CONFIG.bucketName}/${key}`;
}

/**
 * Upload a file to R2 storage
 */
export async function uploadToR2(
  file: File | Buffer,
  fileName: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const { folder = 'uploads', contentType, metadata = {} } = options;
    
    // Generate unique key
    const key = generateFileKey(fileName, folder);
    
    // Prepare file data
    let fileData: Buffer | Uint8Array;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      fileData = new Uint8Array(arrayBuffer);
    } else {
      fileData = file;
    }
    
    // Prepare upload command
    const command = new PutObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key,
      Body: fileData,
      ContentType: contentType || (file instanceof File ? file.type : 'application/octet-stream'),
      Metadata: {
        ...metadata,
        uploadedAt: new Date().toISOString(),
      },
    });
    
    // Execute upload
    await r2Client.send(command);
    
    // Return success with public URL
    const publicUrl = getPublicUrl(key);
    
    return {
      success: true,
      key,
      url: publicUrl,
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete a file from R2 storage
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key,
    });
    
    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error('R2 delete error:', error);
    return false;
  }
}

/**
 * Generate a presigned URL for direct browser upload
 */
export async function getPresignedUploadUrl(
  fileName: string,
  options: UploadOptions = {}
): Promise<{ url: string; key: string; publicUrl: string }> {
  const { folder = 'uploads', contentType } = options;
  const key = generateFileKey(fileName, folder);
  
  const command = new PutObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key,
    ContentType: contentType || 'application/octet-stream',
  });
  
  const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 }); // 1 hour expiry
  const publicUrl = getPublicUrl(key);
  
  return { url, key, publicUrl };
}

/**
 * Generate a presigned URL for downloading/accessing private content
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key,
  });
  
  return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Upload video material with metadata
 */
export async function uploadVideoMaterial(
  file: File,
  projectId: string,
  materialType: 'video' | 'image' | 'audio' | 'overlay' = 'video'
): Promise<UploadResult> {
  const folder = `projects/${projectId}/${materialType}s`;
  
  return uploadToR2(file, file.name, {
    folder,
    contentType: file.type,
    metadata: {
      projectId,
      materialType,
      originalName: file.name,
      size: file.size.toString(),
    },
  });
}

/**
 * Upload brand kit asset (logo, etc.)
 */
export async function uploadBrandAsset(
  file: File,
  projectId: string,
  assetType: 'logo' | 'watermark' | 'overlay'
): Promise<UploadResult> {
  const folder = `projects/${projectId}/brand`;
  
  return uploadToR2(file, file.name, {
    folder,
    contentType: file.type,
    metadata: {
      projectId,
      assetType,
      originalName: file.name,
    },
  });
}

/**
 * Upload exported video variant
 */
export async function uploadExportedVideo(
  file: Buffer,
  projectId: string,
  variantId: string,
  fileName: string
): Promise<UploadResult> {
  const folder = `projects/${projectId}/exports`;
  
  return uploadToR2(file, fileName, {
    folder,
    contentType: 'video/mp4',
    metadata: {
      projectId,
      variantId,
      exportedAt: new Date().toISOString(),
    },
  });
}