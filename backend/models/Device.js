const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    deviceFingerprint: {
      type: String,
      required: true
    },
    deviceName: {
      type: String,
      default: 'Unknown Device'
    },
    isTrusted: {
      type: Boolean,
      default: false
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

deviceSchema.index({ userId: 1, deviceFingerprint: 1 }, { unique: true });

module.exports = mongoose.model('Device', deviceSchema);
