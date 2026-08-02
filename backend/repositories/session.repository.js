const Session = require('../models/Session');
const RefreshToken = require('../models/RefreshToken');

class SessionRepository {
  async createSession(sessionData) {
    const session = new Session(sessionData);
    return await session.save();
  }

  async findSessionByTokenHash(tokenHash) {
    return await Session.findOne({ tokenHash, isValid: true });
  }

  async findActiveSessionsByUserId(userId) {
    return await Session.find({ userId, isValid: true }).sort({ lastActive: -1 });
  }

  async touchSession(sessionId) {
    return await Session.findByIdAndUpdate(sessionId, { lastActive: new Date() });
  }

  async revokeSession(sessionId, userId) {
    return await Session.findOneAndUpdate(
      { _id: sessionId, userId },
      { isValid: false },
      { new: true }
    );
  }

  async revokeAllUserSessions(userId, exceptSessionId = null) {
    const query = { userId, isValid: true };
    if (exceptSessionId) {
      query._id = { $ne: exceptSessionId };
    }
    return await Session.updateMany(query, { isValid: false });
  }

  async saveRefreshToken(tokenData) {
    const token = new RefreshToken(tokenData);
    return await token.save();
  }

  async findRefreshToken(tokenHash) {
    return await RefreshToken.findOne({ tokenHash });
  }

  async revokeRefreshToken(tokenHash, replacedByTokenHash = null) {
    return await RefreshToken.findOneAndUpdate(
      { tokenHash },
      { isRevoked: true, replacedByTokenHash },
      { new: true }
    );
  }
}

module.exports = new SessionRepository();
