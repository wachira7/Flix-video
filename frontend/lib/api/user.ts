// lib/api/user.ts
import { apiClient } from './client'

export const userAPI = {
  // Get profile
  async getProfile() {
    const response = await apiClient.get('/api/users/me')
    return response.data
  },

  // Update profile
  async updateProfile(data: any) {
    const response = await apiClient.put('/api/users/profile', data)
    return response.data
  },

  // Upload avatar - uses FormData for file upload
  async uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('avatar', file)
    
    const response = await apiClient.post('/api/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Delete avatar
  async deleteAvatar() {
    const response = await apiClient.delete('/api/users/avatar')
    return response.data
  },

  // Change password
  async changePassword(data: { current_password: string; new_password: string }) {
    const response = await apiClient.put('/api/users/password', data)
    return response.data
  },
}