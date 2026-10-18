// src/services/ai-usage.service.js
// Daily FlixVideo AI message allowance per plan (config/plans.js:
// ai_messages_daily). Days run midnight to midnight in Nairobi, so
// "resets at midnight" means the same thing to every user in Kenya.
const { redisClient } = require('../config/cache');
const { getPlan } = require('../config/plans');
const { getUserSubscription } = require('../api/middlewares/subscription.middleware');

const NAIROBI_OFFSET_HOURS = 3; // EAT, no daylight saving
const DAY_MS = 24 * 60 * 60 * 1000;

function nairobiDay(now = new Date()) {
  return new Date(now.getTime() + NAIROBI_OFFSET_HOURS * 3600 * 1000).toISOString().slice(0, 10);
}

// The next midnight in Nairobi, as an ISO timestamp
function nextReset(now = new Date()) {
  const startOfDayUtc = Date.parse(`${nairobiDay(now)}T00:00:00Z`) - NAIROBI_OFFSET_HOURS * 3600 * 1000;
  return new Date(startOfDayUtc + DAY_MS).toISOString();
}

const keyFor = (userId, now) => `ai_messages:${userId}:${nairobiDay(now)}`;

/**
 * { plan, limit, used, remaining, resets_at } for today.
 */
async function getUsage(userId, now = new Date()) {
  const subscription = await getUserSubscription(userId);
  const plan = subscription.plan_type || 'free';
  const limit = getPlan(plan).limits.ai_messages_daily ?? 0;
  const used = parseInt(await redisClient.get(keyFor(userId, now)), 10) || 0;
  return { plan, limit, used, remaining: Math.max(0, limit - used), resets_at: nextReset(now) };
}

/**
 * Count one answered message. Only called after the AI replies, so a
 * failed request doesn't use up the allowance.
 */
async function recordMessage(userId, now = new Date()) {
  const key = keyFor(userId, now);
  const used = await redisClient.incr(key);
  if (used === 1) await redisClient.expire(key, 2 * 24 * 60 * 60);
  return used;
}

module.exports = { getUsage, recordMessage, nairobiDay, nextReset };
