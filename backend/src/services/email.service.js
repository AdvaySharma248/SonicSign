const nodemailer = require('nodemailer');
const { env } = require('../config/env');
const { emailTemplates } = require('./email.templates');
const { emailQueue } = require('./email.queue');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

function fromAddress() {
  if (!env.smtpFromEmail) {
    throw new Error('SMTP_FROM_EMAIL is required for SMTP delivery');
  }
  return `${env.smtpFromName || 'SonicSign'} <${env.smtpFromEmail}>`;
}

function createTransporter() {
  if (!env.smtpHost) {
    throw new Error('SMTP_HOST is required for SMTP delivery');
  }
  if (!env.smtpPort) {
    throw new Error('SMTP_PORT is required for SMTP delivery');
  }
  if (env.smtpUser && !env.smtpPass) {
    throw new Error('SMTP_PASS is required when SMTP_USER is configured');
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
    requireTLS: !env.smtpSecure && env.smtpPort === 587,
    logger: true,
    debug: true,
  });
}

async function sendTemplatedEmail({ recipient, template, documentId, userId, type }) {
  const cleaned = cleanEmail(recipient);
  if (!emailRegex.test(cleaned)) {
    throw new Error(`Invalid recipient email address: "${recipient}"`);
  }

  const log = await emailQueue.createQueuedLog({
    recipient: cleaned,
    subject: template.subject,
    documentId,
    userId,
    type,
    html: template.html,
    text: template.text,
  });

  // Asynchronously trigger queue processing immediately (non-blocking)
  setImmediate(() => {
    try {
      console.log('setImmediate: importing and executing processEmailQueue');
      const { processEmailQueue } = require('../jobs/emailQueueJob');
      processEmailQueue().catch((err) => {
        console.error('Async email queue processing trigger failed:', err);
      });
    } catch (err) {
      console.error('Error during require of emailQueueJob in setImmediate:', err);
    }
  });

  return log;
}

const emailService = {
  async sendMailFromLog(log) {
    const transporter = createTransporter();
    const result = await transporter.sendMail({
      from: fromAddress(),
      to: log.recipient,
      subject: log.subject,
      text: log.text,
      html: log.html,
    });

    const rejected = Array.isArray(result.rejected) ? result.rejected.filter(Boolean) : [];
    if (rejected.length) {
      throw new Error(`SMTP rejected recipient(s): ${rejected.join(', ')}`);
    }

    return result;
  },

  async testConnection({ recipient }) {
    const transporter = createTransporter();
    await transporter.verify();

    if (recipient) {
      const cleaned = cleanEmail(recipient);
      if (!emailRegex.test(cleaned)) {
        throw new Error(`Invalid test recipient email address: "${recipient}"`);
      }
      return transporter.sendMail({
        from: fromAddress(),
        to: cleaned,
        subject: 'SonicSign SMTP Diagnostic Test',
        text: 'This is a test email from SonicSign to verify SMTP configuration.',
        html: '<p>This is a test email from <strong>SonicSign</strong> to verify SMTP configuration.</p>',
      });
    }
    return { verified: true };
  },

  sendSigningRequestEmail({ recipient, recipientName, documentName, senderName, signingUrl, expiresAt, documentId, userId }) {
    return sendTemplatedEmail({
      recipient,
      documentId,
      userId,
      type: 'signing_request',
      template: emailTemplates.signingRequest({ documentName, senderName, recipientName, signingUrl, expiresAt }),
    });
  },

  sendReminderEmail({ recipient, recipientName, outstandingCount, signingUrl, documentId, userId }) {
    return sendTemplatedEmail({
      recipient,
      documentId,
      userId,
      type: 'reminder',
      template: emailTemplates.reminder({ recipientName, outstandingCount, signingUrl }),
    });
  },

  sendDocumentCompletedEmail({ recipient, documentName, downloadUrl, documentId, userId }) {
    return sendTemplatedEmail({
      recipient,
      documentId,
      userId,
      type: 'document_completed',
      template: emailTemplates.completed({ documentName, downloadUrl }),
    });
  },

  sendAccountVerificationEmail({ recipient, recipientName, verificationUrl, userId }) {
    return sendTemplatedEmail({
      recipient,
      userId,
      type: 'account_verification',
      template: emailTemplates.accountVerification({ recipientName, verificationUrl }),
    });
  },

  sendPasswordResetEmail({ recipient, recipientName, resetUrl, userId }) {
    return sendTemplatedEmail({
      recipient,
      userId,
      type: 'password_reset',
      template: emailTemplates.passwordReset({ recipientName, resetUrl }),
    });
  },
};

module.exports = { emailService };
