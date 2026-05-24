import api from './api.service';

export const favoritesService = {
  getAll: () => api.get('/favorites'),
  add: (contentType: string, contentId: number) =>
    api.post('/favorites', { contentType, contentId }),
  remove: (contentType: string, contentId: number) =>
    api.delete(`/favorites/${contentType}/${contentId}`),
  check: (contentType: string, contentId: number) =>
    api.get(`/favorites/check/${contentType}/${contentId}`),
};
