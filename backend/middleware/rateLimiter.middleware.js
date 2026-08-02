const rateLimit = require('express-rate-limit');

/**
 * Standard API Rate Limiter
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many requests from this IP address. Please try again later.' }
  }
});

/**
 * Strict Rate Limiter for Authentication endpoints (Login, Register)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 15, // 15 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many authentication attempts. Please try again after 15 minutes.' }
  }
});

/**
 * Password Reset Rate Limiter
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many password reset requests. Please try again in an hour.' }
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter
};
