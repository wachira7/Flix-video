const axios = require('axios');

const NOWPAYMENTS_API_URL = process.env.NOWPAYMENTS_ENVIRONMENT === 'sandbox'
  ? 'https://api-sandbox.nowpayments.io/v1'
  : 'https://api.nowpayments.io/v1';

/**
 * Get available cryptocurrencies
 */
const getAvailableCurrencies = async () => {
  try {
    const response = await axios.get(`${NOWPAYMENTS_API_URL}/currencies`, {
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY
      }
    });

    // Filter to supported currencies
    const supported = process.env.SUPPORTED_CRYPTOCURRENCIES.split(',');
    const available = response.data.currencies.filter(c => supported.includes(c));

    return {
      success: true,
      currencies: available
    };

  } catch (error) {
    console.error('Get currencies error:', error.response?.data || error.message);
    throw new Error('Failed to get available currencies');
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
    console.error('Estimate price error:', error.response?.data || error.message);
    throw new Error('Failed to estimate price');
  }
};

/**
 * Create payment
 */
const createPayment = async (price_amount, price_currency, pay_currency, order_id, order_description, ipn_callback_url) => {
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
    console.error('Create payment error:', error.response?.data || error.message);
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
    console.error('Get payment status error:', error.response?.data || error.message);
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
  getAvailableCurrencies,
  getEstimatedPrice,
  createPayment,
  getPaymentStatus,
  verifyIPNSignature
};
