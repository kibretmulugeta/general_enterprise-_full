const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session'
    },
    isRevoked: {
      type: Boolean,
      default: false
    },
    replacedByTokenHash: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // Automatic TTL expiration index
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
