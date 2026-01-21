// frontend/lib/api/payments.ts

import { apiClient } from './client';

export interface StripeCheckoutResponse {
  success: boolean;
  payment_id: string;
  session_id: string;
  checkout_url: string;
}

export interface MpesaPaymentResponse {
  success: boolean;
  payment_id: string;
  checkout_request_id: string;
  message: string;
}

export interface CryptoPaymentResponse {
  success: boolean;
  payment_id: string;
  crypto_payment_id: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  payment_url: string | null;
  expiration: string;
}

export interface PaymentStatus {
  success: boolean;
  payment: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    payment_method: string;
    created_at: string;
    paid_at?: string;
  };
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'mpesa' | 'crypto';
  last4?: string;
  brand?: string;
  phone?: string;
  wallet_address?: string;
  is_default: boolean;
  created_at: string;
}

export const paymentsAPI = {
  // =========================================================================
  // STRIPE
  // =========================================================================

  /**
   * Create Stripe checkout session
   */
  async createStripeCheckout(
    amount: number,
    planType: string,
    description?: string
  ): Promise<StripeCheckoutResponse> {
    const response = await apiClient.post('/api/payments/stripe/create-checkout', {
      amount,
      currency: 'KES',
      plan_type: planType,
      description
    });
    return response.data;
  },

  /**
   * Get Stripe payment status
   */
  async getStripeStatus(sessionId: string): Promise<PaymentStatus> {
    const response = await apiClient.get(`/api/payments/stripe/status/${sessionId}`);
    return response.data;
  },

  // =========================================================================
  // M-PESA
  // =========================================================================

  /**
   * Initiate M-Pesa STK Push
   */
  async initiateMpesaPayment(
    phoneNumber: string,
    amount: number,
    planType: string,
    description?: string
  ): Promise<MpesaPaymentResponse> {
    const response = await apiClient.post('/api/payments/mpesa/stk-push', {
      phone_number: phoneNumber,
      amount,
      plan_type: planType,
      description
    });
    return response.data;
  },

  /**
   * Get M-Pesa payment status
   */
  async getMpesaStatus(checkoutId: string): Promise<PaymentStatus> {
    const response = await apiClient.get(`/api/payments/mpesa/status/${checkoutId}`);
    return response.data;
  },

  // =========================================================================
  // CRYPTO
  // =========================================================================

  /**
   * Get available cryptocurrencies
   */
  async getCryptoCurrencies() {
    const response = await apiClient.get('/api/payments/crypto/currencies');
    return response.data;
  },

  /**
   * Create crypto payment
   */
  async createCryptoPayment(
    amount: number,
    cryptoCurrency: string,
    planType: string,
    description?: string
  ): Promise<CryptoPaymentResponse> {
    const response = await apiClient.post('/api/payments/crypto/create', {
      amount,
      currency: 'KES',
      crypto_currency: cryptoCurrency,
      plan_type: planType,
      description
    });
    return response.data;
  },

  /**
   * Get crypto payment status
   */
  async getCryptoStatus(paymentId: string): Promise<PaymentStatus> {
    const response = await apiClient.get(`/api/payments/crypto/status/${paymentId}`);
    return response.data;
  },

  // =========================================================================
  // PAYMENT METHODS
  // =========================================================================

  /**
   * Get user's saved payment methods
   */
  async getPaymentMethods() {
    const response = await apiClient.get('/api/payments/methods');
    return response.data;
  },

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(methodId: string) {
    const response = await apiClient.put(`/api/payments/methods/${methodId}/default`);
    return response.data;
  },

  /**
   * Delete payment method
   */
  async deletePaymentMethod(methodId: string) {
    const response = await apiClient.delete(`/api/payments/methods/${methodId}`);
    return response.data;
  },
  
  // =========================================================================
  // PAYMENT HISTORY
  // =========================================================================

  /**
   * Get payment history
   */
  async getPaymentHistory(limit = 20, offset = 0) {
  const response = await apiClient.get('/api/payments/history', { 
    params: { limit, offset } 
  });
  return response.data;
  }

};