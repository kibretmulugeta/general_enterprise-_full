const Role = require('../models/Role');
const Permission = require('../models/Permission');
const RolePermission = require('../models/RolePermission');
const UserPermission = require('../models/UserPermission');

class RoleRepository {
  async findRoleByName(name) {
    return await Role.findOne({ name });
  }

  async getAllRoles() {
    return await Role.find();
  }

  async getAllPermissions() {
    return await Permission.find();
  }

  async getRolePermissions(roleName) {
    const mappings = await RolePermission.find({ roleName });
    return mappings.map((m) => m.permissionCode);
  }

  async getUserPermissions(userId) {
    return await UserPermission.find({ userId });
  }
}

module.exports = new RoleRepository();
