//backend/src/integrations/crypto/nowpayments/index.js
const axios = require('axios');
const logger = require('../../../utils/logger');
const paymentConfig = require('../../../config/payment');

const NOWPAYMENTS_API_URL = process.env.NOWPAYMENTS_ENVIRONMENT === 'sandbox'
  ? 'https://api-sandbox.nowpayments.io/v1'
  : 'https://api.nowpayments.io/v1';

/**
 * Crypto checkout needs a NOWPayments key. Without one, every call fails,
 * so callers check this first and tell the user crypto is unavailable.
 */
const isConfigured = () => Boolean(process.env.NOWPAYMENTS_API_KEY);

class CryptoNotConfiguredError extends Error {
  constructor() {
    super('Crypto payments are not configured');
    this.code = 'CRYPTO_NOT_CONFIGURED';
  }
}

/**
 * Get available cryptocurrencies: the ones we support (config/payment.js,
 * overridable with SUPPORTED_CRYPTOCURRENCIES) that NOWPayments offers.
 */
const getAvailableCurrencies = async () => {
  if (!isConfigured()) throw new CryptoNotConfiguredError();

  const supported = paymentConfig.crypto.supported_currencies.map((c) => c.trim().toLowerCase()).filter(Boolean);

  try {
    const response = await axios.get(`${NOWPAYMENTS_API_URL}/currencies`, {
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY
      },
      timeout: 10000
    });

    const offered = new Set((response.data.currencies || []).map((c) => String(c).toLowerCase()));
    const available = supported.filter((c) => offered.has(c));

    return {
      success: true,
      currencies: available.length > 0 ? available : supported
    };

  } catch (error) {
    // The list only fills the picker; creating the payment validates the coin
    logger.error('Get currencies error, using the supported list:', error.response?.data || error.message);
    return {
      success: true,
      currencies: supported
    };
  }
};

/**
 * Get estimated price
 */
const getEstimatedPrice = async (amount, currency_from, currency_to) => {
  try {
    const response = await axios.get(`${NOWPAYMENTS_API_URL}/estimate`, {
      params: {
        amount,
        currency_from,
        currency_to
      },
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY
      }
    });

    return {
      success: true,
      estimated_amount: response.data.estimated_amount,
      currency_from: response.data.currency_from,
      currency_to: response.data.currency_to
    };

  } catch (error) {
    logger.error('Estimate price error:', error.response?.data || error.message);
    throw new Error('Failed to estimate price');
  }
};

/**
 * Create payment
 */
const createPayment = async (price_amount, price_currency, pay_currency, order_id, order_description, ipn_callback_url) => {
  if (!isConfigured()) throw new CryptoNotConfiguredError();
  try {
    const payload = {
      price_amount,
      price_currency,
      pay_currency,
      order_id,
      order_description: order_description || 'FlixVideo Payment',
      ipn_callback_url: ipn_callback_url || process.env.NOWPAYMENTS_CALLBACK_URL,
      is_fee_paid_by_user: false
    };

    const response = await axios.post(
      `${NOWPAYMENTS_API_URL}/payment`,
      payload,
      {
        headers: {
          'x-api-key': process.env.NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      payment_id: response.data.payment_id,
      payment_status: response.data.payment_status,
      pay_address: response.data.pay_address,
      price_amount: response.data.price_amount,
      price_currency: response.data.price_currency,
      pay_amount: response.data.pay_amount,
      pay_currency: response.data.pay_currency,
      order_id: response.data.order_id,
      payment_url: response.data.payment_url || null,
      expiration_estimate_date: response.data.expiration_estimate_date
    };

  } catch (error) {
    logger.error('Create payment error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create crypto payment');
  }
};

/**
 * Get payment status
 */
const getPaymentStatus = async (payment_id) => {
  try {
    const response = await axios.get(
      `${NOWPAYMENTS_API_URL}/payment/${payment_id}`,
      {
        headers: {
          'x-api-key': process.env.NOWPAYMENTS_API_KEY
        }
      }
    );

    return {
      success: true,
      payment: response.data
    };

  } catch (error) {
    logger.error('Get payment status error:', error.response?.data || error.message);
    throw new Error('Failed to get payment status');
  }
};

/**
 * Verify IPN (Webhook) Signature
 */
const verifyIPNSignature = (request_signature, payload) => {
  const crypto = require('crypto');
  
  const hmac = crypto.createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET);
  hmac.update(JSON.stringify(payload));
  const calculated_signature = hmac.digest('hex');

  return request_signature === calculated_signature;
};

module.exports = {
  isConfigured,
  CryptoNotConfiguredError,
  getAvailableCurrencies,
  getEstimatedPrice,
  createPayment,
  getPaymentStatus,
  verifyIPNSignature
};
