const roleRepository = require('../repositories/role.repository');
const { DEFAULT_ROLE_PERMISSIONS } = require('../config/constants');

/**
 * Permission-Based Access Control (PBAC) Middleware
 * Checks if user's role or custom per-user permissions grant the required permission code.
 * @param {string} requiredPermission - Permission code (e.g. 'user.create', 'booking.cancel')
 */
const authorizePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Authentication required.' }
        });
      }

      // Super Admin bypasses all PBAC checks
      if (req.user.role === 'Super Admin') {
        return next();
      }

      // 1. Check custom per-user permission overrides
      const userPermissions = await roleRepository.getUserPermissions(req.user._id);
      const userOverride = userPermissions.find(p => p.permissionCode === requiredPermission);

      if (userOverride) {
        if (userOverride.granted === true) {
          return next();
        } else {
          return res.status(403).json({
            success: false,
            error: { message: `Access denied. Permission '${requiredPermission}' has been explicitly revoked for your user account.` }
          });
        }
      }

      // 2. Check role-level permissions
      const rolePermissions = DEFAULT_ROLE_PERMISSIONS[req.user.role] || [];
      if (rolePermissions.includes(requiredPermission) || req.user.permissions?.includes(requiredPermission)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: { message: `Access denied. Missing required permission: '${requiredPermission}'` }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { message: 'Permission evaluation error', details: error.message }
      });
    }
  };
};

module.exports = { authorizePermission };
