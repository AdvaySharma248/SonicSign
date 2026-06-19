const { signerService } = require('../services/signerService');
const { sendSuccess } = require('../../../utils/apiResponse');
const { asyncHandler } = require('../../../utils/asyncHandler');

const signerController = {
  create: asyncHandler(async (request, response) => {
    const signer = await signerService.addSigner({
      documentId: request.body.documentId,
      owner: request.user,
      signer: { email: request.body.email, name: request.body.name, role: request.body.role, signingOrder: request.body.signingOrder, isOwner: request.body.isOwner },
      request,
    });
    sendSuccess(response, 201, 'Signer added successfully', { signer });
  }),

  listByDocument: asyncHandler(async (request, response) => {
    const signers = await signerService.listForDocument(request.params.documentId, request.user);
    sendSuccess(response, 200, 'Signers fetched successfully', { signers });
  }),

  remove: asyncHandler(async (request, response) => {
    await signerService.remove(request.params.id, request.user);
    sendSuccess(response, 200, 'Signer removed successfully');
  }),

  sendInvite: asyncHandler(async (request, response) => {
    const signer = await signerService.sendInvite(request.body.signerId, request.user);
    sendSuccess(response, 200, 'Signing invitation sent', { signer });
  }),

  listMine: asyncHandler(async (request, response) => {
    const signers = await signerService.listForOwner(request.user);
    sendSuccess(response, 200, 'Signature requests fetched successfully', { signers });
  }),

  sendDocument: asyncHandler(async (request, response) => {
    const result = await signerService.sendDocument(request.params.documentId, request.user, request);
    sendSuccess(response, 200, 'Signing requests sent', result);
  }),
};

module.exports = { signerController };
