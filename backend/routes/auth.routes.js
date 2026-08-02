const express = require('express');
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter.middleware');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} = require('../validators/auth.validator');

const router = express.Router();

// Local Authentication
router.post('/register', authLimiter, registerValidation, (req, res, next) => authController.register(req, res, next));
router.post('/login', authLimiter, loginValidation, (req, res, next) => authController.login(req, res, next));
router.post('/logout', protect, (req, res, next) => authController.logout(req, res, next));
router.get('/verify-email', (req, res, next) => authController.verifyEmail(req, res, next));
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
router.get('/me', protect, (req, res, next) => authController.getMe(req, res, next));

// Password Management
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, (req, res, next) => authController.forgotPassword(req, res, next));
router.post('/reset-password', passwordResetLimiter, resetPasswordValidation, (req, res, next) => authController.resetPassword(req, res, next));

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/pages/login.html?error=OAuthFailed' }), (req, res, next) => authController.oauthSuccessCallback(req, res, next));

// GitHub OAuth Routes
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate('github', { session: false, failureRedirect: '/pages/login.html?error=OAuthFailed' }), (req, res, next) => authController.oauthSuccessCallback(req, res, next));

module.exports = router;
