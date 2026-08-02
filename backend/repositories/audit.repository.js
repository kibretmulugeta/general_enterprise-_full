const AuditLog = require('../models/AuditLog');

class AuditRepository {
  async logEvent(eventData) {
    const log = new AuditLog(eventData);
    return await log.save();
  }

  async findLogs({ query = {}, page = 1, limit = 20, sort = { createdAt: -1 } }) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort(sort).skip(skip).limit(limit),
      AuditLog.countDocuments(query)
    ]);

    return {
      logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new AuditRepository();
