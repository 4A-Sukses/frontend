'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Material, Profile, UserProfile } from '@/types/database'
import Navbar from '@/components/Navbar'
import { stripHtml } from '@/lib/htmlUtils'
import MaterialDetailModal from '@/components/MaterialDetailModal'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function MentorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const mentorId = params.mentorId as string

  const [loading, setLoading] = useState(true)
  const [mentorProfile, setMentorProfile] = useState<Profile | null>(null)
  const [mentorDetail, setMentorDetail] = useState<UserProfile | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [isMaterialDetailOpen, setIsMaterialDetailOpen] = useState(false)

  const loadMentorData = useCallback(async () => {
    try {
      // 1. Load Mentor Profile (auth info)
      const { data: profile, error: profileError } = await supabase
        .from('user')
        .select('*')
        .eq('id', mentorId)
        .single()

      if (profileError) throw profileError
      setMentorProfile(profile)

      if (profile.role !== 'mentor') {
        // Handle case where ID exists but is not a mentor
        console.warn('User is not a mentor')
        // You might want to redirect or show an error
      }

      // 2. Load Mentor Details (name, avatar, etc.)
      const { data: detail, error: detailError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', mentorId)
        .single()

      if (!detailError) {
        setMentorDetail(detail)
      }

      // 3. Load Mentor's Published Materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .eq('created_by', mentorId)
        .eq('status', 'published') // Only show published materials
        .order('created_at', { ascending: false })

      if (materialsError) throw materialsError
      setMaterials(materialsData || [])

    } catch (error) {
      console.error('Error loading mentor data:', error)
    } finally {
      setLoading(false)
    }
  }, [mentorId])

  useEffect(() => {
    if (mentorId) {
      loadMentorData()
    }
  }, [mentorId, loadMentorData])

  const handleMaterialClick = (material: Material) => {
    setSelectedMaterial(material)
    setIsMaterialDetailOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-100">
        <LoadingSpinner text="Loading..." />
      </div>
    )
  }

  if (!mentorProfile) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-100">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center bg-yellow-200 rounded-xl border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] p-12">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-black text-black mb-4">Mentor Tidak Ditemukan</h2>
            <Link href="/" className="inline-block px-6 py-3 bg-blue-400 text-black font-black border-2 border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-100">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Mentor Header */}
        <div className="bg-white rounded-xl border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] overflow-hidden mb-8">
          <div className="bg-purple-400 h-32 md:h-48 border-b-[3px] border-black"></div>
          <div className="px-8 pb-8">
            <div className="relative flex flex-col md:flex-row md:items-end -mt-16 mb-4 gap-4">
              <div className="relative">
                {mentorDetail?.avatar_url ? (
                  <img
                    src={mentorDetail.avatar_url}
                    alt={mentorDetail.nama || mentorProfile.username}
                    className="w-32 h-32 rounded-full border-4 border-black object-cover bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-black bg-indigo-400 flex items-center justify-center text-4xl font-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {(mentorDetail?.nama || mentorProfile.username).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="md:ml-6 md:mb-2">
                <h1 className="text-3xl font-black text-black mb-1">
                  {mentorDetail?.nama || mentorProfile.username}
                </h1>
                <p className="text-black/70 font-bold">
                  @{mentorProfile.username}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 border-t-[3px] border-black pt-6">
              <div className="text-center bg-blue-200 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4">
                <span className="block text-3xl font-black text-black mb-1">
                  {materials.length}
                </span>
                <span className="text-sm text-black/70 font-bold">Materi Dipublikasikan</span>
              </div>
              <div className="text-center bg-green-200 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4">
                <span className="block text-3xl font-black text-black mb-1">
                  {new Date(mentorProfile.created_at).getFullYear()}
                </span>
                <span className="text-sm text-black/70 font-bold">Bergabung Sejak</span>
              </div>
            </div>

            {mentorDetail?.interest && Array.isArray(mentorDetail.interest) && mentorDetail.interest.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-black text-black uppercase tracking-wide mb-3">Minat & Keahlian</h3>
                <div className="flex flex-wrap gap-2">
                  {mentorDetail.interest.map((tag, i) => (
                    <span key={i} className="px-3 py-1.5 bg-yellow-300 text-black font-bold border-2 border-black rounded-full text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Materials List */}
        <h2 className="text-3xl font-black text-black mb-6">Materi Pembelajaran</h2>

        {materials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material) => (
              <div
                key={material.id}
                onClick={() => handleMaterialClick(material)}
                className="bg-white rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all cursor-pointer overflow-hidden flex flex-col h-full"
              >
                <div className="p-6 flex-1">
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wide border-2 border-black ${material.material_type === 'video' ? 'bg-red-300' :
                      material.material_type === 'article' ? 'bg-blue-300' :
                        'bg-gray-300'
                      }`}>
                      {material.material_type}
                    </span>
                    {material.tags && material.tags.length > 0 && (
                      <span className="text-xs text-black font-bold">
                        {material.tags.slice(0, 2).map(t => `#${t}`).join(' ')}
                        {material.tags.length > 2 && '...'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-black mb-2 line-clamp-2">
                    {material.title}
                  </h3>
                  <p className="text-black/70 text-sm font-bold line-clamp-3 mb-4">
                    {stripHtml(material.content, 150)}
                  </p>
                </div>

                <div className="px-6 py-4 bg-yellow-200 border-t-[3px] border-black flex justify-between items-center text-sm">
                  <span className="text-black font-bold">
                    {new Date(material.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                  </span>
                  <span className="text-black font-black hover:underline">
                    Lihat Detail →
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border-[3px] border-dashed border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] p-12">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-black font-black text-xl">
              Mentor ini belum mempublikasikan materi apapun.
            </p>
          </div>
        )}
      </div>

      {/* Material Detail Modal */}
      {isMaterialDetailOpen && selectedMaterial && (
        <MaterialDetailModal
          material={selectedMaterial}
          onClose={() => setIsMaterialDetailOpen(false)}
        />
      )}
    </div>
  )
}
