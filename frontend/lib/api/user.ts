// lib/api/user.ts
import { apiClient } from './client'

export const userAPI = {
  // ── Profile ──────────────────────────────────────────────────
  async getProfile() {
    const response = await apiClient.get('/api/users/me')
    return response.data
  },

  async updateProfile(data: any) {
    const response = await apiClient.put('/api/users/profile', data)
    return response.data
  },

  async uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('avatar', file)
    const response = await apiClient.post('/api/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async deleteAvatar() {
    const response = await apiClient.delete('/api/users/avatar')
    return response.data
  },

  async changePassword(data: { current_password: string; new_password: string }) {
    const response = await apiClient.put('/api/users/password', data)
    return response.data
  },

  // ── Watch History ────────────────────────────────────────────
  async updateWatchProgress(data: {
    content_type: 'movie' | 'tv'
    content_id: number
    progress_seconds: number
    duration_seconds?: number
    completed?: boolean
    season_number?: number | null
    episode_number?: number | null
    quality?: string
  }) {
    const response = await apiClient.post('/api/users/watch-progress', data)
    return response.data
  },

  async getWatchHistory(params?: { limit?: number; content_type?: string }) {
    const response = await apiClient.get('/api/users/watch-history', { params })
    return response.data
  },

  async getContinueWatching(limit = 10) {
    const response = await apiClient.get('/api/users/continue-watching', {
      params: { limit }
    })
    return response.data
  },

  async getWatchProgress(contentType: string, contentId: number) {
    const response = await apiClient.get(
      `/api/users/watch-progress/${contentType}/${contentId}`
    )
    return response.data
  },

  async deleteWatchHistoryItem(contentType: string, contentId: number) {
    const response = await apiClient.delete(
      `/api/users/watch-history/${contentType}/${contentId}`
    )
    return response.data
  },

  async clearWatchHistory() {
    const response = await apiClient.delete('/api/users/watch-history')
    return response.data
  },
}