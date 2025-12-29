import { supabase } from './supabase'

const MATERIAL_BUCKET = 'materials'

export interface UploadResult {
  url: string
  path: string
  fileName: string
  fileSize: number
  fileType: string
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  userId: string,
  folder: 'images' | 'videos' | 'audio' | 'documents' = 'documents'
): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const filePath = `${userId}/${folder}/${fileName}`

  const { data, error } = await supabase.storage
    .from(MATERIAL_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // For private bucket, create a signed URL (valid for 1 year)
  // This is a long-lived URL that will work for displaying in content
  const { data: signedData, error: signedError } = await supabase.storage
    .from(MATERIAL_BUCKET)
    .createSignedUrl(filePath, 60 * 60 * 24 * 365) // 1 year expiry

  if (signedError) {
    // Fallback to public URL if signed URL fails
    const { data: urlData } = supabase.storage
      .from(MATERIAL_BUCKET)
      .getPublicUrl(filePath)

    return {
      url: urlData.publicUrl,
      path: filePath,
      fileName: file.name,
      fileSize: file.size,
      fileType: getFileType(file.type)
    }
  }

  return {
    url: signedData.signedUrl,
    path: filePath,
    fileName: file.name,
    fileSize: file.size,
    fileType: getFileType(file.type)
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(MATERIAL_BUCKET)
    .remove([path])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

/**
 * Get signed URL for private file access
 */
export async function getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(MATERIAL_BUCKET)
    .createSignedUrl(path, expiresIn)

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * Get file type category from MIME type
 */
function getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'document'
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, options?: {
  maxSize?: number // in bytes
  allowedTypes?: string[]
}): { valid: boolean; error?: string } {
  const maxSize = options?.maxSize || 50 * 1024 * 1024 // 50MB default
  const allowedTypes = options?.allowedTypes || [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'application/pdf'
  ]

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File terlalu besar. Maksimum ${Math.round(maxSize / 1024 / 1024)}MB`
    }
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipe file tidak didukung. Gunakan: ${allowedTypes.join(', ')}`
    }
  }

  return { valid: true }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
