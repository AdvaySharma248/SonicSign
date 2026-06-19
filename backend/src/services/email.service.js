const nodemailer = require('nodemailer');
const { env } = require('../config/env');
const { emailTemplates } = require('./email.templates');
const { emailQueue } = require('./email.queue');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

function parseMailFrom(mailFrom) {
  if (typeof mailFrom !== 'string') return {};
  const trimmed = mailFrom.trim();
  if (!trimmed) return {};

  const match = trimmed.match(/^(.*?)\s*<([^<>]+)>$/);
  if (match) {
    const name = match[1].trim().replace(/^["']|["']$/g, '');
    return { name, email: match[2].trim() };
  }

  return { email: trimmed };
}

function fromAddress() {
  const fallbackFrom = parseMailFrom(env.mailFrom);
  const senderEmail = env.smtpFromEmail || fallbackFrom.email;
  const senderName = env.smtpFromName || fallbackFrom.name || 'SonicSign';

  if (!senderEmail) {
    throw new Error('SMTP_FROM_EMAIL or MAIL_FROM is required for SMTP delivery');
  }
  return `${senderName} <${senderEmail}>`;
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

  const enableSmtpDebugLogs = env.nodeEnv !== 'production';

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
    requireTLS: !env.smtpSecure && env.smtpPort === 587,
    logger: enableSmtpDebugLogs,
    debug: enableSmtpDebugLogs,
    family: 4,
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

  const { processEmailLog } = require('../jobs/emailQueueJob');
  const processedLog = await processEmailLog(log._id, { throwOnFailure: true });

  return processedLog || log;
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
