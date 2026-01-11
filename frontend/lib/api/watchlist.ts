// lib/api/watchlist.ts
import axios from "axios"
import { getToken } from "@/lib/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export const watchlistAPI = {
  getWatchlist: async (page = 1, contentType?: "movie" | "tv") => {
    const token = getToken()
    const params = new URLSearchParams({ page: page.toString() })
    if (contentType) params.append("contentType", contentType)
    
    const response = await axios.get(`${API_URL}/api/watchlist?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  addToWatchlist: async (contentType: "movie" | "tv", contentId: number) => {
    const token = getToken()
    const response = await axios.post(
      `${API_URL}/api/watchlist/${contentType}/${contentId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  },

  removeFromWatchlist: async (contentType: "movie" | "tv", contentId: number) => {
    const token = getToken()
    const response = await axios.delete(
      `${API_URL}/api/watchlist/${contentType}/${contentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  },

  checkWatchlist: async (contentType: "movie" | "tv", contentId: number) => {
    const token = getToken()
    const response = await axios.get(
      `${API_URL}/api/watchlist/check/${contentType}/${contentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  }
}