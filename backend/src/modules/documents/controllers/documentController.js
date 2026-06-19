const { documentService } = require('../services/documentService');
const { sendSuccess } = require('../../../utils/apiResponse');
const { asyncHandler } = require('../../../utils/asyncHandler');
const fs = require('fs');
const { signerRepository } = require('../../signatures/repositories/signerRepository');

function safeDownloadName(title) {
  return `${title.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'document'}.pdf`;
}

function setPdfHeaders(response, disposition, fileName, size) {
  response.status(200).set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `${disposition}; filename="${fileName}"`,
    'Content-Length': size,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
}

const documentController = {
  upload: asyncHandler(async (request, response) => {
    const document = await documentService.upload({
      title: request.body.title,
      file: request.file,
      owner: request.user,
      request,
    });
    sendSuccess(response, 201, 'Document uploaded successfully', {
      document,
      documentId: document.id,
      fileUrl: document.fileUrl,
      fileName: document.fileName,
    });
  }),

  list: asyncHandler(async (request, response) => {
    const documents = await documentService.list(request.user, {
      status: request.query.status,
      search: request.query.search,
      from: request.query.from ? new Date(request.query.from) : undefined,
      to: request.query.to ? new Date(request.query.to) : undefined,
      page: Number(request.query.page),
      limit: Number(request.query.limit),
      sort: request.query.sort,
    });
    sendSuccess(response, 200, 'Documents fetched successfully', documents);
  }),

  getById: asyncHandler(async (request, response) => {
    const document = await documentService.getOwned(request.params.id, request.user);
    const { signerService } = require('../../signatures/services/signerService');
    const signers = await signerService.listForDocument(document.id, request.user);
    sendSuccess(response, 200, 'Document fetched successfully', { document: { ...document.toObject(), signers } });
  }),

  update: asyncHandler(async (request, response) => {
    const document = await documentService.update(request.params.id, request.user, request.body, request);
    sendSuccess(response, 200, 'Document updated successfully', { document });
  }),

  remove: asyncHandler(async (request, response) => {
    await documentService.remove(request.params.id, request.user, request);
    sendSuccess(response, 200, 'Document deleted successfully');
  }),

  download: asyncHandler(async (request, response) => {
    const { document, filePath, size } = await documentService.download(
      request.params.id,
      request.user,
      request
    );
    setPdfHeaders(response, 'attachment', safeDownloadName(document.title), size);
    fs.createReadStream(filePath).pipe(response);
  }),

  view: asyncHandler(async (request, response) => {
    const { document, filePath, size } = await documentService.view(request.params.id, request.user);
    setPdfHeaders(response, 'inline', safeDownloadName(document.title), size);
    fs.createReadStream(filePath).pipe(response);
  }),

  viewMetadata: asyncHandler(async (request, response) => {
    const { document, size } = await documentService.view(request.params.id, request.user);
    setPdfHeaders(response, 'inline', safeDownloadName(document.title), size);
    response.end();
  }),

  verifyIntegrity: asyncHandler(async (request, response) => {
    const integrity = await documentService.verifyIntegrity(request.params.id, request.user);
    sendSuccess(response, 200, 'Document integrity checked successfully', integrity);
  }),
};

module.exports = { documentController };
