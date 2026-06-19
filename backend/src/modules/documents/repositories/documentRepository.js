const Document = require('../models/Document');

const documentRepository = {
  create(document) {
    return Document.create(document);
  },

  findById(documentId) {
    return Document.findById(documentId).populate('ownerId', 'name email role');
  },

  findOwnedById(documentId, ownerId) {
    return Document.findOne({ _id: documentId, ownerId }).populate('ownerId', 'name displayName email avatar');
  },

  updateById(documentId, updates) {
    return Document.findByIdAndUpdate(documentId, updates, { new: true, runValidators: true });
  },

  deleteOwned(documentId, ownerId) {
    return Document.findOneAndDelete({ _id: documentId, ownerId });
  },

  async listForUser(userId, filters) {
    const query = { ownerId: userId };

    if (filters.status) query.status = filters.status;
    if (filters.from || filters.to) {
      query.createdAt = {};
      if (filters.from) query.createdAt.$gte = filters.from;
      if (filters.to) query.createdAt.$lte = filters.to;
    }
    if (filters.search) query.$text = { $search: filters.search };

    const page = Math.max(filters.page || 1, 1);
    const limit = Math.min(Math.max(filters.limit || 20, 1), 100);
    const skip = (page - 1) * limit;
    const sort = filters.sort || '-createdAt';

    const [documents, total] = await Promise.all([
      Document.find(query).sort(sort).skip(skip).limit(limit).populate('ownerId', 'name displayName email avatar'),
      Document.countDocuments(query),
    ]);

    return { documents, page, limit, total, pages: Math.ceil(total / limit) || 1 };
  },

  countByStatus(ownerId) {
    return Document.aggregate([
      { $match: { ownerId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  },

  recent(ownerId, status, limit = 5) {
    const query = { ownerId };
    if (status) query.status = status;
    return Document.find(query).sort('-updatedAt').limit(limit).populate('ownerId', 'name displayName email avatar');
  },

  markExpired(documentIds) {
    return Document.updateMany({ _id: { $in: documentIds } }, { status: 'expired' });
  },
};

module.exports = { documentRepository };
