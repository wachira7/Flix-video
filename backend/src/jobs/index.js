// src/jobs/index.js
const { startScheduler, stopScheduler } = require('./scheduler');

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
  console.log('🚀 Starting background job system...');

  try {
    // Start the scheduler
    scheduledJobs = startScheduler();

    console.log('✅ All workers are running!');
    console.log('📋 Active workers:');
    console.log('   🪙 Crypto Payment Checker');
    console.log('   📊 Analytics Aggregator');
    console.log('   🧹 Data Cleanup');
    console.log('   �� AI Recommendations');
    console.log('   📧 Notification Sender');
    console.log('   💱 Exchange Rate Updater');

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
    console.error('❌ Failed to start job system:', error);
    throw error;
  }
}

/**
 * Stop all background jobs
 */
async function stopJobs() {
  console.log('⏸️  Stopping background job system...');

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

    console.log('✅ All workers stopped');

  } catch (error) {
    console.error('❌ Error stopping jobs:', error);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  await stopJobs();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📴 Received SIGINT, shutting down gracefully...');
  await stopJobs();
  process.exit(0);
});

module.exports = {
  startJobs,
  stopJobs
};
