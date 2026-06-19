const AuditLog = require('../models/AuditLog');

const auditRepository = {
  create(auditLog) {
    return AuditLog.create(auditLog);
  },

  async list(filters = {}) {
    const query = {};
    if (filters.documentId) query.documentId = filters.documentId;
    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }

    const page = Math.max(Number(filters.page) || 1, 1);
    const limit = Math.min(Math.max(Number(filters.limit) || 100, 1), 200);
    const skip = (page - 1) * limit;

    const [auditLogs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email avatar')
        .populate('documentId', 'title fileName')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query),
    ]);

    return {
      auditLogs,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    };
  },
};

module.exports = { auditRepository };
