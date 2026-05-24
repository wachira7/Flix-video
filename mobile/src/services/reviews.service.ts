import api from './api.service';

export const reviewsService = {
  getForContent: (contentType: string, contentId: number) =>
    api.get(`/reviews/${contentType}/${contentId}`),
  create: (contentType: string, contentId: number, rating: number, comment: string) =>
    api.post('/reviews', { contentType, contentId, rating, comment }),
  update: (reviewId: number, data: { rating?: number; comment?: string }) =>
    api.put(`/reviews/${reviewId}`, data),
  delete: (reviewId: number) => api.delete(`/reviews/${reviewId}`),
  addComment: (reviewId: number, comment: string, parentCommentId?: number) =>
    api.post(`/reviews/${reviewId}/comments`, { comment, parentCommentId }),
  deleteComment: (reviewId: number, commentId: number) =>
    api.delete(`/reviews/${reviewId}/comments/${commentId}`),
};
