// lib/api/streaming.ts

import { apiClient } from './client'

export interface StreamingOption {
  id: string
  platform: string
  platformSlug: string
  logo?: string
  websiteUrl?: string
  type: 'stream' | 'rent' | 'buy' | 'free'
  price?: number
  currency?: string
  quality?: string
  url?: string
  availableFrom?: string
  availableUntil?: string
  lastChecked?: string
}

export interface StreamingAvailabilityResponse {
  success: boolean
  country: string
  contentType: 'movie' | 'tv'
  contentId: string
  totalOptions: number
  options: {
    stream: StreamingOption[]
    rent: StreamingOption[]
    buy: StreamingOption[]
    free: StreamingOption[]
  }
}

export const streamingAPI = {
  /**
   * Get streaming availability for a movie
   */
  async getMovieAvailability(
    movieId: number,
    country: string = 'KE'
  ): Promise<StreamingAvailabilityResponse> {
    const response = await apiClient.get(`/api/streaming/movie/${movieId}`, {
      params: { country }
    })
    return response.data
  },

  /**
   * Get streaming availability for a TV show
   */
  async getTVAvailability(
    tvShowId: number,
    country: string = 'KE'
  ): Promise<StreamingAvailabilityResponse> {
    const response = await apiClient.get(`/api/streaming/tv/${tvShowId}`, {
      params: { country }
    })
    return response.data
  },

  /**
   * Get all streaming platforms
   */
  async getPlatforms(activeOnly: boolean = true) {
    const response = await apiClient.get('/api/streaming/platforms', {
      params: { active_only: activeOnly }
    })
    return response.data
  }
}