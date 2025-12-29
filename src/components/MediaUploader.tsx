'use client'

import { useState, useCallback, useRef } from 'react'
import { uploadFile, validateFile, formatFileSize, type UploadResult } from '@/lib/storage'

interface MediaUploaderProps {
    userId: string
    onUpload: (result: UploadResult) => void
    disabled?: boolean
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface UploadedFile {
    id: string
    name: string
    type: 'image' | 'video' | 'audio'
    url: string
    size: number
}

export default function MediaUploader({ userId, onUpload, disabled = false }: MediaUploaderProps) {
    const [status, setStatus] = useState<UploadStatus>('idle')
    const [error, setError] = useState<string | null>(null)
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [progress, setProgress] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFile = useCallback(async (file: File) => {
        // Validate file
        const validation = validateFile(file)
        if (!validation.valid) {
            setError(validation.error || 'File tidak valid')
            return
        }

        setStatus('uploading')
        setError(null)
        setProgress(0)

        try {
            // Determine folder based on file type
            let folder: 'images' | 'videos' | 'audio' = 'images'
            if (file.type.startsWith('video/')) folder = 'videos'
            else if (file.type.startsWith('audio/')) folder = 'audio'

            // Simulate progress (Supabase doesn't provide real progress)
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90))
            }, 200)

            const result = await uploadFile(file, userId, folder)

            clearInterval(progressInterval)
            setProgress(100)

            // Add to uploaded files list
            const uploadedFile: UploadedFile = {
                id: Date.now().toString(),
                name: file.name,
                type: folder === 'images' ? 'image' : folder === 'videos' ? 'video' : 'audio',
                url: result.url,
                size: file.size
            }
            setUploadedFiles(prev => [...prev, uploadedFile])

            // Notify parent
            onUpload(result)

            setStatus('success')
            setTimeout(() => {
                setStatus('idle')
                setProgress(0)
            }, 1500)

        } catch (err: any) {
            console.error('Upload error:', err)
            setError(err.message || 'Gagal mengupload file')
            setStatus('error')
            setProgress(0)
        }
    }, [userId, onUpload])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            handleFile(files[0])
        }
        // Reset input
        if (inputRef.current) {
            inputRef.current.value = ''
        }
    }, [handleFile])

    const insertToEditor = (file: UploadedFile) => {
        // Use the global method exposed by RichTextEditor
        if (typeof window !== 'undefined' && (window as any).__insertEditorImage) {
            (window as any).__insertEditorImage(file.url)
        }
    }

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload Media
            </label>

            {/* Upload Button Group */}
            <div className="flex flex-wrap gap-2">
                {/* Image Upload */}
                <button
                    type="button"
                    onClick={() => {
                        if (inputRef.current) {
                            inputRef.current.accept = 'image/jpeg,image/png,image/gif,image/webp'
                            inputRef.current.click()
                        }
                    }}
                    disabled={disabled || status === 'uploading'}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Gambar
                </button>

                {/* Video Upload */}
                <button
                    type="button"
                    onClick={() => {
                        if (inputRef.current) {
                            inputRef.current.accept = 'video/mp4,video/webm'
                            inputRef.current.click()
                        }
                    }}
                    disabled={disabled || status === 'uploading'}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Video
                </button>

                {/* Audio Upload */}
                <button
                    type="button"
                    onClick={() => {
                        if (inputRef.current) {
                            inputRef.current.accept = 'audio/mpeg,audio/wav,audio/ogg'
                            inputRef.current.click()
                        }
                    }}
                    disabled={disabled || status === 'uploading'}
                    className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    Audio
                </button>
            </div>

            {/* Hidden File Input */}
            <input
                ref={inputRef}
                type="file"
                onChange={handleChange}
                disabled={disabled}
                className="hidden"
            />

            {/* Upload Progress */}
            {status === 'uploading' && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Mengupload... {progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Success Message */}
            {status === 'success' && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    File berhasil diupload!
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">File yang diupload:</p>
                    <div className="space-y-2">
                        {uploadedFiles.map(file => (
                            <div
                                key={file.id}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    {/* File Type Icon */}
                                    {file.type === 'image' && (
                                        <div className="w-10 h-10 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                    {file.type === 'video' && (
                                        <div className="w-10 h-10 rounded bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                    {file.type === 'audio' && (
                                        <div className="w-10 h-10 rounded bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                            </svg>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {file.type === 'image' && (
                                        <button
                                            type="button"
                                            onClick={() => insertToEditor(file)}
                                            className="text-xs px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors"
                                        >
                                            Insert ke Editor
                                        </button>
                                    )}
                                    <a
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Help Text */}
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Ukuran maksimum: 50MB. Format: JPG, PNG, GIF, WebP, MP4, WebM, MP3, WAV, OGG
            </p>
        </div>
    )
}
