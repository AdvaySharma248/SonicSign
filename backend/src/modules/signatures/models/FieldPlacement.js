const mongoose = require('mongoose');

const fieldPlacementSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    signerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Signer', required: true, index: true },
    page: { type: Number, required: true, min: 1 },
    // Coordinates are percentages measured from the top-left of the rendered PDF page.
    x: { type: Number, required: true, min: 0, max: 100 },
    y: { type: Number, required: true, min: 0, max: 100 },
    width: { type: Number, required: true, min: 1, max: 100 },
    height: { type: Number, required: true, min: 1, max: 100 },
    type: { type: String, enum: ['signature', 'initials', 'date', 'text'], required: true },
    required: { type: Boolean, default: true },
    label: { type: String, trim: true, maxlength: 120 },
  },
  { timestamps: true }
);

fieldPlacementSchema.index({ documentId: 1, page: 1 });
module.exports = mongoose.model('FieldPlacement', fieldPlacementSchema);
