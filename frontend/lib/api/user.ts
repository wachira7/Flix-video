// lib/api/user.ts 

import axios from "axios"
import { getToken } from "@/lib/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export const userAPI = {
  // Get current user profile
  getProfile: async () => {
    const token = getToken()
    const response = await axios.get(`${API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  // Update profile
  updateProfile: async (data: {
    username?: string
    full_name?: string
    bio?: string
    date_of_birth?: string
    gender?: string
    country?: string
    city?: string
    timezone?: string
    language?: string
    is_public?: boolean
  }) => {
    const token = getToken()
    const response = await axios.put(
      `${API_URL}/api/users/profile`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  },

  // Upload avatar (via backend)
  uploadAvatar: async (file: File) => {
    const token = getToken()
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await axios.post(
      `${API_URL}/api/users/avatar`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return response.data
  },

  // Delete avatar
  deleteAvatar: async () => {
    const token = getToken()
    const response = await axios.delete(`${API_URL}/api/users/avatar`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  // Change password
  changePassword: async (data: {
    current_password: string
    new_password: string
  }) => {
    const token = getToken()
    const response = await axios.put(
      `${API_URL}/api/users/password`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  }
}