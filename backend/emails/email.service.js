const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'test') {
    return {
      sendMail: async (options) => {
        logger.info(`[Test Email Mock] To: ${options.to}, Subject: ${options.subject}`);
        return { messageId: 'test-mock-id' };
      }
    };
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || 'ethereal_user',
      pass: process.env.SMTP_PASS || 'ethereal_pass',
    },
  });
};

const transporter = createTransporter();

/**
 * Base Email Layout Wrapper
 */
const wrapTemplate = (title, bodyContent) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: rgba(30, 41, 59, 0.9); border-radius: 12px; padding: 30px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .header { text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 20px; }
    .brand { font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .btn { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #3b82f6, #6366f1); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">${process.env.APP_NAME || 'Enterprise Auth Platform'}</div>
    </div>
    ${bodyContent}
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Enterprise Auth Platform'}. All rights reserved.<br>
      This is an automated security email. Please do not reply directly.
    </div>
  </div>
</body>
</html>
`;

/**
 * Send Verification Email
 */
const sendVerificationEmail = async (email, name, verificationUrl) => {
  const subject = 'Verify Your Email Address';
  const body = `
    <h2>Welcome, ${name}!</h2>
    <p>Thank you for registering. Please verify your email address to complete your account setup and activate full platform features.</p>
    <div style="text-align: center;">
      <a href="${verificationUrl}" class="btn">Verify Email Address</a>
    </div>
    <p style="font-size: 13px; color: #94a3b8;">Or copy and paste this link into your browser:</p>
    <p style="font-size: 12px; word-break: break-all; color: #38bdf8;">${verificationUrl}</p>
    <p>This verification link will expire in 24 hours.</p>
  `;

  return await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Enterprise Security" <noreply@enterprise.local>',
    to: email,
    subject,
    html: wrapTemplate(subject, body)
  });
};

/**
 * Send Password Reset Email
 */
const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const subject = 'Reset Your Password';
  const body = `
    <h2>Hello, ${name}</h2>
    <p>We received a request to reset your password. Click the button below to set a new password:</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <p style="font-size: 13px; color: #94a3b8;">Or copy and paste this link into your browser:</p>
    <p style="font-size: 12px; word-break: break-all; color: #38bdf8;">${resetUrl}</p>
    <p style="color: #ef4444; font-size: 13px;">If you did not request a password reset, please ignore this email or contact support immediately.</p>
    <p>This reset link expires in 1 hour.</p>
  `;

  return await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Enterprise Security" <noreply@enterprise.local>',
    to: email,
    subject,
    html: wrapTemplate(subject, body)
  });
};

/**
 * Send Account Locked Notification Email
 */
const sendAccountLockedEmail = async (email, name, lockTimeMinutes) => {
  const subject = 'Security Alert: Account Temporarily Locked';
  const body = `
    <h2>Security Alert</h2>
    <p>Hello ${name}, your account has been temporarily locked due to multiple consecutive failed login attempts.</p>
    <p><strong>Lock duration:</strong> ${lockTimeMinutes} minutes.</p>
    <p>If this was not you, someone may be attempting to access your account. We recommend resetting your password immediately once the lock period expires.</p>
  `;

  return await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Enterprise Security" <noreply@enterprise.local>',
    to: email,
    subject,
    html: wrapTemplate(subject, body)
  });
};

/**
 * Send New Login Notification Email
 */
const sendNewLoginEmail = async (email, name, loginDetails) => {
  const subject = 'Security Alert: New Sign-In Detected';
  const body = `
    <h2>New Sign-In Detected</h2>
    <p>Hello ${name}, a new sign-in to your account was detected:</p>
    <ul>
      <li><strong>Time:</strong> ${new Date().toUTCString()}</li>
      <li><strong>IP Address:</strong> ${loginDetails.ipAddress}</li>
      <li><strong>Browser:</strong> ${loginDetails.browser}</li>
      <li><strong>Operating System:</strong> ${loginDetails.os}</li>
      <li><strong>Device:</strong> ${loginDetails.device}</li>
    </ul>
    <p>If this was you, no action is needed. If you do not recognize this activity, please change your password and revoke active sessions immediately.</p>
  `;

  return await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Enterprise Security" <noreply@enterprise.local>',
    to: email,
    subject,
    html: wrapTemplate(subject, body)
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAccountLockedEmail,
  sendNewLoginEmail
};
