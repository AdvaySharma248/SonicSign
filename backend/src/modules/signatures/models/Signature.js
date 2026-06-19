const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    signerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Signer', required: true, index: true },
    page: { type: Number, required: true, min: 1 },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 },
    signatureImage: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Signature', signatureSchema);
