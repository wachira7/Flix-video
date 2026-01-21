// backend/src/config/payment.js

module.exports = {
  // Stripe Configuration
  stripe: {
    public_key: process.env.STRIPE_PUBLIC_KEY,
    secret_key: process.env.STRIPE_SECRET_KEY,
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
    currency: 'kes',
    success_url: process.env.PAYMENT_SUCCESS_URL || 'http://localhost:3000/subscription/success',
    cancel_url: process.env.PAYMENT_CANCEL_URL || 'http://localhost:3000/subscription/checkout'
  },

  // M-Pesa Configuration
  mpesa: {
    environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
    consumer_key: process.env.MPESA_CONSUMER_KEY,
    consumer_secret: process.env.MPESA_CONSUMER_SECRET,
    shortcode: process.env.MPESA_SHORTCODE,
    passkey: process.env.MPESA_PASSKEY,
    callback_url: process.env.MPESA_CALLBACK_URL || 'http://localhost:5000/api/payments/mpesa/callback'
  },

  // NOWPayments (Crypto) Configuration
  crypto: {
    environment: process.env.NOWPAYMENTS_ENVIRONMENT || 'sandbox',
    api_key: process.env.NOWPAYMENTS_API_KEY,
    ipn_secret: process.env.NOWPAYMENTS_IPN_SECRET,
    callback_url: process.env.NOWPAYMENTS_CALLBACK_URL || 'http://localhost:5000/api/payments/crypto/webhook',
    supported_currencies: process.env.SUPPORTED_CRYPTOCURRENCIES?.split(',') || ['btc', 'eth', 'usdt', 'usdttrc20']
  },

  // General Payment Settings
  general: {
    default_currency: 'KES',
    min_amount: 1,
    max_amount: 1000000,
    payment_timeout: 3600, // 1 hour in seconds
    retry_attempts: 3
  },

  // Plan Prices (synced with plans.js)
  prices: {
    free: 0,
    basic: 499,
    premium: 999
  }
};