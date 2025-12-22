const { HTTP_STATUS } = require('../../utils/constants');

/**
 * Admin Authorization Middleware
 * Checks if authenticated user has admin privileges
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check user role
    const result = await global.pgPool.query(
      'SELECT is_admin, role, banned_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    if (user.banned_at) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Your account has been banned'
      });
    }

    // Check if user is admin (either is_admin flag OR role = 'admin')
    if (!user.is_admin && user.role !== 'admin') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Admin privileges required'
      });
    }

    // Store role in request for later use
    req.userRole = user.role;
    next();

  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * Moderator Authorization Middleware
 * Checks if user is moderator OR admin
 */
const requireModerator = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const result = await global.pgPool.query(
      'SELECT is_admin, role, banned_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    if (user.banned_at) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Your account has been banned'
      });
    }

    // Check if user is moderator or admin
    const allowedRoles = ['admin', 'moderator'];
    if (!allowedRoles.includes(user.role) && !user.is_admin) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Moderator or admin privileges required'
      });
    }

    req.userRole = user.role;
    next();

  } catch (error) {
    console.error('Moderator middleware error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * Log admin/moderator activity
 */
const logAdminActivity = async (adminUserId, action, targetType, targetId, details, ipAddress) => {
  try {
    await global.pgPool.query(
      `INSERT INTO admin_activity_logs (admin_user_id, action, target_type, target_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [adminUserId, action, targetType, targetId, JSON.stringify(details), ipAddress]
    );
  } catch (error) {
    console.error('Log admin activity error:', error);
  }
};

module.exports = {
  requireAdmin,
  requireModerator,
  logAdminActivity
};