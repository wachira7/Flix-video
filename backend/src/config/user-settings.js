// backend/src/config/user-settings.js
/**
 * User settings schema. Only these keys are stored, and every one of them
 * changes real behaviour somewhere:
 *
 * notifications.billing_reminders   -> subscription_expiring emails (notification.job)
 * notifications.watch_party_invites -> watch_party_invite emails (notification.job)
 * notifications.review_activity     -> new_review emails (notification.job)
 * preferences.region                -> "Where to watch" country (frontend)
 * preferences.autoplay_hero         -> home hero auto-advance (frontend)
 * privacy.record_watch_history      -> POST /api/users/watch-progress (user.controller)
 *
 * Payment receipts and failures are transactional and always sent.
 */

const REGIONS = ['KE', 'UG', 'TZ', 'RW', 'NG', 'GH', 'ZA', 'US', 'GB', 'CA', 'IN', 'AE'];

const SCHEMA = {
  notifications: {
    billing_reminders: { type: 'boolean', default: true },
    watch_party_invites: { type: 'boolean', default: true },
    review_activity: { type: 'boolean', default: true },
  },
  preferences: {
    region: { type: 'enum', values: REGIONS, default: 'KE' },
    autoplay_hero: { type: 'boolean', default: true },
  },
  privacy: {
    record_watch_history: { type: 'boolean', default: true },
  },
};

/** Stored settings merged over defaults, so every key is always present */
function withDefaults(stored = {}) {
  const out = {};
  for (const [section, fields] of Object.entries(SCHEMA)) {
    out[section] = {};
    for (const [key, rule] of Object.entries(fields)) {
      const value = stored?.[section]?.[key];
      out[section][key] = isValid(rule, value) ? value : rule.default;
    }
  }
  return out;
}

function isValid(rule, value) {
  if (rule.type === 'boolean') return typeof value === 'boolean';
  if (rule.type === 'enum') return rule.values.includes(value);
  return false;
}

/**
 * Validate a partial update. Returns { settings } with only known, valid keys,
 * or { error } describing the first problem.
 */
function validatePatch(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return { error: 'Settings must be an object' };
  }
  const clean = {};
  for (const [section, values] of Object.entries(patch)) {
    const fields = SCHEMA[section];
    if (!fields) return { error: `Unknown settings section: ${section}` };
    if (!values || typeof values !== 'object') return { error: `${section} must be an object` };
    clean[section] = {};
    for (const [key, value] of Object.entries(values)) {
      const rule = fields[key];
      if (!rule) return { error: `Unknown setting: ${section}.${key}` };
      if (!isValid(rule, value)) return { error: `Invalid value for ${section}.${key}` };
      clean[section][key] = value;
    }
  }
  return { settings: clean };
}

/** Deep-merge a validated patch into stored settings */
function merge(stored = {}, patch = {}) {
  const out = { ...stored };
  for (const [section, values] of Object.entries(patch)) {
    out[section] = { ...(stored[section] || {}), ...values };
  }
  return out;
}

module.exports = { SCHEMA, REGIONS, withDefaults, validatePatch, merge };
