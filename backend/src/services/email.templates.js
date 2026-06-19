function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function button(label, href) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:#365CF5;color:#fff;text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:700">${escapeHtml(label)}</a>`;
}

function layout({ preview, title, body }) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#101828">
    <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${escapeHtml(preview)}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e6eaf2">
            <tr>
              <td style="padding:26px 30px;background:#0f172a;color:#fff">
                <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em">SonicSign</div>
                <div style="font-size:13px;color:#cbd5e1;margin-top:4px">Secure document signing</div>
              </td>
            </tr>
            <tr>
              <td style="padding:30px">${body}</td>
            </tr>
            <tr>
              <td style="padding:20px 30px;background:#f8fafc;color:#667085;font-size:12px;line-height:1.6">
                SonicSign sends secure document workflow notifications. If you were not expecting this email, you can ignore it.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function signingRequest({ documentName, senderName, recipientName, signingUrl, expiresAt }) {
  const expiration = new Date(expiresAt).toLocaleString();
  const subject = `${senderName || 'SonicSign'} requested your signature`;
  const text = `Hi ${recipientName},\n\n${senderName || 'A SonicSign user'} requested your signature on "${documentName}".\n\nSecure signing link: ${signingUrl}\nExpiration date: ${expiration}\n\nSonicSign`;
  const html = layout({
    title: subject,
    preview: `Signature requested for ${documentName}`,
    body: `
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#101828">Signature requested</h1>
      <p style="margin:0 0 18px;color:#475467;line-height:1.6">Hi ${escapeHtml(recipientName)}, ${escapeHtml(senderName || 'a SonicSign user')} requested your signature.</p>
      <div style="border:1px solid #e6eaf2;border-radius:14px;padding:16px;margin:20px 0;background:#fbfdff">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#667085;font-weight:700">Document</div>
        <div style="font-size:18px;font-weight:700;margin-top:4px">${escapeHtml(documentName)}</div>
        <div style="font-size:13px;color:#667085;margin-top:8px">Expires ${escapeHtml(expiration)}</div>
      </div>
      <p style="margin:24px 0">${button('Open Document', signingUrl)}</p>
      <p style="margin:18px 0 0;color:#667085;font-size:13px;line-height:1.5">If the button does not work, copy this secure link:<br/><a href="${escapeHtml(signingUrl)}" style="color:#365CF5">${escapeHtml(signingUrl)}</a></p>
    `,
  });
  return { subject, text, html };
}

function reminder({ recipientName, outstandingCount, signingUrl }) {
  const subject = 'Reminder: documents waiting for signature';
  return {
    subject,
    text: `Hi ${recipientName},\n\nYou have ${outstandingCount} outstanding document(s) waiting for signature.\n\nSign now: ${signingUrl}`,
    html: layout({
      title: subject,
      preview: `${outstandingCount} document(s) waiting for signature`,
      body: `
        <h1 style="margin:0 0 12px;font-size:24px;color:#101828">Friendly reminder</h1>
        <p style="color:#475467;line-height:1.6">Hi ${escapeHtml(recipientName)}, you have <strong>${escapeHtml(outstandingCount)}</strong> outstanding document(s) waiting for signature.</p>
        <p style="margin:24px 0">${button('Sign Now', signingUrl)}</p>
      `,
    }),
  };
}

function completed({ documentName, downloadUrl }) {
  const subject = `Completed: ${documentName}`;
  return {
    subject,
    text: `"${documentName}" has been completed successfully.\n\nDownload: ${downloadUrl}`,
    html: layout({
      title: subject,
      preview: `${documentName} was completed successfully`,
      body: `
        <h1 style="margin:0 0 12px;font-size:24px;color:#101828">Document completed</h1>
        <p style="color:#475467;line-height:1.6">"${escapeHtml(documentName)}" has been completed successfully and is ready to download.</p>
        ${downloadUrl ? `<p style="margin:24px 0">${button('Download Document', downloadUrl)}</p>` : ''}
      `,
    }),
  };
}

function accountVerification({ recipientName, verificationUrl }) {
  const subject = 'Verify your SonicSign account';
  return {
    subject,
    text: `Hi ${recipientName},\n\nVerify your SonicSign account: ${verificationUrl}`,
    html: layout({
      title: subject,
      preview: 'Verify your SonicSign account',
      body: `
        <h1 style="margin:0 0 12px;font-size:24px;color:#101828">Verify your account</h1>
        <p style="color:#475467;line-height:1.6">Hi ${escapeHtml(recipientName)}, confirm your email address to finish setting up SonicSign.</p>
        <p style="margin:24px 0">${button('Verify Account', verificationUrl)}</p>
      `,
    }),
  };
}

function passwordReset({ recipientName, resetUrl }) {
  const subject = 'Reset your SonicSign password';
  return {
    subject,
    text: `Hi ${recipientName},\n\nReset your SonicSign password: ${resetUrl}`,
    html: layout({
      title: subject,
      preview: 'Reset your SonicSign password',
      body: `
        <h1 style="margin:0 0 12px;font-size:24px;color:#101828">Reset your password</h1>
        <p style="color:#475467;line-height:1.6">Hi ${escapeHtml(recipientName)}, use the secure button below to reset your password.</p>
        <p style="margin:24px 0">${button('Reset Password', resetUrl)}</p>
      `,
    }),
  };
}

module.exports = {
  emailTemplates: {
    signingRequest,
    reminder,
    completed,
    accountVerification,
    passwordReset,
  },
};
