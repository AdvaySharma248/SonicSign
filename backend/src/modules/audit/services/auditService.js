const { auditRepository } = require('../repositories/auditRepository');

const auditService = {
  record({ documentId, userId, ownerId, createdBy, firebaseUid, action, description, request, metadata }) {
    return auditRepository.create({
      documentId,
      userId,
      ownerId: ownerId || userId,
      createdBy: createdBy || userId,
      firebaseUid: firebaseUid || request?.user?.firebaseUid,
      action,
      description,
      ipAddress: request?.ip,
      userAgent: request?.headers?.['user-agent'],
      metadata,
    });
  },

  listForDocument(documentId, options = {}) {
    return auditRepository.list({ documentId, ...options });
  },

  listForUser(userId, options = {}) {
    return auditRepository.list({ userId, ...options });
  },
};

module.exports = { auditService };
