const express = require('express');
const adminController = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');
const { authorizePermission } = require('../middleware/pbac.middleware');
const { ROLES, PERMISSIONS } = require('../config/constants');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN));

router.get('/users', authorizePermission(PERMISSIONS.USER_READ), (req, res, next) => adminController.getUsers(req, res, next));
router.put('/users/:id/role', authorizePermission(PERMISSIONS.ROLE_UPDATE), (req, res, next) => adminController.updateUserRole(req, res, next));
router.put('/users/:id/status', authorizePermission(PERMISSIONS.USER_UPDATE), (req, res, next) => adminController.updateUserStatus(req, res, next));
router.get('/analytics', (req, res, next) => adminController.getAnalytics(req, res, next));
router.get('/roles-permissions', authorizePermission(PERMISSIONS.PERMISSION_MANAGE), (req, res, next) => adminController.getRolesAndPermissions(req, res, next));

module.exports = router;
