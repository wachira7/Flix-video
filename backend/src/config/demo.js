// src/config/demo.js
// One-click demo accounts: what they get and what they can't do.
// The rules are enforced in the auth middleware, so every route is covered
// without each controller having to know about demos.

const DEMO_TTL_HOURS = 24;
const MAX_ACTIVE_DEMOS = 200; // protects the database if the endpoint is hammered
const DEMO_EMAIL_DOMAIN = 'demo.flixvideo.invalid'; // .invalid never receives mail

// Actions that would spend money, reach real people, or change sign-in details
const BLOCKED = [
  { method: 'POST', path: /^\/api\/payments\/(stripe\/create-checkout|mpesa\/stk-push|crypto\/create)\/?$/ },
  { method: 'POST', path: /^\/api\/subscriptions\/(upgrade|cancel|activate)\/?$/ },
  { method: 'PUT', path: /^\/api\/users\/password\/?$/ },
  { method: 'POST', path: /^\/api\/users\/avatar\/?$/ },
  { method: 'POST', path: /^\/api\/users\/me\/delete\/?$/ },
  // Reviews and comments are public, so a demo account can't post them
  { method: 'POST', path: /^\/api\/reviews\/[^/]+\/[^/]+\/?$/ },
  { method: 'POST', path: /^\/api\/reviews\/[^/]+\/comments\/?$/ },
  { method: 'PUT', path: /^\/api\/reviews\/(comments\/)?[^/]+\/?$/ }
];

// Writes that would otherwise be visible to everyone stay private
const FORCE_PRIVATE = [
  { method: 'POST', path: /^\/api\/lists\/?$/ },
  { method: 'PUT', path: /^\/api\/lists\/[^/]+\/?$/ },
  { method: 'POST', path: /^\/api\/watch-party\/?$/ }
];

const matches = (rules, req) => {
  const path = (req.originalUrl || req.url || '').split('?')[0];
  return rules.some((r) => r.method === req.method && r.path.test(path));
};

/**
 * Apply the demo rules to a request from a demo account.
 * Returns an error body to send with 403, or null to carry on.
 */
function applyDemoRules(req) {
  if (matches(BLOCKED, req)) {
    return {
      success: false,
      demo: true,
      error: "That isn't available in the demo. Create a free account to do it for real."
    };
  }
  if (matches(FORCE_PRIVATE, req) && req.body && typeof req.body === 'object') {
    req.body.is_public = false;
  }
  return null;
}

module.exports = { DEMO_TTL_HOURS, MAX_ACTIVE_DEMOS, DEMO_EMAIL_DOMAIN, applyDemoRules };
