import api from './api.service';

export const streamingService = {
  getProviders: (contentType: string, contentId: number) =>
    api.get(`/streaming/${contentType}/${contentId}/providers`),
  getWatchHistory: () => api.get('/streaming/watch-history'),
  updateProgress: (contentType: string, contentId: number, progress: number, duration: number) =>
    api.post('/streaming/progress', { contentType, contentId, progress, duration }),
  getResumePosition: (contentType: string, contentId: number) =>
    api.get(`/streaming/progress/${contentType}/${contentId}`),
};
