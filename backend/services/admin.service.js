const userRepository = require('../repositories/user.repository');
const roleRepository = require('../repositories/role.repository');
const Session = require('../models/Session');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

class AdminService {
  /**
   * Get Paginated Users
   */
  async getUsers(params) {
    const { page = 1, limit = 10, search, role, status } = params;
    const query = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { displayName: new RegExp(search, 'i') }
      ];
    }

    return await userRepository.findPaginated(query, page, limit);
  }

  /**
   * Update User Role
   */
  async updateUserRole(userId, newRole) {
    const roleExists = await roleRepository.findRoleByName(newRole);
    if (!roleExists && !['Super Admin', 'Admin', 'Manager', 'Employee', 'User', 'Guest'].includes(newRole)) {
      throw new Error('Invalid role specified.');
    }

    return await userRepository.update(userId, { role: newRole });
  }

  /**
   * Update User Status
   */
  async updateUserStatus(userId, status) {
    return await userRepository.update(userId, { status });
  }

  /**
   * Get Platform Auth Analytics
   */
  async getAnalytics() {
    const [
      totalUsers,
      activeUsers,
      onlineSessions,
      totalAuditLogs,
      loginSuccessCount,
      loginFailedCount,
      providerStats
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Session.countDocuments({ isValid: true, expiresAt: { $gt: new Date() } }),
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ action: 'LOGIN_SUCCESS' }),
      AuditLog.countDocuments({ action: 'LOGIN_FAILED' }),
      User.aggregate([
        { $group: { _id: '$provider', count: { $sum: 1 } } }
      ])
    ]);

    const formattedProviderStats = {};
    providerStats.forEach((p) => {
      formattedProviderStats[p._id || 'local'] = p.count;
    });

    return {
      totalUsers,
      activeUsers,
      onlineSessions,
      totalAuditLogs,
      logins: {
        success: loginSuccessCount,
        failed: loginFailedCount
      },
      providers: formattedProviderStats
    };
  }

  /**
   * Get Roles and Permissions List
   */
  async getRolesAndPermissions() {
    const [roles, permissions] = await Promise.all([
      roleRepository.getAllRoles(),
      roleRepository.getAllPermissions()
    ]);
    return { roles, permissions };
  }
}

module.exports = new AdminService();
