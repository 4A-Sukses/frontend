'use client'

import { useState } from 'react'

interface YouTubeEmbedProps {
    onEmbed: (embedHtml: string) => void
    disabled?: boolean
}

export default function YouTubeEmbed({ onEmbed, disabled }: YouTubeEmbedProps) {
    const [url, setUrl] = useState('')
    const [error, setError] = useState('')
    const [preview, setPreview] = useState<string | null>(null)

    // Extract YouTube video ID from various URL formats
    const extractVideoId = (url: string): string | null => {
        const patterns = [
            // Standard YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID
            /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
            // Short YouTube URL: https://youtu.be/VIDEO_ID
            /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            // Embedded URL: https://www.youtube.com/embed/VIDEO_ID
            /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            // YouTube Shorts: https://www.youtube.com/shorts/VIDEO_ID
            /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        ]

        for (const pattern of patterns) {
            const match = url.match(pattern)
            if (match && match[1]) {
                return match[1]
            }
        }
        return null
    }

    const handlePreview = () => {
        setError('')
        const videoId = extractVideoId(url.trim())

        if (!videoId) {
            setError('URL YouTube tidak valid. Gunakan format: youtube.com/watch?v=... atau youtu.be/...')
            setPreview(null)
            return
        }

        setPreview(videoId)
    }

    const handleEmbed = () => {
        if (!preview) return

        // Use simple, single-line HTML for better compatibility
        const embedHtml = `<div class="youtube-embed" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:16px 0;border-radius:12px;background:#000;"><iframe src="https://www.youtube.com/embed/${preview}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:12px;" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>`

        onEmbed(embedHtml)
        setUrl('')
        setPreview(null)
    }

    const handleClear = () => {
        setUrl('')
        setPreview(null)
        setError('')
    }

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Embed Video YouTube</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tempelkan link YouTube untuk menyisipkan video</p>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        disabled={disabled}
                    />
                    <button
                        type="button"
                        onClick={handlePreview}
                        disabled={disabled || !url.trim()}
                        className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                        Preview
                    </button>
                </div>

                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                {preview && (
                    <div className="space-y-3">
                        <div className="relative rounded-lg overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                            <iframe
                                src={`https://www.youtube.com/embed/${preview}`}
                                className="absolute top-0 left-0 w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleEmbed}
                                disabled={disabled}
                                className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Sisipkan ke Konten
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                disabled={disabled}
                                className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
