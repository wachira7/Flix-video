import api from './api.service';

export const watchPartyService = {
  getAll: () => api.get('/watch-party'),
  getById: (id: string) => api.get(`/watch-party/${id}`),
  create: (data: { title: string; contentType: string; contentId: number }) =>
    api.post('/watch-party', data),
  join: (id: string) => api.post(`/watch-party/${id}/join`),
  leave: (id: string) => api.post(`/watch-party/${id}/leave`),
  end: (id: string) => api.post(`/watch-party/${id}/end`),
  getMessages: (id: string) => api.get(`/watch-party/${id}/messages`),
};
