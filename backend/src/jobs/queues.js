//backend/src/jobs/queues.js
const { Queue } = require('bullmq');

// Parse REDIS_URL for BullMQ connection
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = {
  url: REDIS_URL
};

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
  connection  // Export connection for workers  
};