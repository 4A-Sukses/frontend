'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { MaterialPage } from '@/types/database'
import type { UploadResult } from '@/lib/storage'

// Dynamic imports
const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
    ssr: false,
    loading: () => (
        <div className="border-2 border-black rounded-xl p-4 min-h-[300px] flex items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent"></div>
        </div>
    )
})

const MediaUploader = dynamic(() => import('./MediaUploader'), { ssr: false })
const YouTubeEmbed = dynamic(() => import('./YouTubeEmbed'), { ssr: false })

interface MultiPageMaterialEditorProps {
    pages: MaterialPage[]
    onChange: (pages: MaterialPage[]) => void
    cacheKey?: string
    disabled?: boolean
    userId: string
}

// Local storage cache helpers
const getCachedPages = (key: string): MaterialPage[] | null => {
    if (typeof window === 'undefined') return null
    try {
        const cached = localStorage.getItem(`material_draft_${key}`)
        return cached ? JSON.parse(cached) : null
    } catch {
        return null
    }
}

const setCachedPages = (key: string, pages: MaterialPage[]) => {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(`material_draft_${key}`, JSON.stringify(pages))
    } catch (e) {
        console.error('Failed to cache pages:', e)
    }
}

const clearCachedPages = (key: string) => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(`material_draft_${key}`)
}

