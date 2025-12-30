const { HTTP_STATUS } = require('../../utils/constants');
const { getPlan, getLimit } = require('../../config/plans');

/**
 * Get user's current subscription
 */
const getUserSubscription = async (userId) => {
  try {
    const result = await global.pgPool.query(
      `SELECT s.*, sp.name as plan_name, sp.features, sp.price
       FROM subscriptions s
       JOIN subscription_plans sp ON s.plan_id = sp.id
       WHERE s.user_id = $1 AND s.status = 'active'
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // No active subscription, return free plan
      return {
        plan_type: 'free',
        status: 'active'
      };
    }

    return result.rows[0];
  } catch (error) {
    console.error('Get user subscription error:', error);
    throw error;
  }
};

/**
 * Check if user has reached usage limit
 */
const checkUsageLimit = (feature, period = 'daily') => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Get user's subscription
      const subscription = await getUserSubscription(userId);
      const planType = subscription.plan_type || 'free';
      const plan = getPlan(planType);

      // Get limit for this feature
      const limit = plan.limits[feature];

      // -1 means unlimited
      if (limit === -1) {
        return next();
      }

      // Check current usage from Redis
      const redis = require('../../config/cache').redisClient;
      const key = `usage:${userId}:${feature}:${period}`;
      const currentUsage = await redis.get(key);
      const usage = currentUsage ? parseInt(currentUsage) : 0;

      if (usage >= limit) {
        return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
          success: false,
          error: `${feature} limit reached`,
          limit_info: {
            limit: limit,
            used: usage,
            period: period,
            plan: planType,
            upgrade_required: planType === 'free'
          }
        });
      }

      // Increment usage
      const ttl = period === 'daily' ? 86400 : 2592000; // 1 day or 30 days
      await redis.incr(key);
      await redis.expire(key, ttl);

      // Add usage info to request
      req.usageInfo = {
        feature,
        limit,
        used: usage + 1,
        remaining: limit - usage - 1
      };

      next();

    } catch (error) {
      console.error('Check usage limit error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to check usage limit'
      });
    }
  };
};

/**
 * Require specific plan
 */
const requirePlan = (requiredPlans) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const subscription = await getUserSubscription(userId);
      const planType = subscription.plan_type || 'free';

      const allowedPlans = Array.isArray(requiredPlans) ? requiredPlans : [requiredPlans];

      if (!allowedPlans.includes(planType)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: 'This feature requires a premium subscription',
          required_plans: allowedPlans,
          current_plan: planType
        });
      }

      next();

    } catch (error) {
      console.error('Require plan error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to check subscription'
      });
    }
  };
};

module.exports = {
  getUserSubscription,
  checkUsageLimit,
  requirePlan
};
