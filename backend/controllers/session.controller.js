const sessionService = require('../services/session.service');
const auditService = require('../services/audit.service');
const { AUDIT_ACTIONS } = require('../config/constants');

class SessionController {
  /**
   * Get Active Sessions
   */
  async getSessions(req, res, next) {
    try {
      const sessions = await sessionService.getUserActiveSessions(req.user._id, req.sessionId);
      res.status(200).json({
        success: true,
        data: { sessions }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke Single Session by ID
   */
  async revokeSession(req, res, next) {
    try {
      const { id } = req.params;
      await sessionService.revokeSession(id, req.user._id);

      await auditService.log({
        req,
        userId: req.user._id,
        userEmail: req.user.email,
        action: AUDIT_ACTIONS.SESSION_REVOKED,
        status: 'SUCCESS',
        details: { revokedSessionId: id }
      });

      res.status(200).json({
        success: true,
        data: { message: 'Session revoked successfully.' }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke All Sessions Except Current
   */
  async revokeAllSessions(req, res, next) {
    try {
      await sessionService.revokeAllUserSessions(req.user._id, req.sessionId);

      await auditService.log({
        req,
        userId: req.user._id,
        userEmail: req.user.email,
        action: AUDIT_ACTIONS.ALL_SESSIONS_REVOKED,
        status: 'SUCCESS'
      });

      res.status(200).json({
        success: true,
        data: { message: 'All other active sessions have been revoked.' }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SessionController();