export default function MultiPageMaterialEditor({
    pages: initialPages,
    onChange,
    cacheKey = 'default',
    disabled = false,
    userId
}: MultiPageMaterialEditorProps) {
    // Initialize with at least one page
    const [pages, setPages] = useState<MaterialPage[]>(() => {
        // Try to restore from cache first (only if no initial pages provided)
        if (initialPages.length === 0) {
            const cached = getCachedPages(cacheKey)
            if (cached && cached.length > 0) return cached
        }
        // Use initial pages or create empty first page
        return initialPages.length > 0 ? initialPages : [{ page_number: 1, content: '' }]
    })

    const [currentPageIndex, setCurrentPageIndex] = useState(0)
    const [showCacheRestored, setShowCacheRestored] = useState(false)
    const [showMediaUploader, setShowMediaUploader] = useState(false)

    const handleContentChange = useCallback((content: string) => {
        setPages(prev => prev.map((page, idx) =>
            idx === currentPageIndex ? { ...page, content } : page
        ))
    }, [currentPageIndex])

    const insertMediaToCurrentPage = useCallback((html: string) => {
        setPages(prev => prev.map((page, idx) => {
            if (idx === currentPageIndex) {
                return { ...page, content: page.content + '\n' + html }
            }
            return page
        }))
    }, [currentPageIndex])

    const addPage = useCallback(() => {
        const newPageNumber = pages.length + 1
        setPages(prev => [...prev, { page_number: newPageNumber, content: '' }])
        setCurrentPageIndex(pages.length) // Go to new page
    }, [pages])

    const deletePage = useCallback(() => {
        if (pages.length <= 1) return
        setPages(prev => {
            const newPages = prev.filter((_, idx) => idx !== currentPageIndex)
            return newPages.map((page, idx) => ({ ...page, page_number: idx + 1 }))
        })
        setCurrentPageIndex(Math.max(0, currentPageIndex - 1))
    }, [pages, currentPageIndex])

    const goToPrev = useCallback(() => {
        if (currentPageIndex > 0) setCurrentPageIndex(prev => prev - 1)
    }, [currentPageIndex])

    const goToNext = useCallback(() => {
        if (currentPageIndex < pages.length - 1) setCurrentPageIndex(prev => prev + 1)
    }, [currentPageIndex, pages.length])

    const goToPage = useCallback((index: number) => {
        setCurrentPageIndex(index)
    }, [])

    const clearCache = useCallback(() => {
        clearCachedPages(cacheKey)
    }, [cacheKey])

    // Check if cache was restored on mount
    useEffect(() => {
        if (initialPages.length === 0) {
            const cached = getCachedPages(cacheKey)
            if (cached && cached.length > 0) {
                setShowCacheRestored(true)
                setTimeout(() => setShowCacheRestored(false), 3000)
            }
        }
    }, [])

    // Sync with initialPages when they change (for edit mode)
    useEffect(() => {
        if (initialPages.length > 0 && pages.length <= 1 && !pages[0]?.content) {
            setPages(initialPages)
        }
    }, [initialPages])

    // Save to cache whenever pages change
    useEffect(() => {
        setCachedPages(cacheKey, pages)
        onChange(pages)
    }, [pages, cacheKey, onChange])

    const handleMediaUpload = useCallback((result: UploadResult) => {
        if (result.fileType === 'image') {
            const imageHtml = `<img src="${result.url}" alt="${result.fileName}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;" />`
            insertMediaToCurrentPage(imageHtml)
        } else if (result.fileType === 'video') {
            const videoHtml = `<video src="${result.url}" controls style="max-width: 100%; border-radius: 8px; margin: 16px 0;"></video>`
            insertMediaToCurrentPage(videoHtml)
        } else if (result.fileType === 'audio') {
            const audioHtml = `<audio src="${result.url}" controls style="width: 100%; margin: 16px 0;"></audio>`
            insertMediaToCurrentPage(audioHtml)
        }
    }, [insertMediaToCurrentPage])

    const currentPage = pages[currentPageIndex]
    const totalPages = pages.length

    return (
        <div className="space-y-6">
            {/* Cache restored notification */}
            {showCacheRestored && (
                <div className="bg-blue-100 border-2 border-black rounded-xl p-3 flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-bold text-black">
                        Draft sebelumnya berhasil dipulihkan dari cache lokal
                    </span>
                </div>
            )}

            {/* Page Navigation Header */}
            <div className="bg-purple-100 border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between">
                    {/* Left: Navigation */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={goToPrev}
                            disabled={currentPageIndex === 0 || disabled}
                            className="p-2 rounded-lg border-2 border-black bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                        >
                            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div className="text-center min-w-[140px]">
                            <span className="font-black text-black text-lg">
                                Halaman {currentPageIndex + 1} / {totalPages}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={goToNext}
                            disabled={currentPageIndex === totalPages - 1 || disabled}
                            className="p-2 rounded-lg border-2 border-black bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                        >
                            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Right: Add/Delete Page */}
                    <div className="flex items-center gap-2">
                        {totalPages > 1 && (
                            <button
                                type="button"
                                onClick={deletePage}
                                disabled={disabled}
                                className="px-3 py-2 text-sm font-black bg-red-400 border-2 border-black text-black hover:bg-red-500 rounded-lg transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 011.995 1.858L5 7m5 4v6m0-6L5 7m5 4v6" />
                                </svg>
                                Hapus
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={addPage}
                            disabled={disabled}
                            className="px-3 py-2 bg-green-400 hover:bg-green-500 border-2 border-black text-black text-sm font-black rounded-lg transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4m0 0l4 4m0 0116.138 21H7.862a2 2 0 011.995 1.858L5 7m5 4v6m0-6L5 7m5 4v6" />
                            </svg>
                            Tambah Halaman
                        </button>
                    </div>
                </div>

                {/* Dots Indicator */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        {pages.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => goToPage(index)}
                                disabled={disabled}
                                className={`w-3 h-3 rounded-full border border-black transition-all ${index === currentPageIndex
                                    ? 'bg-black scale-125'
                                    : 'bg-white hover:bg-gray-300'
                                    }`}
                                aria-label={`Go to page ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Media Upload Section */}
            <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-black text-black uppercase tracking-wide">
                        📷 Upload Media (Halaman {currentPageIndex + 1})
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowMediaUploader(!showMediaUploader)}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-800 underline"
                    >
                        {showMediaUploader ? 'Sembunyikan' : 'Tampilkan'}
                    </button>
                </div>

                {showMediaUploader && (
                    <div className="space-y-4 border-2 border-black border-dashed rounded-xl p-4 bg-gray-50">
                        <MediaUploader
                            userId={userId}
                            onUpload={handleMediaUpload}
                            disabled={disabled}
                        />
                        <YouTubeEmbed
                            onEmbed={(embedHtml) => insertMediaToCurrentPage(embedHtml)}
                            disabled={disabled}
                        />
                    </div>
                )}
            </div>

            {/* TipTap Editor */}
            <div className="relative">
                <RichTextEditor
                    key={`${cacheKey}-${currentPageIndex}`}
                    content={currentPage?.content || ''}
                    onChange={handleContentChange}
                    placeholder={`Tulis konten halaman ${currentPageIndex + 1} di sini...`}
                    disabled={disabled}
                />
            </div>

            {/* Page indicator bottom */}
            <div className="text-center text-sm font-bold text-gray-500">
                💡 Konten disimpan otomatis. Anda bisa menambah halaman dan melanjutkan nanti.
            </div>
        </div>
    )
}

export { clearCachedPages }
