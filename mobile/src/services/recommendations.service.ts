import api from './api.service';

export const recommendationsService = {
  getForUser: () => api.get('/recommendations'),
  getForContent: (contentType: string, contentId: number) =>
    api.get(`/recommendations/${contentType}/${contentId}`),
  refreshRecommendations: () => api.post('/recommendations/refresh'),
};
