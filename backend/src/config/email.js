// backend/src/config/email.js
/**
 * Sender for every email FlixVideo sends.
 *
 * Set EMAIL_FROM to an address on a domain verified in Resend, e.g.
 *   EMAIL_FROM=FlixVideo <noreply@flixvideo.com>   (or just noreply@flixvideo.com)
 *
 * Without it we fall back to Resend's test sender, onboarding@resend.dev,
 * which only delivers to the Resend account owner's own inbox.
 */
const logger = require('../utils/logger');

const TEST_SENDER = 'onboarding@resend.dev';

function resolveSender(raw = process.env.EMAIL_FROM) {
  const value = (raw || '').trim();
  if (!value) return `FlixVideo <${TEST_SENDER}>`;
  return value.includes('<') ? value : `FlixVideo <${value}>`;
}

const EMAIL_FROM = resolveSender();
const USING_TEST_SENDER = EMAIL_FROM.includes(TEST_SENDER);

if (USING_TEST_SENDER && process.env.NODE_ENV === 'production') {
  logger.warn(
    `EMAIL_FROM is not set (or uses ${TEST_SENDER}). Resend only delivers mail from its test sender to the ` +
      'account owner, so users will not receive verification, password reset or notification emails. ' +
      'Verify your domain in Resend and set EMAIL_FROM, e.g. "FlixVideo <noreply@yourdomain.com>".'
  );
}

module.exports = { EMAIL_FROM, USING_TEST_SENDER, resolveSender };
