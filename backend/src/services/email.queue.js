const EmailLog = require('../models/EmailLog');

const emailQueue = {
  createQueuedLog({ recipient, subject, documentId, userId, type, html, text }) {
    return EmailLog.create({
      recipient,
      subject,
      documentId,
      userId,
      type,
      html,
      text,
      status: 'queued',
      nextAttemptAt: new Date(),
    });
  },

  markProcessing(id) {
    return EmailLog.findByIdAndUpdate(
      id,
      { status: 'processing' },
      { new: true }
    );
  },

  markSent(id, result) {
    return EmailLog.findByIdAndUpdate(
      id,
      {
        status: 'sent',
        provider: 'smtp',
        messageId: result.messageId,
        accepted: result.accepted || [],
        rejected: result.rejected || [],
        response: result.response,
        sentAt: new Date(),
      },
      { new: true }
    );
  },

  markDelivered(id) {
    return EmailLog.findByIdAndUpdate(
      id,
      { status: 'delivered', deliveredAt: new Date() },
      { new: true }
    );
  },

  markRetry(id, error, nextAttemptAt, retryCount) {
    return EmailLog.findByIdAndUpdate(
      id,
      {
        status: 'queued',
        errorMessage: error?.message || String(error),
        nextAttemptAt,
        retryCount,
      },
      { new: true }
    );
  },

  markFailed(id, error) {
    return EmailLog.findByIdAndUpdate(
      id,
      {
        status: 'failed',
        errorMessage: error?.message || String(error),
      },
      { new: true }
    );
  },
};

module.exports = { emailQueue };
