// lib/api/ratings.ts
import axios from "axios"
import { getToken } from "@/lib/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export const ratingsAPI = {
  // Rate content (1.0 to 10.0 stars)
  rateContent: async (contentType: "movie" | "tv", contentId: number, rating: number) => {
    const token = getToken()
    const response = await axios.post(
      `${API_URL}/api/ratings/${contentType}/${contentId}`,
      { rating },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  },

  // Get user's rating for content
  getUserRating: async (contentType: "movie" | "tv", contentId: number) => {
    const token = getToken()
    const response = await axios.get(
      `${API_URL}/api/ratings/${contentType}/${contentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  },

  // Delete rating
  deleteRating: async (contentType: "movie" | "tv", contentId: number) => {
    const token = getToken()
    const response = await axios.delete(
      `${API_URL}/api/ratings/${contentType}/${contentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  },

  // Get all user's ratings
  getAllRatings: async () => {
    const token = getToken()
    const response = await axios.get(`${API_URL}/api/ratings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  }
}