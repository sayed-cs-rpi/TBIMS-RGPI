'use client';

import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadTicketImages, UploadProgress } from '@/lib/storage-service';
import { formatFileSize } from '@/lib/image-utils';

interface ImageUploadProps {
  ticketId?: string;
  existingImages?: string[];
  onImagesChange?: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

interface PreviewImage {
  file: File;
  url: string;
  progress?: UploadProgress;
}

export function ImageUpload({
  ticketId,
  existingImages = [],
  onImagesChange,
  maxImages = 3,
  disabled = false,
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<PreviewImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalImages = existingImages.length + previews.length;
  const canAddMore = totalImages < maxImages && !disabled;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (totalImages + files.length > maxImages) {
      alert(`You can only upload ${maxImages} images per ticket. You currently have ${totalImages} images.`);
      return;
    }

    // Create previews
    const newPreviews: PreviewImage[] = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setPreviews([...previews, ...newPreviews]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePreview = (index: number) => {
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
  };

  const removeExistingImage = (index: number) => {
    const updated = existingImages.filter((_, i) => i !== index);
    onImagesChange?.(updated);
  };

  const handleUpload = async () => {
    if (!ticketId || previews.length === 0) return;

    setIsUploading(true);

    try {
      const files = previews.map((p) => p.file);
      
      const uploadPromises = files.map((file, index) =>
        uploadTicketImages([file], ticketId, existingImages, (i, progress) => {
          setPreviews((prev) => {
            const updated = [...prev];
            updated[index].progress = progress;
            return updated;
          });
        })
      );

      const results = await Promise.all(uploadPromises);
      const newUrls = results.flat();

      onImagesChange?.([...existingImages, ...newUrls]);
      setPreviews([]);
    } catch (error) {
      console.error('[v0] Upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing images */}
      {existingImages.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Images ({existingImages.length}/{maxImages})</p>
          <div className="grid grid-cols-3 gap-2">
            {existingImages.map((url, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={url}
                  alt={`Uploaded ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-border"
                />
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview images */}
      {previews.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Preview ({previews.length}/{maxImages})</p>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((preview, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={preview.url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-border"
                />
                {preview.progress?.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <Loader2 className="animate-spin text-white" size={24} />
                  </div>
                )}
                {preview.progress?.status === 'error' && (
                  <div className="absolute inset-0 bg-red-500/50 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs">Error</span>
                  </div>
                )}
                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => removePreview(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                )}
                {preview.progress && (
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {preview.progress.status === 'compressing' && 'Compressing...'}
                    {preview.progress.status === 'uploading' && `${preview.progress.progress}%`}
                    {preview.progress.status === 'completed' && 'Done'}
                  </div>
                )}
              </div>
            ))}
          </div>
          {ticketId && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Images
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Upload button */}
      {canAddMore && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full py-3 px-4 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors flex items-center justify-center gap-2 text-foreground/60 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ImageIcon size={20} />
            <span>
              {totalImages === 0
                ? 'Add images (max 3)'
                : `Add more images (${maxImages - totalImages} remaining)`}
            </span>
          </button>
          <p className="text-xs text-foreground/40 mt-1">
            Images will be compressed automatically. Max 2MB per image.
          </p>
        </div>
      )}

      {/* Limit reached */}
      {!canAddMore && totalImages >= maxImages && (
        <p className="text-sm text-foreground/60">
          Maximum {maxImages} images reached. Remove some to add more.
        </p>
      )}
    </div>
  );
}
