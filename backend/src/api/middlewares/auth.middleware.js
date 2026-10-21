//backend/src/api/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const { USER_STATUS, USER_ROLES, HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');
const { applyDemoRules } = require('../../config/demo');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get user (and this token's session, if it has one) in one query
      let rows;
      try {
        ({ rows } = await global.pgPool.query(
          `SELECT u.id, u.email, u.role, u.sessions_valid_after, u.is_demo, u.demo_expires_at,
                  d.is_active AS session_active, d.last_active_at AS session_last_active
           FROM users u
           LEFT JOIN devices d ON d.id = $3 AND d.user_id = u.id
           WHERE u.id = $1 AND u.status = $2`,
          [decoded.id, USER_STATUS.ACTIVE, decoded.sid || null]
        ));
      } catch (dbError) {
        // 42703 = undefined column: migration 019 hasn't run yet.
        // Fall back to the old check rather than locking everyone out.
        if (dbError.code !== '42703') throw dbError;
        ({ rows } = await global.pgPool.query(
          'SELECT id, email, role FROM users WHERE id = $1 AND status = $2',
          [decoded.id, USER_STATUS.ACTIVE]
        ));
        if (rows[0]) rows[0].session_active = true;
      }

      if (rows.length === 0) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
          error: ERROR_MESSAGES.USER_NOT_FOUND 
        });
      }

      const row = rows[0];

      // Session-less tokens (issued before sessions existed) can't be signed
      // out one by one, so "sign out everywhere" cuts them off by issue time.
      // Tokens with a session are checked against their own row below.
      if (!decoded.sid && row.sessions_valid_after && decoded.iat * 1000 < new Date(row.sessions_valid_after).getTime()) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: 'Session ended. Please sign in again.' });
      }

      // This device was signed out
      if (decoded.sid && row.session_active !== true) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: 'Session ended. Please sign in again.' });
      }

      // Keep "last active" fresh without writing on every request
      if (decoded.sid && (!row.session_last_active || Date.now() - new Date(row.session_last_active).getTime() > 5 * 60 * 1000)) {
        global.pgPool
          .query('UPDATE devices SET last_active_at = NOW(), last_ip = $2 WHERE id = $1', [decoded.sid, req.ip || null])
          .catch(() => {});
      }

      // One-click demo accounts expire, and can't pay or post publicly
      if (row.is_demo) {
        if (row.demo_expires_at && new Date(row.demo_expires_at).getTime() <= Date.now()) {
          return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: 'This demo has ended. Start a new one any time.', demo_ended: true });
        }
        const blocked = applyDemoRules(req);
        if (blocked) return res.status(HTTP_STATUS.FORBIDDEN).json(blocked);
      }

      // Attach user to request
      req.user = { id: row.id, email: row.email, role: row.role, isDemo: row.is_demo === true };
      req.sessionId = decoded.sid || null;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
        error: 'Not authorized, token failed' 
      });
    }
  }

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
      error: ERROR_MESSAGES.UNAUTHORIZED 
    });
  }
};

// Admin only middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === USER_ROLES.ADMIN) {
    next();
  } else {
    res.status(HTTP_STATUS.FORBIDDEN).json({ 
      error: 'Access denied. Admin only.' 
    });
  }
};

module.exports = { protect, admin };
