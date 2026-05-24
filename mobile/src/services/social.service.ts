import api from './api.service';

export const socialService = {
  follow: (userId: number) => api.post(`/social/follow/${userId}`),
  unfollow: (userId: number) => api.delete(`/social/follow/${userId}`),
  getFollowers: (userId: number) => api.get(`/social/followers/${userId}`),
  getFollowing: (userId: number) => api.get(`/social/following/${userId}`),
  getUserLists: (userId: number) => api.get(`/social/lists/${userId}`),
  createList: (data: { name: string; description?: string; isPublic?: boolean }) =>
    api.post('/social/lists', data),
  updateList: (listId: number, data: { name?: string; description?: string; isPublic?: boolean }) =>
    api.put(`/social/lists/${listId}`, data),
  deleteList: (listId: number) => api.delete(`/social/lists/${listId}`),
  addToList: (listId: number, contentType: string, contentId: number) =>
    api.post(`/social/lists/${listId}/items`, { contentType, contentId }),
  removeFromList: (listId: number, itemId: number) =>
    api.delete(`/social/lists/${listId}/items/${itemId}`),
};
