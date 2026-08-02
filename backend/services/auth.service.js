const userRepository = require('../repositories/user.repository');
const sessionService = require('./session.service');
const auditService = require('./audit.service');
const { hashPassword, comparePassword, generateRandomToken, hashToken } = require('../utils/password');
const { generateMFASecret, verifyTOTP } = require('../utils/totp');
const { sendVerificationEmail, sendPasswordResetEmail, sendAccountLockedEmail, sendNewLoginEmail } = require('../emails/email.service');
const { AUDIT_ACTIONS, USER_STATUS, ROLES } = require('../config/constants');
const EmailVerificationToken = require('../models/EmailVerificationToken');
const PasswordResetToken = require('../models/PasswordResetToken');

class AuthService {
  /**
   * Register new user with Email + Password
   */
  async register(userData, req) {
    const { firstName, lastName, email, password } = userData;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email address is already registered.');
    }

    const hashedPassword = await hashPassword(password);
    const displayName = `${firstName} ${lastName}`.trim();

    const user = await userRepository.create({
      firstName,
      lastName,
      displayName,
      email: email.toLowerCase(),
      password: hashedPassword,
      provider: 'local',
      role: ROLES.USER,
      status: USER_STATUS.PENDING_VERIFICATION,
      isVerified: false
    });

    // Generate Email Verification Token
    const { token, tokenHash } = generateRandomToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await EmailVerificationToken.create({
      userId: user._id,
      tokenHash,
      expiresAt
    });

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/pages/verify-email.html?token=${token}`;
    
    // Dispatch verification email in background
    sendVerificationEmail(user.email, user.firstName, verificationUrl).catch(console.error);

    await auditService.log({
      req,
      userId: user._id,
      userEmail: user.email,
      action: AUDIT_ACTIONS.REGISTER_SUCCESS,
      status: 'SUCCESS'
    });

    return {
      message: 'Registration successful! Please check your email to verify your account.',
      userId: user._id,
      email: user.email
    };
  }

  /**
   * Verify User Email Address
   */
  async verifyEmail(token, req) {
    const tokenHash = hashToken(token);
    const record = await EmailVerificationToken.findOne({ tokenHash });

    if (!record || record.expiresAt < new Date()) {
      throw new Error('Invalid or expired verification token.');
    }

    const user = await userRepository.findById(record.userId);
    if (!user) {
      throw new Error('User not found.');
    }

    user.isVerified = true;
    user.status = USER_STATUS.ACTIVE;
    await user.save();

    // Delete token record
    await EmailVerificationToken.deleteOne({ _id: record._id });

    await auditService.log({
      req,
      userId: user._id,
      userEmail: user.email,
      action: AUDIT_ACTIONS.EMAIL_VERIFIED,
      status: 'SUCCESS'
    });

    return { message: 'Email address verified successfully! You can now log in.' };
  }

  /**
   * Local Login Flow
   */
  async login({ email, password, mfaToken }, req) {
    const user = await userRepository.findByEmail(email, true);

    if (!user) {
      await auditService.log({
        req,
        userEmail: email,
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        status: 'FAILURE',
        details: { reason: 'User not found' }
      });
      throw new Error('Invalid email or password.');
    }

    // Check account locking
    if (user.isLocked()) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      await auditService.log({
        req,
        userId: user._id,
        userEmail: user.email,
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        status: 'FAILURE',
        details: { reason: 'Account locked' }
      });
      throw new Error(`Account is locked due to multiple failed login attempts. Try again in ${remainingMinutes} minutes.`);
    }

    // Verify Password
    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      const maxAttempts = parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS || '5', 10);
      const lockMinutes = parseInt(process.env.ACCOUNT_LOCK_TIME_MINUTES || '15', 10);
      const updatedUser = await userRepository.incrementFailedAttempts(user, maxAttempts, lockMinutes);

      if (updatedUser.isLocked()) {
        sendAccountLockedEmail(user.email, user.firstName, lockMinutes).catch(console.error);
        await auditService.log({
          req,
          userId: user._id,
          userEmail: user.email,
          action: AUDIT_ACTIONS.ACCOUNT_LOCKED,
          status: 'WARNING'
        });
      }

      await auditService.log({
        req,
        userId: user._id,
        userEmail: user.email,
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        status: 'FAILURE',
        details: { reason: 'Invalid password' }
      });

      throw new Error('Invalid email or password.');
    }

    // Check if Email is Verified
    if (!user.isVerified) {
      throw new Error('Please verify your email address before logging in.');
    }

    // Check Multi-Factor Authentication (2FA)
    if (user.mfaEnabled) {
      if (!mfaToken) {
        return {
          mfaRequired: true,
          userId: user._id,
          message: 'Multi-factor authentication code required.'
        };
      }

      // Verify MFA Token
      const isValidMFA = verifyTOTP(user.mfaSecret, mfaToken);
      let isRecoveryCode = false;

      if (!isValidMFA && user.recoveryCodes && user.recoveryCodes.length > 0) {
        const codeIndex = user.recoveryCodes.indexOf(mfaToken.toUpperCase());
        if (codeIndex !== -1) {
          isRecoveryCode = true;
          // Consume recovery code
          user.recoveryCodes.splice(codeIndex, 1);
          await user.save();
        }
      }

      if (!isValidMFA && !isRecoveryCode) {
        await auditService.log({
          req,
          userId: user._id,
          userEmail: user.email,
          action: AUDIT_ACTIONS.LOGIN_FAILED,
          status: 'FAILURE',
          details: { reason: 'Invalid 2FA TOTP code' }
        });
        throw new Error('Invalid 2FA authentication code.');
      }
    }

    // Login successful - Update user metadata
    await userRepository.updateLoginMetadata(user._id);

    // Create session and issue JWT tokens
    const { accessToken, refreshToken, session } = await sessionService.createSession(user, req);

    // Dispatch login alert email
    const ua = req ? req.headers['user-agent'] : '';
    sendNewLoginEmail(user.email, user.firstName, {
      ipAddress: req.ip || '127.0.0.1',
      browser: session.browser,
      os: session.os,
      device: session.device
    }).catch(console.error);

    await auditService.log({
      req,
      userId: user._id,
      userEmail: user.email,
      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      status: 'SUCCESS'
    });

    return {
      mfaRequired: false,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        mfaEnabled: user.mfaEnabled
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Request Password Reset
   */
  async forgotPassword(email, req) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Return success even if email not found to prevent user enumeration security attacks
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    const { token, tokenHash } = generateRandomToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordResetToken.create({
      userId: user._id,
      tokenHash,
      expiresAt
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/pages/reset-password.html?token=${token}`;

