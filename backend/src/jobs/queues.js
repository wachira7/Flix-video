//backend/src/jobs/queues.js
const { Queue } = require('bullmq');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
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
  exchangeRateQueue  
};