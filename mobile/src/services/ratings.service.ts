import api from './api.service';

export const ratingsService = {
  rate: (contentType: string, contentId: number, rating: number) =>
    api.post('/ratings', { contentType, contentId, rating }),
  getUserRating: (contentType: string, contentId: number) =>
    api.get(`/ratings/${contentType}/${contentId}`),
  deleteRating: (contentType: string, contentId: number) =>
    api.delete(`/ratings/${contentType}/${contentId}`),
};
