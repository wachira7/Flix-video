// backend/src/integrations/stripe/index.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create Stripe Checkout Session
 */
const createCheckoutSession = async (userId, amount, currency, metadata) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: metadata.plan_name || 'FlixVideo Subscription',
              description: metadata.description || 'Premium subscription'
            },
            unit_amount: Math.round(amount * 100) // Convert to cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.PAYMENT_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.PAYMENT_CANCEL_URL,
      client_reference_id: userId,
      metadata: metadata
    });

    return {
      success: true,
      session_id: session.id,
      checkout_url: session.url
    };

  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw new Error('Failed to create Stripe checkout session');
  }
};

/**
 * Verify Stripe Webhook Signature
 */
const verifyWebhookSignature = (payload, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return { success: true, event };
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get Checkout Session Details
 */
const getCheckoutSession = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return {
      success: true,
      session
    };
  } catch (error) {
    console.error('Get session error:', error);
    throw new Error('Failed to retrieve session');
  }
};

/**
 * Create Refund
 */
const createRefund = async (paymentIntentId, amount) => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined
    });

    return {
      success: true,
      refund
    };
  } catch (error) {
    console.error('Refund error:', error);
    throw new Error('Failed to create refund');
  }
};

/**
 * Cancel Payment
 */
const cancelPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    return {
      success: true,
      paymentIntent
    };
  } catch (error) {
    console.error('Cancel payment error:', error);
    throw new Error('Failed to cancel payment');
  }
};

module.exports = {
  createCheckoutSession,
  verifyWebhookSignature,
  getCheckoutSession,
  createRefund,
  cancelPaymentIntent
};
