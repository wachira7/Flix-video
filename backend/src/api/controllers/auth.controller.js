const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
  USER_ROLES,
  USER_STATUS,
  TOKEN_EXPIRY,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PASSWORD_REQUIREMENTS
} = require('../../utils/constants');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || TOKEN_EXPIRY.ACCESS_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { email, password, username, full_name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: ERROR_MESSAGES.REQUIRED_FIELD 
      });
    }

    // Check password length
    if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: ERROR_MESSAGES.INVALID_PASSWORD 
      });
    }

    // Check password strength with regex
    const passwordRegex = PASSWORD_REQUIREMENTS.PATTERN;
    if (!passwordRegex.test(password)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: ERROR_MESSAGES.INVALID_PASSWORD 
      });
    }

    // Check if user exists
    const userExists = await global.pgPool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userExists.rows.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: ERROR_MESSAGES.USER_EXISTS 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

        // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const result = await global.pgPool.query(
      `INSERT INTO users (email, password_hash, role, status, email_verified, verification_token, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
      RETURNING id, email, role, status, created_at`,
      [email.toLowerCase(), password_hash, USER_ROLES.USER, USER_STATUS.ACTIVE, false, verificationToken]
    );

    const user = result.rows[0];  // DEFINE user FIRST

    // Create user profile
    await global.pgPool.query(
      `INSERT INTO user_profiles (user_id, username, full_name, created_at, updated_at) 
      VALUES ($1, $2, $3, NOW(), NOW())`,
      [user.id, username || email.split('@')[0], full_name || '']
    );

    // Send verification email (AFTER defining user)
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const { sendVerificationEmail } = require('../../services/email.service');
    await sendVerificationEmail(user.email, verificationUrl);

    // Send welcome email
    const { sendWelcomeEmail } = require('../../services/email.service');
    await sendWelcomeEmail(user.email, username || email.split('@')[0]);

    // Generate token
    const token = generateToken(user.id);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.REGISTRATION_SUCCESS,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      error: ERROR_MESSAGES.SERVER_ERROR 
    });
  }
};
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: ERROR_MESSAGES.REQUIRED_FIELD 
      });
    }

    // Check user exists + GET PROFILE DATA
    const result = await global.pgPool.query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.status,
              up.username, up.full_name, up.avatar_url
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
        error: ERROR_MESSAGES.INVALID_CREDENTIALS 
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (user.status !== USER_STATUS.ACTIVE) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ 
        error: ERROR_MESSAGES.ACCOUNT_SUSPENDED 
      });
    }

    // Check if user has password (OAuth users don't)
    if (!user.password_hash) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: 'This account uses social login. Please login with Google.' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
        error: ERROR_MESSAGES.INVALID_CREDENTIALS 
      });
    }

    // Update last login
    await global.pgPool.query(
      'UPDATE users SET last_login_at = NOW(), last_login_ip = $1 WHERE id = $2',
      [req.ip, user.id]
    );

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        full_name: user.full_name,
        avatar_url: user.avatar_url  // INCLUDES AVATAR!
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      error: ERROR_MESSAGES.SERVER_ERROR 
    });
  }
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = async (req, res) => {
  try {
    // User authenticated by Passport
    const token = generateToken(req.user.id);

    // Redirect to frontend with token
    res.redirect(`${FRONTEND_URL}/callback?token=${token}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${FRONTEND_URL}/auth/error?message=Authentication failed`);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const result = await global.pgPool.query(
      `SELECT u.id, u.email, u.role, u.status, u.email_verified, u.created_at, u.last_login_at,
              up.username, up.full_name, up.avatar_url, up.bio, up.country, up.city, up.timezone, up.language
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        error: ERROR_MESSAGES.USER_NOT_FOUND 
      });
    }

    res.json({ 
      success: true,
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      error: ERROR_MESSAGES.SERVER_ERROR 
    });
  }
};


const crypto = require('crypto');

// @desc    Verify email with token
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find user with verification token
    const result = await global.pgPool.query(
      'SELECT id, email FROM users WHERE verification_token = $1 AND email_verified = false',
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        success: false, 
        message: 'Invalid or expired verification token' 
      });
    }
    
    const user = result.rows[0];
    
    // Update user - mark email as verified and clear token
    await global.pgPool.query(
      'UPDATE users SET email_verified = true, verification_token = null, updated_at = NOW() WHERE id = $1',
      [user.id]
    );
    
    res.json({ 
      success: true, 
      message: 'Email verified successfully' 
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      success: false, 
      message: 'Verification failed' 
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        success: false, 
        message: ERROR_MESSAGES.REQUIRED_FIELD 
      });
    }
    
    const result = await global.pgPool.query(
      'SELECT id, email, email_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const user = result.rows[0];
    
    if (user.email_verified) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        success: false, 
        message: 'Email already verified' 
      });
    }
    
    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    
    await global.pgPool.query(
      'UPDATE users SET verification_token = $1, updated_at = NOW() WHERE id = $2',
      [token, user.id]
    );
    
    // Send verification email
    const { sendVerificationEmail } = require('../../services/email.service');
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
    await sendVerificationEmail(user.email, verificationUrl);
    
    res.json({ 
      success: true, 
      message: 'Verification email sent' 
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      success: false, 
      message: 'Failed to resend verification' 
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { username, full_name, bio, country, city, timezone, language } = req.body;

    const result = await global.pgPool.query(
      `UPDATE user_profiles 
       SET username = COALESCE($1, username),
           full_name = COALESCE($2, full_name),
           bio = COALESCE($3, bio),
           country = COALESCE($4, country),
           city = COALESCE($5, city),
           timezone = COALESCE($6, timezone),
           language = COALESCE($7, language),
           updated_at = NOW()
       WHERE user_id = $8
       RETURNING *`,
      [username, full_name, bio, country, city, timezone, language, req.user.id]
    );

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.PROFILE_UPDATED,
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      error: ERROR_MESSAGES.SERVER_ERROR 
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  // With JWT, logout is handled client-side by removing token
  res.json({
    success: true,
    message: SUCCESS_MESSAGES.LOGOUT_SUCCESS
  });
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: ERROR_MESSAGES.REQUIRED_FIELD 
      });
    }

    // Check if user exists
    const result = await global.pgPool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: SUCCESS_MESSAGES.PASSWORD_RESET_EMAIL_SENT
      });
    }

    const user = result.rows[0];

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { id: user.id, purpose: 'password-reset' },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY.PASSWORD_RESET }
    );

    // Store reset token in database
    await global.pgPool.query(
      `UPDATE users 
       SET password_reset_token = $1, 
           password_reset_expires = NOW() + INTERVAL '1 hour'
       WHERE id = $2`,
      [resetToken, user.id]
    );

    // Create reset URL
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send email
    const { sendPasswordResetEmail } = require('../../services/email.service');
    const emailSent = await sendPasswordResetEmail(user.email, resetToken, resetUrl);

    if (!emailSent) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
        error: ERROR_MESSAGES.EMAIL_SEND_FAILED 
      });
    }

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.PASSWORD_RESET_EMAIL_SENT
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      error: ERROR_MESSAGES.SERVER_ERROR 
    });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: ERROR_MESSAGES.REQUIRED_FIELD 
      });
    }

    // Check password length
    if (newPassword.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: ERROR_MESSAGES.INVALID_PASSWORD 
      });
    }

    // Check password strength with regex
    const passwordRegex = PASSWORD_REQUIREMENTS.PATTERN;
    if (!passwordRegex.test(newPassword)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: ERROR_MESSAGES.INVALID_PASSWORD 
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: ERROR_MESSAGES.INVALID_TOKEN 
      });
    }

    // Check if token is for password reset
    if (decoded.purpose !== 'password-reset') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: 'Invalid token type' 
      });
    }

    // Check if token exists in database and hasn't expired
    const result = await global.pgPool.query(
      `SELECT id, email 
       FROM users 
       WHERE id = $1 
       AND password_reset_token = $2 
       AND password_reset_expires > NOW()`,
      [decoded.id, token]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: ERROR_MESSAGES.INVALID_TOKEN 
      });
    }

    const user = result.rows[0];

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    await global.pgPool.query(
      `UPDATE users 
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [password_hash, user.id]
    );

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      error: ERROR_MESSAGES.SERVER_ERROR 
    });
  }
};

module.exports = {
  register,
  login,
  googleCallback,
  getProfile,
  updateProfile,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
};
