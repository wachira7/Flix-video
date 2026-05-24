import api from './api.service';

export const paymentsService = {
  getHistory: (page = 1) => api.get(`/payments?page=${page}`),
  getInvoice: (invoiceId: number) => api.get(`/payments/invoices/${invoiceId}`),
  createStripeIntent: (planId: number) =>
    api.post('/payments/stripe/intent', { planId }),
  initiateMpesa: (planId: number, phoneNumber: string) =>
    api.post('/payments/mpesa/initiate', { planId, phoneNumber }),
  initiateCrypto: (planId: number, currency: string) =>
    api.post('/payments/crypto/initiate', { planId, currency }),
  applyCoupon: (code: string) => api.post('/payments/coupon/apply', { code }),
};
