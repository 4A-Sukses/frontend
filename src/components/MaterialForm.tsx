'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import type { Topic, MaterialInsert, Material, MaterialUpdate, MaterialPage } from '@/types/database'
import { clearCachedPages } from './MultiPageMaterialEditor'

// Dynamic imports
const MultiPageMaterialEditor = dynamic(() => import('./MultiPageMaterialEditor'), {
  ssr: false,
  loading: () => (
    <div className="border-2 border-black rounded-xl p-8 min-h-[300px] flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
    </div>
  )
})

interface MaterialFormProps {
  userId: string
  initialMaterial?: Material
  initialTopicId?: number
  onSuccess?: () => void
  onCancel?: () => void
}

export default function MaterialForm({ userId, initialMaterial, initialTopicId, onSuccess, onCancel }: MaterialFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [step, setStep] = useState<1 | 2>(1) // Step 1: Metadata, Step 2: Content

  // Metadata form
  const [formData, setFormData] = useState({
    title: initialMaterial?.title || '',
    material_type: initialMaterial?.material_type || 'article',
    url: initialMaterial?.url || '',
    tags: initialMaterial?.tags ? initialMaterial.tags.join(', ') : '',
  })
  const [selectedTopicId, setSelectedTopicId] = useState<number | string>(initialMaterial?.topic_id || initialTopicId || '')

  // Multi-page content
  const [pages, setPages] = useState<MaterialPage[]>(() => {
    if (initialMaterial?.pages && initialMaterial.pages.length > 0) {
      return initialMaterial.pages
    }
    if (initialMaterial?.content) {
      return [{ page_number: 1, content: initialMaterial.content }]
    }
    return []
  })

  // Cache key for localStorage
  const cacheKey = `${userId}_${selectedTopicId}_${formData.title || 'new'}`

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

  const handlePagesChange = useCallback((newPages: MaterialPage[]) => {
    setPages(newPages)
  }, [])

  const validateStep1 = () => {
    if (!selectedTopicId) {
      setMessage({ type: 'error', text: 'Pilih topik terlebih dahulu' })
      return false
    }
    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Judul materi tidak boleh kosong' })
      return false
    }
    return true
  }

  const goToStep2 = () => {
    if (validateStep1()) {
      setMessage(null)
      setStep(2)
    }
  }

  const goToStep1 = () => {
    setStep(1)
  }

  const handleSubmit = async (status: 'published' | 'draft' = 'published') => {
    if (!validateStep1()) return

    if (pages.length === 0 || pages.every(p => !p.content.trim())) {
      setMessage({ type: 'error', text: 'Konten materi tidak boleh kosong' })
      return
    }

    setLoading(true)
    setMessage(null)

    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    // Combine all pages content for legacy 'content' field
    const combinedContent = pages.map(p => p.content).join('\n\n<!-- PAGE BREAK -->\n\n')

    try {
      if (initialMaterial) {
        const materialData: MaterialUpdate = {
          topic_id: Number(selectedTopicId),
          title: formData.title,
          content: combinedContent,
          material_type: formData.material_type,
          url: formData.url || null,
          status: status,
          tags: tagsArray,
          pages: pages
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
        const materialData: MaterialInsert = {
          topic_id: Number(selectedTopicId),
          title: formData.title,
          content: combinedContent,
          material_type: formData.material_type,
          url: formData.url || null,
          created_by: userId,
          status: status,
          tags: tagsArray,
          pages: pages
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

      // Clear cache on successful save
      clearCachedPages(cacheKey)

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
    <div className="bg-white rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b-2 border-black bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-black">
              {initialMaterial ? 'Edit Materi' : 'Buat Materi Baru'}
            </h2>
            <p className="text-sm font-bold text-gray-600 mt-1">
              {step === 1 ? 'Langkah 1: Informasi Materi' : 'Langkah 2: Konten Multi-Halaman'}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-black transition-all ${step === 1 ? 'bg-indigo-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-100 text-gray-500'}`}>
              1
            </div>
            <div className="w-10 h-1 bg-black rounded-full"></div>
            <div className={`w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-black transition-all ${step === 2 ? 'bg-indigo-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-100 text-gray-500'}`}>
              2
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-8 space-y-8">
        {/* STEP 1: Metadata */}
        {step === 1 && (
          <>
            {/* Topic Selection */}
            <div>
              <label htmlFor="topic_id" className="block text-base font-black text-black mb-2">
                Pilih Topik <span className="text-red-500">*</span>
              </label>
              <select
                id="topic_id"
                required
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-black rounded-xl text-black bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold"
                disabled={loading}
              >
                <option value="">-- Pilih Topik --</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title.length > 30 ? t.title.slice(0, 30) + '...' : t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-base font-black text-black mb-2">
                Judul Materi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-black rounded-xl text-black bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold placeholder:font-medium placeholder:text-gray-400"
                placeholder="Masukkan judul materi"
                disabled={loading}
              />
            </div>

            {/* Material Type */}
            <div>
              <label className="block text-base font-black text-black mb-2">
                Tipe Materi <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['article', 'video', 'pdf', 'slides', 'book', 'other'].map((type) => (
                  <label
                    key={type}
                    className={`relative flex items-center justify-center px-4 py-3 rounded-xl border-2 cursor-pointer transition-all font-bold
                      ${formData.material_type === type
                        ? 'border-black bg-indigo-200 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]'
                        : 'border-black bg-white text-gray-600 hover:bg-gray-50'
                      }`}
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
                    <span className="capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* URL */}
            <div>
              <label htmlFor="url" className="block text-base font-black text-black mb-2">
                URL Sumber (Opsional)
              </label>
              <input
                type="url"
                id="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-black rounded-xl text-black bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold placeholder:font-medium placeholder:text-gray-400"
                placeholder="https://example.com/sumber"
                disabled={loading}
              />
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-base font-black text-black mb-2">
                Tags (Pisahkan dengan koma)
              </label>
              <input
                type="text"
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-black rounded-xl text-black bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold placeholder:font-medium placeholder:text-gray-400"
                placeholder="Contoh: fisika, matematika, dasar"
                disabled={loading}
              />
            </div>
          </>
        )}

        {/* STEP 2: Multi-Page Content */}
        {step === 2 && (
          <>
            {/* Material Info Summary */}
            <div className="bg-yellow-100 border-2 border-black rounded-xl p-4 mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg text-black">{formData.title}</h3>
                  <p className="text-sm font-bold text-black/70">
                    {topics.find(t => t.id === Number(selectedTopicId))?.title} • {formData.material_type}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={goToStep1}
                  className="px-3 py-1 bg-white border-2 border-black rounded-lg text-sm font-bold hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Edit Info
                </button>
              </div>
            </div>

            {/* Multi-Page Editor */}
            <MultiPageMaterialEditor
              pages={pages}
              onChange={handlePagesChange}
              cacheKey={cacheKey}
              disabled={loading}
              userId={userId}
            />
          </>
        )}

        {/* Message */}
        {message && (
          <div
            className={`rounded-xl p-4 flex items-start gap-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${message.type === 'error'
              ? 'bg-red-200 text-red-900'
              : 'bg-green-200 text-green-900'
              }`}
          >
            {message.type === 'success' ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className="font-bold">{message.text}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t-2 border-black">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={() => onCancel ? onCancel() : router.back()}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-white border-2 border-black text-black rounded-xl hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-black disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={goToStep2}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-indigo-500 border-2 border-black text-white rounded-xl hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-black disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Lanjut ke Konten
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={goToStep1}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-white border-2 border-black text-black rounded-xl hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-black disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
                Kembali
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-yellow-400 border-2 border-black text-black rounded-xl hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-black disabled:opacity-50"
              >
                Simpan Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('published')}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-500 border-2 border-black text-white rounded-xl hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-black disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : (initialMaterial ? 'Publish Perubahan' : 'Publish Sekarang')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
