const { addHours } = require('../../../utils/date');
const { signerRepository } = require('../repositories/signerRepository');
const { documentService } = require('../../documents/services/documentService');
const { auditService } = require('../../audit/services/auditService');
const { notificationService } = require('../../notifications/services/notificationService');
const { createOpaqueToken } = require('../../../utils/token');
const { AppError } = require('../../../utils/AppError');
const { AUDIT_ACTIONS } = require('../../../constants/auditActions');
const { DOCUMENT_STATUS, SIGNER_STATUS } = require('../../../constants/documentStatus');
const { env } = require('../../../config/env');
const { fieldRepository } = require('../repositories/fieldRepository');

const signerService = {
  async addSigner({ documentId, owner, signer, request }) {
    const document = await documentService.getOwned(documentId, owner);
    const normalizedEmail = signer.email.toLowerCase().trim();
    const isOwner = normalizedEmail === owner.email.toLowerCase().trim();
    if (signer.isOwner && !isOwner) {
      throw new AppError('Owner signer must use the authenticated owner email address', 400);
    }
    const existing = await signerRepository.findByDocumentEmail(documentId, normalizedEmail);
    if (existing) {
      return existing;
    }
    const createdSigner = await signerRepository.create({
      documentId,
      userId: owner.firebaseUid,
      ownerId: owner.id,
      createdBy: owner.id,
      ...signer,
      email: normalizedEmail,
      name: isOwner ? owner.name || owner.email : signer.name,
      isOwner,
      token: createOpaqueToken(),
      expiresAt: addHours(new Date(), env.signingLinkTtlHours),
    });

    await auditService.record({
      documentId,
      userId: owner.id,
      action: AUDIT_ACTIONS.SIGNER_ADDED,
      description: `${createdSigner.email} was added to ${document.title}`,
      request,
    });

    return createdSigner;
  },

  async listForDocument(documentId, owner) {
    await documentService.getOwned(documentId, owner);
    const signers = await signerRepository.listByDocument(documentId);
    const EmailLog = require('../../../models/EmailLog');

    const enrichedSigners = await Promise.all(
      signers.map(async (signer) => {
        const signerObj = signer.toObject ? signer.toObject() : signer;
        if (signerObj.isOwner) {
          return signerObj;
        }
        const emailLog = await EmailLog.findOne({
          recipient: signerObj.email.toLowerCase().trim(),
          documentId: documentId,
        }).sort({ createdAt: -1 });

        if (emailLog) {
          signerObj.emailDelivery = {
            status: emailLog.status,
            sentAt: emailLog.sentAt || emailLog.createdAt,
            deliveredAt: emailLog.deliveredAt,
            errorMessage: emailLog.errorMessage,
            retryCount: emailLog.retryCount,
          };
        }
        return signerObj;
      })
    );
    return enrichedSigners;
  },

  async remove(signerId, owner) {
    const signer = await signerRepository.findById(signerId);
    if (!signer) {
      throw new AppError('Signer not found', 404);
    }
    await documentService.getOwned(signer.documentId, owner);
    return signerRepository.deleteById(signerId);
  },

  async sendInvite(signerId, owner) {
    const signer = await signerRepository.findById(signerId);
    if (!signer) {
      throw new AppError('Signer not found', 404);
    }
    const document = await documentService.getOwned(signer.documentId, owner);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleaned = signer.email.trim().toLowerCase();
    if (!emailRegex.test(cleaned)) {
      throw new AppError(`Invalid recipient email address: "${signer.email}"`, 400);
    }

    try {
      await notificationService.sendSigningInvite({ userId: owner.id, document, signer, senderName: owner.name || owner.email });
    } catch (error) {
      throw new AppError('Unable to deliver signing email. Please verify SMTP settings and recipient address.', 502, {
        email: signer.email,
        error: error.message,
      });
    }
    return signer;
  },

  async sendDocument(documentId, owner, request) {
    const document = await documentService.getOwned(documentId, owner);
    const [signers, fields] = await Promise.all([
      signerRepository.listByDocument(documentId),
      fieldRepository.listByDocument(documentId),
    ]);
    if (!signers.length) throw new AppError('Add at least one signer before sending', 400);
    if (!fields.length || !fields.some((field) => field.required)) throw new AppError('Place at least one required field before sending', 400);
    
    if (fields.some((field) => {
      const fieldSignerId = field.signerId?.id || field.signerId?._id || field.signerId;
      if (!fieldSignerId) return true;
      const fsIdStr = fieldSignerId.toString();
      return !signers.some((signer) => signer.id === fsIdStr || signer._id?.toString() === fsIdStr);
    })) {
      throw new AppError('Every field must be assigned to a signer', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const signer of signers) {
      if (!signer.isOwner) {
        const cleaned = signer.email.trim().toLowerCase();
        if (!emailRegex.test(cleaned)) {
          throw new AppError(`Invalid email address: "${signer.email}" for signer "${signer.name}"`, 400);
        }
      }
    }

    const expiresAt = addHours(new Date(), env.signingLinkTtlHours);
    const sent = [];
    for (const signer of signers) {
      const token = createOpaqueToken();
      const updated = await signerRepository.updateById(signer.id, { token, expiresAt, status: SIGNER_STATUS.PENDING });
      let emailStatus = updated.isOwner ? 'not_required' : 'queued';
      let emailError;
      if (!updated.isOwner) {
        try {
          await notificationService.sendSigningInvite({ userId: owner.id, document, signer: updated, senderName: owner.name || owner.email });
        } catch (error) {
          emailStatus = 'failed';
          emailError = error.message;
        }
      }
      sent.push({ signerId: updated.id, signingUrl: `${env.frontendUrl}/sign/document/${token}`, emailStatus, emailError });
      await auditService.record({ documentId, userId: owner.id, action: AUDIT_ACTIONS.SIGNING_REQUEST_SENT, description: `Signing request ${updated.isOwner ? 'prepared for owner' : `queued for ${updated.email}`}`, request });
    }
    await documentService.update(documentId, owner, { status: DOCUMENT_STATUS.PENDING, expiresAt }, request);
    return { documentId, expiresAt, requests: sent };
  },

  async resolvePublicToken(token, request) {
    const signer = await signerRepository.findByToken(token);
    if (!signer || signer.expiresAt < new Date()) {
      throw new AppError('Signing link is invalid or expired', 404);
    }
    if (!signer.documentId) {
      throw new AppError('Document for this signing link is unavailable. Please ask the sender to resend the request.', 404);
    }
    if ([SIGNER_STATUS.SIGNED, SIGNER_STATUS.REJECTED].includes(signer.status)) {
      throw new AppError('Signing link has already been used', 409);
    }

    if (!signer.viewedAt) {
      await signerRepository.updateById(signer.id, { viewedAt: new Date(), status: SIGNER_STATUS.VIEWED, ipAddress: request.ip, browserInfo: request.headers['user-agent'] });
      await documentService.markViewed(signer.documentId, signer, request);
    }

    return signer;
  },

  listForOwner(owner) {
    return signerRepository.listByOwner(owner.id);
  },
};

module.exports = { signerService };
