// src/config/payment-modes.js
// Whether each payment method takes real money. A test-mode method
// (M-Pesa sandbox, a Stripe sk_test_ key, NOWPayments sandbox) completes
// without money moving, so it must never unlock a plan in production.
//
// Set ALLOW_TEST_PAYMENTS=true (local development only) to try the
// payment flows against the sandboxes.

const isLive = {
  mpesa: () => process.env.MPESA_ENVIRONMENT === 'production',
  stripe: () => /^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY || ''),
  // The NOWPayments integration uses the live API unless told 'sandbox'
  crypto: () => Boolean(process.env.NOWPAYMENTS_API_KEY) && process.env.NOWPAYMENTS_ENVIRONMENT !== 'sandbox'
};

const testPaymentsAllowed = () => process.env.ALLOW_TEST_PAYMENTS === 'true';

/** Can this method be used to buy a plan right now? */
const canTakePayment = (method) => {
  const live = isLive[method];
  if (!live) return false;
  return live() || testPaymentsAllowed();
};

module.exports = { isLive, testPaymentsAllowed, canTakePayment };
