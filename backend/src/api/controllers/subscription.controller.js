// backend/src/api/controllers/subscription.controller.js
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');
const { PLANS, getPlan, isValidUpgrade, isValidDowngrade } = require('../../config/plans');
const { getUserSubscription } = require('../middlewares/subscription.middleware');
const logger = require('../../utils/logger');
const { notificationQueue } = require('../../jobs/queues');
const { grantPlanForPayment } = require('../../services/subscription.service');

// @desc    Get all subscription plans
// @route   GET /api/subscriptions/plans
// @access  Public
const getPlans = async (req, res) => {
  try {
    const plans = Object.values(PLANS).map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      billing_period: plan.billing_period,
      features: plan.features,
      popular: plan.id === 'premium'
    }));

    res.json({
      success: true,
      plans
    });

  } catch (error) {
    logger.error('Get plans error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get user's current subscription
// @route   GET /api/subscriptions/my-subscription
// @access  Private
const getMySubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await getUserSubscription(userId);
    const planType = subscription.plan_type || 'free';
    const plan = getPlan(planType);

    res.json({
      success: true,
      subscription: {
        ...subscription,
        plan_details: plan
      }
    });

  } catch (error) {
    logger.error('Get my subscription error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Upgrade subscription
// @route   POST /api/subscriptions/upgrade
// @access  Private
const upgradeSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan_type, payment_method } = req.body;

    if (!plan_type || !['basic', 'premium'].includes(plan_type.toLowerCase())) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid plan type'
      });
    }

    if (!payment_method || !['stripe', 'mpesa', 'crypto'].includes(payment_method.toLowerCase())) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid payment method'
      });
    }

    // Get current subscription
    const currentSub = await getUserSubscription(userId);
    const currentPlan = currentSub.plan_type || 'free';

    // Check if upgrade is valid
    if (!isValidUpgrade(currentPlan, plan_type)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: `Cannot upgrade from ${currentPlan} to ${plan_type}`
      });
    }

    // Nothing is written here: the plan is granted only once a payment for it
    // succeeds (see services/subscription.service.js). This just quotes it.
    const newPlan = getPlan(plan_type);

    res.json({
      success: true,
      message: 'Complete payment to upgrade',
      plan: newPlan.id,
      amount: newPlan.price,
      currency: newPlan.currency,
      next_step: `Complete payment via ${payment_method}`
    });

  } catch (error) {
    logger.error('Upgrade subscription error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Cancel subscription
// @route   POST /api/subscriptions/cancel
// @access  Private
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reason } = req.body;

    // Get current subscription
    const subscription = await getUserSubscription(userId);

    if (!subscription.id || subscription.plan_type === 'free') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'No active subscription to cancel'
      });
    }

    // Cancel subscription (will revert to free at end of period)
    await global.pgPool.query(
      `UPDATE subscriptions 
       SET status = 'cancelled', 
           cancelled_at = NOW(),
           cancellation_reason = $1
       WHERE id = $2`,
      [reason, subscription.id]
    );


    const subUser = await global.pgPool.query(
     `SELECT u.email, up.username, s.current_period_end
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE s.id = $1`,
      [subscription.id]
    );
    if (subUser.rows.length > 0) {
      const user = subUser.rows[0];
      await notificationQueue.add('subscription_expiring', {
        type: 'subscription_expiring',
        userId,
        data: {
          email: user.email,
          username: user.username,
          plan: subscription.plan_type,
          expiry_date: new Date(user.current_period_end).toLocaleDateString(),
          days_remaining: Math.ceil(
            (new Date(user.current_period_end) - new Date()) / (1000 * 60 * 60 * 24)
          )
        }
      });
    }

    res.json({
      success: true,
      message: 'Subscription cancelled. You will retain access until the end of your billing period.',
      end_date: subscription.current_period_end
    });

  } catch (error) {
    logger.error('Cancel subscription error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get usage statistics
// @route   GET /api/subscriptions/usage
// @access  Private
const getUsageStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get subscription
    const subscription = await getUserSubscription(userId);
    const planType = subscription.plan_type || 'free';
    const plan = getPlan(planType);

    // Get usage from Redis
    const { redisClient } = require('../../config/cache');

    const features = [
      'ai_recommendations_daily',
      'watch_parties_daily',
      'lists',
      'watchlists'
    ];

    const usage = {};
    for (const feature of features) {
      const key = `usage:${userId}:${feature}:daily`;
      const count = await redisClient.get(key);
      const limit = plan.limits[feature];

      usage[feature] = {
        used: count ? parseInt(count) : 0,
        limit: limit === -1 ? 'unlimited' : limit,
        remaining: limit === -1 ? 'unlimited' : Math.max(0, limit - (count ? parseInt(count) : 0))
      };
    }

    res.json({
      success: true,
      plan: planType,
      usage
    });

  } catch (error) {
    logger.error('Get usage stats error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Activate subscription after payment
// @route   POST /api/subscriptions/activate
// @access  Private (Called by payment webhook)
const activateSubscription = async (req, res) => {
  try {
    const { payment_id } = req.body;

    if (!payment_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Payment ID required'
      });
    }

    // The payment must be this user's; the grant checks it succeeded and covers the plan
    const paymentResult = await global.pgPool.query('SELECT user_id FROM payments WHERE id = $1', [payment_id]);
    const payment = paymentResult.rows[0];

    if (!payment || String(payment.user_id) !== String(req.user.id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Payment not successful'
      });
    }

    // Payment callbacks normally grant the plan already; this is a safe retry
    const result = await grantPlanForPayment(payment_id);

    if (!result.granted && result.reason !== 'already_granted') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: result.reason === 'payment_does_not_match_plan' ? 'Payment does not match this plan' : 'Payment not successful'
      });
    }

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription_id: result.subscription_id
    });

  } catch (error) {
    logger.error('Activate subscription error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Check if user can perform action
// @route   GET /api/subscriptions/can/:action
// @access  Private
const canPerformAction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { action } = req.params;

    const subscription = await getUserSubscription(userId);
    const planType = subscription.plan_type || 'free';
    const plan = getPlan(planType);

    const allowed = plan.features[action] || false;

    res.json({
      success: true,
      action,
      allowed,
      plan: planType,
      upgrade_required: !allowed
    });

  } catch (error) {
    logger.error('Can perform action error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

module.exports = {
  getPlans,
  getMySubscription,
  upgradeSubscription,
  cancelSubscription,
  getUsageStats,
  activateSubscription,
  canPerformAction
};
