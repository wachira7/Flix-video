// lib/api/lists.ts

import { apiClient } from './client'

export interface List {
  id: string
  user_id: string
  title: string
  description?: string
  is_public: boolean
  is_ranked: boolean
  cover_image_url?: string
  created_at: string
  updated_at: string
  items?: ListItem[]
}

export interface ListItem {
  id: string
  list_id: string
  content_type: 'movie' | 'tv'
  content_id: number
  notes?: string
  rank_order?: number
  added_at: string
}

export interface CreateListData {
  title: string
  description?: string
  is_public?: boolean
  is_ranked?: boolean
}

export interface AddItemData {
  contentType: 'movie' | 'tv'
  contentId: number
  notes?: string
  rank_order?: number
}

export const listsAPI = {
  // Create a list
  async create(data: CreateListData): Promise<{ list: List }> {
    const response = await apiClient.post('/api/lists', data)
    return response.data
  },

  // Get my lists
  async getMyLists(page = 1, limit = 20): Promise<{ lists: List[]; total: number }> {
    const response = await apiClient.get('/api/lists/me', {
      params: { page, limit }
    })
    return response.data
  },

  // Get user's public lists
  async getUserLists(userId: string, page = 1, limit = 20): Promise<{ lists: List[] }> {
    const response = await apiClient.get(`/api/lists/user/${userId}`, {
      params: { page, limit }
    })
    return response.data
  },

  // Get list details with items
  async getDetails(listId: string): Promise<{ list: List }> {
    const response = await apiClient.get(`/api/lists/${listId}`)
    return response.data
  },

  // Update a list
  async update(listId: string, data: Partial<CreateListData>): Promise<{ list: List }> {
    const response = await apiClient.put(`/api/lists/${listId}`, data)
    return response.data
  },

  // Delete a list
  async delete(listId: string): Promise<void> {
    await apiClient.delete(`/api/lists/${listId}`)
  },

  // Add item to list
  async addItem(listId: string, data: AddItemData): Promise<{ item: ListItem }> {
    const response = await apiClient.post(`/api/lists/${listId}/items`, data)
    return response.data
  },

  // Add multiple items (batch)
  async addItemsBatch(listId: string, items: AddItemData[]): Promise<{ addedItems: ListItem[] }> {
    const response = await apiClient.post(`/api/lists/${listId}/items/batch`, { items })
    return response.data
  },

  // Remove item from list
  async removeItem(listId: string, itemId: string): Promise<void> {
    await apiClient.delete(`/api/lists/${listId}/items/${itemId}`)
  },

  // Toggle like on a list
  async toggleLike(listId: string): Promise<{ liked: boolean }> {
    const response = await apiClient.post(`/api/lists/${listId}/like`)
    return response.data
  }
}