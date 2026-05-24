import api from './api.service';

export const aiService = {
  getConversations: () => api.get('/ai/conversations'),
  getConversation: (id: string) => api.get(`/ai/conversations/${id}`),
  sendMessage: (conversationId: string | null, message: string) =>
    api.post('/ai/chat', { conversationId, message }),
  deleteConversation: (id: string) => api.delete(`/ai/conversations/${id}`),
  analyzeContent: (contentType: string, contentId: number) =>
    api.get(`/ai/analyze/${contentType}/${contentId}`),
};
