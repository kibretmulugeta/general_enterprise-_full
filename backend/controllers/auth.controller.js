const authService = require('../services/auth.service');
const sessionService = require('../services/session.service');
const oauthService = require('../services/oauth.service');
const { sendTokenCookies, clearTokenCookies } = require('../utils/jwt');

class AuthController {
  /**
   * Local Register
   */
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body, req);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify Email Address
   */
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      const result = await authService.verifyEmail(token, req);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Local Login
   */
  async login(req, res, next) {
    try {
      const result = await authService.login(req.body, req);

      if (result.mfaRequired) {
        return res.status(200).json({
          success: true,
          data: {
            mfaRequired: true,
            userId: result.userId,
            message: result.message
          }
        });
      }

      // Send HttpOnly token cookies
      sendTokenCookies(res, result.accessToken, result.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout
   */
  async logout(req, res, next) {
    try {
      if (req.sessionId && req.user) {
        await sessionService.revokeSession(req.sessionId, req.user._id);
      }
      clearTokenCookies(res);
      res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully.' }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh Token Endpoint
   */
  async refresh(req, res, next) {
    try {
      const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!incomingRefreshToken) {
        return res.status(401).json({
          success: false,
          error: { message: 'Refresh token missing.' }
        });
      }

      const { accessToken, refreshToken } = await sessionService.rotateRefreshToken(incomingRefreshToken, req);
      sendTokenCookies(res, accessToken, refreshToken);

      res.status(200).json({
        success: true,
        data: { accessToken }
      });
    } catch (error) {
      clearTokenCookies(res);
      next(error);
    }
  }

  /**
   * Forgot Password
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email, req);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset Password
   */
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      const result = await authService.resetPassword(token, password, req);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Current Authenticated User profile (`/auth/me`)
   */
  async getMe(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: req.user._id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            displayName: req.user.displayName,
            email: req.user.email,
            role: req.user.role,
            permissions: req.user.permissions,
            profilePicture: req.user.profilePicture,
            mfaEnabled: req.user.mfaEnabled,
            googleId: req.user.googleId ? true : false,
            githubId: req.user.githubId ? true : false,
            createdAt: req.user.createdAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * OAuth Callback Success Handler
   */
  async oauthSuccessCallback(req, res, next) {
    try {
      if (!req.user || !req.user.accessToken) {
        return res.redirect('/pages/login.html?error=OAuthFailed');
      }

      sendTokenCookies(res, req.user.accessToken, req.user.refreshToken);
      res.redirect('/pages/dashboard.html');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
