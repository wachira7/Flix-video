//./src/jobs/queues.js
const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

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

// Create ONE shared connection for all queues
const sharedConnection = new IORedis(parseRedisUrl(REDIS_URL));

// Create ONE shared connection for all workers  
const workerConnection = new IORedis(parseRedisUrl(REDIS_URL));


// Default options for all queues - reduces Redis command usage
const defaultQueueOptions = {
  connection: sharedConnection,  // Use the shared connection for all queues
  defaultJobOptions: {
    removeOnComplete: 5,  // Keep only last 5 completed jobs (was 10-30)
    removeOnFail: 3,      // Keep only last 3 failed jobs (was 5)
    attempts: 2           // Retry twice max on failure
  }
};

// Create queues
const cryptoPaymentQueue = new Queue('crypto-payment-checker', defaultQueueOptions);
const analyticsQueue = new Queue('analytics', defaultQueueOptions);
const cleanupQueue = new Queue('cleanup', defaultQueueOptions);
const recommendationQueue = new Queue('recommendations', defaultQueueOptions);
const notificationQueue = new Queue('notifications', defaultQueueOptions);
const exchangeRateQueue = new Queue('exchange-rates', defaultQueueOptions);

console.log('Job queues created');

module.exports = {
  cryptoPaymentQueue,
  analyticsQueue,
  cleanupQueue,
  recommendationQueue,
  notificationQueue,
  exchangeRateQueue,
  connection : workerConnection // Export the worker connection for use in workers, 
};