const mongoose = require('mongoose');
const { DOCUMENT_STATUS } = require('../../../constants/documentStatus');

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    signedFileName: { type: String },
    userId: { type: String, required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    firebaseUid: { type: String, required: true, index: true },
    status: { type: String, enum: Object.values(DOCUMENT_STATUS), default: DOCUMENT_STATUS.DRAFT, index: true },
    pageCount: { type: Number, required: true },
    documentHash: { type: String, required: true },
    signedVersion: { type: Number, default: 0 },
    expiresAt: { type: Date },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

documentSchema.index({ ownerId: 1, createdAt: -1 });
documentSchema.index({ title: 'text' });

module.exports = mongoose.model('Document', documentSchema);
