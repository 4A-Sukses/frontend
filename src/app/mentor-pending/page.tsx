'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/profile'
import { supabase } from '@/lib/supabase'

export default function MentorPending() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkStatus() {
      const user = await getCurrentUserProfile()

      if (!user) {
        router.push('/login')
        return
      }

      // If approved, redirect to dashboard/home
      if (user.role === 'mentor') {
        router.push('/')
        return
      }

      // If rejected (role reverted to user) or is student
      if (user.role === 'user' || user.role === 'student') {
        router.push('/')
        return
      }

      // If superadmin
      if (user.role === 'superadmin') {
        router.push('/admin/dashboard')
        return
      }

      setLoading(false)
    }

    checkStatus()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-blue-200 px-4">
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="max-w-md w-full bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl p-8 text-center"
        style={{ animation: 'fadeInUp 0.5s ease-out forwards' }}
      >
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-400 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
          <svg className="h-10 w-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="text-3xl font-black text-black mb-4 uppercase tracking-tight">Application Pending</h2>
        <p className="text-gray-700 font-bold mb-8 text-lg leading-relaxed">
          Your application to become a mentor is currently under review by our administrators.
          You will be notified once your account is approved.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full inline-flex justify-center py-3 px-4 border-2 border-black rounded-xl text-lg font-black text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
          >
            Check Status
          </button>

          <button
            onClick={handleLogout}
            className="w-full inline-flex justify-center py-3 px-4 border-2 border-black rounded-xl text-lg font-black text-black bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-600 focus:outline-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
