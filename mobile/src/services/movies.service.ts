import api from './api.service';

export const moviesService = {
  getPopular: (page = 1) => api.get(`/movies/popular?page=${page}`),
  getTrending: (timeWindow: 'day' | 'week' = 'week') => api.get(`/movies/trending/${timeWindow}`),
  getTopRated: (page = 1) => api.get(`/movies/top-rated?page=${page}`),
  getNowPlaying: (page = 1) => api.get(`/movies/now-playing?page=${page}`),
  getUpcoming: (page = 1) => api.get(`/movies/upcoming?page=${page}`),
  getById: (id: number) => api.get(`/movies/${id}`),
  getCredits: (id: number) => api.get(`/movies/${id}/credits`),
  getSimilar: (id: number) => api.get(`/movies/${id}/similar`),
  getVideos: (id: number) => api.get(`/movies/${id}/videos`),
  getByGenre: (genreId: number, page = 1) => api.get(`/movies?genre=${genreId}&page=${page}`),
};
