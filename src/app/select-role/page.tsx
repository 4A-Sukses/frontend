'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile, updateProfile, upsertUserProfile } from '@/lib/profile'
import type { Profile, Gender } from '@/types/database'

export default function SelectRole() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [user, setUser] = useState<Profile | null>(null)
  const [selectedRole, setSelectedRole] = useState<'student' | 'pending_mentor' | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    tanggal_lahir: '',
    gender: 'Pria' as Gender,
    interest: '',
  })
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    async function checkUser() {
      try {
        const profile = await getCurrentUserProfile()
        if (!profile) {
          router.push('/login')
          return
        }

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

  const validateForm = () => {
    const errors: { [key: string]: string } = {}
    if (!formData.nama.trim()) errors.nama = 'Nama lengkap wajib diisi'
    if (!formData.gender) errors.gender = 'Jenis kelamin wajib diisi'
    if (!selectedRole) errors.role = 'Silakan pilih role Anda (Siswa atau Mentor)'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !selectedRole) return

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setUpdating(true)

    try {
      // Step 1: Simpan data ke tabel detail profile (user_profiles)
      const { success: profileSuccess, error: profileError } = await upsertUserProfile(user.id, {
        nama: formData.nama,
        tanggal_lahir: formData.tanggal_lahir || null,
        gender: formData.gender,
        interest: formData.interest.trim() || null,
        avatar_url: null
      })

      if (!profileSuccess) throw new Error('Gagal menyimpan profil: ' + profileError)

      // Step 2: Perbarui role di tabel user utama
      const { success: roleSuccess, error: roleError } = await updateProfile({ role: selectedRole })

      if (!roleSuccess) throw new Error('Gagal memperbarui role: ' + roleError)

      // Step 3: Redirect sesuai pilihan
      if (selectedRole === 'student') {
        router.push('/')
      } else {
        router.push('/mentor-pending')
      }

    } catch (error: any) {
      console.error('Error during onboarding:', error)
      alert(error.message || 'Terjadi kesalahan saat pendaftaran')
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
    <div className="min-h-screen bg-gray-50 bg-gradient-to-b from-blue-100 to-blue-200 py-12 px-4 sm:px-6 lg:px-8">
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center" style={{ animation: 'fadeInUp 0.5s ease-out forwards' }}>
          <h1 className="text-4xl font-black text-black sm:text-5xl uppercase tracking-tight">
            Lengkapi Profil Anda
          </h1>
          <p className="mt-4 text-xl font-bold text-gray-700">
            Selamat datang! Silakan lengkapi data diri Anda untuk memulai.
          </p>
        </div>

        <div
          className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl p-8"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.1s forwards', opacity: 0 }}
        >
          <form className="space-y-8" onSubmit={handleFinalSubmit}>

            {/* Section: Data Diri */}
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-black border-b-2 border-gray-200 pb-2">
                Data Diri
              </h3>

              {/* Nama Lengkap */}
              <div>
                <label htmlFor="nama" className="block text-sm font-black text-black mb-2">
                  Nama Lengkap <span className="text-red-600">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="nama"
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className={`appearance-none block w-full px-4 py-3 border-2 border-black rounded-xl text-black placeholder-gray-500 focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-1 focus:-translate-x-1 transition-all font-bold ${formErrors.nama ? 'bg-red-50' : 'bg-white'}`}
                    placeholder="Masukkan nama lengkap Anda"
                  />
                  {formErrors.nama && <p className="mt-1 text-sm text-red-600 font-bold">{formErrors.nama}</p>}
                </div>
              </div>

              {/* Jenis Kelamin */}
              <div>
                <label htmlFor="gender" className="block text-sm font-black text-black mb-2">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <select
                    id="gender"
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="appearance-none block w-full px-4 py-3 border-2 border-black rounded-xl text-black focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-1 focus:-translate-x-1 transition-all font-bold bg-white cursor-pointer"
                  >
                    <option value="Pria">Pria</option>
                    <option value="Wanita">Wanita</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-black">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Tanggal Lahir */}
              <div>
                <label htmlFor="tanggal_lahir" className="block text-sm font-black text-black mb-2">
                  Tanggal Lahir
                </label>
                <div className="mt-1">
                  <input
                    id="tanggal_lahir"
                    type="date"
                    value={formData.tanggal_lahir}
                    onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                    className="appearance-none block w-full px-4 py-3 border-2 border-black rounded-xl text-black focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-1 focus:-translate-x-1 transition-all font-bold bg-white"
                  />
                </div>
              </div>

              {/* Minat / Keahlian */}
              <div>
                <label htmlFor="interest" className="block text-sm font-black text-black mb-2">
                  Minat / Keahlian
                </label>
                <div className="mt-1">
                  <input
                    id="interest"
                    type="text"
                    value={formData.interest}
                    onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                    className="appearance-none block w-full px-4 py-3 border-2 border-black rounded-xl text-black placeholder-gray-500 focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-1 focus:-translate-x-1 transition-all font-bold bg-white"
                    placeholder="Contoh: Matematika, Coding, Musik"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600 font-bold">Tulis minat atau keahlian Anda</p>
              </div>
            </div>

            {/* Section: Pilih Role Anda */}
            <div className="space-y-6 pt-4">
              <h3 className="text-2xl font-black text-black border-b-2 border-gray-200 pb-2">
                Pilih Role Anda
              </h3>
              {formErrors.role && <p className="text-sm text-red-600 font-black bg-red-100 p-2 rounded-lg border-2 border-red-200">{formErrors.role}</p>}

              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {/* Role: Siswa */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('student')}
                  className={`group relative p-6 rounded-xl border-2 transition-all duration-200 text-left focus:outline-none overflow-hidden ${selectedRole === 'student'
                      ? 'border-black bg-blue-100 shadow-[6px_6px_0px_0px_rgba(59,130,246,1)] translate-x-[-2px] translate-y-[-2px]'
                      : 'border-black bg-white hover:bg-gray-50 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]'
                    }`}
                >
                  <div className="flex items-center mb-4 relative z-10">
                    <div className={`h-12 w-12 rounded-xl border-2 border-black flex items-center justify-center mr-4 transition-colors ${selectedRole === 'student' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'
                      }`}>
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-black text-black">Siswa</h4>
                  </div>
                  <p className="text-sm text-gray-800 font-bold relative z-10">
                    Saya ingin belajar, bermain games edukasi, dan meningkatkan pengetahuan.
                  </p>
                </button>

                {/* Role: Mentor */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('pending_mentor')}
                  className={`group relative p-6 rounded-xl border-2 transition-all duration-200 text-left focus:outline-none overflow-hidden ${selectedRole === 'pending_mentor'
                      ? 'border-black bg-purple-100 shadow-[6px_6px_0px_0px_rgba(168,85,247,1)] translate-x-[-2px] translate-y-[-2px]'
                      : 'border-black bg-white hover:bg-gray-50 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]'
                    }`}
                >
                  <div className="flex items-center mb-4 relative z-10">
                    <div className={`h-12 w-12 rounded-xl border-2 border-black flex items-center justify-center mr-4 transition-colors ${selectedRole === 'pending_mentor' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600'
                      }`}>
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-black text-black">Mentor</h4>
                  </div>
                  <p className="text-sm text-gray-800 font-bold relative z-10">
                    Saya ingin berkontribusi materi dan membimbing siswa. (Butuh persetujuan Admin)
                  </p>
                </button>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={updating}
                className="w-full flex justify-center py-4 px-6 border-2 border-black rounded-xl text-lg font-black text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px]"
              >
                {updating ? 'MEMPROSES...' : 'SIMPAN & LANJUTKAN'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}