// backend/src/api/controllers/payment.controller.js
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');
const stripeService = require('../../integrations/stripe');
const mpesaService = require('../../integrations/mpesa');
const cryptoService = require('../../integrations/crypto/nowpayments');
const { paymentsTotal, failedPayments, revenueTotal } = require('../../config/metrics');
const logger = require('../../utils/logger');
const { notificationQueue } = require('../../jobs/queues');



// =============================================================================
// STRIPE ENDPOINTS
// =============================================================================

// @desc    Create Stripe Checkout Session
// @route   POST /api/payments/stripe/create-checkout
// @access  Private
const createStripeCheckout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, currency = 'KES', plan_type, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid amount'
      });
    }

    // Create payment record
    const paymentResult = await global.pgPool.query(
      `INSERT INTO payments (user_id, amount, currency, payment_method, status, plan_type, description)
       VALUES ($1, $2, $3, 'stripe', 'pending', $4, $5)
       RETURNING id`,
      [userId, amount, currency, plan_type, description]
    );

    const paymentId = paymentResult.rows[0].id;

    // Create Stripe checkout session
    const session = await stripeService.createCheckoutSession(
      userId,
      amount,
      currency,
      {
        payment_id: paymentId,
        plan_type,
        plan_name: plan_type ? `FlixVideo ${plan_type} Plan` : 'FlixVideo Payment',
        description
      }
    );

    // Update payment with session ID
    await global.pgPool.query(
      'UPDATE payments SET stripe_session_id = $1 WHERE id = $2',
      [session.session_id, paymentId]
    );

    // Update payment status
    await global.pgPool.query(
      `UPDATE payments 
       SET status = 'pending', 
           stripe_session_id = $1
       WHERE id = $2`,
      [session.session_id, paymentId]
    );

    // Update user's plan type
    if (plan_type) {
      await global.pgPool.query(
        'UPDATE users SET plan_type = $1 WHERE id = $2',
        [plan_type, userId]
      );
    }

    paymentsTotal.inc({ status: 'succeeded', provider: 'stripe' });
    revenueTotal.inc({ provider: 'stripe' }, session.amount_total / 100);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      payment_id: paymentId,
      session_id: session.session_id,
      checkout_url: session.checkout_url
    });

  } catch (error) {
    console.error('Create Stripe checkout error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Stripe Webhook Handler
// @route   POST /api/payments/stripe/webhook
// @access  Public (Stripe calls this)
const stripeWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    // Verify webhook signature
    const verification = stripeService.verifyWebhookSignature(payload, signature);

    if (!verification.success) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    const event = verification.event;

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const paymentId = session.metadata.payment_id;

      // Update payment status
      await global.pgPool.query(
        `UPDATE payments 
         SET status = 'succeeded', 
             stripe_payment_intent_id = $1,
             paid_at = NOW()
         WHERE id = $2`,
        [session.payment_intent, paymentId]
      );

      logger.info(`✅ Stripe payment ${paymentId} completed!`);
    }

    // Get user email for notification
    const userResult = await global.pgPool.query(
      `SELECT u.email, up.username, p.amount, p.currency, p.plan_type
      FROM payments p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE p.id = $1`,
      [paymentId]
    );
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      await notificationQueue.add('payment_success', {
        type: 'payment_success',
        userId: session.client_reference_id,
        data: {
          email: user.email,
          username: user.username,
          amount: user.amount,
          currency: user.currency,
          plan: user.plan_type,
          payment_method: 'Stripe',
          transaction_id: paymentId
        }
      });
    }

    paymentsTotal.inc({ status: 'succeeded', provider: 'stripe' });
    revenueTotal.inc({ provider: 'stripe' }, session.amount_total / 100);

    // Handle payment_intent.payment_failed
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      
      await global.pgPool.query(
        `UPDATE payments 
         SET status = 'failed',
             failed_at = NOW(),
             error_code = $1,
             error_message = $2
         WHERE stripe_payment_intent_id = $3`,
        [
          paymentIntent.last_payment_error?.code,
          paymentIntent.last_payment_error?.message,
          paymentIntent.id
        ]
      );

      logger.warn(`❌ Stripe payment failed: ${paymentIntent.id}`);
    }

    const failedUser = await global.pgPool.query(
      `SELECT u.email, up.username, p.amount, p.currency, p.plan_type
      FROM payments p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE p.stripe_payment_intent_id = $1`,
      [paymentIntent.id]
    );
    if (failedUser.rows.length > 0) {
      const user = failedUser.rows[0];
      await notificationQueue.add('payment_failed', {
        type: 'payment_failed',
        userId: user.id,
        data: {
          email: user.email,
          username: user.username,
          amount: user.amount,
          currency: user.currency,
          plan: user.plan_type,
          reason: paymentIntent.last_payment_error?.message || 'Payment declined'
        }
      });
    }

    // Increment failed payments metric
    failedPayments.inc({ provider: 'stripe' });
    paymentsTotal.inc({ status: 'failed', provider: 'stripe' });

    res.json({ received: true });

  } catch (error) {
    logger.error('Stripe webhook error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
};

// @desc    Get Stripe Payment Status
// @route   GET /api/payments/stripe/status/:sessionId
// @access  Private
const getStripeStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripeService.getCheckoutSession(sessionId);

    // Get payment from database
    const result = await global.pgPool.query(
      'SELECT * FROM payments WHERE stripe_session_id = $1',
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      payment: result.rows[0],
      stripe_session: session.session
    });

  } catch (error) {
    logger.error('Get Stripe status error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// =============================================================================
// M-PESA ENDPOINTS
// =============================================================================

// @desc    Initiate M-Pesa STK Push
// @route   POST /api/payments/mpesa/stk-push
// @access  Private
const initiateMpesaPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone_number, amount, plan_type, description } = req.body;

    if (!phone_number || !amount || amount <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Phone number and valid amount required'
      });
    }

    // Create payment record
    const paymentResult = await global.pgPool.query(
      `INSERT INTO payments (user_id, amount, currency, payment_method, status, plan_type, description)
       VALUES ($1, $2, 'KES', 'mpesa', 'pending', $3, $4)
       RETURNING id`,
      [userId, amount, plan_type, description]
    );

    const paymentId = paymentResult.rows[0].id;

    // Initiate STK Push
    const stkPush = await mpesaService.initiateSTKPush(
      phone_number,
      amount,
      `FlixVideo-${paymentId}`,
      description || 'Payment for FlixVideo subscription'
    );

    // Create M-Pesa payment record
    await global.pgPool.query(
      `INSERT INTO mpesa_payments (
        payment_id, checkout_request_id, merchant_request_id, 
        phone_number, amount, account_reference, transaction_desc
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        paymentId,
        stkPush.checkout_request_id,
        stkPush.merchant_request_id,
        phone_number,
        amount,
        `FlixVideo-${paymentId}`,
        description
      ]
    );

    // Update payment with M-Pesa IDs
    await global.pgPool.query(
      `UPDATE payments 
       SET mpesa_checkout_request_id = $1, mpesa_merchant_request_id = $2
       WHERE id = $3`,
      [stkPush.checkout_request_id, stkPush.merchant_request_id, paymentId]
    );

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      payment_id: paymentId,
      checkout_request_id: stkPush.checkout_request_id,
      message: stkPush.customer_message
    });

  } catch (error) {
    logger.error('M-Pesa STK Push error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message || ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    M-Pesa Callback Handler
// @route   POST /api/payments/mpesa/callback
// @access  Public (M-Pesa calls this)
const mpesaCallback = async (req, res) => {
  try {
    const callbackData = req.body;
    logger.info('📱 M-Pesa Callback:', JSON.stringify(callbackData, null, 2));

    const resultCode = callbackData.Body?.stkCallback?.ResultCode;
    const checkoutRequestId = callbackData.Body?.stkCallback?.CheckoutRequestID;
    const resultDesc = callbackData.Body?.stkCallback?.ResultDesc;

    if (resultCode === 0) {
      // Payment successful
      const callbackMetadata = callbackData.Body.stkCallback.CallbackMetadata.Item;
      const mpesaReceiptNumber = callbackMetadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = callbackMetadata.find(item => item.Name === 'TransactionDate')?.Value;

      // Update mpesa_payments
      await global.pgPool.query(
        `UPDATE mpesa_payments 
         SET mpesa_receipt_number = $1,
             transaction_date = TO_TIMESTAMP($2, 'YYYYMMDDHHmmss'),
             result_code = $3,
             result_desc = $4,
             callback_received = true,
             callback_data = $5,
             callback_received_at = NOW()
         WHERE checkout_request_id = $6`,
        [
          mpesaReceiptNumber,
          transactionDate,
          resultCode,
          resultDesc,
          JSON.stringify(callbackData),
          checkoutRequestId
        ]
      );

      // Update main payment
      await global.pgPool.query(
        `UPDATE payments 
         SET status = 'succeeded', paid_at = NOW()
         WHERE mpesa_checkout_request_id = $1`,
        [checkoutRequestId]
      );

      logger.info(`✅ M-Pesa payment ${checkoutRequestId} completed!`);

    const mpesaUser = await global.pgPool.query(
       `SELECT u.email, up.username, p.amount, p.plan_type
        FROM payments p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE p.mpesa_checkout_request_id = $1`,
        [checkoutRequestId]
      );
      if (mpesaUser.rows.length > 0) {
        const user = mpesaUser.rows[0];
        await notificationQueue.add('payment_success', {
          type: 'payment_success',
          userId: user.id,
          data: {
            email: user.email,
            username: user.username,
            amount: user.amount,
            currency: 'KES',
            plan: user.plan_type,
            payment_method: 'M-Pesa',
            transaction_id: mpesaReceiptNumber
          }
        });
      }

      // Increment revenue metric
      paymentsTotal.inc({ status: 'succeeded', provider: 'mpesa' });
      revenueTotal.inc({ provider: 'mpesa' }, payload.amount);

      // Send success response
      res.json({ ResultCode: 0, ResultDesc: 'Success' });


    } else {
      // Payment failed
      await global.pgPool.query(
        `UPDATE mpesa_payments 
         SET result_code = $1,
             result_desc = $2,
             callback_received = true,
             callback_data = $3,
             callback_received_at = NOW()
         WHERE checkout_request_id = $4`,
        [resultCode, resultDesc, JSON.stringify(callbackData), checkoutRequestId]
      );

      await global.pgPool.query(
        `UPDATE payments 
         SET status = 'failed', 
             failed_at = NOW(),
             error_code = $1,
             error_message = $2
         WHERE mpesa_checkout_request_id = $3`,
        [resultCode.toString(), resultDesc, checkoutRequestId]
      );

      logger.warn(`❌ M-Pesa payment ${checkoutRequestId} failed: ${resultDesc}`);
    }

      const mpesaUser = await global.pgPool.query(
       `SELECT u.email, up.username, p.amount, p.plan_type
        FROM payments p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE p.mpesa_checkout_request_id = $1`,
        [checkoutRequestId]
      );
      if (mpesaUser.rows.length > 0) {
        const user = mpesaUser.rows[0];
        await notificationQueue.add('payment_failed', {
          type: 'payment_failed',
          userId: user.id,
          data: {
            email: user.email,
            username: user.username,
            amount: user.amount,
            currency: 'KES',
            plan: user.plan_type,
            payment_method: 'M-Pesa',
            transaction_id: mpesaReceiptNumber
          }
        });
      }

    failedPayments.inc({ provider: 'mpesa' });
    paymentsTotal.inc({ status: 'failed', provider: 'mpesa' });

    res.json({ ResultCode: 0, ResultDesc: 'Success' });

  } catch (error) {
    logger.error('M-Pesa callback error:', error);
    res.json({ ResultCode: 1, ResultDesc: 'Failed' });
  }
};

// @desc    Get M-Pesa Payment Status
// @route   GET /api/payments/mpesa/status/:checkoutId
// @access  Private
const getMpesaStatus = async (req, res) => {
  try {
    const { checkoutId } = req.params;

    // Query status from M-Pesa
    const status = await mpesaService.querySTKPushStatus(checkoutId);

    // Get from database
    const result = await global.pgPool.query(
      `SELECT p.*, mp.* 
       FROM payments p
       JOIN mpesa_payments mp ON p.id = mp.payment_id
       WHERE p.mpesa_checkout_request_id = $1`,
      [checkoutId]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      payment: result.rows[0],
      mpesa_status: status
    });

  } catch (error) {
    logger.error('Get M-Pesa status error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// =============================================================================
// CRYPTO ENDPOINTS
// =============================================================================

// @desc    Create Crypto Payment
// @route   POST /api/payments/crypto/create
// @access  Private
const createCryptoPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, currency = 'KES', crypto_currency, plan_type, description } = req.body;

    if (!amount || !crypto_currency) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Amount and crypto currency required'
      });
    }

    // Create payment record
    const paymentResult = await global.pgPool.query(
      `INSERT INTO payments (user_id, amount, currency, payment_method, status, plan_type, description)
       VALUES ($1, $2, $3, 'crypto', 'pending', $4, $5)
       RETURNING id`,
      [userId, amount, currency, plan_type, description]
    );

    const paymentId = paymentResult.rows[0].id;

    // Create NOWPayments payment
    const payment = await cryptoService.createPayment(
      amount,
      currency,
      crypto_currency,
      paymentId,
      description || 'FlixVideo Payment',
      process.env.NOWPAYMENTS_CALLBACK_URL
    );

    // Create crypto_payments record
    await global.pgPool.query(
      `INSERT INTO crypto_payments (
        payment_id, nowpayments_payment_id, pay_currency, pay_amount,
        price_amount, price_currency, pay_address, payment_status,
        expiration_estimate_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        paymentId,
        payment.payment_id,
        payment.pay_currency,
        payment.pay_amount,
        payment.price_amount,
        payment.price_currency,
        payment.pay_address,
        payment.payment_status,
        payment.expiration_estimate_date
      ]
    );

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      payment_id: paymentId,
      crypto_payment_id: payment.payment_id,
      pay_address: payment.pay_address,
      pay_amount: payment.pay_amount,
      pay_currency: payment.pay_currency,
      payment_url: payment.payment_url,
      expiration: payment.expiration_estimate_date
    });

  } catch (error) {
    logger.error('Create crypto payment error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message || ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Crypto Webhook (IPN) Handler
// @route   POST /api/payments/crypto/webhook
// @access  Public (NOWPayments calls this)
const cryptoWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-nowpayments-sig'];
    const payload = req.body;

    logger.info('🪙 Crypto Webhook:', JSON.stringify(payload, null, 2));

    // Verify signature
    const isValid = cryptoService.verifyIPNSignature(signature, payload);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    const paymentStatus = payload.payment_status;
    const paymentId = payload.order_id;
    const nowpaymentsId = payload.payment_id;

    // Update crypto_payments
    await global.pgPool.query(
      `UPDATE crypto_payments 
       SET payment_status = $1,
           actually_paid = $2,
           outcome_amount = $3,
           pay_in_hash = $4,
           confirmations = $5,
           callback_data = $6,
           last_callback_at = NOW(),
           confirmed_at = CASE WHEN $1 = 'confirmed' THEN NOW() ELSE confirmed_at END
       WHERE payment_id = $7`,
      [
        paymentStatus,
        payload.actually_paid,
        payload.outcome_amount,
        payload.payin_hash,
        payload.confirmations,
        JSON.stringify(payload),
        paymentId
      ]
    );

    // Update main payment based on status
    if (paymentStatus === 'finished') {
      await global.pgPool.query(
        'UPDATE payments SET status = $1, paid_at = NOW() WHERE id = $2',
        ['succeeded', paymentId]
      );
      logger.info(`✅ Crypto payment ${paymentId} completed!`);

      const cryptoUser = await global.pgPool.query(
       `SELECT u.email, up.username, p.amount, p.currency, p.plan_type
        FROM payments p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE p.id = $1`,
        [paymentId]
      );
      if (cryptoUser.rows.length > 0) {
        const user = cryptoUser.rows[0];
        await notificationQueue.add('payment_success', {
          type: 'payment_success',
          userId: user.id,
          data: {
            email: user.email,
            username: user.username,
            amount: user.amount,
            currency: user.currency,
            plan: user.plan_type,
            payment_method: 'Crypto',
            transaction_id: payload.payin_hash
          }
        });
      }

      paymentsTotal.inc({ status: 'succeeded', provider: 'crypto' });
      revenueTotal.inc({ provider: 'crypto' }, payload.price_amount);
    } 
      
    
    else if (['failed', 'expired', 'refunded'].includes(paymentStatus)) {
      await global.pgPool.query(
        'UPDATE payments SET status = $1, failed_at = NOW() WHERE id = $2',
        ['failed', paymentId]
      );
      logger.warn(`❌ Crypto payment ${paymentId} ${paymentStatus}`);
      paymentsTotal.inc({ status: 'failed', provider: 'crypto' });
      failedPayments.inc({ provider: 'crypto' });
    }

    res.json({ success: true });

  } catch (error) {
    logger.error('Crypto webhook error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
};

// @desc    Get Crypto Payment Status
// @route   GET /api/payments/crypto/status/:paymentId
// @access  Private
const getCryptoStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Get from database
    const result = await global.pgPool.query(
      `SELECT p.*, cp.* 
       FROM payments p
       JOIN crypto_payments cp ON p.id = cp.payment_id
       WHERE p.id = $1`,
      [paymentId]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Get live status from NOWPayments
    const liveStatus = await cryptoService.getPaymentStatus(
      result.rows[0].nowpayments_payment_id
    );

    res.json({
      success: true,
      payment: result.rows[0],
      live_status: liveStatus.payment
    });

  } catch (error) {
    logger.error('Get crypto status error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get Available Cryptocurrencies
// @route   GET /api/payments/crypto/currencies
// @access  Public
const getCryptoCurrencies = async (req, res) => {
  try {
    const currencies = await cryptoService.getAvailableCurrencies();

    res.json({
      success: true,
      currencies: currencies.currencies
    });

  } catch (error) {
    logger.error('Get crypto currencies error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};


// @desc    Get user's saved payment methods
// @route   GET /api/payments/methods
// @access  Private
const getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;

    // For now, return empty since we don't save payment methods
    // In production, you'd query Stripe/M-Pesa for saved methods
    
    res.json({
      success: true,
      payment_methods: []
    });

  } catch (error) {
    logger.error('Get payment methods error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Set default payment method
// @route   PUT /api/payments/methods/:methodId/default
// @access  Private
const setDefaultPaymentMethod = async (req, res) => {
  try {
    // TODO: Implement when we add saved payment methods feature
    res.json({
      success: true,
      message: 'Default payment method updated'
    });

  } catch (error) {
    logger.error('Set default error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Delete payment method
// @route   DELETE /api/payments/methods/:methodId
// @access  Private
const deletePaymentMethod = async (req, res) => {
  try {
    // TODO: Implement when we add saved payment methods feature
    res.json({
      success: true,
      message: 'Payment method removed'
    });

  } catch (error) {
    logger.error('Delete payment method error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get User's Payment History
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    // Get user's payments
    const result = await global.pgPool.query(
      `SELECT 
        p.id,
        p.amount,
        p.currency,
        p.payment_method,
        p.status,
        p.plan_type,
        p.description,
        p.created_at,
        p.paid_at,
        p.failed_at,
        
        -- Include method-specific details
        CASE 
          WHEN p.payment_method = 'stripe' THEN p.stripe_session_id
          WHEN p.payment_method = 'mpesa' THEN mp.mpesa_receipt_number
          WHEN p.payment_method = 'crypto' THEN cp.pay_in_hash
        END as transaction_id

      FROM payments p
      LEFT JOIN mpesa_payments mp ON p.id = mp.payment_id
      LEFT JOIN crypto_payments cp ON p.id = cp.payment_id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count
    const countResult = await global.pgPool.query(
      'SELECT COUNT(*) FROM payments WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      payments: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    logger.error('Get payment history error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};


module.exports = {
  // Stripe
  createStripeCheckout,
  stripeWebhook,
  getStripeStatus,
  
  // M-Pesa
  initiateMpesaPayment,
  mpesaCallback,
  getMpesaStatus,
  
  // Crypto
  createCryptoPayment,
  cryptoWebhook,
  getCryptoStatus,
  getCryptoCurrencies,
  
  // Payment Methods
  getPaymentMethods,
  setDefaultPaymentMethod,
  deletePaymentMethod,

  // Payment History
  getPaymentHistory
};
