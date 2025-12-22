// User roles
const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator'
};

// User status
const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted'
};

// Token expiry times
const TOKEN_EXPIRY = {
  ACCESS_TOKEN: '7d',
  REFRESH_TOKEN: '30d',
  PASSWORD_RESET: '1h',
  EMAIL_VERIFICATION: '24h'
};

// Email types
const EMAIL_TYPES = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_CHANGED: 'password_changed',
  ACCOUNT_DELETED: 'account_deleted'
};

// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// Password requirements
const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: true,
  SPECIAL_CHARS: '@!#$%^&*()_+-=[]{}|;:,.<>?',
  PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@!#$%^&*()_+\-=\[\]{}|;:,.<>?])[A-Za-z\d@!#$%^&*()_+\-=\[\]{}|;:,.<>?]{8,}$/
};

// Username requirements
const USERNAME_REQUIREMENTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 30,
  PATTERN: /^[a-zA-Z0-9_]+$/ // Alphanumeric and underscore only
};

// Email configuration
const EMAIL_CONFIG = {
  FROM_NAME: 'FlixVideo',
  FROM_EMAIL: 'onboarding@resend.dev',
  SUPPORT_EMAIL: 'support@flixvideo.com'
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// File upload limits
const UPLOAD_LIMITS = {
  AVATAR_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  AVATAR_ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  COVER_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  COVER_ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp']
};

// Rate limiting
const RATE_LIMITS = {
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5 // 5 requests per window
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100 // 100 requests per window
  }
};

// Content types
const CONTENT_TYPES = {
  MOVIE: 'movie',
  TV_SHOW: 'tv'
};

// Subscription plans
const SUBSCRIPTION_PLANS = {
  BASIC: 'basic',
  STANDARD: 'standard',
  PREMIUM: 'premium',
  ANNUAL: 'annual'
};

// Payment methods
const PAYMENT_METHODS = {
  STRIPE: 'stripe',
  MPESA: 'mpesa',
  CRYPTO: 'crypto'
};

// Payment status
const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
};

// Crypto currencies
const CRYPTO_CURRENCIES = {
  BTC: 'btc',
  ETH: 'eth',
  USDT: 'usdt',
  USDC: 'usdc',
  LTC: 'ltc',
  BCH: 'bch',
  DOGE: 'doge',
  TRX: 'trx'
};

// Error messages
const ERROR_MESSAGES = {
  // Auth errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_EXISTS: 'User already exists with this email',
  USER_NOT_FOUND: 'User not found',
  ACCOUNT_SUSPENDED: 'Your account has been suspended',
  ACCOUNT_DELETED: 'Your account has been deleted',
  EMAIL_NOT_VERIFIED: 'Please verify your email address',
  INVALID_TOKEN: 'Invalid or expired token',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  
  // Validation errors
  INVALID_EMAIL: 'Please provide a valid email address',
  INVALID_PASSWORD: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@!#$%^&* etc.)',
  INVALID_USERNAME: 'Username must be 3-30 characters and contain only letters, numbers, and underscores',
  REQUIRED_FIELD: 'This field is required',
  PASSWORD_MISMATCH: 'Passwords do not match',
  WEAK_PASSWORD: 'Password is too weak. Please use a stronger password.',
  
  // Server errors
  SERVER_ERROR: 'An error occurred. Please try again later',
  DATABASE_ERROR: 'Database connection error',
  EMAIL_SEND_FAILED: 'Failed to send email. Please try again later'
};

// Success messages
const SUCCESS_MESSAGES = {
  // Auth success
  REGISTRATION_SUCCESS: 'Account created successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PASSWORD_RESET_EMAIL_SENT: 'If that email exists, a password reset link has been sent',
  PASSWORD_RESET_SUCCESS: 'Password reset successful. You can now login with your new password',
  EMAIL_VERIFIED: 'Email verified successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  
  // General success
  SUCCESS: 'Operation completed successfully'
};

module.exports = {
  USER_ROLES,
  USER_STATUS,
  TOKEN_EXPIRY,
  EMAIL_TYPES,
  HTTP_STATUS,
  PASSWORD_REQUIREMENTS,
  USERNAME_REQUIREMENTS,
  EMAIL_CONFIG,
  PAGINATION,
  UPLOAD_LIMITS,
  RATE_LIMITS,
  CONTENT_TYPES,
  SUBSCRIPTION_PLANS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  CRYPTO_CURRENCIES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};
