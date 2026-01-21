//backend/src/integrations/mpesa/index.js
const axios = require('axios');

/**
 * Get M-Pesa Access Token
 */
const getAccessToken = async () => {
  try {
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    );

    return response.data.access_token;

  } catch (error) {
    console.error('M-Pesa auth error:', error.response?.data || error.message);
    throw new Error('Failed to get M-Pesa access token');
  }
};

/**
 * Generate Timestamp (YYYYMMDDHHmmss)
 */
const generateTimestamp = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hour}${minute}${second}`;
};

/**
 * Generate Password
 */
const generatePassword = (timestamp) => {
  const str = `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(str).toString('base64');
};

/**
 * Initiate STK Push
 */
const initiateSTKPush = async (phoneNumber, amount, accountReference, transactionDesc) => {
  try {
    const accessToken = await getAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);

    // Format phone number (remove + and spaces)
    const formattedPhone = phoneNumber.replace(/[\s+]/g, '');
    
    // Ensure phone starts with 254
    const phone = formattedPhone.startsWith('254') 
      ? formattedPhone 
      : `254${formattedPhone.replace(/^0/, '')}`;

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: accountReference || 'FlixVideo',
      TransactionDesc: transactionDesc || 'Payment for FlixVideo subscription'
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      checkout_request_id: response.data.CheckoutRequestID,
      merchant_request_id: response.data.MerchantRequestID,
      response_code: response.data.ResponseCode,
      response_description: response.data.ResponseDescription,
      customer_message: response.data.CustomerMessage
    };

  } catch (error) {
    console.error('M-Pesa STK Push error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || 'Failed to initiate M-Pesa payment');
  }
};

/**
 * Query STK Push Status
 */
const querySTKPushStatus = async (checkoutRequestId) => {
  try {
    const accessToken = await getAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      result_code: response.data.ResultCode,
      result_desc: response.data.ResultDesc,
      status: response.data.ResultCode === '0' ? 'completed' : 'failed'
    };

  } catch (error) {
    console.error('M-Pesa query error:', error.response?.data || error.message);
    throw new Error('Failed to query M-Pesa status');
  }
};

module.exports = {
  initiateSTKPush,
  querySTKPushStatus,
  getAccessToken
};
