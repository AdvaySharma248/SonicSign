const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const { documentRepository } = require('../repositories/documentRepository');
const { signerRepository } = require('../../signatures/repositories/signerRepository');
const { auditService } = require('../../audit/services/auditService');
const { pdfService } = require('./pdfService');
const { sha256 } = require('../../../utils/hash');
const { getAbsolutePath } = require('../../../storage/localStorage');
const { AppError } = require('../../../utils/AppError');
const { AUDIT_ACTIONS } = require('../../../constants/auditActions');
const { DOCUMENT_STATUS } = require('../../../constants/documentStatus');

const documentService = {
  async upload({ title, file, owner, request }) {
    if (!file) {
      throw new AppError('PDF file is required', 400);
    }

    const documentId = new mongoose.Types.ObjectId();

    try {
      const metadata = await pdfService.getMetadata(file.path);
      const document = await documentRepository.create({
        _id: documentId,
        title: title || path.parse(file.originalname).name,
        fileName: file.filename,
        fileUrl: `/api/documents/${documentId}/view`,
        userId: owner.firebaseUid,
        ownerId: owner.id,
        createdBy: owner.id,
        firebaseUid: owner.firebaseUid,
        pageCount: metadata.pageCount,
        documentHash: sha256(metadata.bytes),
      });

      await auditService.record({
        documentId: document.id,
        userId: owner.id,
        action: AUDIT_ACTIONS.DOCUMENT_UPLOADED,
        description: `${owner.email} uploaded ${document.title}`,
        request,
      });

      return document;
    } catch (error) {
      console.error('Document upload failed:', {
        documentId: documentId.toString(),
        error: error.message,
        stack: error.stack,
      });

      try {
        await fs.unlink(file.path);
        console.log(`[File Cleanup] Deleted orphan file: ${file.path}`);
      } catch (unlinkError) {
        if (unlinkError.code !== 'ENOENT') {
          console.error(`[File Cleanup Error] Failed to delete orphan file ${file.path}:`, unlinkError);
        }
      }

      throw error;
    }
  },

  async list(user, filters) {
    const result = await documentRepository.listForUser(user.id, filters);
    result.documents = await Promise.all(result.documents.map((document) => this.ensureViewUrl(document)));
    return result;
  },

  async getOwned(documentId, user) {
    const document = await documentRepository.findOwnedById(documentId, user.id);
    if (!document) {
      throw new AppError('Document not found', 404);
    }
    return this.ensureViewUrl(document);
  },

  async ensureViewUrl(document) {
    const fileUrl = `/api/documents/${document.id}/view`;
    if (document.fileUrl !== fileUrl) {
      document.fileUrl = fileUrl;
      await document.save();
    }
    return document;
  },

  async update(documentId, user, updates, request) {
    await this.getOwned(documentId, user);
    const allowedUpdates = {};
    if (typeof updates.title === 'string') allowedUpdates.title = updates.title;
    if (typeof updates.status === 'string') allowedUpdates.status = updates.status;
    if (updates.expiresAt) allowedUpdates.expiresAt = updates.expiresAt;
    const document = await documentRepository.updateById(documentId, allowedUpdates);
    await auditService.record({
      documentId,
      userId: user.id,
      action: AUDIT_ACTIONS.DOCUMENT_UPDATED,
      description: `${user.email} updated ${document.title}`,
      request,
    });
    return document;
  },

  async remove(documentId, user, request) {
    const existingDocument = await this.getOwned(documentId, user);
    const document = await documentRepository.deleteOwned(documentId, user.id);
    if (!document) {
      throw new AppError('Document not found', 404);
    }
    await auditService.record({
      documentId,
      userId: user.id,
      action: AUDIT_ACTIONS.DOCUMENT_DELETED,
      description: `${user.email} deleted ${existingDocument.title}`,
      request,
    });
    return document;
  },

  async download(documentId, user, request) {
    const document = await this.getOwned(documentId, user);
    await auditService.record({
      documentId,
      userId: user.id,
      action: AUDIT_ACTIONS.DOCUMENT_DOWNLOADED,
      description: `${user.email} downloaded ${document.title}`,
      request,
    });

    return this.getDocumentFile(document);
  },

  async view(documentId, user) {
    const document = await this.getOwned(documentId, user);
    return this.getDocumentFile(document);
  },

  async getDocumentFile(document) {
    const fileName = document.signedFileName || document.fileName;
    const filePath = getAbsolutePath(fileName);

    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        throw new AppError('PDF file is unavailable', 404);
      }
      return { document, filePath, size: stats.size };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new AppError('PDF file is unavailable', 404);
      }
      throw error;
    }
  },

  async markViewed(document, signer, request) {
    if (document.status === DOCUMENT_STATUS.DRAFT) {
      await documentRepository.updateById(document.id, { status: DOCUMENT_STATUS.VIEWED });
    }
    await auditService.record({
      documentId: document.id,
      userId: document.ownerId,
      ownerId: document.ownerId,
      createdBy: document.ownerId,
      firebaseUid: document.firebaseUid,
      action: AUDIT_ACTIONS.DOCUMENT_VIEWED,
      description: `${signer.email} viewed ${document.title}`,
      request,
    });
  },

  async attachSignedPdf(document, pdfBuffer, status = DOCUMENT_STATUS.SIGNED) {
    const signedVersion = (document.signedVersion || 0) + 1;
    const signedFileName = `signed-v${signedVersion}-${document.fileName}`;
    await fs.writeFile(getAbsolutePath(signedFileName), pdfBuffer);
    return documentRepository.updateById(document.id, {
      signedFileName,
      signedVersion,
      status,
      documentHash: sha256(pdfBuffer),
    });
  },

  async verifyIntegrity(documentId, user) {
    const document = await this.getOwned(documentId, user);
    const fileName = document.signedFileName || document.fileName;
    const bytes = await fs.readFile(getAbsolutePath(fileName));
    return { valid: sha256(bytes) === document.documentHash, documentHash: document.documentHash };
  },
};

module.exports = { documentService };
