const mongoose = require('mongoose');

const rolePermissionSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      required: true,
      index: true
    },
    permissionCode: {
      type: String,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

rolePermissionSchema.index({ roleName: 1, permissionCode: 1 }, { unique: true });

module.exports = mongoose.model('RolePermission', rolePermissionSchema);
