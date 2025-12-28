export type UserRole = 'user' | 'admin' | 'teacher' | 'student'

export interface Profile {
  id: string
  email: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface ProfileInsert {
  id: string
  email: string
  username: string
  full_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  role?: UserRole
}

export interface ProfileUpdate {
  username?: string
  full_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  role?: UserRole
}
