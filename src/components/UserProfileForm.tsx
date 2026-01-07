'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getBadgeById } from '@/lib/badges'
import type { UserProfile, UserProfileUpdate, Gender, Badge } from '@/types/database'

const getAnimationStyle = (delay: number) => ({
  animation: `fadeInUp 0.5s ease-out ${delay}s forwards`,
  opacity: 0,
})

interface UserProfileFormProps {
  userId?: string
  onSuccess?: () => void
}

export default function UserProfileForm({ userId, onSuccess }: UserProfileFormProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [badge, setBadge] = useState<Badge | null>(null)
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

        // Fetch badge data if user has a badge
        if (data.badge_id) {
          const badgeData = await getBadgeById(data.badge_id)
          setBadge(badgeData)
        } else {
          setBadge(null)
        }
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
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl p-8" style={getAnimationStyle(0)}>
        <h2 className="text-3xl font-black text-black mb-6 text-center">
          User Profile
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-4" style={getAnimationStyle(0.1)}>
            <div className="relative">
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-yellow-400 border-4 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <svg
                    className="w-16 h-16 text-black"
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

            <label className="cursor-pointer bg-pink-400 border-2 border-black text-black px-4 py-2 rounded-xl hover:bg-pink-500 transition-all font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5">
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
          <div style={getAnimationStyle(0.2)}>
            <label htmlFor="nama" className="block text-sm font-black text-black mb-2">
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nama"
              required
              value={formData.nama}
              onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
              className="w-full px-4 py-2 border-2 border-black rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              placeholder="Enter your name"
              disabled={loading}
            />
          </div>

          {/* Tanggal Lahir */}
          <div style={getAnimationStyle(0.3)}>
            <label htmlFor="tanggal_lahir" className="block text-sm font-black text-black mb-2">
              Tanggal Lahir
            </label>
            <input
              type="date"
              id="tanggal_lahir"
              value={formData.tanggal_lahir}
              onChange={(e) => setFormData(prev => ({ ...prev, tanggal_lahir: e.target.value }))}
              className="w-full px-4 py-2 border-2 border-black rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              disabled={loading}
            />
          </div>

          {/* Gender */}
          <div style={getAnimationStyle(0.4)}>
            <label htmlFor="gender" className="block text-sm font-black text-black mb-2">
              Jenis Kelamin <span className="text-red-500">*</span>
            </label>
            <select
              id="gender"
              required
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as Gender }))}
              className="w-full px-4 py-2 border-2 border-black rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              disabled={loading}
            >
              <option value="Pria">Pria</option>
              <option value="Wanita">Wanita</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Interest */}
          <div style={getAnimationStyle(0.5)}>
            <label htmlFor="interest" className="block text-sm font-black text-black mb-2">
              Interest / Minat
            </label>
            <textarea
              id="interest"
              value={formData.interest}
              onChange={(e) => setFormData(prev => ({ ...prev, interest: e.target.value }))}
              placeholder="Contoh: Saya suka web development, coding, dan teknologi terbaru..."
              className="w-full px-4 py-3 border-2 border-black rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] resize-none"
              rows={3}
              disabled={loading}
            />
            <p className="mt-2 text-sm font-bold text-gray-600">
              Ceritakan minat atau hobi Anda secara bebas. Ini akan digunakan untuk menghubungkan Anda dengan komunitas yang sesuai.
            </p>
          </div>

          {/* Badge Display */}
          <div style={getAnimationStyle(0.6)}>
            <label className="block text-sm font-black text-black mb-3">
              Badge Saya
            </label>
            {badge ? (
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-400 to-pink-400 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                {badge.gambar && (
                  <div className="flex-shrink-0">
                    <img
                      src={badge.gambar}
                      alt={badge.nama}
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-black text-black">
                    {badge.nama}
                  </h3>
                  <p className="text-sm font-bold text-black mt-1">
                    Badge yang sedang Anda gunakan
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-400 border-2 border-black rounded-xl text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-sm font-black text-black">
                  Anda belum memiliki badge. Raih achievement untuk mendapatkan badge!
                </p>
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div
              style={getAnimationStyle(0.7)}
              className={`rounded-xl p-4 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                message.type === 'error'
                  ? 'bg-red-400 text-black'
                  : 'bg-green-400 text-black'
              }`}
            >
              <p className="text-sm font-black">{message.text}</p>
            </div>
          )}

          {/* Submit & Cancel Button */}
          <div className="flex gap-4" style={getAnimationStyle(0.8)}>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 bg-teal-400 border-2 border-black text-black py-2 px-4 rounded-xl hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
            >
              {loading ? 'Menyimpan...' : profile ? 'Perbarui Profil' : 'Buat Profil'}
            </button>
            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 border-2 border-black rounded-xl text-black hover:bg-gray-200 transition-all font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
