// lib/api/search.ts
import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export const searchAPI = {
  searchMulti: async (query: string, page = 1) => {
    const response = await axios.get(`${API_URL}/api/search/multi`, {
      params: { query, page }
    })
    return response.data
  },

  searchMovies: async (query: string, page = 1, filters?: { year?: number; language?: string }) => {
    const response = await axios.get(`${API_URL}/api/search/movies`, {
      params: { query, page, ...filters }
    })
    return response.data
  },

  searchTV: async (query: string, page = 1, filters?: { first_air_date_year?: number; language?: string }) => {
    const response = await axios.get(`${API_URL}/api/search/tv`, {
      params: { query, page, ...filters }
    })
    return response.data
  },

  searchPeople: async (query: string, page = 1) => {
    const response = await axios.get(`${API_URL}/api/search/people`, {
      params: { query, page }
    })
    return response.data
  }
}