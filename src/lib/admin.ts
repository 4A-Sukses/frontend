import { supabase } from './supabase'
import type { Profile } from '@/types/database'

/**
 * Mengambil semua daftar user dari tabel "user".
 * Digunakan untuk menampilkan tabel manajemen user di Dashboard Admin.
 */
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('user')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all users:', error)
    return []
  }

  return data as Profile[]
}

/**
 * Mengambil daftar user yang baru saja mendaftar sebagai mentor
 * dan masih berstatus 'pending_mentor'.
 */
export async function getPendingMentors() {
  const { data, error } = await supabase
    .from('user')
    .select('*')
    .eq('role', 'pending_mentor')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pending mentors:', error)
    return []
  }

  return data as Profile[]
}

/**
 * Fungsi umum untuk memperbarui role user berdasarkan ID.
 */
export async function updateUserRole(userId: string, newRole: string) {
  const { error } = await supabase
    .from('user')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user role:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Alur Approve: Mengubah status user dari 'pending_mentor' menjadi 'mentor' resmi.
 */
export async function approveMentor(userId: string) {
  return updateUserRole(userId, 'mentor')
}

/**
 * Alur Reject: Mengembalikan status mentor yang ditolak menjadi user biasa.
 */
export async function rejectMentor(userId: string) {
  return updateUserRole(userId, 'user')
}

// ============================================
// PENDING TOPICS FUNCTIONS
// ============================================

import type { PendingTopic } from '@/types/database'

/**
 * Mengambil semua pending topic requests.
 * Digunakan untuk menampilkan di Dashboard Admin.
 */
export async function getPendingTopics() {
  // First fetch pending topics
  const { data: topics, error: topicsError } = await supabase
    .from('pending_topics')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (topicsError) {
    console.error('Error fetching pending topics:', topicsError)
    return []
  }

  if (!topics || topics.length === 0) {
    return []
  }

  // Get unique requester IDs
  const requesterIds = [...new Set(topics.map(t => t.requested_by).filter(Boolean))]

  // Fetch requester info from user table
  const { data: users } = await supabase
    .from('user')
    .select('id, username, email')
    .in('id', requesterIds)

  // Map users to topics
  const userMap = new Map(users?.map(u => [u.id, u]) || [])

  const result = topics.map(topic => ({
    ...topic,
    requester: topic.requested_by ? userMap.get(topic.requested_by) : undefined
  }))

  return result as PendingTopic[]
}

/**
 * Approve pending topic dan buat topic baru di tabel topics.
 */
export async function approvePendingTopic(pendingTopicId: string, reviewerId: string) {
  // 1. Get pending topic data
  const { data: pending, error: fetchError } = await supabase
    .from('pending_topics')
    .select('*')
    .eq('id', pendingTopicId)
    .single()

  if (fetchError || !pending) {
    console.error('Error fetching pending topic:', fetchError)
    return { success: false, error: 'Pending topic not found' }
  }

  // 2. Create new topic
  const { error: insertError } = await supabase
    .from('topics')
    .insert({
      title: pending.title,
      description: pending.description,
      created_by: pending.requested_by
    })

  if (insertError) {
    console.error('Error creating topic:', insertError)
    return { success: false, error: insertError.message }
  }

  // 3. Update pending topic status
  const { error: updateError } = await supabase
    .from('pending_topics')
    .update({
      status: 'approved',
      reviewed_by: reviewerId,
      updated_at: new Date().toISOString()
    })
    .eq('id', pendingTopicId)

  if (updateError) {
    console.error('Error updating pending topic status:', updateError)
    return { success: false, error: updateError.message }
  }

  return { success: true }
}

/**
 * Reject pending topic request.
 */
export async function rejectPendingTopic(pendingTopicId: string, reviewerId: string) {
  const { error } = await supabase
    .from('pending_topics')
    .update({
      status: 'rejected',
      reviewed_by: reviewerId,
      updated_at: new Date().toISOString()
    })
    .eq('id', pendingTopicId)

  if (error) {
    console.error('Error rejecting pending topic:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
