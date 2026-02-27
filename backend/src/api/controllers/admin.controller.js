// src/api/controllers/admin.controller.js
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');
const { logAdminActivity } = require('../middlewares/admin.middleware');

// @desc    Get admin dashboard overview
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    // Get user stats
    const userStats = await global.pgPool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_today,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_week,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_month,
        COUNT(*) FILTER (WHERE banned_at IS NOT NULL) as banned_users
      FROM users
    `);

    // Get content stats
    const contentStats = await global.pgPool.query(`
      SELECT 
        (SELECT COUNT(*) FROM reviews) as total_reviews,
        (SELECT COUNT(*) FROM lists) as total_lists,
        (SELECT COUNT(*) FROM watch_parties) as total_parties,
        (SELECT COUNT(*) FROM favorites) as total_favorites,
        (SELECT COUNT(*) FROM ratings) as total_ratings
    `);

    // Get support tickets stats
    const ticketStats = await global.pgPool.query(`
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(*) FILTER (WHERE status = 'open') as open_tickets,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tickets,
        COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_tickets
      FROM support_tickets
    `);

    // Get content reports stats
    const reportStats = await global.pgPool.query(`
      SELECT 
        COUNT(*) as total_reports,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_reports
      FROM content_reports
    `);

    res.json({
      success: true,
      stats: {
        users: userStats.rows[0],
        content: contentStats.rows[0],
        support: ticketStats.rows[0],
        moderation: reportStats.rows[0]
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = 'all', role = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.email, u.role, u.status, u.email_verified, u.is_admin, 
         u.banned_at, u.ban_reason, u.created_at, u.last_login_at,
         up.username, up.full_name, up.avatar_url
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    // Search filter
    if (search) {
      paramCount++;
      query += ` AND (u.email ILIKE $${paramCount} OR up.username ILIKE $${paramCount} OR up.full_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Status filter
    if (status === 'banned') {
      query += ' AND u.banned_at IS NOT NULL';
    } else if (status === 'active') {
      query += ' AND u.banned_at IS NULL';
    } else if (status === 'admin') {
      query += ' AND u.is_admin = true';
    }

    // Role filter 
    if (role === 'admin') {
      query += ' AND u.is_admin = true';
    } else if (role === 'moderator') {
      query += " AND u.role = 'moderator'";
    } else if (role === 'user') {
      query += " AND u.role = 'user' AND u.is_admin = false";
    }

    // Get total count
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await global.pgPool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await global.pgPool.query(query, params);

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / limit),
      users: result.rows
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get user details with all activity
// @route   GET /api/admin/users/:userId
// @access  Private (Admin only)
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user info
    const userResult = await global.pgPool.query(
      `SELECT u.*, up.username, up.full_name, up.bio, up.avatar_url, up.date_of_birth
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Get user activity stats
    const statsResult = await global.pgPool.query(
      `SELECT 
        (SELECT COUNT(*) FROM favorites WHERE user_id = $1) as favorites_count,
        (SELECT COUNT(*) FROM watchlist WHERE user_id = $1) as watchlist_count,
        (SELECT COUNT(*) FROM ratings WHERE user_id = $1) as ratings_count,
        (SELECT COUNT(*) FROM reviews WHERE user_id = $1) as reviews_count,
        (SELECT COUNT(*) FROM lists WHERE user_id = $1) as lists_count,
        (SELECT COUNT(*) FROM watch_parties WHERE host_user_id = $1) as parties_hosted
      `,
      [userId]
    );

    // Get recent activity
    const recentReviews = await global.pgPool.query(
      'SELECT * FROM reviews WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [userId]
    );

    const recentLists = await global.pgPool.query(
      'SELECT * FROM lists WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [userId]
    );

    res.json({
      success: true,
      user,
      stats: statsResult.rows[0],
      recent_activity: {
        reviews: recentReviews.rows,
        lists: recentLists.rows
      }
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Ban a user
// @route   PUT /api/admin/users/:userId/ban
// @access  Private (Admin only)
const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason || reason.trim().length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Ban reason is required'
      });
    }

    // Can't ban yourself
    if (userId === adminId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'You cannot ban yourself'
      });
    }

    // Can't ban other admins
    const targetUser = await global.pgPool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId]
    );

    if (targetUser.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'User not found'
      });
    }

    if (targetUser.rows[0].is_admin) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Cannot ban admin users'
      });
    }

    // Ban user
    await global.pgPool.query(
      'UPDATE users SET banned_at = NOW(), ban_reason = $1 WHERE id = $2',
      [reason, userId]
    );

    // Log activity
    await logAdminActivity(
      adminId,
      'BAN_USER',
      'user',
      userId,
      { reason },
      req.ip
    );

    res.json({
      success: true,
      message: 'User banned successfully'
    });

  } catch (error) {
    console.error('Ban user error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Unban a user
// @route   PUT /api/admin/users/:userId/unban
// @access  Private (Admin only)
const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    // Unban user
    await global.pgPool.query(
      'UPDATE users SET banned_at = NULL, ban_reason = NULL WHERE id = $1',
      [userId]
    );

    // Log activity
    await logAdminActivity(
      adminId,
      'UNBAN_USER',
      'user',
      userId,
      {},
      req.ip
    );

    res.json({
      success: true,
      message: 'User unbanned successfully'
    });

  } catch (error) {
    console.error('Unban user error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Delete a user (permanent)
// @route   DELETE /api/admin/users/:userId
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    // Can't delete yourself
    if (userId === adminId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'You cannot delete yourself'
      });
    }

    // Can't delete other admins
    const targetUser = await global.pgPool.query(
      'SELECT is_admin, email FROM users WHERE id = $1',
      [userId]
    );

    if (targetUser.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'User not found'
      });
    }

    if (targetUser.rows[0].is_admin) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Cannot delete admin users'
      });
    }

    // Log activity before deletion
    await logAdminActivity(
      adminId,
      'DELETE_USER',
      'user',
      userId,
      { email: targetUser.rows[0].email },
      req.ip
    );

    // Delete user (CASCADE will delete all related data)
    await global.pgPool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({
      success: true,
      message: 'User deleted permanently'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get admin activity logs
// @route   GET /api/admin/activity-logs
// @access  Private (Admin only)
const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT aal.*, u.email as admin_email, up.username as admin_username
      FROM admin_activity_logs aal
      JOIN users u ON aal.admin_user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE 1=1
    `;

    const params = [];

    if (action !== 'all') {
      params.push(action);
      query += ` AND aal.action = $${params.length}`;
    }

    query += ` ORDER BY aal.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await global.pgPool.query(query, params);

    res.json({
      success: true,
      logs: result.rows
    });

  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get all payments
// @route   GET /api/admin/payments
// @access  Private (Admin only)
const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all', method = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.email as user_email, up.username
      FROM payments p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (status !== 'all') {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }

    if (method !== 'all') {
      paramCount++;
      query += ` AND p.payment_method = $${paramCount}`;
      params.push(method);
    }

    // Get total count
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await global.pgPool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await global.pgPool.query(query, params);

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / limit),
      payments: result.rows
    });

  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get payment statistics
// @route   GET /api/admin/payments/stats
// @access  Private (Admin only)
const getPaymentStats = async (req, res) => {
  try {
    const statsResult = await global.pgPool.query(
      `SELECT 
        COUNT(*) as total_payments,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_payments,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_payments,
        SUM(amount) FILTER (WHERE status = 'completed') as total_revenue,
        SUM(amount) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days' AND status = 'completed') as revenue_30d,
        SUM(amount) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days' AND status = 'completed') as revenue_7d
       FROM payments`
    );

    // Revenue by payment method
    const methodResult = await global.pgPool.query(
      `SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(amount) as total
       FROM payments
       WHERE status = 'completed'
       GROUP BY payment_method
       ORDER BY total DESC`
    );

    res.json({
      success: true,
      stats: statsResult.rows[0],
      by_method: methodResult.rows
    });

  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get failed payments
// @route   GET /api/admin/payments/failed
// @access  Private (Admin only)
const getFailedPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await global.pgPool.query(
      `SELECT p.*, u.email as user_email, up.username
       FROM payments p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE p.status = 'failed'
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await global.pgPool.query(
      `SELECT COUNT(*) FROM payments WHERE status = 'failed'`
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / limit),
      payments: result.rows
    });

  } catch (error) {
    console.error('Get failed payments error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Delete a review (moderation)
// @route   DELETE /api/admin/reviews/:reviewId
// @access  Private (Admin only)
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const result = await global.pgPool.query(
      'DELETE FROM reviews WHERE id = $1 RETURNING user_id, content_type, content_id',
      [reviewId]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Log activity
    await logAdminActivity(
      adminId,
      'DELETE_REVIEW',
      'review',
      reviewId,
      { reason: reason || 'No reason provided', deleted_review: result.rows[0] },
      req.ip
    );

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Delete a list (moderation)
// @route   DELETE /api/admin/lists/:listId
// @access  Private (Admin only)
const deleteList = async (req, res) => {
  try {
    const { listId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const result = await global.pgPool.query(
      'DELETE FROM lists WHERE id = $1 RETURNING user_id, title',
      [listId]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'List not found'
      });
    }

    // Log activity
    await logAdminActivity(
      adminId,
      'DELETE_LIST',
      'list',
      listId,
      { reason: reason || 'No reason provided', deleted_list: result.rows[0] },
      req.ip
    );

    res.json({
      success: true,
      message: 'List deleted successfully'
    });

  } catch (error) {
    console.error('Delete list error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get all content reports
// @route   GET /api/admin/reports
// @access  Private (Admin only)
const getContentReports = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT cr.*, 
             u1.email as reporter_email, up1.username as reporter_username,
             u2.email as reviewer_email, up2.username as reviewer_username
      FROM content_reports cr
      LEFT JOIN users u1 ON cr.reporter_user_id = u1.id
      LEFT JOIN user_profiles up1 ON u1.id = up1.user_id
      LEFT JOIN users u2 ON cr.reviewed_by = u2.id
      LEFT JOIN user_profiles up2 ON u2.id = up2.user_id
      WHERE 1=1
    `;

    const params = [];

    if (status !== 'all') {
      params.push(status);
      query += ` AND cr.status = $${params.length}`;
    }

    query += ` ORDER BY cr.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await global.pgPool.query(query, params);

    res.json({
      success: true,
      reports: result.rows
    });

  } catch (error) {
    console.error('Get content reports error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Update content report status
// @route   PUT /api/admin/reports/:reportId
// @access  Private (Admin only)
const updateContentReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, action_taken } = req.body;
    const adminId = req.user.id;

    if (!['reviewed', 'actioned', 'dismissed'].includes(status)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid status'
      });
    }

    await global.pgPool.query(
      `UPDATE content_reports 
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), action_taken = $3
       WHERE id = $4`,
      [status, adminId, action_taken, reportId]
    );

    // Log activity
    await logAdminActivity(
      adminId,
      'REVIEW_REPORT',
      'content_report',
      reportId,
      { status, action_taken },
      req.ip
    );

    res.json({
      success: true,
      message: 'Report updated successfully'
    });

  } catch (error) {
    console.error('Update content report error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get moderator dashboard
// @route   GET /api/moderator/dashboard
// @access  Private (Moderator or Admin)
const getModeratorDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Pending reports
    const reportsResult = await global.pgPool.query(
      `SELECT 
        COUNT(*) as total_reports,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_reports,
        COUNT(*) FILTER (WHERE status = 'reviewed') as reviewed_reports,
        COUNT(*) FILTER (WHERE status = 'actioned') as actioned_reports
       FROM content_reports`
    );

    // My activity today
    const myActivityResult = await global.pgPool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE action = 'BAN_USER') as bans_today,
        COUNT(*) FILTER (WHERE action = 'DELETE_REVIEW') as reviews_deleted_today,
        COUNT(*) FILTER (WHERE action = 'DELETE_LIST') as lists_deleted_today,
        COUNT(*) FILTER (WHERE action = 'REVIEW_REPORT') as reports_handled_today
       FROM admin_activity_logs
       WHERE admin_user_id = $1 
       AND created_at >= CURRENT_DATE`,
      [userId]
    );

    // My activity this week
    const weekActivityResult = await global.pgPool.query(
      `SELECT COUNT(*) as actions_this_week
       FROM admin_activity_logs
       WHERE admin_user_id = $1 
       AND created_at >= DATE_TRUNC('week', CURRENT_DATE)`,
      [userId]
    );

    // Recent pending reports
    const recentReportsResult = await global.pgPool.query(
      `SELECT cr.*, 
              up.username as reporter_username,
              u.email as reporter_email
       FROM content_reports cr
       LEFT JOIN users u ON cr.reporter_user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE cr.status = 'pending'
       ORDER BY cr.created_at DESC
       LIMIT 5`
    );

    // Banned users (last 7 days)
    const bannedUsersResult = await global.pgPool.query(
      `SELECT COUNT(*) as banned_count
       FROM users
       WHERE banned_at >= NOW() - INTERVAL '7 days'`
    );

    // Content statistics
    const contentStatsResult = await global.pgPool.query(
      `SELECT 
        (SELECT COUNT(*) FROM reviews WHERE created_at >= NOW() - INTERVAL '7 days') as reviews_7d,
        (SELECT COUNT(*) FROM lists WHERE created_at >= NOW() - INTERVAL '7 days') as lists_7d,
        (SELECT COUNT(*) FROM watch_parties WHERE created_at >= NOW() - INTERVAL '7 days') as parties_7d
      `
    );

    res.json({
      success: true,
      stats: {
        reports: reportsResult.rows[0],
        my_activity_today: myActivityResult.rows[0],
        my_activity_week: parseInt(weekActivityResult.rows[0].actions_this_week),
        banned_users_7d: parseInt(bannedUsersResult.rows[0].banned_count),
        content_7d: contentStatsResult.rows[0]
      },
      recent_pending_reports: recentReportsResult.rows
    });

  } catch (error) {
    console.error('Get moderator dashboard error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  banUser,
  unbanUser,
  deleteUser,
  getActivityLogs,
  getAllPayments,
  getPaymentStats,
  getFailedPayments,
  deleteReview,
  deleteList,
  getContentReports,
  updateContentReport,
  getModeratorDashboard
};
