const FieldPlacement = require('../models/FieldPlacement');
const FieldValue = require('../models/FieldValue');

const fieldRepository = {
  replaceForDocument(documentId, fields) {
    return FieldPlacement.deleteMany({ documentId }).then(() => FieldPlacement.insertMany(fields));
  },
  listByDocument(documentId) { return FieldPlacement.find({ documentId }).populate('signerId', 'name email status').sort('page createdAt'); },
  listBySigner(signerId) { return FieldPlacement.find({ signerId }).sort('page createdAt'); },
  listValuesByDocument(documentId) { return FieldValue.find({ documentId }); },
  createValue(value) { return FieldValue.findOneAndUpdate({ fieldId: value.fieldId }, value, { new: true, upsert: true, runValidators: true }); },
};

module.exports = { fieldRepository };
