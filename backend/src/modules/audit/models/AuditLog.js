const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    firebaseUid: { type: String, index: true },
    action: { type: String, required: true, index: true },
    description: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
