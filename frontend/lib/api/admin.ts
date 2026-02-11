// lib/api/admin.ts
import { apiClient } from './client'

export interface User {
  id: string
  email: string
  role: string
  status: string
  is_admin: boolean
  email_verified: boolean
  banned_at: string | null
  ban_reason: string | null
  created_at: string
  last_login_at: string | null
  username?: string
  full_name?: string
  avatar_url?: string | null
}

// Matches actual backend getDashboardStats response
export interface DashboardStats {
  users: {
    total_users: string
    new_users_today: string
    new_users_week: string
    new_users_month: string
    banned_users: string
  }
  content: {
    total_reviews: string
    total_lists: string
    total_parties: string
    total_favorites: string
    total_ratings: string
  }
  support: {
    total_tickets: string
    open_tickets: string
    urgent_tickets: string
  }
  moderation: {
    total_reports: string
    pending_reports: string
  }
}

// Matches actual backend getPaymentStats response
// Full response: { stats: PaymentStats, by_method: PaymentMethod[] }
export interface PaymentStats {
  total_payments: string
  successful_payments: string
  failed_payments: string
  pending_payments: string
  total_revenue: string | null
  revenue_30d: string | null
  revenue_7d: string | null
}

export interface PaymentMethod {
  payment_method: string
  count: string
  total: string
}

export interface ActivityLog {
  id: string
  admin_user_id: string
  action: string
  target_type: string
  target_id: string
  details: any
  ip_address: string
  created_at: string
  admin_email?: string
}

export const adminAPI = {
  // Dashboard
  async getDashboard(): Promise<{ success: boolean; stats: DashboardStats }> {
    const response = await apiClient.get('/api/admin/dashboard')
    return response.data
  },

  // Users
  async getUsers(page = 1, limit = 20, role?: string, status?: string) {
    const response = await apiClient.get('/api/admin/users', {
      params: { page, limit, role, status }
    })
    return response.data
  },

  async getUserDetails(userId: string): Promise<{ user: User }> {
    const response = await apiClient.get(`/api/admin/users/${userId}`)
    return response.data
  },

  async banUser(userId: string, reason: string): Promise<void> {
    await apiClient.put(`/api/admin/users/${userId}/ban`, { reason })
  },

  async unbanUser(userId: string): Promise<void> {
    await apiClient.put(`/api/admin/users/${userId}/unban`)
  },

  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/api/admin/users/${userId}`)
  },

  // Payments
  async getPayments(page = 1, limit = 20) {
    const response = await apiClient.get('/api/admin/payments', {
      params: { page, limit }
    })
    return response.data
  },

  async getPaymentStats(): Promise<{ stats: PaymentStats; by_method: PaymentMethod[] }> {
    const response = await apiClient.get('/api/admin/payments/stats')
    return response.data
  },

  async getFailedPayments(page = 1, limit = 20) {
    const response = await apiClient.get('/api/admin/payments/failed', {
      params: { page, limit }
    })
    return response.data
  },

  // Analytics
  async getUserAnalytics(days = 30) {
    const period = days === 7 ? '7days'
      : days === 90 ? '90days'
      : days === 365 ? '1year'
      : '30days'

    const response = await apiClient.get('/api/admin/analytics/users', {
      params: { period }
    })
    return response.data
  },

  // No time params needed - controller doesn't support them yet
  async getContentAnalytics() {
    const response = await apiClient.get('/api/admin/analytics/content')
    return response.data
  },

  async getEngagementAnalytics() {
    const response = await apiClient.get('/api/admin/analytics/engagement')
    return response.data
  },

  // Activity Logs
  async getActivityLogs(page = 1, limit = 50) {
    const response = await apiClient.get('/api/admin/activity-logs', {
      params: { page, limit }
    })
    return response.data
  },

  // Moderation
  async deleteReview(reviewId: string): Promise<void> {
    await apiClient.delete(`/api/admin/reviews/${reviewId}`)
  },

  async deleteList(listId: string): Promise<void> {
    await apiClient.delete(`/api/admin/lists/${listId}`)
  },

  async getReports(page = 1, limit = 20, status?: string) {
    const response = await apiClient.get('/api/admin/reports', {
      params: { page, limit, status }
    })
    return response.data
  },

  async updateReportStatus(reportId: string, status: string, action: string) {
    await apiClient.put(`/api/admin/reports/${reportId}`, {
      status,
      action_taken: action  // Backend expects action_taken not action
    })
  }
}