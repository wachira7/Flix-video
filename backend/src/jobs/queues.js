const { Queue } = require('bullmq');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Parse the Redis URL for BullMQ (ioredis format)
const parseRedisUrl = (url) => {
  const parsed = new URL(url);
  const isSecure = parsed.protocol === 'rediss:';

  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || (isSecure ? 6380 : 6379),
    username: parsed.username || 'default',
    password: parsed.password || undefined,
    tls: isSecure ? { rejectUnauthorized: false } : undefined,
    maxRetriesPerRequest: null,  // Required for BullMQ
  };
};

const connection = parseRedisUrl(REDIS_URL);

// Create queues
const cryptoPaymentQueue = new Queue('crypto-payment-checker', { connection });
const analyticsQueue = new Queue('analytics', { connection });
const cleanupQueue = new Queue('cleanup', { connection });
const recommendationQueue = new Queue('recommendations', { connection });
const notificationQueue = new Queue('notifications', { connection });
const exchangeRateQueue = new Queue('exchange-rates', { connection });

console.log('Job queues created');

module.exports = {
  cryptoPaymentQueue,
  analyticsQueue,
  cleanupQueue,
  recommendationQueue,
  notificationQueue,
  exchangeRateQueue,
  connection, // Export connection for workers
};