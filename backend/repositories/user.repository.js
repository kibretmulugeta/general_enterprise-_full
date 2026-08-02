const User = require('../models/User');

class UserRepository {
  async findById(id, includeSecrets = false) {
    let query = User.findById(id);
    if (includeSecrets) {
      query = query.select('+password +mfaSecret +recoveryCodes');
    }
    return await query;
  }

  async findByEmail(email, includeSecrets = false) {
    let query = User.findOne({ email: email.toLowerCase() });
    if (includeSecrets) {
      query = query.select('+password +mfaSecret +recoveryCodes');
    }
    return await query;
  }

  async findByGoogleId(googleId) {
    return await User.findOne({ googleId });
  }

  async findByGithubId(githubId) {
    return await User.findOne({ githubId });
  }

  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async update(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async updateLoginMetadata(userId) {
    return await User.findByIdAndUpdate(userId, {
      $set: {
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        lockUntil: null
      },
      $inc: { loginCount: 1 }
    }, { new: true });
  }

  async incrementFailedAttempts(user, maxAttempts = 5, lockTimeMinutes = 15) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= maxAttempts) {
      user.lockUntil = new Date(Date.now() + lockTimeMinutes * 60 * 1000);
    }
    return await user.save();
  }

  async findPaginated(query = {}, page = 1, limit = 10, sort = { createdAt: -1 }) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).sort(sort).skip(skip).limit(limit),
      User.countDocuments(query)
    ]);

    return {
      users,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new UserRepository();
