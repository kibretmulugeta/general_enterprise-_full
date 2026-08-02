const auditRepository = require('../repositories/audit.repository');
const { parseUserAgent } = require('../utils/deviceParser');
const logger = require('../utils/logger');

class AuditService {
  /**
   * Log Security Audit Event
   */
  async log({ req, userId = null, userEmail = null, action, status = 'SUCCESS', details = {} }) {
    try {
      const ua = req ? parseUserAgent(req.headers['user-agent']) : { browser: 'N/A', os: 'N/A', device: 'N/A', raw: 'N/A' };
      const ipAddress = req ? (req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || '127.0.0.1') : '127.0.0.1';

      const eventData = {
        userId,
        userEmail: userEmail || req?.user?.email || null,
        action,
        ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : '127.0.0.1',
        userAgent: ua.raw,
        browser: ua.browser,
        os: ua.os,
        device: ua.device,
        status,
        details
      };

      await auditRepository.logEvent(eventData);
      logger.info(`[Audit Log] ${action} - Status: ${status} - User: ${userEmail || userId || 'Anonymous'}`);
    } catch (err) {
      logger.error(`[Audit Log Error] Failed to store audit log: ${err.message}`);
    }
  }

  async getLogs(queryParams) {
    const { page = 1, limit = 20, action, userEmail, status } = queryParams;
    const query = {};

    if (action) query.action = action;
    if (userEmail) query.userEmail = new RegExp(userEmail, 'i');
    if (status) query.status = status;

    return await auditRepository.findLogs({ query, page, limit });
  }
}

module.exports = new AuditService();
