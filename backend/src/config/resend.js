// src/config/resend.js
// One Resend client for the whole app. Addresses on the reserved .invalid
// domain (demo accounts, anonymised deleted accounts) can never receive
// mail, so sending to them is skipped instead of bouncing, which would
// hurt the sender's reputation.
const { Resend } = require('resend');
const logger = require('../utils/logger');

const client = new Resend(process.env.RESEND_API_KEY);

const undeliverable = (to) =>
  [].concat(to || []).some((address) => /\.invalid>?\s*$/i.test(String(address).trim()));

const resend = {
  emails: {
    send: async (message) => {
      if (undeliverable(message?.to)) {
        logger.info('Skipped email to an undeliverable address', { subject: message?.subject });
        return { data: { id: null, skipped: true }, error: null };
      }
      return client.emails.send(message);
    }
  }
};

module.exports = { resend, undeliverable };
