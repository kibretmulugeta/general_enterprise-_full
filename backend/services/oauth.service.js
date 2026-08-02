const userRepository = require('../repositories/user.repository');
const OAuthAccount = require('../models/OAuthAccount');
const sessionService = require('./session.service');
const auditService = require('./audit.service');
const { AUDIT_ACTIONS, USER_STATUS, ROLES } = require('../config/constants');

class OAuthService {
  /**
   * Handle OAuth Login / Registration callback
   */
  async handleOAuthCallback({ provider, profile, req }) {
    const providerId = profile.id;
    const email = (profile.emails && profile.emails[0] ? profile.emails[0].value : '').toLowerCase();
    const displayName = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || profile.username || 'User';
    const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : '/images/default-avatar.png';

    // 1. Check if OAuth record exists
    let oauthAccount = await OAuthAccount.findOne({ provider, providerId });
    let user = null;

    if (oauthAccount) {
      user = await userRepository.findById(oauthAccount.userId);
    }

    // 2. If no OAuth record, check if user exists by email
    if (!user && email) {
      user = await userRepository.findByEmail(email);
    }

    // 3. Create user if still doesn't exist
    if (!user) {
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || 'Social';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      user = await userRepository.create({
        firstName,
        lastName,
        displayName,
        email: email || `${provider}_${providerId}@enterprise.local`,
        profilePicture: avatarUrl,
        provider,
        role: ROLES.USER,
        status: USER_STATUS.ACTIVE,
        isVerified: true // OAuth emails are verified by provider
      });
    }

    // Update social provider ID on user model
    if (provider === 'google' && !user.googleId) {
      user.googleId = providerId;
      await user.save();
    } else if (provider === 'github' && !user.githubId) {
      user.githubId = providerId;
      await user.save();
    }

    // 4. Link OAuth Account if not already linked
    if (!oauthAccount) {
      oauthAccount = await OAuthAccount.create({
        userId: user._id,
        provider,
        providerId,
        email,
        displayName,
        avatarUrl,
        profileData: profile
      });
    }

    // Update login count & metadata
    await userRepository.updateLoginMetadata(user._id);

    // 5. Create Session & Tokens
    const { accessToken, refreshToken, session } = await sessionService.createSession(user, req);

    await auditService.log({
      req,
      userId: user._id,
      userEmail: user.email,
      action: AUDIT_ACTIONS.OAUTH_LINKED,
      status: 'SUCCESS',
      details: { provider, providerId }
    });

    return {
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
}

module.exports = new OAuthService();
