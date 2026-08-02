const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Generate 2FA Secret and QR Code Data URL
 * @param {string} userEmail 
 * @param {string} appName 
 */
const generateMFASecret = async (userEmail, appName = 'Enterprise Auth') => {
  const secret = speakeasy.generateSecret({
    length: 20,
    name: `${appName} (${userEmail})`,
    issuer: appName
  });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  // Generate 8 alphanumeric recovery codes
  const recoveryCodes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );

  return {
    otpauthUrl: secret.otpauth_url,
    base32Secret: secret.base32,
    qrCodeUrl,
    recoveryCodes
  };
};

/**
 * Verify TOTP Token
 * @param {string} secret - Base32 encoded secret
 * @param {string} token - 6-digit TOTP token
 * @returns {boolean}
 */
const verifyTOTP = (secret, token) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1 // Allow 30s clock drift
  });
};

module.exports = {
  generateMFASecret,
  verifyTOTP
};
