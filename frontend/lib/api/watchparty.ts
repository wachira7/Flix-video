// lib/api/watchparty.ts

import { apiClient } from './client'

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
  participant_count?: number
  join_url?: string
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

export interface WatchPartyResponse {
  success: boolean
  message?: string
  party: WatchParty
}

export interface WatchPartiesListResponse {
  success: boolean
  page: number
  limit: number
  total: number
  total_pages: number
  parties: WatchParty[]
}

export const watchPartyAPI = {
  /**
   * Create a new watch party
   */
  async create(data: CreatePartyData): Promise<WatchPartyResponse> {
    const response = await apiClient.post('/api/watch-party', data)
    return response.data
  },

  /**
   * Get watch party details by code
   */
  async getByCode(partyCode: string): Promise<WatchPartyResponse> {
    const response = await apiClient.get(`/api/watch-party/${partyCode}`)
    return response.data
  },

  /**
   * Join a watch party
   */
  async join(partyCode: string): Promise<WatchPartyResponse> {
    const response = await apiClient.post(`/api/watch-party/${partyCode}/join`)
    return response.data
  },

  /**
   * Leave a watch party
   */
  async leave(partyId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/api/watch-party/${partyId}/leave`)
    return response.data
  },

  /**
   * End a watch party (host only)
   */
  async end(partyId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/api/watch-party/${partyId}/end`)
    return response.data
  },

  /**
   * Get my watch parties
   */
  async getMyParties(params?: {
    status?: 'all' | 'waiting' | 'playing' | 'paused' | 'ended'
    page?: number
    limit?: number
  }): Promise<WatchPartiesListResponse> {
    const response = await apiClient.get('/api/watch-party/my-parties', { params })
    return response.data
  },
}