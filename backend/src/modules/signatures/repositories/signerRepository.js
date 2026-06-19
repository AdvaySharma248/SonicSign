const Signer = require('../models/Signer');

const signerRepository = {
  create(signer) {
    return Signer.create(signer);
  },

  findById(signerId) {
    return Signer.findById(signerId);
  },

  findByDocumentEmail(documentId, email) {
    return Signer.findOne({ documentId, email: String(email).toLowerCase().trim() });
  },

  findByToken(token) {
    return Signer.findOne({ token }).populate('documentId');
  },

  listByDocument(documentId) {
    return Signer.find({ documentId }).sort('createdAt');
  },

  deleteById(signerId) {
    return Signer.findByIdAndDelete(signerId);
  },

  updateById(signerId, updates) {
    return Signer.findByIdAndUpdate(signerId, updates, { new: true, runValidators: true });
  },

  async expirePending(now = new Date()) {
    const expiredSigners = await Signer.find({
      expiresAt: { $lt: now },
      status: { $in: ['pending', 'viewed'] },
    });

    await Signer.updateMany(
      { _id: { $in: expiredSigners.map((signer) => signer._id) } },
      { status: 'expired' }
    );

    return expiredSigners;
  },
  async listByOwner(ownerId) {
    const Document = require('../../documents/models/Document');
    const documents = await Document.find({ ownerId }).select('_id title');
    const docIds = documents.map(d => d._id);
    return Signer.find({ documentId: { $in: docIds } })
      .populate('documentId', 'title')
      .sort('-createdAt');
  },
};

module.exports = { signerRepository };
