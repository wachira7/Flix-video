const jwt = require('jsonwebtoken');
const { USER_STATUS, USER_ROLES, HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');

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

      // Get user from token
      const { rows } = await global.pgPool.query(
        'SELECT id, email, role FROM users WHERE id = $1 AND status = $2',
        [decoded.id, USER_STATUS.ACTIVE]
      );

      if (rows.length === 0) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
          error: ERROR_MESSAGES.USER_NOT_FOUND 
        });
      }

      // Attach user to request
      req.user = rows[0];
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
