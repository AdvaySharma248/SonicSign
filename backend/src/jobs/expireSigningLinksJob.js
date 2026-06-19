const { signerRepository } = require('../modules/signatures/repositories/signerRepository');
const { documentRepository } = require('../modules/documents/repositories/documentRepository');

async function expireSigningLinksJob() {
  const expiredSigners = await signerRepository.expirePending();
  const documentIds = [...new Set(expiredSigners.map((signer) => signer.documentId.toString()))];

  if (documentIds.length) {
    await documentRepository.markExpired(documentIds);
  }
}

module.exports = { expireSigningLinksJob };
