const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', index: true },
    recipientEmail: { type: String, required: true, lowercase: true, trim: true },
    type: { type: String, required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ['queued', 'delivered', 'failed'], default: 'queued' },
    error: { type: String },
    provider: { type: String },
    providerMessageId: { type: String },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
