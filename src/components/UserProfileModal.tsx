'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getBadgeById } from '@/lib/badges'
import type { UserProfile, Badge, Gender, UserProfileUpdate } from '@/types/database'

interface UserProfileModalProps {
  userId: string
  onClose: () => void
}

export default function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [badge, setBadge] = useState<Badge | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)

  const [formData, setFormData] = useState({
    nama: '',
    tanggal_lahir: '',
    gender: 'Pria' as Gender,
    interest: '',
    avatar_url: '',
  })

  useEffect(() => {
    loadProfile()

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [userId])

  const loadProfile = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        return
      }

      if (data) {
        setProfile(data)

        // Set form data
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
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
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

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const profileData: UserProfileUpdate = {
        nama: formData.nama,
        tanggal_lahir: formData.tanggal_lahir || null,
        gender: formData.gender,
        interest: formData.interest || null,
        avatar_url: formData.avatar_url || null,
        ...(formData.interest !== profile?.interest && { interest_id: null })
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('user_id', userId)

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Profile updated successfully!'
      })

      // Reload profile
      await loadProfile()
      setIsEditMode(false)
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update profile'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original profile data
    if (profile) {
      setFormData({
        nama: profile.nama || '',
        tanggal_lahir: profile.tanggal_lahir || '',
        gender: (profile.gender || 'Pria') as Gender,
        interest: profile.interest || '',
        avatar_url: profile.avatar_url || '',
      })
    }
    setIsEditMode(false)
    setMessage(null)
  }

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isEditMode) {
      onClose()
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white border-2 border-black rounded-2xl p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-black"></div>
            <span className="text-black font-black">Loading profile...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleBackdropClick}>
        <div className="bg-white border-2 border-black rounded-2xl p-8 max-w-md mx-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black font-black text-center">Profile not found</p>
          <button
            onClick={onClose}
            className="mt-4 w-full bg-red-400 border-2 border-black text-black py-2 px-4 rounded-xl hover:bg-red-500 transition-all font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-400 to-pink-400 border-b-2 border-black text-black p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">User Profile</h2>
            <button
              onClick={onClose}
              className="text-black hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-white/20 font-bold"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message */}
          {message && (
            <div
              className={`rounded-xl p-4 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                message.type === 'error'
                  ? 'bg-red-400 text-black'
                  : 'bg-green-400 text-black'
              }`}
            >
              <p className="text-sm font-black">{message.text}</p>
            </div>
          )}

          {/* Avatar and Basic Info */}
          <div className="flex flex-col items-center space-y-4">
            {formData.avatar_url ? (
              <img
                src={formData.avatar_url}
                alt={formData.nama}
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

            {isEditMode && (
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
            )}

            {!isEditMode && (
              <div className="text-center">
                <h3 className="text-2xl font-black text-black">
                  {profile?.nama}
                </h3>
              </div>
            )}
          </div>

          {/* Profile Details */}
          {isEditMode ? (
            /* Edit Mode - Form Fields */
            <div className="space-y-4">
              {/* Nama */}
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  Nama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                  className="w-full px-4 py-2 border-2 border-black rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  placeholder="Enter your name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tanggal Lahir */}
                <div>
                  <label className="block text-sm font-black text-black mb-2">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_lahir}
                    onChange={(e) => setFormData(prev => ({ ...prev, tanggal_lahir: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-black rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-black text-black mb-2">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as Gender }))}
                    className="w-full px-4 py-2 border-2 border-black rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <option value="Pria">Pria</option>
                    <option value="Wanita">Wanita</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Interest */}
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  Interest / Minat
                </label>
                <textarea
                  value={formData.interest}
                  onChange={(e) => setFormData(prev => ({ ...prev, interest: e.target.value }))}
                  placeholder="Contoh: Saya suka web development, coding, dan teknologi terbaru..."
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] resize-none"
                  rows={3}
                />
                <p className="mt-2 text-sm font-bold text-gray-600">
                  Ceritakan minat atau hobi Anda secara bebas.
                </p>
              </div>
            </div>
          ) : (
            /* View Mode - Display Only */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tanggal Lahir */}
                {profile?.tanggal_lahir && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tanggal Lahir</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {new Date(profile.tanggal_lahir).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                {/* Gender */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Jenis Kelamin</p>
                  <p className="text-gray-900 dark:text-white font-medium">{profile?.gender}</p>
                </div>
              </div>

              {/* Interest */}
              {profile?.interest && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">Interest / Minat</p>
                  <p className="text-gray-900 dark:text-white leading-relaxed">
                    {profile.interest}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Badge Display */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Badge
            </h4>
            {badge ? (
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border-2 border-indigo-200 dark:border-indigo-700">
                {badge.gambar && (
                  <div className="flex-shrink-0">
                    <img
                      src={badge.gambar}
                      alt={badge.nama}
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {badge.nama}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Badge yang sedang digunakan
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                <svg
                  className="w-12 h-12 text-gray-400 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Belum memiliki badge
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Raih achievement untuk mendapatkan badge!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black p-6 bg-blue-100 rounded-b-2xl">
          {isEditMode ? (
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 bg-red-400 border-2 border-black text-black py-3 px-4 rounded-xl hover:bg-red-500 transition-all font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.nama}
                className="flex-1 bg-teal-400 border-2 border-black text-black py-3 px-4 rounded-xl hover:bg-teal-500 transition-all font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditMode(true)}
                className="flex-1 bg-green-400 border-2 border-black text-black py-3 px-4 rounded-xl hover:bg-green-500 transition-all font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
              >
                Edit Profile
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-400 border-2 border-black text-black py-3 px-4 rounded-xl hover:bg-gray-500 transition-all font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
