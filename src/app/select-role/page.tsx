'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile, updateProfile } from '@/lib/profile'
import type { Profile } from '@/types/database'

export default function SelectRole() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [user, setUser] = useState<Profile | null>(null)

  useEffect(() => {
    async function checkUser() {
      try {
        const profile = await getCurrentUserProfile()
        if (!profile) {
          router.push('/login')
          return
        }
  
        // If user already has a specific role (not just 'user'), redirect them away
        if (profile.role !== 'user') {
          if (profile.role === 'pending_mentor') {
            router.push('/mentor-pending')
          } else {
            router.push('/')
          }
          return
        }
  
        setUser(profile)
      } catch (error) {
        console.error('Error checking user:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [router])

  async function handleRoleSelect(role: 'student' | 'pending_mentor') {
    if (!user) return
    setUpdating(true)

    try {
      const { success, error } = await updateProfile({ role })
      
      if (success) {
        if (role === 'student') {
          router.push('/')
        } else {
          router.push('/mentor-pending')
        }
      } else {
        alert('Failed to update role: ' + error)
      }
    } catch (error) {
      console.error('Error selecting role:', error)
      alert('An error occurred')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Welcome, {user.username}!
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Please select how you want to join our platform.
          </p>
        </div>

        <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2">
          {/* Student Card */}
          <button
            onClick={() => handleRoleSelect('student')}
            disabled={updating}
            className="relative group bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-blue-500 text-left"
          >
            <div className="h-full flex flex-col">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  I am a Student
                </h3>
                <p className="mt-2 text-gray-500">
                  I want to learn, access materials, and join games to improve my knowledge.
                </p>
              </div>
            </div>
          </button>

          {/* Mentor Card */}
          <button
            onClick={() => handleRoleSelect('pending_mentor')}
            disabled={updating}
            className="relative group bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-purple-500 text-left"
          >
            <div className="h-full flex flex-col">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                  I am a Mentor
                </h3>
                <p className="mt-2 text-gray-500">
                  I want to contribute materials, create topics, and guide students. (Requires Approval)
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
