'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserProfile, UserProfileUpdate, Gender } from '@/types/database'

interface UserProfileFormProps {
  userId?: string
  onSuccess?: () => void
}

export default function UserProfileForm({ userId, onSuccess }: UserProfileFormProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)

  const [formData, setFormData] = useState({
    nama: '',
    tanggal_lahir: '',
    gender: 'Pria' as Gender,
    interest: '',
    avatar_url: '',
  })

  useEffect(() => {
    if (userId) {
      loadProfile()
    }
  }, [userId])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setProfile(data)
        setFormData({
          nama: data.nama || '',
          tanggal_lahir: data.tanggal_lahir || '',
          gender: data.gender || 'Pria',
          interest: data.interest || '',
          avatar_url: data.avatar_url || '',
        })
      }
    } catch (error: any) {
      console.error('Error loading profile:', error)
      setMessage({
        type: 'error',
        text: 'Failed to load profile'
      })
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      setMessage(null)

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }))

      setMessage({
        type: 'success',
        text: 'Avatar uploaded successfully!'
      })
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message
      })
    } finally {
      setUploading(false)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (!userId) {
        throw new Error('User ID is required')
      }

      const profileData: UserProfileUpdate = {
        nama: formData.nama,
        tanggal_lahir: formData.tanggal_lahir || null,
        gender: formData.gender,
        interest: formData.interest || null,
        avatar_url: formData.avatar_url || null,
        // Reset interest_id jika user mengubah interest
        // Agar AI kategorisasi ulang saat buka PeerConnect
        ...(formData.interest !== profile?.interest && { interest_id: null })
      }

      if (profile) {
        // Update existing profile
        const { error } = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('user_id', userId)

        if (error) throw error
      } else {
        // Insert new profile
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            ...profileData,
            user_id: userId,
          })

        if (error) throw error
      }

      setMessage({
        type: 'success',
        text: 'Profile saved successfully!'
      })

      if (onSuccess) {
        onSuccess()
      }

      // Reload profile
      await loadProfile()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to save profile'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          User Profile
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>

            <label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
              <span>{uploading ? 'Uploading...' : 'Upload Avatar'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Nama */}
          <div>
            <label htmlFor="nama" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nama"
              required
              value={formData.nama}
              onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter your name"
              disabled={loading}
            />
          </div>

          {/* Tanggal Lahir */}
          <div>
            <label htmlFor="tanggal_lahir" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tanggal Lahir
            </label>
            <input
              type="date"
              id="tanggal_lahir"
              value={formData.tanggal_lahir}
              onChange={(e) => setFormData(prev => ({ ...prev, tanggal_lahir: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Jenis Kelamin <span className="text-red-500">*</span>
            </label>
            <select
              id="gender"
              required
              
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as Gender }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              disabled={loading}
            >
              <option value="Pria">Pria</option>
              <option value="Wanita">Wanita</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Interest */}
          <div>
            <label htmlFor="interest" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Interest / Minat
            </label>
            <textarea
              id="interest"
              value={formData.interest}
              onChange={(e) => setFormData(prev => ({ ...prev, interest: e.target.value }))}
              placeholder="Contoh: Saya suka web development, coding, dan teknologi terbaru..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              rows={3}
              disabled={loading}
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Ceritakan minat atau hobi Anda secara bebas. Ini akan digunakan untuk menghubungkan Anda dengan komunitas yang sesuai.
            </p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`rounded-md p-4 ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200'
              }`}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          {/* Submit & Cancel Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {loading ? 'Menyimpan...' : profile ? 'Perbarui Profil' : 'Buat Profil'}
            </button>
            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
