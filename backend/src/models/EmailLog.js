const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
  {
    recipient: { type: String, required: true, lowercase: true, trim: true, index: true },
    subject: { type: String, required: true, trim: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    type: {
      type: String,
      enum: ['signing_request', 'reminder', 'document_completed', 'account_verification', 'password_reset'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['queued', 'processing', 'sent', 'delivered', 'failed', 'bounced', 'rejected'],
      default: 'queued',
      index: true,
    },
    errorMessage: { type: String },
    provider: { type: String, default: 'smtp' },
    messageId: { type: String },
    accepted: [{ type: String }],
    rejected: [{ type: String }],
    response: { type: String },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    html: { type: String },
    text: { type: String },
    retryCount: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailLog', emailLogSchema);
