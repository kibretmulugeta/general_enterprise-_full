const auditService = require('../services/audit.service');

class AuditController {
  /**
   * Get Audit Logs (User sees own logs, Admin sees system-wide)
   */
  async getAuditLogs(req, res, next) {
    try {
      const queryParams = { ...req.query };

      // Non-admins can only view their own audit logs
      if (!['Super Admin', 'Admin'].includes(req.user.role)) {
        queryParams.userEmail = req.user.email;
      }

      const result = await auditService.getLogs(queryParams);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditController();
