// src/services/subscription.service.js
// Turns a successful payment into an active plan. Called from every payment
// success path (M-Pesa callback, Stripe webhook, crypto webhook).
const logger = require('../utils/logger');
const { getPlan } = require('../config/plans');
const { subscriptionChanges, subscriptionsByTier } = require('../config/metrics');

const PERIOD_DAYS = 30;

/**
 * Find the subscription_plans row for a plan from config/plans.js,
 * creating it if the database doesn't have one yet.
 */
async function planRowId(client, plan) {
  const { rows } = await client.query(
    `INSERT INTO subscription_plans (name, slug, price, currency, billing_interval, features)
     VALUES ($1, $2, $3, $4, 'monthly', $5)
     ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
     RETURNING id`,
    [plan.name, plan.id, plan.price, plan.currency || 'KES', JSON.stringify(plan.features || {})]
  );
  return rows[0].id;
}

/**
 * Grant the plan a payment paid for. Safe to call more than once for the
 * same payment: the second call finds the existing subscription and stops.
 *
 * Returns { granted, reason?, subscription_id?, plan_type? }.
 */
async function grantPlanForPayment(paymentId) {
  const client = await global.pgPool.connect();
  try {
    await client.query('BEGIN');

    // Lock the payment so two callbacks for it can't both grant
    const { rows: [payment] } = await client.query(
      'SELECT id, user_id, status, plan_type, amount, payment_method FROM payments WHERE id = $1 FOR UPDATE',
      [paymentId]
    );
    if (!payment) {
      await client.query('ROLLBACK');
      return { granted: false, reason: 'payment_not_found' };
    }
    if (payment.status !== 'succeeded') {
      await client.query('ROLLBACK');
      return { granted: false, reason: 'payment_not_succeeded' };
    }

    const existing = await client.query('SELECT id FROM subscriptions WHERE payment_id = $1', [paymentId]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return { granted: false, reason: 'already_granted', subscription_id: existing.rows[0].id };
    }

    let plan;
    try {
      plan = getPlan(String(payment.plan_type || ''));
    } catch {
      plan = null;
    }
    if (!plan || !plan.price || parseFloat(payment.amount) < plan.price) {
      await client.query('ROLLBACK');
      logger.warn('Payment does not cover a paid plan; no plan granted', { paymentId, plan_type: payment.plan_type, amount: payment.amount });
      return { granted: false, reason: 'payment_does_not_match_plan' };
    }

    const planId = await planRowId(client, plan);

    // Renewing the same plan adds 30 days on top of what's left;
    // switching plans starts a fresh 30 days now.
    const { rows: [current] } = await client.query(
      `SELECT s.current_period_end
       FROM subscriptions s
       WHERE s.user_id = $1 AND s.status = 'active' AND s.plan_id = $2 AND s.current_period_end > NOW()
       ORDER BY s.current_period_end DESC
       LIMIT 1`,
      [payment.user_id, planId]
    );
    const periodFrom = current ? current.current_period_end : new Date();

    const { rows: [previous] } = await client.query(
      `SELECT sp.slug FROM subscriptions s JOIN subscription_plans sp ON s.plan_id = sp.id
       WHERE s.user_id = $1 AND s.status = 'active' AND s.current_period_end > NOW()
       ORDER BY s.created_at DESC LIMIT 1`,
      [payment.user_id]
    );
    const fromTier = previous ? previous.slug : 'free';

    await client.query(
      `UPDATE subscriptions SET status = 'cancelled', cancelled_at = NOW(), ended_at = NOW(), updated_at = NOW()
       WHERE user_id = $1 AND status = 'active'`,
      [payment.user_id]
    );

    const { rows: [subscription] } = await client.query(
      `INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end, payment_method, payment_id)
       VALUES ($1, $2, 'active', NOW(), $3::timestamptz + INTERVAL '${PERIOD_DAYS} days', $4, $5)
       RETURNING id, current_period_end`,
      [payment.user_id, planId, periodFrom, payment.payment_method, paymentId]
    );

    await client.query('UPDATE users SET plan_type = $1 WHERE id = $2', [plan.id, payment.user_id]);

    await client.query('COMMIT');

    // Metrics must never undo a grant that's already committed
    try {
      if (fromTier !== plan.id) {
        subscriptionChanges.inc({ from_tier: fromTier, to_tier: plan.id });
        subscriptionsByTier.inc({ tier: plan.id });
        if (fromTier !== 'free') subscriptionsByTier.dec({ tier: fromTier });
      }
    } catch (error) {
      logger.warn('Subscription metrics update failed', { error: error.message });
    }
    logger.info('Plan granted for payment', { paymentId, userId: payment.user_id, plan: plan.id });
    return { granted: true, subscription_id: subscription.id, plan_type: plan.id, current_period_end: subscription.current_period_end };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Same as grantPlanForPayment, but never throws: a payment provider's
 * callback must still get its 200 even if granting fails.
 */
async function grantPlanSafely(paymentId) {
  try {
    return await grantPlanForPayment(paymentId);
  } catch (error) {
    logger.error('Failed to grant plan for payment', { paymentId, error: error.message });
    return { granted: false, reason: 'error' };
  }
}

module.exports = { grantPlanForPayment, grantPlanSafely };
