const { emailService } = require('../../../services/email.service');
const { auditService } = require('../../audit/services/auditService');
const { AUDIT_ACTIONS } = require('../../../constants/auditActions');
const { env } = require('../../../config/env');

const notificationService = {
  async sendSigningInvite({ userId, document, signer, senderName }) {
    const signingUrl = `${env.frontendUrl}/sign/document/${signer.token}`;
    return this.sendTrackedEmail({
      userId,
      documentId: document.id,
      recipientEmail: signer.email,
      subject: `${senderName || 'SonicSign'} requested your signature`,
      auditLabel: 'signing request',
      send: () => emailService.sendSigningRequestEmail({
        recipient: signer.email,
        recipientName: signer.name,
        documentName: document.title,
        senderName,
        signingUrl,
        expiresAt: signer.expiresAt,
        documentId: document.id,
        userId,
      }),
    });
  },

  async sendReminder({ userId, document, signer }) {
    const signingUrl = `${env.frontendUrl}/sign/document/${signer.token}`;
    return this.sendTrackedEmail({
      userId,
      documentId: document.id,
      recipientEmail: signer.email,
      subject: `Reminder: ${document.title} is waiting for signature`,
      auditLabel: 'reminder',
      send: () => emailService.sendReminderEmail({
        recipient: signer.email,
        recipientName: signer.name,
        outstandingCount: 1,
        signingUrl,
        documentId: document.id,
        userId,
      }),
    });
  },

  async sendCompletion({ userId, document, recipientEmail }) {
    return this.sendTrackedEmail({
      userId,
      documentId: document.id,
      recipientEmail,
      subject: `Completed: ${document.title}`,
      auditLabel: 'completion',
      send: () => emailService.sendDocumentCompletedEmail({
        recipient: recipientEmail,
        documentName: document.title,
        downloadUrl: `${env.frontendUrl}/documents/${document.id}`,
        documentId: document.id,
        userId,
      }),
    });
  },

  async sendTrackedEmail(email) {
    await auditService.record({
      documentId: email.documentId,
      userId: email.userId,
      action: AUDIT_ACTIONS.EMAIL_QUEUED,
      description: `SMTP ${email.auditLabel || 'email'} queued for ${email.recipientEmail}: ${email.subject}`,
    });
    try {
      const sent = await email.send();
      await auditService.record({
        documentId: email.documentId,
        userId: email.userId,
        action: AUDIT_ACTIONS.EMAIL_DELIVERED,
        description: `SMTP accepted ${email.auditLabel || 'email'} for ${email.recipientEmail}`,
      });
      return sent;
    } catch (error) {
      await auditService.record({
        documentId: email.documentId,
        userId: email.userId,
        action: AUDIT_ACTIONS.EMAIL_FAILED,
        description: `SMTP failed for ${email.recipientEmail}: ${error.message}`,
      });
      throw error;
    }
  },
};

module.exports = { notificationService };
