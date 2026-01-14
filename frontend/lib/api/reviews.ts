// lib/api/reviews.ts
import axios from "axios"
import { getToken } from "@/lib/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export const reviewsAPI = {
  // Get reviews for content
  getReviews: async (contentType: "movie" | "tv", contentId: number) => {
    const response = await axios.get(
      `${API_URL}/api/reviews/${contentType}/${contentId}`
    )
    return response.data
  },

  // Create review
  createReview: async (
    contentType: "movie" | "tv",
    contentId: number,
    data: {
      title?: string
      content: string
      contains_spoilers?: boolean
    }
  ) => {
    const token = getToken()
    const response = await axios.post(
      `${API_URL}/api/reviews/${contentType}/${contentId}`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  },

  // Update review
  updateReview: async (
    reviewId: string,
    data: {
      title?: string
      content: string
      contains_spoilers?: boolean
    }
  ) => {
    const token = getToken()
    const response = await axios.put(
      `${API_URL}/api/reviews/${reviewId}`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  },

  // Delete review
  deleteReview: async (reviewId: string) => {
    const token = getToken()
    const response = await axios.delete(
      `${API_URL}/api/reviews/${reviewId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  },

  // Like/Unlike review
  toggleLike: async (reviewId: string) => {
    const token = getToken()
    const response = await axios.post(
      `${API_URL}/api/reviews/${reviewId}/like`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  },

  // Get user's reviews
  getUserReviews: async () => {
    const token = getToken()
    const response = await axios.get(`${API_URL}/api/reviews/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  }
}