    sendPasswordResetEmail(user.email, user.firstName, resetUrl).catch(console.error);

    await auditService.log({
      req,
      userId: user._id,
      userEmail: user.email,
      action: AUDIT_ACTIONS.PASSWORD_RESET_REQUEST,
      status: 'SUCCESS'
    });

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  /**
   * Confirm Password Reset
   */
  async resetPassword(token, newPassword, req) {
    const tokenHash = hashToken(token);
    const record = await PasswordResetToken.findOne({ tokenHash, used: false });

    if (!record || record.expiresAt < new Date()) {
      throw new Error('Invalid or expired password reset token.');
    }

    const user = await userRepository.findById(record.userId, true);
    if (!user) {
      throw new Error('User not found.');
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    record.used = true;
    await record.save();

    // Revoke all existing active sessions for security
    await sessionService.revokeAllUserSessions(user._id);

    await auditService.log({
      req,
      userId: user._id,
      userEmail: user.email,
      action: AUDIT_ACTIONS.PASSWORD_RESET_SUCCESS,
      status: 'SUCCESS'
    });

    return { message: 'Password has been reset successfully! Please log in with your new password.' };
  }

  /**
   * Setup TOTP 2FA
   */
  async setupMFA(userId) {
    const user = await userRepository.findById(userId, true);
    if (!user) throw new Error('User not found.');

    const { base32Secret, qrCodeUrl, recoveryCodes } = await generateMFASecret(
      user.email,
      process.env.APP_NAME || 'Enterprise Auth'
    );

    // Temporarily save secret
    user.mfaSecret = base32Secret;
    user.recoveryCodes = recoveryCodes;
    await user.save();

    return {
      qrCodeUrl,
      secret: base32Secret,
      recoveryCodes
    };
  }

  /**
   * Enable 2FA after validating TOTP code
   */
  async enableMFA(userId, token, req) {
    const user = await userRepository.findById(userId, true);
    if (!user || !user.mfaSecret) {
      throw new Error('MFA setup not initialized.');
    }

    const isValid = verifyTOTP(user.mfaSecret, token);
    if (!isValid) {
      throw new Error('Invalid verification code.');
    }

    user.mfaEnabled = true;
    await user.save();

    await auditService.log({
      req,
      userId: user._id,
      userEmail: user.email,
      action: AUDIT_ACTIONS.MFA_ENABLED,
      status: 'SUCCESS'
    });

    return { message: 'Two-factor authentication has been enabled successfully!', recoveryCodes: user.recoveryCodes };
  }

  /**
   * Disable 2FA
   */
  async disableMFA(userId, password, req) {
    const user = await userRepository.findById(userId, true);
    if (!user) throw new Error('User not found.');

    if (user.password) {
      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) throw new Error('Incorrect password.');
    }

    user.mfaEnabled = false;
    user.mfaSecret = null;
    user.recoveryCodes = [];
    await user.save();

    await auditService.log({
      req,
      userId: user._id,
      userEmail: user.email,
      action: AUDIT_ACTIONS.MFA_DISABLED,
      status: 'SUCCESS'
    });

    return { message: 'Two-factor authentication has been disabled.' };
  }
}

module.exports = new AuthService();
