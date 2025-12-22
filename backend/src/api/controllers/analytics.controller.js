const { HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');

// @desc    Get user growth analytics
// @route   GET /api/admin/analytics/users
// @access  Private (Admin only)
const getUserAnalytics = async (req, res) => {
  try {
    const { period = '30days' } = req.query;

    let interval = '1 day';
    let dateRange = '30 days';

    if (period === '7days') {
      dateRange = '7 days';
    } else if (period === '90days') {
      dateRange = '90 days';
      interval = '1 day';
    } else if (period === '1year') {
      dateRange = '1 year';
      interval = '1 week';
    }

    // User growth over time
    const growthResult = await global.pgPool.query(
      `SELECT 
        DATE_TRUNC($1, created_at) as date,
        COUNT(*) as new_users
       FROM users
       WHERE created_at >= NOW() - INTERVAL $2
       GROUP BY DATE_TRUNC($1, created_at)
       ORDER BY date ASC`,
      [interval, dateRange]
    );

    // Total active users (logged in last 30 days)
    const activeResult = await global.pgPool.query(
      `SELECT COUNT(*) as active_users
       FROM users
       WHERE last_login_at >= NOW() - INTERVAL '30 days'`
    );

    // User retention (users who came back after first day)
    const retentionResult = await global.pgPool.query(
      `SELECT COUNT(*) as retained_users
       FROM users
       WHERE last_login_at > created_at + INTERVAL '1 day'
       AND created_at >= NOW() - INTERVAL $1`,
      [dateRange]
    );

    res.json({
      success: true,
      period,
      growth: growthResult.rows,
      active_users: parseInt(activeResult.rows[0].active_users),
      retained_users: parseInt(retentionResult.rows[0].retained_users)
    });

  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get content analytics
// @route   GET /api/admin/analytics/content
// @access  Private (Admin only)
const getContentAnalytics = async (req, res) => {
  try {
    // Most reviewed content
    const topReviewedResult = await global.pgPool.query(
      `SELECT content_type, content_id, COUNT(*) as review_count
       FROM reviews
       GROUP BY content_type, content_id
       ORDER BY review_count DESC
       LIMIT 10`
    );

    // Most rated content
    const topRatedResult = await global.pgPool.query(
      `SELECT content_type, content_id, 
              COUNT(*) as rating_count,
              ROUND(AVG(rating), 1) as avg_rating
       FROM ratings
       GROUP BY content_type, content_id
       ORDER BY rating_count DESC
       LIMIT 10`
    );

    // Most favorited content
    const topFavoritedResult = await global.pgPool.query(
      `SELECT content_type, content_id, COUNT(*) as favorite_count
       FROM favorites
       GROUP BY content_type, content_id
       ORDER BY favorite_count DESC
       LIMIT 10`
    );

    // Popular lists
    const popularListsResult = await global.pgPool.query(
      `SELECT l.id, l.title, l.likes_count, l.items_count, 
              up.username as creator
       FROM lists l
       LEFT JOIN user_profiles up ON l.user_id = up.user_id
       WHERE l.is_public = true
       ORDER BY l.likes_count DESC
       LIMIT 10`
    );

    // Watch party stats
    const partyStatsResult = await global.pgPool.query(
      `SELECT 
        COUNT(*) as total_parties,
        COUNT(*) FILTER (WHERE status = 'ended') as completed_parties,
        AVG((SELECT COUNT(*) FROM watch_party_participants WHERE party_id = watch_parties.id))::int as avg_participants
       FROM watch_parties`
    );

    res.json({
      success: true,
      top_reviewed: topReviewedResult.rows,
      top_rated: topRatedResult.rows,
      top_favorited: topFavoritedResult.rows,
      popular_lists: popularListsResult.rows,
      watch_party_stats: partyStatsResult.rows[0]
    });

  } catch (error) {
    console.error('Get content analytics error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get engagement analytics
// @route   GET /api/admin/analytics/engagement
// @access  Private (Admin only)
const getEngagementAnalytics = async (req, res) => {
  try {
    // Daily active users trend
    const dauResult = await global.pgPool.query(
      `SELECT 
        DATE_TRUNC('day', last_login_at) as date,
        COUNT(DISTINCT id) as active_users
       FROM users
       WHERE last_login_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE_TRUNC('day', last_login_at)
       ORDER BY date ASC`
    );

    // User activity breakdown
    const activityResult = await global.pgPool.query(
      `SELECT 
        (SELECT COUNT(*) FROM reviews WHERE created_at >= NOW() - INTERVAL '30 days') as reviews_30d,
        (SELECT COUNT(*) FROM lists WHERE created_at >= NOW() - INTERVAL '30 days') as lists_30d,
        (SELECT COUNT(*) FROM ratings WHERE created_at >= NOW() - INTERVAL '30 days') as ratings_30d,
        (SELECT COUNT(*) FROM watch_parties WHERE created_at >= NOW() - INTERVAL '30 days') as parties_30d`
    );

    // Most active users
    const activeUsersResult = await global.pgPool.query(
      `SELECT 
        u.id,
        up.username,
        up.full_name,
        (SELECT COUNT(*) FROM reviews WHERE user_id = u.id) as reviews,
        (SELECT COUNT(*) FROM lists WHERE user_id = u.id) as lists,
        (SELECT COUNT(*) FROM ratings WHERE user_id = u.id) as ratings
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       ORDER BY (
         (SELECT COUNT(*) FROM reviews WHERE user_id = u.id) +
         (SELECT COUNT(*) FROM lists WHERE user_id = u.id) +
         (SELECT COUNT(*) FROM ratings WHERE user_id = u.id)
       ) DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      daily_active_users: dauResult.rows,
      activity_30d: activityResult.rows[0],
      most_active_users: activeUsersResult.rows
    });

  } catch (error) {
    console.error('Get engagement analytics error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

module.exports = {
  getUserAnalytics,
  getContentAnalytics,
  getEngagementAnalytics
};
