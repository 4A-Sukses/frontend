export type UserRole = 'user' | 'admin' | 'teacher' | 'student'
export type Gender = 'male' | 'female' | 'other'

// Table: user (profiles table)
export interface Profile {
  id: string // uuid - Primary Key, references auth.users.id
  email: string // text
  username: string // text
  role: string // text (instead of enum for flexibility)
  created_at: string // timestamptz
  updated_at: string // timestamptz
}

export interface ProfileInsert {
  id: string
  email: string
  username: string
  role?: string
}

export interface ProfileUpdate {
  username?: string
  role?: string
}

// Table: user_profiles (detail user profile table)
export interface UserProfile {
  id: number // int8 - Primary Key
  created_at: string // timestamptz
  nama: string // text
  tanggal_lahir: string | null // date
  gender: string // text (from gender_enum)
  interest: string[] // _text (array of text)
  avatar_url: string | null // text
  user_id: string // uuid - Foreign Key to auth.users.id
  badge_id: number | null // int8
}

export interface UserProfileInsert {
  nama: string
  tanggal_lahir?: string | null
  gender: string
  interest?: string[]
  avatar_url?: string | null
  user_id: string
  badge_id?: number | null
}

export interface UserProfileUpdate {
  nama?: string
  tanggal_lahir?: string | null
  gender?: string
  interest?: string[]
  avatar_url?: string | null
  badge_id?: number | null
}
