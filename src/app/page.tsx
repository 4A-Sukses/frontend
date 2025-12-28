'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import UserNav from "@/components/UserNav"
import { getCurrentUserProfile } from '@/lib/profile'
import type { Profile } from '@/types/database'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
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
        setLoading(false)
      }
    }

    checkUser()
  }, [router])

  const features = [
    {
      path: "/AdaptiveMaterial",
      title: "Adaptive Material",
      description: "Adaptive Material Learning System"
    },
    {
      path: "/games",
      title: "Games",
      description: "Educational Games Platform"
    },
    {
      path: "/Multi-Source-Knowledge",
      title: "Multi-Source Knowledge",
      description: "Multi-Source Knowledge Base"
    },
    {
      path: "/n8n-workflow",
      title: "N8N Workflow",
      description: "Workflow Automation System"
    },
    {
      path: "/PeerConnect",
      title: "Peer Connect",
      description: "Peer-to-Peer Connection Platform"
    },
    {
      path: "/TaskIntegrator",
      title: "Task Integrator",
      description: "Task Integration & Management"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <UserNav />
      <h1 className="text-4xl font-bold mb-8">Welcome to Lomba Web</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
        {features.map((feature) => (
          <Link
            key={feature.path}
            href={feature.path}
            className="p-6 border rounded-lg hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
          >
            <h2 className="text-2xl font-semibold">{feature.title}</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {feature.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
