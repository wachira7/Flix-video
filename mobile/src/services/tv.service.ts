import api from './api.service';

export const tvService = {
  getPopular: (page = 1) => api.get(`/tv/popular?page=${page}`),
  getTrending: (timeWindow: 'day' | 'week' = 'week') => api.get(`/tv/trending/${timeWindow}`),
  getTopRated: (page = 1) => api.get(`/tv/top-rated?page=${page}`),
  getAiringToday: (page = 1) => api.get(`/tv/airing-today?page=${page}`),
  getById: (id: number) => api.get(`/tv/${id}`),
  getSeason: (id: number, seasonNumber: number) => api.get(`/tv/${id}/season/${seasonNumber}`),
  getCredits: (id: number) => api.get(`/tv/${id}/credits`),
  getSimilar: (id: number) => api.get(`/tv/${id}/similar`),
  getVideos: (id: number) => api.get(`/tv/${id}/videos`),
};
