// lib/types/watchparty.ts

export interface WatchParty {
  id: string
  host_user_id: string
  content_type: 'movie' | 'tv_show'
  content_id: number
  title: string
  episode_number?: number
  season_number?: number
  is_public: boolean
  max_participants: number
  party_code: string
  status: 'waiting' | 'playing' | 'paused' | 'ended'
  video_position: number
  created_at: string
  started_at?: string
  ended_at?: string
  host_email?: string
  host_username?: string
  host_name?: string
  participants?: Participant[]
  participant_count?: number
}

export interface Participant {
  id: string
  party_id: string
  user_id: string
  is_host: boolean
  is_active: boolean
  joined_at: string
  left_at?: string
  email: string
  username: string
  full_name?: string
  avatar_url?: string
}

export interface ChatMessage {
  id: string
  party_id: string
  user_id: string
  message_type: 'text' | 'reaction' | 'system'
  content: string
  created_at: string
  userId?: string
  username?: string
  message?: string
  timestamp?: string
}

export interface CreatePartyData {
  content_type: 'movie' | 'tv'
  content_id: number
  title: string
  episode_number?: number
  season_number?: number
  is_public?: boolean
  max_participants?: number
}

export interface PartyState {
  participants: Array<{
    socketId: string
    userId: string
    username: string
  }>
  participantCount: number
}

// Socket event types
export interface SocketEventData {
  partyId: string
  userId: string
  username: string
  timestamp?: number
  message?: string
  emoji?: string
}

export interface VideoControlEvent {
  timestamp: number
  userId: string
  username: string
}