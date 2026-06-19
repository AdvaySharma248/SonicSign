const { documentRepository } = require('../../documents/repositories/documentRepository');
const { auditService } = require('../../audit/services/auditService');
const { DOCUMENT_STATUS } = require('../../../constants/documentStatus');
const Signer = require('../../signatures/models/Signer');

function formatDocument(doc, signersForDoc = [], owner = {}) {
  const ownerName = owner.name || owner.email || '';

  return {
    id: doc._id.toString(),
    name: doc.title,
    owner: ownerName,
    ownerAvatar: owner.avatar || '',
    date: doc.createdAt.toISOString().split('T')[0],
    status: doc.status,
    size: `${(doc.pageCount * 0.15 + 0.2).toFixed(1)} MB`,
    pages: doc.pageCount,
    signers: signersForDoc.map(s => ({
      id: s._id.toString(),
      name: s.name,
      email: s.email,
      status: s.status,
      signedAt: s.signedAt ? s.signedAt.toISOString() : undefined
    })),
    lastModified: doc.updatedAt.toISOString(),
  };
}

function formatActivity(log) {
  let type = 'update';
  const actionStr = log.action;
  if (actionStr === 'USER_LOGIN') type = 'login';
  else if (actionStr === 'DOCUMENT_UPLOADED') type = 'upload';
  else if (actionStr === 'DOCUMENT_VIEWED') type = 'view';
  else if (actionStr === 'DOCUMENT_DOWNLOADED') type = 'download';
  else if (actionStr === 'DOCUMENT_DELETED') type = 'delete';
  else if (actionStr === 'SIGNER_ADDED') type = 'request';
  else if (actionStr === 'SIGNATURE_ADDED' || actionStr === 'DOCUMENT_SIGNED') type = 'sign';
  else if (actionStr === 'DOCUMENT_REJECTED') type = 'reject';

  const userName = log.userId?.name || log.userId?.email || '';

  return {
    id: log._id.toString(),
    type,
    user: userName,
    action: log.description,
    target: log.documentId?.title || '',
    timestamp: log.createdAt.toISOString(),
    avatar: log.userId?.avatar || '',
  };
}

const dashboardService = {
  async summary(user) {
    const [counts, auditResult, recentDocsList, pendingDocsList] = await Promise.all([
      documentRepository.countByStatus(user._id),
      auditService.listForUser(user.id, { limit: 10 }),
      documentRepository.recent(user._id, null, 5),
      documentRepository.recent(user._id, DOCUMENT_STATUS.PENDING, 10),
    ]);

    const countsMap = counts.reduce((accumulator, count) => {
      accumulator[count._id] = count.count;
      return accumulator;
    }, {});

    const draft = countsMap['draft'] || 0;
    const pending = countsMap['pending'] || 0;
    const viewed = countsMap['viewed'] || 0;
    const signed = countsMap['signed'] || 0;
    const rejected = countsMap['rejected'] || 0;
    const expired = countsMap['expired'] || 0;
    const archived = countsMap['archived'] || 0;
    const totalDocuments = draft + pending + viewed + signed + rejected + expired + archived;

    const stats = {
      totalDocuments,
      draft,
      pending,
      viewed,
      signed,
      rejected,
      expired,
      archived,
    };

    // Combine document IDs to fetch signers in one query
    const docIds = [...new Set([
      ...recentDocsList.map(d => d._id),
      ...pendingDocsList.map(d => d._id),
    ])];

    const signers = docIds.length > 0 ? await Signer.find({ documentId: { $in: docIds } }) : [];

    const signersMap = signers.reduce((acc, signer) => {
      const docIdStr = signer.documentId.toString();
      if (!acc[docIdStr]) acc[docIdStr] = [];
      acc[docIdStr].push(signer);
      return acc;
    }, {});

    const recentDocuments = recentDocsList.map(doc => 
      formatDocument(doc, signersMap[doc._id.toString()] || [], user)
    );

    const pendingDocuments = pendingDocsList.map(doc => 
      formatDocument(doc, signersMap[doc._id.toString()] || [], user)
    );

    const recentActivities = (auditResult.auditLogs || []).map(formatActivity);

    return {
      stats,
      recentDocuments,
      recentActivities,
      pendingDocuments,
    };
  },
};

module.exports = { dashboardService };
