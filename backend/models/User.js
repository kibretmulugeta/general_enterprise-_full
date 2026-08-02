const mongoose = require('mongoose');
const { USER_STATUS, ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      default: null, // Null if user signed up solely via OAuth
      select: false  // Hidden by default in queries
    },
    profilePicture: {
      type: String,
      default: '/images/default-avatar.png'
    },
    googleId: {
      type: String,
      sparse: true,
      index: true
    },
    githubId: {
      type: String,
      sparse: true,
      index: true
    },
    provider: {
      type: String,
      default: 'local',
      enum: ['local', 'google', 'github', 'microsoft', 'apple', 'linkedin', 'facebook', 'twitter']
    },
    role: {
      type: String,
      default: ROLES.USER,
      index: true
    },
    permissions: [{
      type: String
    }],
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.PENDING_VERIFICATION
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    mfaEnabled: {
      type: Boolean,
      default: false
    },
    mfaSecret: {
      type: String,
      default: null,
      select: false
    },
    recoveryCodes: [{
      type: String,
      select: false
    }],
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date,
      default: null
    },
    lastLogin: {
      type: Date,
      default: null
    },
    loginCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Virtual property for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Helper instance method to check if account is currently locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

module.exports = mongoose.model('User', userSchema);
