const adminService = require('../services/admin.service');
const auditService = require('../services/audit.service');
const { AUDIT_ACTIONS } = require('../config/constants');

class AdminController {
  /**
   * Get Users
   */
  async getUsers(req, res, next) {
    try {
      const result = await adminService.getUsers(req.query);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update User Role
   */
  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const user = await adminService.updateUserRole(id, role);

      await auditService.log({
        req,
        userId: req.user._id,
        userEmail: req.user.email,
        action: AUDIT_ACTIONS.ROLE_UPDATED,
        status: 'SUCCESS',
        details: { targetUserId: id, newRole: role }
      });

      res.status(200).json({
        success: true,
        data: { user, message: 'User role updated successfully.' }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update User Status
   */
  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const user = await adminService.updateUserStatus(id, status);

      res.status(200).json({
        success: true,
        data: { user, message: 'User status updated successfully.' }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Platform Analytics
   */
  async getAnalytics(req, res, next) {
    try {
      const analytics = await adminService.getAnalytics();
      res.status(200).json({
        success: true,
        data: { analytics }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Roles and Permissions
   */
  async getRolesAndPermissions(req, res, next) {
    try {
      const data = await adminService.getRolesAndPermissions();
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
