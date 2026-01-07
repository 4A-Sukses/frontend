'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/profile'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    async function checkUser() {
      try {
        const profile = await getCurrentUserProfile()

        if (profile) {
          // User sudah login, redirect sesuai role
          if (profile.role === 'user') {
            router.push('/select-role')
            return
          }
          if (profile.role === 'pending_mentor') {
            router.push('/mentor-pending')
            return
          }
          // User dengan role valid, redirect ke home
          router.push('/home')
          return
        } else {
          // User belum login, redirect ke halaman login
          router.push('/login')
          return
        }
      } catch (error) {
        console.error('Error checking user:', error)
        router.push('/login')
        return
      }
    }

    checkUser()
  }, [router])

  // Tampilkan loading screen saat redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
