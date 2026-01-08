import type { PrivateChat, PrivateMessage } from "@/types/database"

export interface Interest {
  id: number
  name: string
  description: string
}

export interface ChatRoom {
  id: string
  interest_id: number
  name: string
  created_at: string
}

export interface MaterialLinkData {
  id: number
  title: string
  slug: string
  material_type: string
  topic?: string
}

export interface ChatMessageData {
  id: string
  room_id: string
  user_id: string
  message: string
  created_at: string
  material_id?: number | null
  material_data?: MaterialLinkData | null
  user_profiles?: {
    nama: string
    avatar_url: string
    role?: string
  }
}

export interface UserProfile {
  user_id: string
  nama: string
  interest: string | null
  interest_id: number | null
  avatar_url: string
  role?: string
}

export interface PrivateChatWithUser extends PrivateChat {
  otherUser: {
    user_id: string
    nama: string
    avatar_url: string | null
    role?: string
    badge_id?: number | null
  }
  lastMessage?: string
}

export type ChatMode = 'group' | 'private'

export { PrivateMessage }
