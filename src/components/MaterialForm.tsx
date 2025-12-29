'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import type { Topic, MaterialInsert, Material, MaterialUpdate } from '@/types/database'
import type { UploadResult } from '@/lib/storage'

// Dynamic import for RichTextEditor to avoid SSR issues with Tiptap
const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  )
})

// Dynamic import for FileImporter
const FileImporter = dynamic(() => import('./FileImporter'), { ssr: false })

// Dynamic import for MediaUploader
const MediaUploader = dynamic(() => import('./MediaUploader'), { ssr: false })

interface MaterialFormProps {
  userId: string
  initialMaterial?: Material
  initialTopicId?: number
  onSuccess?: () => void
  onCancel?: () => void
}

interface UploadedMedia {
  id: string
  type: 'image' | 'video' | 'audio' | 'document'
  url: string
  name: string
}

export default function MaterialForm({ userId, initialMaterial, initialTopicId, onSuccess, onCancel }: MaterialFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<number | string>(initialMaterial?.topic_id || initialTopicId || '')
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([])
  const [showMediaUploader, setShowMediaUploader] = useState(false)

  const [formData, setFormData] = useState({
    title: initialMaterial?.title || '',
    content: initialMaterial?.content || '',
    material_type: initialMaterial?.material_type || 'article',
    url: initialMaterial?.url || '',
    tags: initialMaterial?.tags ? initialMaterial.tags.join(', ') : '',
  })

  useEffect(() => {
    loadTopics()
  }, [])

  const loadTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('title')

      if (error) throw error
      setTopics(data || [])
    } catch (error) {
      console.error('Error loading topics:', error)
    }
  }

  const handleContentChange = (html: string) => {
    setFormData(prev => ({ ...prev, content: html }))
  }

  const handleFileImport = (importedContent: string) => {
    // Append imported content to existing content
    setFormData(prev => ({
      ...prev,
      content: prev.content
        ? `${prev.content}\n\n${importedContent}`
        : importedContent
    }))
  }

  const handleMediaUpload = (result: UploadResult) => {
    const media: UploadedMedia = {
      id: Date.now().toString(),
      type: result.fileType as 'image' | 'video' | 'audio' | 'document',
      url: result.url,
      name: result.fileName
    }
    setUploadedMedia(prev => [...prev, media])

    // Auto-insert media into content
    if (result.fileType === 'image') {
      const imageHtml = `<img src="${result.url}" alt="${result.fileName}" class="max-w-full h-auto rounded-lg my-4" />`
      setFormData(prev => ({
        ...prev,
        content: prev.content ? `${prev.content}\n${imageHtml}` : imageHtml
      }))
    } else if (result.fileType === 'video') {
      const videoHtml = `<video controls class="max-w-full my-4 rounded-lg"><source src="${result.url}" type="video/mp4">Your browser does not support the video tag.</video>`
      setFormData(prev => ({
        ...prev,
        content: prev.content ? `${prev.content}\n${videoHtml}` : videoHtml
      }))
    } else if (result.fileType === 'audio') {
      const audioHtml = `<audio controls class="w-full my-4"><source src="${result.url}" type="audio/mpeg">Your browser does not support the audio tag.</audio>`
      setFormData(prev => ({
        ...prev,
        content: prev.content ? `${prev.content}\n${audioHtml}` : audioHtml
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent | null, status: 'published' | 'draft' = 'published') => {
    if (e) e.preventDefault()

    if (!selectedTopicId) {
      setMessage({ type: 'error', text: 'Pilih topik terlebih dahulu' })
      return
    }

    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Judul materi tidak boleh kosong' })
      return
    }

    if (!formData.content.trim()) {
      setMessage({ type: 'error', text: 'Konten materi tidak boleh kosong' })
      return
    }

    setLoading(true)
    setMessage(null)

    // Parse tags
    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    try {
      if (initialMaterial) {
        // Update existing material
        const materialData: MaterialUpdate = {
          topic_id: Number(selectedTopicId),
          title: formData.title,
          content: formData.content,
          material_type: formData.material_type,
          url: formData.url || null,
          status: status,
          tags: tagsArray
        }

        const { error } = await supabase
          .from('materials')
          .update(materialData)
          .eq('id', initialMaterial.id)

        if (error) throw error

        setMessage({
          type: 'success',
          text: `Materi berhasil diperbarui${status === 'draft' ? ' (Draft)' : ''}!`
        })
      } else {
        // Create new material
        const materialData: MaterialInsert = {
          topic_id: Number(selectedTopicId),
          title: formData.title,
          content: formData.content,
          material_type: formData.material_type,
          url: formData.url || null,
          created_by: userId,
          status: status,
          tags: tagsArray
        }

        const { error } = await supabase
          .from('materials')
          .insert(materialData)

        if (error) throw error

        setMessage({
          type: 'success',
          text: `Materi berhasil ${status === 'published' ? 'dipublish' : 'disimpan sebagai draft'}!`
        })
      }

      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        } else {
          router.back()
        }
      }, 1000)
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Gagal menyimpan materi'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {initialMaterial ? 'Edit Materi' : 'Buat Materi Baru'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {initialMaterial ? 'Perbarui informasi materi pembelajaran' : 'Gunakan editor di bawah untuk membuat materi dengan konten yang kaya'}
        </p>
      </div>

      {/* Form */}
      <div className="p-6 space-y-6">
        {/* Topic Selection */}
        <div>
          <label htmlFor="topic_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pilih Topik <span className="text-red-500">*</span>
          </label>
          <select
            id="topic_id"
            required
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-shadow"
            disabled={loading}
          >
            <option value="">-- Pilih Topik --</option>
            {topics.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Judul Materi <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-shadow"
            placeholder="Masukkan judul materi"
            disabled={loading}
          />
        </div>

        {/* Material Type */}
        <div>
          <label htmlFor="material_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipe Materi <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {['article', 'video', 'pdf', 'slides', 'book', 'other'].map((type) => (
              <label
                key={type}
                className={`
                  relative flex items-center justify-center px-4 py-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all
                  ${formData.material_type === type
                    ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-50 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                  }
                `}
              >
                <input
                  type="radio"
                  name="material_type"
                  value={type}
                  checked={formData.material_type === type}
                  onChange={(e) => setFormData(prev => ({ ...prev, material_type: e.target.value }))}
                  className="sr-only"
                  disabled={loading}
                />
                <span className="capitalize font-medium text-sm text-gray-900 dark:text-gray-200">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Import & Upload Section */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Import & Upload
            </h3>
            <button
              type="button"
              onClick={() => setShowMediaUploader(!showMediaUploader)}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {showMediaUploader ? 'Sembunyikan' : 'Tampilkan'} Upload Media
            </button>
          </div>

          {/* File Importer */}
          <FileImporter onImport={handleFileImport} disabled={loading} />

          {/* Media Uploader (Collapsible) */}
          {showMediaUploader && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <MediaUploader
                userId={userId}
                onUpload={handleMediaUpload}
                disabled={loading}
              />
            </div>
          )}
        </div>

        {/* Rich Text Editor for Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Konten Materi <span className="text-red-500">*</span>
          </label>
          <RichTextEditor
            content={formData.content}
            onChange={handleContentChange}
            placeholder="Tulis konten materi di sini... Gunakan toolbar untuk format teks."
            disabled={loading}
            onImageUpload={() => setShowMediaUploader(true)}
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            💡 Tips: Gunakan toolbar untuk memformat teks. Anda juga bisa import dari file DOCX/PDF atau upload media.
          </p>
        </div>

        {/* URL */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            URL Sumber (Opsional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">https://</span>
            </div>
            <input
              type="text"
              id="url"
              value={formData.url?.replace(/^https?:\/\//, '') || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value ? `https://${e.target.value.replace(/^https?:\/\//, '')}` : '' }))}
              className="w-full pl-16 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-shadow"
              placeholder="example.com/materi"
              disabled={loading}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags (Pisahkan dengan koma)
          </label>
          <input
            type="text"
            id="tags"
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-shadow"
            placeholder="Contoh: fisika, matematika, dasar, advanced"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Gunakan koma untuk memisahkan setiap tag.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`rounded-lg p-4 flex items-start gap-3 ${message.type === 'error'
              ? 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200 border border-red-200 dark:border-red-800'
              : 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200 border border-green-200 dark:border-green-800'
              }`}
          >
            {message.type === 'success' ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => onCancel ? onCancel() : router.back()}
            disabled={loading}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(null, 'draft')}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-semibold shadow-sm hover:shadow disabled:opacity-50"
          >
            Simpan Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(null, 'published')}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-semibold shadow-sm hover:shadow disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : (initialMaterial ? 'Publish Perubahan' : 'Publish Sekarang')}
          </button>
        </div>
      </div>
    </div>
  )
}
