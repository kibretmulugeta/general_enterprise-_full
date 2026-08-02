/**
 * Role-Based Access Control (RBAC) Middleware
 * @param  {...string} allowedRoles - List of authorized roles (e.g., 'Admin', 'Super Admin')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required.' }
      });
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        error: { message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]` }
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
