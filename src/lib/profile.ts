import { supabase } from './supabase'
import type { Profile, ProfileUpdate, UserProfile, UserProfileUpdate, UserProfileInsert } from '@/types/database'

// ============================================
// USER TABLE (Authentication & Basic Info)
// Note: table name is 'user' not 'profiles' based on schema
// ============================================

export async function getCurrentUserProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('user')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

export async function getProfileByUsernameOrEmail(identifier: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .rpc('get_user_by_username_or_email', { identifier })

  if (error || !data || data.length === 0) {
    return null
  }

  return data[0]
}

export async function updateProfile(updates: ProfileUpdate): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('user')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user')
    .select('username')
    .eq('username', username)
    .single()
  if (error) return true
  return !data
}

export async function getProfileById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('user')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

// ============================================
// USER_PROFILES TABLE (Detailed User Info)
// ============================================

export async function getCurrentUserDetailProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No profile found
      return null
    }
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export async function getUserProfileByUserId(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export async function createUserProfile(profileData: UserProfileInsert): Promise<{ success: boolean; error?: string; data?: UserProfile }> {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert(profileData)
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function updateUserProfile(userId: string, updates: UserProfileUpdate): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating user profile:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function upsertUserProfile(userId: string, profileData: Omit<UserProfileInsert, 'user_id'>): Promise<{ success: boolean; error?: string; data?: UserProfile }> {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({ ...profileData, user_id: userId }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    console.error('Error upserting user profile:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}
