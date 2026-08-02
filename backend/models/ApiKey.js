const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    prefix: {
      type: String,
      required: true
    },
    permissions: [{
      type: String
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    lastUsedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ApiKey', apiKeySchema);
