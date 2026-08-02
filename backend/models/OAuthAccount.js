const mongoose = require('mongoose');

const oauthAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    provider: {
      type: String,
      required: true,
      enum: ['google', 'github', 'microsoft', 'apple', 'linkedin', 'facebook', 'twitter']
    },
    providerId: {
      type: String,
      required: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    displayName: {
      type: String
    },
    avatarUrl: {
      type: String
    },
    profileData: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

oauthAccountSchema.index({ provider: 1, providerId: 1 }, { unique: true });

module.exports = mongoose.model('OAuthAccount', oauthAccountSchema);
