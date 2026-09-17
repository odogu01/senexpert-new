// @ts-nocheck
/** Server-only email delivery helpers. */

async function getNodemailer() {
  return import('nodemailer');
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[character]));
}

function getMailConfig() {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM_EMAIL'];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Email is not configured: missing ${missing.join(', ')}`);

  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    from: `"${process.env.SMTP_FROM_NAME || 'SenExpert Global'}" <${process.env.SMTP_FROM_EMAIL}>`,
  };
}

export async function sendNewUserCredentials({ email, fullName, password }: { email: string; fullName: string; password: string }) {
  const config = getMailConfig();
  const nodemailer = await getNodemailer();
  const loginUrl = process.env.EMAIL_LOGIN_URL || `${(process.env.NEXT_PUBLIC_APP_URL || 'https://senexpert-new.vercel.app').replace(/\/$/, '')}/login`;
  const loginLink = loginUrl;
  const logoUrl = `${loginUrl.replace(/\/login\/?$/, '')}/logo.png`;
  const safeName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(password);

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: 'Your SenExpert Global login details',
    text: `Hello ${fullName},\n\nYour SenExpert Global account has been created.\n\nUsername: ${email}\nTemporary password: ${password}\nLogin: ${loginLink}\n\nFor your security, change your password after you sign in.\n\nSenExpert Global`,
    html: `<div style="max-width:600px;margin:0 auto;padding:32px 24px;font-family:Arial,sans-serif;color:#1f2937"><div style="margin-bottom:28px"><img src="${logoUrl}" alt="SenExpert Global" width="180" style="display:block;max-width:180px;height:auto" /></div><p>Hello ${safeName},</p><p>Your <strong>SenExpert Global</strong> account has been created.</p><p><strong>Username:</strong> ${safeEmail}<br><strong>Temporary password:</strong> ${safePassword}</p><p><a href="${loginLink}" style="display:inline-block;background:#0B3C6D;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none">Sign in to SenExpert Global</a></p><p>For your security, change your password after you sign in.</p><p>SenExpert Global</p></div>`,
  });
}
