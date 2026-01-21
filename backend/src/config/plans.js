//backend/src/config/plans.js
/**
 * Subscription Plans Configuration
 */

const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'KES',
    billing_period: null,
    features: {
      // Content Access
      watch_content: true,
      hd_quality: false,
      
      // Social Features
      create_reviews: true,
      create_lists: 5,
      max_watchlists: 3,
      
      // AI Features
      ai_recommendations_per_day: 1,
      ai_chat: false,
      
      // Watch Parties
      create_watch_parties: 2,
      max_party_participants: 5,
      
      // Other
      ads: true,
      download_lists: false,
      custom_themes: false,
      priority_support: false
    },
    limits: {
      lists: 5,
      watchlists: 3,
      ai_recommendations_daily: 1,
      watch_parties_daily: 2,
      party_participants: 5
    }
  },

  BASIC: {
    id: 'basic',
    name: 'Basic',
    price: 499,
    currency: 'KES',
    billing_period: 'monthly',
    features: {
      // Content Access
      watch_content: true,
      hd_quality: true,
      
      // Social Features
      create_reviews: true,
      create_lists: 20,
      max_watchlists: 10,
      
      // AI Features
      ai_recommendations_per_day: 5,
      ai_chat: false,
      
      // Watch Parties
      create_watch_parties: 10,
      max_party_participants: 10,
      
      // Other
      ads: false,
      download_lists: true,
      custom_themes: false,
      priority_support: false
    },
    limits: {
      lists: 20,
      watchlists: 10,
      ai_recommendations_daily: 5,
      watch_parties_daily: 10,
      party_participants: 10
    }
  },

  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 999,
    currency: 'KES',
    billing_period: 'monthly',
    features: {
      // Content Access
      watch_content: true,
      hd_quality: true,
      
      // Social Features
      create_reviews: true,
      create_lists: -1, // Unlimited
      max_watchlists: -1,
      
      // AI Features
      ai_recommendations_per_day: -1,
      ai_chat: true,
      chat_conversations_per_month: 50,
      
      // Watch Parties
      create_watch_parties: -1,
      max_party_participants: 50,
      
      // Other
      ads: false,
      download_lists: true,
      custom_themes: true,
      priority_support: true,
      early_access: true
    },
    limits: {
      lists: -1, // -1 means unlimited
      watchlists: -1,
      ai_recommendations_daily: -1,
      watch_parties_daily: -1,
      party_participants: 50,
      chat_conversations_monthly: 50
    }
  }
};

const PLAN_ORDER = ['free', 'basic', 'premium'];

/**
 * Get plan details
 */
const getPlan = (planId) => {
  const plan = PLANS[planId.toUpperCase()];
  if (!plan) {
    throw new Error('Invalid plan ID');
  }
  return plan;
};

/**
 * Check if user can perform action
 */
const canPerformAction = (userPlan, action) => {
  const plan = getPlan(userPlan);
  return plan.features[action] || false;
};

/**
 * Get usage limit for feature
 */
const getLimit = (userPlan, feature) => {
  const plan = getPlan(userPlan);
  return plan.limits[feature];
};

/**
 * Check if upgrade is valid
 */
const isValidUpgrade = (currentPlan, newPlan) => {
  const currentIndex = PLAN_ORDER.indexOf(currentPlan.toLowerCase());
  const newIndex = PLAN_ORDER.indexOf(newPlan.toLowerCase());
  return newIndex > currentIndex;
};

/**
 * Check if downgrade is valid
 */
const isValidDowngrade = (currentPlan, newPlan) => {
  const currentIndex = PLAN_ORDER.indexOf(currentPlan.toLowerCase());
  const newIndex = PLAN_ORDER.indexOf(newPlan.toLowerCase());
  return newIndex < currentIndex;
};

module.exports = {
  PLANS,
  PLAN_ORDER,
  getPlan,
  canPerformAction,
  getLimit,
  isValidUpgrade,
  isValidDowngrade
};
