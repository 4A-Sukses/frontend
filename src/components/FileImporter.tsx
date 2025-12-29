'use client'

import { useState, useCallback, useRef } from 'react'
import mammoth from 'mammoth'

interface FileImporterProps {
    onImport: (content: string) => void
    disabled?: boolean
}

type ImportStatus = 'idle' | 'processing' | 'success' | 'error'

export default function FileImporter({ onImport, disabled = false }: FileImporterProps) {
    const [status, setStatus] = useState<ImportStatus>('idle')
    const [error, setError] = useState<string | null>(null)
    const [dragActive, setDragActive] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const processDocx = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer })

        if (result.messages.length > 0) {
            console.warn('DOCX conversion warnings:', result.messages)
        }

        return result.value
    }

    const handleFile = useCallback(async (file: File) => {
        setStatus('processing')
        setError(null)

        try {
            let content = ''
            const fileType = file.type
            const fileName = file.name.toLowerCase()

            if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
                content = await processDocx(file)
            } else if (fileName.endsWith('.txt')) {
                content = `<p>${await file.text()}</p>`
            } else {
                throw new Error('Format file tidak didukung. Gunakan DOCX atau TXT.')
            }

            onImport(content)
            setStatus('success')

            // Reset after 2 seconds
            setTimeout(() => setStatus('idle'), 2000)
        } catch (err: any) {
            console.error('Import error:', err)
            setError(err.message || 'Gagal mengimport file')
            setStatus('error')
        }
    }, [onImport])

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (disabled) return

        const files = e.dataTransfer.files
        if (files.length > 0) {
            handleFile(files[0])
        }
    }, [disabled, handleFile])

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

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Import dari File
            </label>

            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
                onClick={() => !disabled && inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".docx,.txt"
                    onChange={handleChange}
                    disabled={disabled}
                    className="hidden"
                />

                {status === 'processing' ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Mengimport file...</p>
                    </div>
                ) : status === 'success' ? (
                    <div className="flex flex-col items-center gap-2 text-green-600 dark:text-green-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-sm">File berhasil diimport!</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Drag & drop file atau klik untuk memilih
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Mendukung: DOCX, TXT
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}
        </div>
    )
}
