'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/lib/profile'
import { deleteFile } from '@/lib/storage'
import type { Material, Topic } from '@/types/database'
import { stripHtml } from '@/lib/htmlUtils'
import AddMaterialModal from '@/components/AddMaterialModal'
import AddTopicModal from '@/components/AddTopicModal'
import MaterialDetailModal from '@/components/MaterialDetailModal'

export default function MentorDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [activeTab, setActiveTab] = useState<'published' | 'draft'>('published')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<Material | undefined>(undefined)
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null)

  const checkAuthAndLoadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const profile = await getCurrentUserProfile()
      if (!profile || profile.role !== 'mentor') {
        router.push('/')
        return
      }

      setUserId(user.id)
      await Promise.all([
        loadMaterials(user.id),
        loadTopics()
      ])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAuthAndLoadData()
  }, [checkAuthAndLoadData])

  const loadMaterials = async (uid: string) => {
    try {
      // Fetch materials created by this user
      // Note: We are selecting * so we get the status field if it exists
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('created_by', uid)
        .order('created_at', { ascending: false })

      if (error) throw error

      setMaterials(data || [])
    } catch (error) {
      console.error('Error loading materials:', error)
    }
  }

  const loadTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTopics(data || [])
    } catch (error) {
      console.error('Error loading topics:', error)
    }
  }

  const handleMaterialAdded = () => {
    setIsAddModalOpen(false)
    setEditingMaterial(undefined)
    if (userId) {
      loadMaterials(userId)
    }
  }

  const handleTopicAdded = () => {
    setIsTopicModalOpen(false)
    loadTopics()
  }

  const handleEditClick = (material: Material) => {
    setEditingMaterial(material)
    setIsAddModalOpen(true)
  }

  const handleCreateClick = () => {
    router.push('/mentor/material/create')
  }

  const handlePreviewClick = (material: Material) => {
    // Create slug from title and encode ID
    const slug = material.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    // Encode ID as base64
    const encodedId = btoa(material.id.toString())
    router.push(`/material/${slug}?ref=${encodedId}`)
  }

  const handleDeleteClick = async (material: Material) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus materi "${material.title}"? Semua file media yang terkait juga akan dihapus.`)) {
      return
    }

    setDeletingId(material.id)

    try {
      // Extract media URLs from content and delete from storage
      const mediaUrls = extractMediaUrls(material.content)
      for (const url of mediaUrls) {
        try {
          // Extract path from URL (e.g., userId/images/filename.jpg)
          const pathMatch = url.match(/materials\/([^?]+)/)
          if (pathMatch && pathMatch[1]) {
            await deleteFile(pathMatch[1])
          }
        } catch (err) {
          console.error('Error deleting file:', err)
          // Continue deleting other files even if one fails
        }
      }

      // Delete material from database
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', material.id)

      if (error) throw error

      // Reload materials
      if (userId) {
        await loadMaterials(userId)
      }
    } catch (error: any) {
      console.error('Error deleting material:', error)
      alert('Gagal menghapus materi: ' + error.message)
    } finally {
      setDeletingId(null)
    }
  }

  // Helper function to extract media URLs from HTML content
  const extractMediaUrls = (content: string): string[] => {
    const urls: string[] = []
    // Match src attributes in img, video, audio tags
    const srcRegex = /src=["']([^"']+supabase[^"']+)["']/g
    let match
    while ((match = srcRegex.exec(content)) !== null) {
      urls.push(match[1])
    }
    return urls
  }

  const getTopicTitle = (topicId: number) => {
    const topic = topics.find(t => t.id === topicId)
    return topic ? topic.title : 'Unknown Topic'
  }

  // Filter materials based on active tab
  const filteredMaterials = materials.filter(m => {
    const status = m.status || 'published'
    return status === activeTab
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-100 to-blue-200">
      <div className="relative flex-1">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <Link
                href="/"
                className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-black border-2 border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Home
              </Link>
              <h1 className="text-4xl md:text-5xl font-black text-black mb-2">
                MENTOR{' '}
                <span className="text-yellow-400" style={{ textShadow: '3px 3px 0px rgba(0,0,0,1)' }}>
                  DASHBOARD
                </span>
              </h1>
              <p className="text-black/80 text-lg font-bold">
                Kelola materi pembelajaran dan topik Anda
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setIsTopicModalOpen(true)}
                className="px-6 py-3 bg-white border-[3px] border-black text-black rounded-xl hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-black flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Topik
              </button>
              <button
                onClick={handleCreateClick}
                className="px-6 py-3 bg-yellow-400 text-black border-[3px] border-black rounded-xl hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-black flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Buat Materi Baru
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="inline-flex gap-4 p-2 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <button
                onClick={() => setActiveTab('published')}
                className={`px-6 py-2.5 text-sm font-black rounded-lg transition-all border-2 ${activeTab === 'published'
                  ? 'bg-purple-400 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]'
                  : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-100 hover:text-black'
                  }`}
              >
                Published
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs border border-black ${activeTab === 'published' ? 'bg-white text-black' : 'bg-gray-200 text-gray-600'
                  }`}>
                  {materials.filter(m => (m.status || 'published') === 'published').length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('draft')}
                className={`px-6 py-2.5 text-sm font-black rounded-lg transition-all border-2 ${activeTab === 'draft'
                  ? 'bg-yellow-400 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]'
                  : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-100 hover:text-black'
                  }`}
              >
                Drafts
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs border border-black ${activeTab === 'draft' ? 'bg-white text-black' : 'bg-gray-200 text-gray-600'
                  }`}>
                  {materials.filter(m => m.status === 'draft').length}
                </span>
              </button>
            </div>
          </div>

          {/* Content List */}
          <div className="grid gap-6">
            {filteredMaterials.length > 0 ? (
              filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="group bg-white border-[3px] border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all relative overflow-visible"
                >
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                    <button
                      onClick={() => handlePreviewClick(material)}
                      className="p-2 bg-green-400 text-black border-2 border-black rounded-lg hover:bg-green-300 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      title="Preview"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEditClick(material)}
                      className="p-2 bg-blue-400 text-black border-2 border-black rounded-lg hover:bg-blue-300 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(material)}
                      disabled={deletingId === material.id}
                      className="p-2 bg-red-400 text-black border-2 border-black rounded-lg hover:bg-red-300 transition-colors disabled:opacity-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      title="Hapus"
                    >
                      {deletingId === material.id ? (
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="flex items-start gap-6">
                    {/* Icon */}
                    <div className={`w-20 h-20 rounded-xl border-2 border-black flex items-center justify-center text-2xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform group-hover:rotate-3 transition-transform ${material.status === 'draft'
                      ? 'bg-yellow-300 text-black'
                      : 'bg-purple-300 text-black'
                      }`}>
                      {material.material_type.substring(0, 3).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                      {material.tags && material.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {material.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-black text-xs font-bold rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-lg bg-pink-200 text-black border border-black text-xs font-black uppercase tracking-wide shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                          {getTopicTitle(material.topic_id)}
                        </span>
                        <span className="text-xs text-black/60 font-mono font-bold">
                          {new Date(material.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-black mb-2 truncate group-hover:text-purple-600 transition-colors">
                        {material.title}
                      </h3>
                      {material.url && (
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-blue-600 hover:text-blue-500 hover:underline flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Buka Sumber
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center border-4 border-dashed border-black/20 rounded-3xl bg-white/50">
                <div className="w-24 h-24 bg-gray-100 rounded-full border-4 border-black/10 flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-black mb-2">
                  Belum ada materi {activeTab === 'published' ? 'terpublish' : 'draft'}
                </h3>
                <p className="text-black/60 max-w-sm mb-8 font-medium">
                  {activeTab === 'published'
                    ? 'Mulai berbagi pengetahuan Anda dengan membuat materi pembelajaran baru.'
                    : 'Draft materi yang Anda buat akan muncul di sini sebelum dipublish.'}
                </p>
                {activeTab === 'published' && (
                  <button
                    onClick={handleCreateClick}
                    className="px-8 py-4 bg-yellow-400 text-black border-4 border-black rounded-2xl hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Buat Materi Pertama
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Material Modal */}
        {isAddModalOpen && userId && (
          <AddMaterialModal
            userId={userId}
            material={editingMaterial}
            onClose={() => {
              setIsAddModalOpen(false)
              setEditingMaterial(undefined)
            }}
            onSuccess={handleMaterialAdded}
          />
        )}

        {/* Add Topic Modal */}
        {isTopicModalOpen && userId && (
          <AddTopicModal
            userId={userId}
            onClose={() => setIsTopicModalOpen(false)}
            onSuccess={handleTopicAdded}
          />
        )}

        {/* Preview Modal */}
        {isPreviewOpen && previewMaterial && (
          <MaterialDetailModal
            material={previewMaterial}
            onClose={() => {
              setIsPreviewOpen(false)
              setPreviewMaterial(null)
            }}
          />
        )}
      </div>
    </div>
  )
}
