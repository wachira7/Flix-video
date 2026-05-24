import api from './api.service';

export const notificationsService = {
  getAll: (page = 1) => api.get(`/notifications?page=${page}`),
  markAsRead: (id: number) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id: number) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  registerPushToken: (token: string) => api.post('/notifications/push-token', { token }),
};
