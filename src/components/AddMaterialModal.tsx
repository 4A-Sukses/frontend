'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import type { Topic, MaterialInsert, Material, MaterialUpdate } from '@/types/database'
import type { UploadResult } from '@/lib/storage'

// Dynamic imports for rich text components to avoid SSR issues
const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  )
})

const FileImporter = dynamic(() => import('./FileImporter'), { ssr: false })
const MediaUploader = dynamic(() => import('./MediaUploader'), { ssr: false })

interface AddMaterialModalProps {
  topic?: Topic
  material?: Material
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export default function AddMaterialModal({ topic, material, userId, onClose, onSuccess }: AddMaterialModalProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<number | string>(topic?.id || material?.topic_id || '')
  const [showMediaUploader, setShowMediaUploader] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    material_type: 'article',
    url: '',
    tags: '',
  })

  useEffect(() => {
    if (!topic && !material) {
      loadTopics()
    }

    if (material) {
      setFormData({
        title: material.title,
        content: material.content,
        material_type: material.material_type,
        url: material.url || '',
        tags: material.tags ? material.tags.join(', ') : '',
      })
      if (!topic) {
        loadTopics()
      }
    }
  }, [topic, material])

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
    setFormData(prev => ({
      ...prev,
      content: prev.content
        ? `${prev.content}\n\n${importedContent}`
        : importedContent
    }))
  }

  const handleMediaUpload = (result: UploadResult) => {
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

    setLoading(true)
    setMessage(null)

    // Parse tags
    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    try {
      if (material) {
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
          .eq('id', material.id)

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
        onSuccess()
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {material ? 'Edit Materi' : 'Tambah Materi Baru'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {topic ? `Topik: ${topic.title}` : (material ? 'Edit materi yang sudah ada' : 'Buat materi baru untuk topik pembelajaran')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Topic Selection (if no topic prop) */}
          {(!topic || material) && (
            <div>
              <label htmlFor="topic_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pilih Topik <span className="text-red-500">*</span>
              </label>
              <select
                id="topic_id"
                required
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={loading}
              >
                <option value="">-- Pilih Topik --</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          )}

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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Masukkan judul materi"
              disabled={loading}
            />
          </div>

          {/* Material Type */}
          <div>
            <label htmlFor="material_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipe Materi <span className="text-red-500">*</span>
            </label>
            <select
              id="material_type"
              required
              value={formData.material_type}
              onChange={(e) => setFormData(prev => ({ ...prev, material_type: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              disabled={loading}
            >
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="pdf">PDF</option>
              <option value="slides">Slides</option>
              <option value="book">Book</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Content - Rich Text Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Konten Materi <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              content={formData.content}
              onChange={handleContentChange}
              placeholder="Tulis konten materi di sini... Gunakan toolbar untuk format teks."
              disabled={loading}
              onImageUpload={() => setShowMediaUploader(true)}
            />
          </div>

          {/* File Import */}
          <FileImporter onImport={handleFileImport} disabled={loading} />

          {/* Media Upload Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Upload Media
            </span>
            <button
              type="button"
              onClick={() => setShowMediaUploader(!showMediaUploader)}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {showMediaUploader ? 'Sembunyikan' : 'Tampilkan Upload Media'}
            </button>
          </div>

          {/* Media Uploader */}
          {showMediaUploader && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <MediaUploader
                userId={userId}
                onUpload={handleMediaUpload}
                disabled={loading}
              />
            </div>
          )}

          {/* URL */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL Sumber (Opsional)
            </label>
            <input
              type="url"
              id="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="https://example.com/materi"
              disabled={loading}
            />
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Contoh: fisika, matematika, dasar, advanced"
              disabled={loading}
            />
          </div>

          {/* Message */}
          {message && (
            <div
              className={`rounded-md p-4 ${message.type === 'error'
                  ? 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          )}
        </div>

        {/* Sticky Footer with Buttons */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 p-6 border-t border-gray-200 dark:border-gray-600">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(null, 'draft')}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Draft'}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(null, 'published')}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : (material ? 'Publish Update' : 'Publish')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
