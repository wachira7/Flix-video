// lib/api/review-comments.ts 

import axios from "axios"
import { getToken } from "@/lib/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export const reviewCommentsAPI = {
  // Get comments for a review
  getComments: async (reviewId: string) => {
    const response = await axios.get(
      `${API_URL}/api/reviews/${reviewId}/comments`
    )
    return response.data
  },

  // Create comment on review
  createComment: async (
    reviewId: string,
    data: {
      content: string
      parent_comment_id?: string | null
    }
  ) => {
    const token = getToken()
    const response = await axios.post(
      `${API_URL}/api/reviews/${reviewId}/comments`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  },

  // Update comment
  updateComment: async (
    commentId: string,
    data: {
      content: string
    }
  ) => {
    const token = getToken()
    const response = await axios.put(
      `${API_URL}/api/reviews/comments/${commentId}`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  },

  // Delete comment
  deleteComment: async (commentId: string) => {
    const token = getToken()
    const response = await axios.delete(
      `${API_URL}/api/reviews/comments/${commentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  }
}