const { auditService } = require('../services/auditService');
const { documentService } = require('../../documents/services/documentService');
const { sendSuccess } = require('../../../utils/apiResponse');
const { asyncHandler } = require('../../../utils/asyncHandler');

const auditController = {
  listForDocument: asyncHandler(async (request, response) => {
    await documentService.getOwned(request.params.documentId, request.user);
    const { action, dateFrom, dateTo, page, limit } = request.query;
    const result = await auditService.listForDocument(request.params.documentId, { action, dateFrom, dateTo, page, limit });
    sendSuccess(response, 200, 'Audit logs fetched successfully', result);
  }),

  listMine: asyncHandler(async (request, response) => {
    const { action, dateFrom, dateTo, page, limit } = request.query;
    const result = await auditService.listForUser(request.user.id, { action, dateFrom, dateTo, page, limit });
    sendSuccess(response, 200, 'Audit logs fetched successfully', result);
  }),
};

module.exports = { auditController };
