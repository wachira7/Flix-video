// lib/api/favorites.ts
import axios from "axios"
import { getToken } from "@/lib/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export const favoritesAPI = {
  getFavorites: async (page = 1, contentType?: "movie" | "tv") => {
    const token = getToken()
    const params = new URLSearchParams({ page: page.toString() })
    if (contentType) params.append("contentType", contentType)
    
    const response = await axios.get(`${API_URL}/api/favorites?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  addFavorite: async (contentType: "movie" | "tv", contentId: number) => {
    const token = getToken()
    const response = await axios.post(
      `${API_URL}/api/favorites/${contentType}/${contentId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  },

  removeFavorite: async (contentType: "movie" | "tv", contentId: number) => {
    const token = getToken()
    const response = await axios.delete(
      `${API_URL}/api/favorites/${contentType}/${contentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  },

  checkFavorite: async (contentType: "movie" | "tv", contentId: number) => {
    const token = getToken()
    const response = await axios.get(
      `${API_URL}/api/favorites/check/${contentType}/${contentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  }
}