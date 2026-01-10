'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/lib/profile'
import MaterialForm from '@/components/MaterialForm'

function CreateMaterialContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const topicIdParam = searchParams.get('topicId')
  const initialTopicId = topicIdParam ? parseInt(topicIdParam) : undefined

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const checkAuth = useCallback(async () => {
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
    } catch (error) {
      console.error('Error checking auth:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleSuccess = () => {
    // Redirect to dashboard after successful creation
    router.push('/mentor/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
      </div>
    )
  }

  if (!userId) return null

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-100 to-blue-200">

      <div className="relative flex-1 overflow-visible">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/mentor/dashboard"
              className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-black border-2 border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Dashboard
            </Link>
            <h1 className="text-4xl md:text-5xl font-black text-black mb-2">
              Buat Materi <span className="text-yellow-400" style={{ textShadow: '3px 3px 0px rgba(0,0,0,1)' }}>Baru</span>
            </h1>
            <p className="text-black/80 text-lg font-bold">
              Bagikan pengetahuan Anda dengan membuat materi pembelajaran berkualitas.
            </p>
          </div>

          {/* Form Component */}
          <MaterialForm
            userId={userId}
            initialTopicId={initialTopicId}
            onSuccess={handleSuccess}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </div>
  )
}

export default function CreateMaterialPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-blue-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
      </div>
    }>
      <CreateMaterialContent />
    </Suspense>
  )
}
