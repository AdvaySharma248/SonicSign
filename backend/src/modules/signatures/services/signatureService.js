const { documentRepository } = require('../../documents/repositories/documentRepository');
const { signerRepository } = require('../repositories/signerRepository');
const { signatureRepository } = require('../repositories/signatureRepository');
const { documentService } = require('../../documents/services/documentService');
const { pdfService } = require('../../documents/services/pdfService');
const { auditService } = require('../../audit/services/auditService');
const { notificationService } = require('../../notifications/services/notificationService');
const { AppError } = require('../../../utils/AppError');
const { AUDIT_ACTIONS } = require('../../../constants/auditActions');
const { DOCUMENT_STATUS, SIGNER_STATUS } = require('../../../constants/documentStatus');
const { fieldRepository } = require('../repositories/fieldRepository');

const signatureService = {
  async create(owner, payload, request) {
    await documentService.getOwned(payload.documentId, owner);
    const signer = await signerRepository.findById(payload.signerId);
    if (!signer || signer.documentId.toString() !== payload.documentId) {
      throw new AppError('Signer not found for this document', 404);
    }

    const signature = await signatureRepository.create(payload);
    await auditService.record({
      documentId: payload.documentId,
      userId: owner.id,
      action: AUDIT_ACTIONS.SIGNATURE_ADDED,
      description: `Signature placed for ${signer.email}`,
      request,
    });
    return signature;
  },

  async publicSign(signer, payload, request) {
    const signature = await signatureRepository.create({
      documentId: signer.documentId.id,
      signerId: signer.id,
      ...payload,
    });

    await signerRepository.updateById(signer.id, {
      status: SIGNER_STATUS.SIGNED,
      signedAt: new Date(),
      ipAddress: request.ip,
    });

    await auditService.record({
      documentId: signer.documentId.id,
      userId: signer.documentId.ownerId,
      ownerId: signer.documentId.ownerId,
      createdBy: signer.documentId.ownerId,
      firebaseUid: signer.documentId.firebaseUid,
      action: AUDIT_ACTIONS.SIGNATURE_ADDED,
      description: `${signer.email} signed ${signer.documentId.title}`,
      request,
    });

    return signature;
  },

  async saveFields(documentId, owner, fields, request) {
    const document = await documentService.getOwned(documentId, owner);
    const signers = await signerRepository.listByDocument(documentId);
    const signerIds = new Set(signers.map((signer) => signer.id));
    if (fields.some((field) => !signerIds.has(field.signerId))) throw new AppError('A field is assigned to an invalid signer', 400);
    if (fields.some((field) => field.page > document.pageCount || field.x + field.width > 100 || field.y + field.height > 100)) throw new AppError('A field lies outside the document page', 400);
    const placements = await fieldRepository.replaceForDocument(documentId, fields.map((field) => ({ ...field, documentId })));
    await auditService.record({ documentId, userId: owner.id, action: AUDIT_ACTIONS.SIGNATURE_ADDED, description: `${placements.length} signing fields were saved`, request });
    return placements;
  },

  async listFields(documentId, owner) {
    await documentService.getOwned(documentId, owner);
    return fieldRepository.listByDocument(documentId);
  },

  async getPublicSession(signer) {
    const [fields, values] = await Promise.all([
      fieldRepository.listByDocument(signer.documentId.id),
      fieldRepository.listValuesByDocument(signer.documentId.id),
    ]);
    return {
      signer: { id: signer.id, name: signer.name, email: signer.email, status: signer.status, expiresAt: signer.expiresAt },
      document: { id: signer.documentId.id, title: signer.documentId.title, pageCount: signer.documentId.pageCount, fileUrl: `/api/public/sign/${signer.token}/pdf` },
      fields: fields.map((field) => ({ ...field.toObject(), completed: values.some((value) => value.fieldId.toString() === field.id) })),
    };
  },

  async completeSigning(signer, values, request) {
    const fields = await fieldRepository.listBySigner(signer.id);
    const fieldById = new Map(fields.map((field) => [field.id, field]));
    const supplied = new Set(values.map((value) => value.fieldId));
    const requiredMissing = fields.filter((field) => field.required && !supplied.has(field.id));
    if (requiredMissing.length) throw new AppError('Complete every required field before submitting', 400);
    if (values.some((value) => !fieldById.has(value.fieldId))) throw new AppError('A field is not assigned to you', 403);
    const signedAt = new Date();
    for (const value of values) {
      const field = fieldById.get(value.fieldId);
      await fieldRepository.createValue({
        documentId: signer.documentId.id,
        signerId: signer.id,
        fieldId: field.id,
        page: field.page,
        type: field.type,
        value: value.value,
        signatureMethod: value.signatureMethod,
        signerEmail: signer.email,
        signerName: signer.name,
        ipAddress: request.ip,
        completedAt: signedAt,
      });
    }

    const [allFields, valuesForDocument, allSigners] = await Promise.all([
      fieldRepository.listByDocument(signer.documentId.id),
      fieldRepository.listValuesByDocument(signer.documentId.id),
      signerRepository.listByDocument(signer.documentId.id),
    ]);
    const completedFieldIds = new Set(valuesForDocument.map((value) => value.fieldId.toString()));
    const allRequiredFieldsComplete = allFields.every((field) => !field.required || completedFieldIds.has(field.id));
    const allSignersComplete = allSigners.every((candidate) => candidate.id === signer.id || candidate.status === SIGNER_STATUS.SIGNED);
    const nextStatus = allRequiredFieldsComplete && allSignersComplete ? DOCUMENT_STATUS.SIGNED : DOCUMENT_STATUS.PARTIALLY_SIGNED;
    const signedPdf = await pdfService.embedFieldValues(signer.documentId, allFields, valuesForDocument);
    const signedDocument = await documentService.attachSignedPdf(signer.documentId, signedPdf, nextStatus);

    await signerRepository.updateById(signer.id, {
      status: SIGNER_STATUS.SIGNED,
      signedAt,
      ipAddress: request.ip,
      browserInfo: request.headers['user-agent'],
    });

    for (const value of values) {
      const field = fieldById.get(value.fieldId);
      await auditService.record({
        documentId: signer.documentId.id,
        userId: signer.documentId.ownerId,
        ownerId: signer.documentId.ownerId,
        createdBy: signer.documentId.ownerId,
        firebaseUid: signer.documentId.firebaseUid,
        action: AUDIT_ACTIONS.FIELD_COMPLETED,
        description: `${signer.email} completed ${field.type} field ${field.id} on page ${field.page}`,
        request,
        metadata: {
          signerEmail: signer.email,
          signerName: signer.name,
          signedAt,
          documentVersion: signedDocument.signedVersion,
          fieldId: field.id,
          fieldType: field.type,
          page: field.page,
          ipAddress: request.ip,
        },
      });
    }

    await auditService.record({
      documentId: signer.documentId.id,
      userId: signer.documentId.ownerId,
      ownerId: signer.documentId.ownerId,
      createdBy: signer.documentId.ownerId,
      firebaseUid: signer.documentId.firebaseUid,
      action: AUDIT_ACTIONS.SIGNATURE_SUBMITTED,
      description: `${signer.email} submitted their signature`,
      request,
      metadata: {
        signerEmail: signer.email,
        signerName: signer.name,
        signedAt,
        documentVersion: signedDocument.signedVersion,
        status: nextStatus,
        ipAddress: request.ip,
      },
    });

    if (nextStatus === DOCUMENT_STATUS.SIGNED) {
      await auditService.record({
        documentId: signer.documentId.id,
        userId: signer.documentId.ownerId,
        ownerId: signer.documentId.ownerId,
        createdBy: signer.documentId.ownerId,
        firebaseUid: signer.documentId.firebaseUid,
        action: AUDIT_ACTIONS.DOCUMENT_FINALIZED,
        description: `${signer.documentId.title} was finalized after all required fields were completed`,
        request,
        metadata: {
          signerEmail: signer.email,
          signerName: signer.name,
          signedAt,
          documentVersion: signedDocument.signedVersion,
          ipAddress: request.ip,
        },
      });

      // Fetch owner User and send completion email
      try {
        const User = require('../../users/models/User');
        const ownerUser = await User.findById(signer.documentId.ownerId);
        if (ownerUser && ownerUser.email) {
          await notificationService.sendCompletion({
            userId: signer.documentId.ownerId,
            document: signedDocument,
            recipientEmail: ownerUser.email,
          });
        }
      } catch (err) {
        console.error('Failed to send completion email to document owner:', err);
      }

      // Send completion email to all signers
      for (const recipient of allSigners) {
        if (!recipient.isOwner) {
          try {
            await notificationService.sendCompletion({
              userId: signer.documentId.ownerId,
              document: signedDocument,
              recipientEmail: recipient.email,
            });
          } catch (err) {
            console.error(`Failed to send completion email to signer ${recipient.email}:`, err);
          }
        }
      }
    }

    return signedDocument;
  },

  async list(documentId, owner) {
    await documentService.getOwned(documentId, owner);
    return signatureRepository.listByDocument(documentId);
  },

  async update(signatureId, owner, updates) {
    const signature = await signatureRepository.findById(signatureId);
    if (!signature) {
      throw new AppError('Signature not found', 404);
    }
    await documentService.getOwned(signature.documentId, owner);
    return signatureRepository.updateById(signatureId, updates);
  },

  async remove(signatureId, owner) {
    const signature = await signatureRepository.findById(signatureId);
    if (!signature) {
      throw new AppError('Signature not found', 404);
    }
    await documentService.getOwned(signature.documentId, owner);
    return signatureRepository.deleteById(signatureId);
  },

  async finalize(documentId, owner, request) {
    const document = await documentService.getOwned(documentId, owner);
    const values = await fieldRepository.listValuesByDocument(documentId);
    const fields = await fieldRepository.listByDocument(documentId);
    if (!values.length) {
      throw new AppError('Document has no signatures to finalize', 400);
    }

    const signedPdf = await pdfService.embedFieldValues(document, fields, values);
    const signedDocument = await documentService.attachSignedPdf(document, signedPdf, DOCUMENT_STATUS.SIGNED);

    await auditService.record({
      documentId,
      userId: owner.id,
      action: AUDIT_ACTIONS.DOCUMENT_SIGNED,
      description: `${document.title} was finalized`,
      request,
    });

    await notificationService.sendCompletion({ userId: owner.id, document: signedDocument, recipientEmail: owner.email });
    return signedDocument;
  },

  async reject(signer, reason, request) {
    await signerRepository.updateById(signer.id, { status: SIGNER_STATUS.REJECTED });
    const document = await documentRepository.updateById(signer.documentId.id, { status: DOCUMENT_STATUS.REJECTED });
    await auditService.record({
      documentId: signer.documentId.id,
      userId: signer.documentId.ownerId,
      ownerId: signer.documentId.ownerId,
      createdBy: signer.documentId.ownerId,
      firebaseUid: signer.documentId.firebaseUid,
      action: AUDIT_ACTIONS.DOCUMENT_REJECTED,
      description: `${signer.email} rejected ${signer.documentId.title}${reason ? `: ${reason}` : ''}`,
      request,
    });
    return document;
  },
};

module.exports = { signatureService };
