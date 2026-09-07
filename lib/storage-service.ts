/**
 * Firebase Storage service for image uploads
 */

import { storage, getStorageInstance } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { compressImage, validateImageFile, formatFileSize, calculateCompression } from './image-utils';

export interface UploadResult {
  url: string;
  path: string;
  originalSize: number;
  compressedSize: number;
}

export interface UploadProgress {
  progress: number;
  status: 'compressing' | 'uploading' | 'completed' | 'error';
  error?: string;
}

const MAX_IMAGES_PER_TICKET = 3;

/**
 * Upload a single image to Firebase Storage
 */
export async function uploadImage(
  file: File,
  ticketId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Compress image
    onProgress?.({ progress: 10, status: 'compressing' });
    const compressed = await compressImage(file);
    
    const compressionPercent = calculateCompression(
      compressed.originalSize,
      compressed.compressedSize
    );
    
    console.log(`[v0] Image compressed: ${formatFileSize(compressed.originalSize)} → ${formatFileSize(compressed.compressedSize)} (${compressionPercent}% reduction)`);

    // Upload to Firebase Storage
    onProgress?.({ progress: 20, status: 'uploading' });
    
    const storageInstance = getStorageInstance();
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storageRef = ref(storageInstance, `ticket-images/${ticketId}/${fileName}`);
    
    const uploadTask = uploadBytes(storageRef, compressed.file);
    const snapshot = await uploadTask;
    
    onProgress?.({ progress: 90, status: 'uploading' });
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    onProgress?.({ progress: 100, status: 'completed' });
    
    return {
      url: downloadURL,
      path: snapshot.ref.fullPath,
      originalSize: compressed.originalSize,
      compressedSize: compressed.compressedSize,
    };
  } catch (error) {
    onProgress?.({ 
      progress: 0, 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Upload failed' 
    });
    throw error;
  }
}

/**
 * Upload multiple images for a ticket
 */
export async function uploadTicketImages(
  files: File[],
  ticketId: string,
  existingImages: string[] = [],
  onProgress?: (index: number, progress: UploadProgress) => void
): Promise<string[]> {
  // Check if adding new images would exceed limit
  if (existingImages.length + files.length > MAX_IMAGES_PER_TICKET) {
    throw new Error(
      `Maximum ${MAX_IMAGES_PER_TICKET} images per ticket. You have ${existingImages.length} images and are trying to add ${files.length} more.`
    );
  }

  const uploadPromises = files.map((file, index) =>
    uploadImage(file, ticketId, (progress) => onProgress?.(index, progress))
  );

  const results = await Promise.all(uploadPromises);
  return results.map((result) => result.url);
}

/**
 * Delete an image from Firebase Storage
 */
export async function deleteImage(url: string): Promise<void> {
  try {
    const storageInstance = getStorageInstance();
    const storageRef = ref(storageInstance, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('[v0] Error deleting image:', error);
    throw error;
  }
}

/**
 * Delete all images for a ticket
 */
export async function deleteTicketImages(imageUrls: string[]): Promise<void> {
  const deletePromises = imageUrls.map((url) => deleteImage(url));
  await Promise.allSettled(deletePromises);
}
