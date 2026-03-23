// src/jobs/index.js
const { startScheduler, stopScheduler } = require('./scheduler');
const logger = require('../utils/logger');

// Import all workers
const cryptoPaymentWorker = require('./crypto-payment-checker.job');
const analyticsWorker = require('./analytics.job');
const cleanupWorker = require('./cleanup.job');
const recommendationWorker = require('./recommendation.job');
const notificationWorker = require('./notification.job');
const exchangeRateWorker = require('./exchange-rate-updater.job');

let scheduledJobs = null;

/**
 * Start all background jobs
 */
async function startJobs() {
  logger.info('🚀 Starting background job system...');

  try {
    // Start the scheduler
    scheduledJobs = startScheduler();

    logger.info('✅ All workers are running!');
    logger.info('📋 Active workers:');
    logger.info('   🪙 Crypto Payment Checker');
    logger.info('   📊 Analytics Aggregator');
    logger.info('   🧹 Data Cleanup');
    logger.info('    AI Recommendations');
    logger.info('   📧 Notification Sender');
    logger.info('   💱 Exchange Rate Updater');

    return {
      workers: {
        cryptoPaymentWorker,
        analyticsWorker,
        cleanupWorker,
        recommendationWorker,
        notificationWorker,
        exchangeRateWorker
      },
      scheduledJobs
    };

  } catch (error) {
    logger.error('❌ Failed to start job system:', error);
    throw error;
  }
}

/**
 * Stop all background jobs
 */
async function stopJobs() {
  logger.info('⏸️  Stopping background job system...');

  try {
    // Stop scheduler
    stopScheduler(scheduledJobs);

    // Close all workers
    await cryptoPaymentWorker.close();
    await analyticsWorker.close();
    await cleanupWorker.close();
    await recommendationWorker.close();
    await notificationWorker.close();
    await exchangeRateWorker.close();

    logger.info('✅ All workers stopped');

  } catch (error) {
    logger.error('❌ Error stopping jobs:', error);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('📴 Received SIGTERM, shutting down gracefully...');
  await stopJobs();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('📴 Received SIGINT, shutting down gracefully...');
  await stopJobs();
  process.exit(0);
});

module.exports = {
  startJobs,
  stopJobs
};
