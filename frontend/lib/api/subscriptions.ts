// frontend/lib/api/subscriptions.ts

import { apiClient } from './client';

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_period: string | null;
  features: {
    watch_content: boolean;
    hd_quality: boolean;
    create_reviews: boolean;
    create_lists: number | -1;
    max_watchlists: number | -1;
    ai_recommendations_per_day: number | -1;
    ai_chat: boolean;
    create_watch_parties: number | -1;
    max_party_participants: number;
    ads: boolean;
    download_lists: boolean;
    custom_themes: boolean;
    priority_support: boolean;
  };
  popular?: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan_type: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  auto_renew: boolean;
  plan_details?: Plan;
}

export const subscriptionAPI = {
  /**
   * Get all available plans
   */
  async getPlans() {
    const response = await apiClient.get('/api/subscriptions/plans');
    return response.data;
  },

  /**
   * Get current user's subscription
   */
  async getMySubscription() {
    const response = await apiClient.get('/api/subscriptions/my-subscription');
    return response.data;
  },

  /**
   * Upgrade subscription
   */
  async upgradeSubscription(planType: string, paymentMethod: 'stripe' | 'mpesa' | 'crypto') {
    const response = await apiClient.post('/api/subscriptions/upgrade', {
      plan_type: planType,
      payment_method: paymentMethod
    });
    return response.data;
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(reason?: string) {
    const response = await apiClient.post('/api/subscriptions/cancel', { reason });
    return response.data;
  },

  /**
   * Get usage statistics
   */
  async getUsageStats() {
    const response = await apiClient.get('/api/subscriptions/usage');
    return response.data;
  },

  /**
   * Activate subscription after payment
   */
  async activateSubscription(subscriptionId: string, paymentId: string) {
    const response = await apiClient.post('/api/subscriptions/activate', {
      subscription_id: subscriptionId,
      payment_id: paymentId
    });
    return response.data;
  },

  /**
   * Check if user can perform action
   */
  async canPerformAction(action: string) {
    const response = await apiClient.get(`/api/subscriptions/can/${action}`);
    return response.data;
  }
};