// backend/src/services/session.service.js
/**
 * Sign-in sessions. Each sign-in creates a row in `devices` (migration 008,
 * repurposed by 019) and the JWT carries its id as `sid`, so a single device
 * can be signed out. `users.sessions_valid_after` signs out everything,
 * including tokens issued before sessions existed.
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const { TOKEN_EXPIRY } = require('../utils/constants');

// Same secret and expiry as auth.controller / auth.middleware
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || TOKEN_EXPIRY.ACCESS_TOKEN;

/** Rough, dependency-free description of a user agent */
function describeUserAgent(ua = '') {
  const s = String(ua);
  const os =
    /iPhone|iPad|iPod/.test(s) ? 'iOS' :
    /Android/.test(s) ? 'Android' :
    /Windows/.test(s) ? 'Windows' :
    /Mac OS X|Macintosh/.test(s) ? 'macOS' :
    /CrOS/.test(s) ? 'ChromeOS' :
    /Linux/.test(s) ? 'Linux' : null;
  const browser =
    /Edg\//.test(s) ? 'Edge' :
    /OPR\/|Opera/.test(s) ? 'Opera' :
    /Firefox\//.test(s) ? 'Firefox' :
    /Chrome\//.test(s) ? 'Chrome' :
    /Safari\//.test(s) ? 'Safari' : null;
  const app = /okhttp|Expo|ReactNative|FlixVideo/i.test(s);

  let deviceType = 'web';
  if (app) deviceType = /iPhone|iPad|iOS/i.test(s) ? 'ios' : 'android';
  else if (/SmartTV|SMART-TV|Tizen|WebOS/i.test(s)) deviceType = 'tv';

  const name = app
    ? `FlixVideo app${os ? ` on ${os}` : ''}`
    : [browser, os && `on ${os}`].filter(Boolean).join(' ') || 'Unknown device';

  return { deviceType, deviceName: name.slice(0, 255), osName: os };
}

/** Create a session row and return a signed token for it */
async function issueToken(userId, req) {
  const ua = req?.headers?.['user-agent'] || '';
  const { deviceType, deviceName, osName } = describeUserAgent(ua);
  const deviceId = crypto.randomUUID();

  let sid = null;
  try {
    const { rows } = await global.pgPool.query(
      `INSERT INTO devices (user_id, device_name, device_type, device_id, os_name, is_active, last_active_at, last_ip)
       VALUES ($1, $2, $3, $4, $5, TRUE, NOW(), $6)
       RETURNING id`,
      [userId, deviceName, deviceType, deviceId, osName, req?.ip || null]
    );
    sid = rows[0]?.id || null;
  } catch {
    // If sessions can't be recorded (e.g. migration 019 not run yet),
    // still sign the user in with a session-less token.
    sid = null;
  }

  const payload = sid ? { id: userId, sid } : { id: userId };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

module.exports = { issueToken, describeUserAgent, JWT_SECRET };
