import api from './api.service';

export const searchService = {
  search: (query: string, page = 1) => api.get(`/search?q=${encodeURIComponent(query)}&page=${page}`),
  searchMovies: (query: string, page = 1) => api.get(`/search/movies?q=${encodeURIComponent(query)}&page=${page}`),
  searchTV: (query: string, page = 1) => api.get(`/search/tv?q=${encodeURIComponent(query)}&page=${page}`),
  searchPeople: (query: string, page = 1) => api.get(`/search/people?q=${encodeURIComponent(query)}&page=${page}`),
  getGenres: () => api.get('/movies/genres'),
};
