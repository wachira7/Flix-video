//./src/jobs/queues.js
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// All background jobs share ONE BullMQ queue. Every BullMQ Worker holds its
// own blocking Redis connection, so six queues with six workers cost six
// extra connections per server instance. The Redis Cloud free tier allows
// 30, so we route every job through one queue and one worker instead.
const JOBS_QUEUE = 'flixvideo-jobs';

// Separates the logical queue from the job name, e.g. "notifications::payment_success"
const NAME_SEPARATOR = '::';

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

// ONE shared connection for the queue and the worker's commands.
// The worker adds one blocking connection of its own on top.
const connection = new IORedis(parseRedisUrl(REDIS_URL));

const jobsQueue = new Queue(JOBS_QUEUE, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 5,  // Keep only last 5 completed jobs (was 10-30)
    removeOnFail: 3,      // Keep only last 3 failed jobs (was 5)
    attempts: 2           // Retry twice max on failure
  }
});

// A logical queue: same .add() API as a BullMQ Queue, stored in the shared one
const logicalQueue = (name) => ({
  name,
  add: (jobName, data, opts) => jobsQueue.add(`${name}${NAME_SEPARATOR}${jobName}`, data, opts)
});

const cryptoPaymentQueue = logicalQueue('crypto-payment-checker');
const analyticsQueue = logicalQueue('analytics');
const cleanupQueue = logicalQueue('cleanup');
const recommendationQueue = logicalQueue('recommendations');
const notificationQueue = logicalQueue('notifications');
const exchangeRateQueue = logicalQueue('exchange-rates');

console.log('Job queues created');

module.exports = {
  cryptoPaymentQueue,
  analyticsQueue,
  cleanupQueue,
  recommendationQueue,
  notificationQueue,
  exchangeRateQueue,
  jobsQueue,
  connection,
  JOBS_QUEUE,
  NAME_SEPARATOR
};
