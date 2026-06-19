const Signature = require('../models/Signature');

const signatureRepository = {
  create(signature) {
    return Signature.create(signature);
  },

  findById(signatureId) {
    return Signature.findById(signatureId);
  },

  listByDocument(documentId) {
    return Signature.find({ documentId }).populate('signerId', 'name email status').sort('page createdAt');
  },

  listBySigner(signerId) {
    return Signature.find({ signerId }).sort('page createdAt');
  },

  updateById(signatureId, updates) {
    return Signature.findByIdAndUpdate(signatureId, updates, { new: true, runValidators: true });
  },

  deleteById(signatureId) {
    return Signature.findByIdAndDelete(signatureId);
  },
};

module.exports = { signatureRepository };
