const userRepository = require('../repositories/user.repository');
const authService = require('../services/auth.service');
const auditService = require('../services/audit.service');
const { hashPassword, comparePassword } = require('../utils/password');
const { AUDIT_ACTIONS } = require('../config/constants');
const OAuthAccount = require('../models/OAuthAccount');

class ProfileController {
  /**
   * Update Profile Details
   */
  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, displayName } = req.body;
      const updateData = {};

      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (displayName) updateData.displayName = displayName;

      const updatedUser = await userRepository.update(req.user._id, updateData);

      await auditService.log({
        req,
        userId: req.user._id,
        userEmail: req.user.email,
        action: AUDIT_ACTIONS.PROFILE_UPDATED,
        status: 'SUCCESS'
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            displayName: updatedUser.displayName,
            email: updatedUser.email,
            profilePicture: updatedUser.profilePicture
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload Profile Avatar
   */
  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { message: 'No image file uploaded.' }
        });
      }

      const avatarPath = `/uploads/${req.file.filename}`;
      const updatedUser = await userRepository.update(req.user._id, { profilePicture: avatarPath });

      res.status(200).json({
        success: true,
        data: {
          profilePicture: avatarPath,
          message: 'Avatar uploaded successfully.'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change Password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await userRepository.findById(req.user._id, true);

      if (user.password) {
        const isMatch = await comparePassword(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({
            success: false,
            error: { message: 'Current password does not match.' }
          });
        }
      }

      const hashedPassword = await hashPassword(newPassword);
      user.password = hashedPassword;
      await user.save();

      await auditService.log({
        req,
        userId: user._id,
        userEmail: user.email,
        action: AUDIT_ACTIONS.PASSWORD_CHANGED,
        status: 'SUCCESS'
      });

      res.status(200).json({
        success: true,
        data: { message: 'Password updated successfully!' }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Setup 2FA
   */
  async setup2FA(req, res, next) {
    try {
      const result = await authService.setupMFA(req.user._id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enable 2FA
   */
  async enable2FA(req, res, next) {
    try {
      const { token } = req.body;
      const result = await authService.enableMFA(req.user._id, token, req);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disable 2FA
   */
  async disable2FA(req, res, next) {
    try {
      const { password } = req.body;
      const result = await authService.disableMFA(req.user._id, password, req);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Connected OAuth Accounts
   */
  async getConnectedAccounts(req, res, next) {
    try {
      const accounts = await OAuthAccount.find({ userId: req.user._id });
      res.status(200).json({
        success: true,
        data: { accounts }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProfileController();
