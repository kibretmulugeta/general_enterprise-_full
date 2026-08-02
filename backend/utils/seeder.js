const Role = require('../models/Role');
const Permission = require('../models/Permission');
const RolePermission = require('../models/RolePermission');
const User = require('../models/User');
const { hashPassword } = require('./password');
const { ROLES, PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, USER_STATUS } = require('../config/constants');
const logger = require('./logger');

/**
 * Automatically seeds database with roles, permissions, and initial Super Admin
 */
const seedDatabase = async () => {
  try {
    logger.info('[Seeder] Initializing database seed...');

    // 1. Seed Granular Permissions
    const permissionDocs = Object.values(PERMISSIONS).map(code => {
      const parts = code.split('.');
      return {
        code,
        name: code.replace('.', ' ').toUpperCase(),
        module: parts[0] || 'general',
        description: `Permission to ${parts[1] || 'manage'} ${parts[0] || 'resource'}`
      };
    });

    for (const perm of permissionDocs) {
      await Permission.updateOne({ code: perm.code }, { $set: perm }, { upsert: true });
    }

    // 2. Seed Default Roles
    for (const roleName of Object.values(ROLES)) {
      await Role.updateOne(
        { name: roleName },
        {
          $set: {
            name: roleName,
            description: `Default system ${roleName} role`,
            permissions: DEFAULT_ROLE_PERMISSIONS[roleName] || [],
            isSystem: true
          }
        },
        { upsert: true }
      );
    }

    // 3. Seed RolePermission mappings
    for (const [roleName, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      for (const permCode of permissions) {
        await RolePermission.updateOne(
          { roleName, permissionCode: permCode },
          { $set: { roleName, permissionCode: permCode } },
          { upsert: true }
        );
      }
    }

    // 4. Seed Default Super Admin User
    const adminEmail = 'admin@enterprise.local';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedPassword = await hashPassword('Admin@123456!');
      await User.create({
        firstName: 'System',
        lastName: 'Administrator',
        displayName: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: ROLES.SUPER_ADMIN,
        status: USER_STATUS.ACTIVE,
        isVerified: true,
        provider: 'local'
      });
      logger.info(`[Seeder] Created default Super Admin user (${adminEmail} / Admin@123456!)`);
    }

    logger.info('[Seeder] Database seeding completed successfully.');
  } catch (error) {
    logger.error(`[Seeder Error] Database seeding failed: ${error.message}`);
  }
};

module.exports = seedDatabase;
