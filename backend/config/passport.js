const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const oauthService = require('../services/oauth.service');
const logger = require('../utils/logger');

module.exports = function configurePassport() {
  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id' && process.env.GOOGLE_CLIENT_ID !== 'mock_google_client_id') {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback',
          passReqToCallback: true
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            const result = await oauthService.handleOAuthCallback({ provider: 'google', profile, req });
            return done(null, result);
          } catch (err) {
            logger.error(`[Passport Google OAuth Error] ${err.message}`);
            return done(err, null);
          }
        }
      )
    );
  } else {
    logger.warn('[Passport Warning] Google OAuth Client ID not configured. Google OAuth disabled.');
  }

  // GitHub OAuth Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID !== 'your-github-client-id' && process.env.GITHUB_CLIENT_ID !== 'mock_github_client_id') {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/github/callback',
          passReqToCallback: true
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            const result = await oauthService.handleOAuthCallback({ provider: 'github', profile, req });
            return done(null, result);
          } catch (err) {
            logger.error(`[Passport GitHub OAuth Error] ${err.message}`);
            return done(err, null);
          }
        }
      )
    );
  } else {
    logger.warn('[Passport Warning] GitHub OAuth Client ID not configured. GitHub OAuth disabled.');
  }
};
