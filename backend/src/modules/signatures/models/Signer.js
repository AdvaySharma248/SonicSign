const mongoose = require('mongoose');
const { SIGNER_STATUS } = require('../../../constants/documentStatus');

const signerSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    userId: { type: String, required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, trim: true, maxlength: 120 },
    signingOrder: { type: Number, min: 1, default: 1 },
    isOwner: { type: Boolean, default: false },
    token: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: Object.values(SIGNER_STATUS), default: SIGNER_STATUS.PENDING },
    expiresAt: { type: Date, required: true },
    signedAt: { type: Date },
    viewedAt: { type: Date },
    ipAddress: { type: String },
    browserInfo: { type: String },
  },
  { timestamps: true }
);

signerSchema.index({ documentId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Signer', signerSchema);
