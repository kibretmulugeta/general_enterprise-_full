const mongoose = require('mongoose');

const userPermissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    permissionCode: {
      type: String,
      required: true
    },
    granted: {
      type: Boolean, // true = explicit grant, false = explicit revoke/deny
      default: true
    }
  },
  {
    timestamps: true
  }
);

userPermissionSchema.index({ userId: 1, permissionCode: 1 }, { unique: true });

module.exports = mongoose.model('UserPermission', userPermissionSchema);
