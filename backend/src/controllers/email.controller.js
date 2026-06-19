const dns = require('dns').promises;
const EmailLog = require('../models/EmailLog');
const { sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

async function checkDnsRecords(email) {
  if (!email || !email.includes('@')) {
    return { error: 'Invalid email address' };
  }
  const domain = email.split('@')[1];
  const results = {
    domain,
    mx: { exists: false, records: [] },
    spf: { exists: false, records: [] },
  };

  try {
    const mxRecords = await dns.resolveMx(domain);
    results.mx.exists = mxRecords && mxRecords.length > 0;
    results.mx.records = mxRecords;
  } catch (error) {
    results.mx.error = error.message;
  }

  try {
    const txtRecords = await dns.resolveTxt(domain);
    const spfRecords = txtRecords
      .map((r) => r.join(''))
      .filter((r) => r.toLowerCase().startsWith('v=spf1'));
    results.spf.exists = spfRecords.length > 0;
    results.spf.records = spfRecords;
  } catch (error) {
    results.spf.error = error.message;
  }

  return results;
}

const emailController = {
  listLogs: asyncHandler(async (request, response) => {
    const query = { userId: request.user.id };
    if (request.query.documentId) query.documentId = request.query.documentId;
    if (request.query.status) query.status = request.query.status;

    const logs = await EmailLog.find(query).sort('-createdAt').limit(100);
    sendSuccess(response, 200, 'Email logs fetched successfully', { logs });
  }),

  testDiagnostics: asyncHandler(async (request, response) => {
    const { recipient } = request.body;
    const { emailService } = require('../services/email.service');
    const { env } = require('../config/env');

    const results = {
      smtp: { verified: false },
      dns: null,
      emailSent: false,
    };

    try {
      await emailService.testConnection({});
      results.smtp.verified = true;
    } catch (error) {
      results.smtp.verified = false;
      results.smtp.error = error.message;
      results.smtp.stack = error.stack;
      results.smtp.tips = [
        'Verify SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS are set correctly in your environment.',
        'If using Gmail, ensure you have enabled "App Passwords" and are using the App Password rather than your account password.',
        'If secure port 465 is used, make sure SMTP_SECURE is true. If 587 is used, SMTP_SECURE should be false (with STARTTLS enabled).',
      ];
    }

    if (env.smtpFromEmail) {
      results.dns = await checkDnsRecords(env.smtpFromEmail);
    }

    if (recipient && results.smtp.verified) {
      try {
        await emailService.testConnection({ recipient });
        results.emailSent = true;
      } catch (error) {
        results.emailSent = false;
        results.emailSentError = error.message;
      }
    }

    sendSuccess(response, 200, 'SMTP diagnostics completed', results);
  }),
};

module.exports = { emailController };
