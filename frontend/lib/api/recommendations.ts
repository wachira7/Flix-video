// frontend/lib/api/recommendations.ts

import { apiClient } from './client';

export interface Recommendation {
  tmdb_id: number;
  content_type: 'movie' | 'tv';
  title: string;
  reason: string;
  confidence: number;
  tags: string[];
}

export interface AIRecommendationsResponse {
  success: boolean;
  cached: boolean;
  message?: string;
  recommendations: Recommendation[];
  summary: string;
  generated_at: string;
  stats?: {
    tokens_used: number;
    cost_estimate: string;
    cache_duration: string;
  };
}

export interface AIStatusResponse {
  success: boolean;
  ai_providers: {
    openai: { configured: boolean; name: string };
    claude: { configured: boolean; name: string };
    active_provider: string;
    primary_provider: string;
    available_count: number;
  };
  message: string;
}

export const recommendationsAPI = {
  /**
   * Get AI provider status
   */
  async getStatus(): Promise<AIStatusResponse> {
    const response = await apiClient.get('/api/recommendations/status');
    return response.data;
  },

  /**
   * Generate new AI recommendations
   */
  async generate(): Promise<AIRecommendationsResponse> {
    const response = await apiClient.post('/api/recommendations/generate');
    return response.data;
  },

  /**
   * Get cached recommendations
   */
  async getMy(): Promise<AIRecommendationsResponse> {
    const response = await apiClient.get('/api/recommendations/me');
    return response.data;
  },

  /**
   * Clear recommendations cache
   */
  async clearCache() {
    const response = await apiClient.delete('/api/recommendations/me');
    return response.data;
  }
};