//src/api/middlewares/rate-limiter.middleware.js
const rateLimit = require('express-rate-limit');

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                    // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Please try again after 15 minutes',
  },
});

// Auth routes — stricter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                     // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts',
    message: 'Please try again after 15 minutes',
  },
});

// Payment routes — very strict
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 20,                     // 20 payment attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many payment requests',
    message: 'Please try again after an hour',
  },
});

// Search routes — relaxed
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 30,               // 30 searches per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many search requests',
    message: 'Please slow down',
  },
});

module.exports = { apiLimiter, authLimiter, paymentLimiter, searchLimiter };