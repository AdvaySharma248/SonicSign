const mongoose = require('mongoose');

const fieldValueSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    signerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Signer', required: true, index: true },
    fieldId: { type: mongoose.Schema.Types.ObjectId, ref: 'FieldPlacement', required: true, unique: true },
    page: { type: Number, required: true, min: 1 },
    type: { type: String, enum: ['signature', 'initials', 'date', 'text'], required: true },
    value: { type: String, required: true },
    signatureMethod: { type: String, enum: ['draw', 'type', 'upload'] },
    signerEmail: { type: String, required: true, lowercase: true, trim: true },
    signerName: { type: String, required: true, trim: true },
    ipAddress: { type: String },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FieldValue', fieldValueSchema);
