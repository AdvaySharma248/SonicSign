const DOCUMENT_STATUS = Object.freeze({
  DRAFT: 'draft',
  PENDING: 'pending',
  VIEWED: 'viewed',
  PARTIALLY_SIGNED: 'partially_signed',
  COMPLETED: 'completed',
  SIGNED: 'signed',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  ARCHIVED: 'archived',
});

const SIGNER_STATUS = Object.freeze({
  PENDING: 'pending',
  VIEWED: 'viewed',
  SIGNED: 'signed',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
});

module.exports = { DOCUMENT_STATUS, SIGNER_STATUS };
