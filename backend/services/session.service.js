const sessionRepository = require('../repositories/session.repository');
const { parseUserAgent } = require('../utils/deviceParser');
const { hashToken, generateRandomToken } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

class SessionService {
  /**
   * Create a new session and issue access/refresh token pair
   */
  async createSession(user, req) {
    const ua = parseUserAgent(req.headers['user-agent']);
    const ipAddress = (req.headers['x-forwarded-for'] || req.ip || '127.0.0.1').toString().split(',')[0].trim();

    // Create session record
    const { token: sessionToken, tokenHash } = generateRandomToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await sessionRepository.createSession({
      userId: user._id,
      tokenHash,
      ipAddress,
      userAgent: ua.raw,
      browser: ua.browser,
      os: ua.os,
      device: ua.device,
      country: 'Local',
      expiresAt
    });

    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId: session._id.toString()
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store hashed refresh token in database for rotation security
    const refreshTokenHash = hashToken(refreshToken);
    await sessionRepository.saveRefreshToken({
      userId: user._id,
      tokenHash: refreshTokenHash,
      sessionId: session._id,
      expiresAt
    });

    return { accessToken, refreshToken, session };
  }

  /**
   * Refresh Token Rotation Logic
   */
  async rotateRefreshToken(incomingRefreshToken, req) {
    const decoded = verifyRefreshToken(incomingRefreshToken);
    const incomingTokenHash = hashToken(incomingRefreshToken);

    const storedToken = await sessionRepository.findRefreshToken(incomingTokenHash);

    if (!storedToken) {
      throw new Error('Invalid refresh token.');
    }

    if (storedToken.isRevoked) {
      // Security breach detected: Revoke ALL sessions for this user!
      await sessionRepository.revokeAllUserSessions(decoded.id);
      throw new Error('Security Alert: Revoked refresh token reused. All sessions terminated.');
    }

    // Mark current token as revoked
    const { token: newSessionToken, tokenHash: newSessionTokenHash } = generateRandomToken();
    const tokenPayload = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      sessionId: decoded.sessionId
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);
    const newRefreshTokenHash = hashToken(newRefreshToken);

    await sessionRepository.revokeRefreshToken(incomingTokenHash, newRefreshTokenHash);

    // Save new refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await sessionRepository.saveRefreshToken({
      userId: decoded.id,
      tokenHash: newRefreshTokenHash,
      sessionId: decoded.sessionId,
      expiresAt
    });

    // Touch active session timestamp
    await sessionRepository.touchSession(decoded.sessionId);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /**
   * Get Active Sessions for User
   */
  async getUserActiveSessions(userId, currentSessionId = null) {
    const sessions = await sessionRepository.findActiveSessionsByUserId(userId);
    return sessions.map((s) => ({
      id: s._id,
      ipAddress: s.ipAddress,
      device: s.device,
      browser: s.browser,
      os: s.os,
      lastActive: s.lastActive,
      isCurrent: currentSessionId ? s._id.toString() === currentSessionId.toString() : false
    }));
  }

  /**
   * Revoke Session
   */
  async revokeSession(sessionId, userId) {
    return await sessionRepository.revokeSession(sessionId, userId);
  }

  /**
   * Revoke All Sessions
   */
  async revokeAllUserSessions(userId, exceptSessionId = null) {
    return await sessionRepository.revokeAllUserSessions(userId, exceptSessionId);
  }
}

module.exports = new SessionService();
