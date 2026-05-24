import api from './api.service';

export const watchlistService = {
  getAll: () => api.get('/watchlist'),
  add: (contentId: number) => api.post('/watchlist', { contentId }),
  remove: (contentId: number) => api.delete(`/watchlist/${contentId}`),
  check: (contentId: number) => api.get(`/watchlist/check/${contentId}`),
};
