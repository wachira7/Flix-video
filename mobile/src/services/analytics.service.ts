import api from './api.service';

export const analyticsService = {
  getUserStats: () => api.get('/analytics/user'),
  getWatchTime: (period: 'week' | 'month' | 'year' = 'month') =>
    api.get(`/analytics/watch-time?period=${period}`),
  getTopGenres: () => api.get('/analytics/top-genres'),
  trackEvent: (event: string, data?: Record<string, unknown>) =>
    api.post('/analytics/event', { event, data }),
};
