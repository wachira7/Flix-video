import api from './api.service';

export const subscriptionsService = {
  getPlans: () => api.get('/subscriptions/plans'),
  getCurrent: () => api.get('/subscriptions/current'),
  getHistory: () => api.get('/subscriptions/history'),
  cancel: () => api.post('/subscriptions/cancel'),
  resume: () => api.post('/subscriptions/resume'),
  changePlan: (planId: number) => api.post('/subscriptions/change', { planId }),
};
