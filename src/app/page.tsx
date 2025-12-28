'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import { getCurrentUserProfile } from '@/lib/profile'
import LoadingScreen from '@/components/LoadingScreen'
import Navbar from '@/components/Navbar'
import type { Profile } from '@/types/database'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [showLoading, setShowLoading] = useState(true)
  const [user, setUser] = useState<Profile | null>(null)

  useEffect(() => {
    async function checkUser() {
      try {
        const profile = await getCurrentUserProfile()
        setUser(profile)

        if (profile) {
          if (profile.role === 'user') {
            router.push('/select-role')
            return
          }
          if (profile.role === 'pending_mentor') {
            router.push('/mentor-pending')
            return
          }
        }
      } catch (error) {
        console.error('Error checking user:', error)
      } finally {
        // Trigger fade out animation before hiding
        setTimeout(() => {
          setLoading(false)
          setTimeout(() => setShowLoading(false), 300) // Wait for fade out to complete
        }, 1000) // Show loading for at least 1 second
      }
    }

    checkUser()
  }, [router])

  if (showLoading) {
    return <LoadingScreen loading={loading} />
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1">
        {/* Hero Section - Dark Background with Curved Lines */}
        <div className="relative bg-black min-h-screen overflow-hidden">
          {/* Decorative curved lines - Concentric circles */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute border-2 border-gray-600 rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: `${(i + 1) * 150}px`,
                    height: `${(i + 1) * 100}px`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
            <div className="text-center">
              {/* Main Title */}
              <h1 className="text-6xl md:text-8xl font-black text-white mb-8 leading-tight">
                THE ALL-IN-ONE
                <br />
                <span className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                  PROJECT
                </span>
                <br />
                LEARNING
                <br />
                <span className="text-yellow-400">SOLUTION</span>
              </h1>

              {/* Subtitle */}
              <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
                Platform pembelajaran modern yang dirancang untuk mempercepat
                <br />
                proses belajar dengan teknologi adaptif dan interaktif
              </p>

              {/* CTA Button */}
              <Link
                href="/AdaptiveMaterial"
                className="inline-block px-10 py-4 bg-yellow-400 text-black text-lg font-black rounded-full hover:bg-yellow-300 transition-all hover:scale-105 shadow-lg"
              >
                MAKE A REQUEST
              </Link>

              {/* Brand Logos Section */}
              <div className="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-60">
                <span className="text-white font-bold text-sm">Integration:</span>
                <span className="text-white text-xs">Supabase</span>
                <span className="text-white text-xs">Next.js</span>
                <span className="text-white text-xs">Tailwind</span>
                <span className="text-white text-xs">TypeScript</span>
              </div>
            </div>
          </div>

          {/* Decorative Star */}
          <div className="absolute bottom-10 right-10">
            <svg className="w-16 h-16 text-yellow-400 animate-spin-slow" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>

        {/* Services Section - Card that slides up */}
        <div className="relative bg-white rounded-t-[50px] pt-20 pb-20 -mt-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-black mb-4">
                WHAT DO WE DO{' '}
                <span className="inline-block transform -rotate-12">✨</span>{' '}
                <span className="bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent">
                  SERVICES
                </span>
              </h2>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Card 1 - Green */}
              <div className="relative bg-gradient-to-br from-green-400 to-green-500 rounded-3xl p-8 overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1">
                <div className="flex gap-6 items-center">
                  {/* Image placeholder with stamp effect */}
                  <div className="w-48 h-32 bg-yellow-100 rounded-2xl border-4 border-dashed border-black flex items-center justify-center transform -rotate-3">
                    <svg className="w-16 h-16 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white mb-2 uppercase">
                      Adaptive Material
                    </h3>
                    <p className="text-white font-medium">
                      Materi pembelajaran yang menyesuaikan dengan tingkat pemahaman dan kecepatan belajar Anda
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2 - Purple */}
              <div className="relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-8 overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1">
                <div className="flex gap-6 items-center">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white mb-2 uppercase">
                      Educational Games
                    </h3>
                    <p className="text-white font-medium">
                      Belajar sambil bermain dengan game edukatif yang menyenangkan
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 3 - Blue */}
              <div className="relative bg-gradient-to-br from-blue-400 to-blue-500 rounded-3xl p-8 overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1">
                <div className="flex gap-6 items-center">
                  <div className="w-48 h-32 bg-pink-100 rounded-2xl border-4 border-dashed border-black flex items-center justify-center transform rotate-2">
                    <svg className="w-16 h-16 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white mb-2 uppercase">
                      N8N Workflow
                    </h3>
                    <p className="text-white font-medium">
                      Automasi pembelajaran dengan workflow yang dapat disesuaikan
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 4 - Pink with Explore */}
              <div className="relative bg-gradient-to-br from-pink-300 to-pink-400 rounded-3xl p-8 overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1">
                <div className="flex gap-6 items-center">
                  <div className="w-48 h-32 bg-white rounded-2xl border-4 border-dashed border-black flex items-center justify-center transform -rotate-1">
                    <span className="text-4xl font-black text-pink-600">Explore</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase">
                      Multi-Source Knowledge
                    </h3>
                    <p className="text-gray-900 font-medium">
                      Akses berbagai sumber pengetahuan terintegrasi
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-indigo-600 dark:bg-indigo-700 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Siap Memulai Perjalanan Belajar Anda?
            </h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Bergabunglah dengan ribuan pembelajar yang telah merasakan pengalaman belajar yang lebih efektif
            </p>
            {!user && (
              <Link
                href="/login"
                className="inline-block px-8 py-4 bg-white text-indigo-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
              >
                Daftar Sekarang
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
