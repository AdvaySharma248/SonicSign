const { signatureService } = require('../services/signatureService');
const { signerService } = require('../services/signerService');
const { sendSuccess } = require('../../../utils/apiResponse');
const { asyncHandler } = require('../../../utils/asyncHandler');
const fs = require('fs');
const { documentService } = require('../../documents/services/documentService');

const signatureController = {
  create: asyncHandler(async (request, response) => {
    const signature = await signatureService.create(request.user, request.body, request);
    sendSuccess(response, 201, 'Signature added successfully', { signature });
  }),

  listByDocument: asyncHandler(async (request, response) => {
    const signatures = await signatureService.list(request.params.documentId, request.user);
    sendSuccess(response, 200, 'Signatures fetched successfully', { signatures });
  }),

  update: asyncHandler(async (request, response) => {
    const signature = await signatureService.update(request.params.id, request.user, request.body);
    sendSuccess(response, 200, 'Signature updated successfully', { signature });
  }),

  remove: asyncHandler(async (request, response) => {
    await signatureService.remove(request.params.id, request.user);
    sendSuccess(response, 200, 'Signature removed successfully');
  }),

  finalize: asyncHandler(async (request, response) => {
    const document = await signatureService.finalize(request.body.documentId, request.user, request);
    sendSuccess(response, 200, 'Document finalized successfully', { document });
  }),

  getPublicSigningSession: asyncHandler(async (request, response) => {
    const signer = await signerService.resolvePublicToken(request.params.token, request);
    sendSuccess(response, 200, 'Signing session fetched successfully', { signer });
  }),

  publicSign: asyncHandler(async (request, response) => {
    const signer = await signerService.resolvePublicToken(request.params.token, request);
    const signature = await signatureService.publicSign(signer, request.body, request);
    sendSuccess(response, 201, 'Document signed successfully', { signature });
  }),

  publicReject: asyncHandler(async (request, response) => {
    const signer = await signerService.resolvePublicToken(request.params.token, request);
    const document = await signatureService.reject(signer, request.body.reason, request);
    sendSuccess(response, 200, 'Document rejected successfully', { document });
  }),
  saveFields: asyncHandler(async (request, response) => {
    const fields = await signatureService.saveFields(request.params.documentId, request.user, request.body.fields, request);
    sendSuccess(response, 200, 'Field placements saved', { fields });
  }),
  listFields: asyncHandler(async (request, response) => {
    const fields = await signatureService.listFields(request.params.documentId, request.user);
    sendSuccess(response, 200, 'Field placements fetched', { fields });
  }),
  completePublicSigning: asyncHandler(async (request, response) => {
    const signer = await signerService.resolvePublicToken(request.params.token, request);
    const document = await signatureService.completeSigning(signer, request.body.values, request);
    sendSuccess(response, 200, 'Signing completed', { document });
  }),
  getPublicDocument: asyncHandler(async (request, response) => {
    const signer = await signerService.resolvePublicToken(request.params.token, request);
    const session = await signatureService.getPublicSession(signer);
    sendSuccess(response, 200, 'Signing session fetched', session);
  }),
  publicPdf: asyncHandler(async (request, response) => {
    const signer = await signerService.resolvePublicToken(request.params.token, request);
    const { document, filePath, size } = await documentService.getDocumentFile(signer.documentId);
    response.status(200).set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${document.title.replace(/[^\w.-]+/g, '-') || 'document'}.pdf"`, 'Content-Length': size, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
    fs.createReadStream(filePath).pipe(response);
  }),
};

module.exports = { signatureController };
