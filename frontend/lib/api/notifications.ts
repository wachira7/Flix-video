// lib/api/notifications.ts

import { apiClient } from './client'

export interface Notification {
  id: string
  user_id: string
  type: 'billing' | 'payment' | 'subscription' | 'watch_party' | 'social' | 'content' | 'system'
  title: string
  message: string
  data: any
  read: boolean
  read_at: string | null
  action_url: string | null
  created_at: string
}

export const notificationsAPI = {
  // Get all notifications
  async getAll(unreadOnly = false, limit = 20): Promise<{ notifications: Notification[] }> {
    const response = await apiClient.get('/api/notifications', {
      params: { unread_only: unreadOnly, limit }
    })
    return response.data
  },

  // Get unread count
  async getUnreadCount(): Promise<{ count: number }> {
    const response = await apiClient.get('/api/notifications/unread-count')
    return response.data
  },

  // Mark as read
  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.put(`/api/notifications/${notificationId}/read`)
  },

  // Mark all as read
  async markAllAsRead(): Promise<void> {
    await apiClient.put('/api/notifications/mark-all-read')
  },

  // Delete notification
  async delete(notificationId: string): Promise<void> {
    await apiClient.delete(`/api/notifications/${notificationId}`)
  }
}
