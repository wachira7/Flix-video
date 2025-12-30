const { CronJob } = require('cron');
const {
  cryptoPaymentQueue,
  analyticsQueue,
  cleanupQueue,
  recommendationQueue,
  notificationQueue,
  exchangeRateQueue
} = require('./queues');

/**
 * Schedule all background jobs
 */
function startScheduler() {
  console.log('⏰ Starting job scheduler...');

  // 1. Crypto Payment Checker - Every 5 minutes
  const cryptoPaymentJob = new CronJob(
    '*/5 * * * *',
    async () => {
      console.log('🪙 Triggering crypto payment check...');
      await cryptoPaymentQueue.add('check-payments', {}, {
        removeOnComplete: 10,
        removeOnFail: 5
      });
    },
    null,
    true,
    'UTC'
  );

  // 2. Analytics Aggregation - Daily at 1 AM
  const analyticsJob = new CronJob(
    '0 1 * * *',
    async () => {
      console.log('📊 Triggering daily analytics...');
      await analyticsQueue.add('aggregate-analytics', {}, {
        removeOnComplete: 30,
        removeOnFail: 5
      });
    },
    null,
    true,
    'UTC'
  );

  // 3. Cleanup Job - Weekly on Sunday at 2 AM
  const cleanupJob = new CronJob(
    '0 2 * * 0',
    async () => {
      console.log('🧹 Triggering cleanup job...');
      await cleanupQueue.add('cleanup-old-data', {}, {
        removeOnComplete: 10,
        removeOnFail: 5
      });
    },
    null,
    true,
    'UTC'
  );

  // 4. AI Recommendations Refresh - Daily at 3 AM
  const recommendationJob = new CronJob(
    '0 3 * * *',
    async () => {
      console.log('🤖 Triggering recommendations refresh...');
      await recommendationQueue.add('refresh-recommendations', {}, {
        removeOnComplete: 10,
        removeOnFail: 5
      });
    },
    null,
    true,
    'UTC'
  );

  // 5. Check Expiring Subscriptions - Daily at 9 AM
  const expiringSubscriptionsJob = new CronJob(
    '0 9 * * *',
    async () => {
      console.log('⏰ Checking expiring subscriptions...');
      
      // Find subscriptions expiring in 3 days
      const result = await global.pgPool.query(
        `SELECT s.id, s.user_id, u.email, sp.name as plan_name
         FROM subscriptions s
         JOIN users u ON s.user_id = u.id
         JOIN subscription_plans sp ON s.plan_id = sp.id
         WHERE s.status = 'active'
         AND s.current_period_end BETWEEN NOW() AND NOW() + INTERVAL '3 days'`
      );

      console.log(`Found ${result.rows.length} expiring subscriptions`);

      // Send notification for each
      for (const sub of result.rows) {
        await notificationQueue.add('send-notification', {
          type: 'subscription_expiring',
          userId: sub.user_id,
          data: {
            email: sub.email,
            plan: sub.plan_name,
            expires_at: sub.current_period_end
          }
        });
      }
    },
    null,
    true,
    'UTC'
  );

  // 6. Exchange Rate Updater - Every 6 hours
  const exchangeRateJob = new CronJob(
    '0 */6 * * *',  // Every 6 hours
    async () => {
      console.log('💱 Triggering exchange rate update...');
      await exchangeRateQueue.add('update-rates', {}, {
        removeOnComplete: 10,
        removeOnFail: 5
      });
    },
    null,
    true,
    'UTC'
  );

  console.log('✅ Job scheduler started!');
  console.log('📅 Scheduled jobs:');
  console.log('   🪙 Crypto payments: Every 5 minutes');
  console.log('   📊 Analytics: Daily at 1 AM UTC');
  console.log('   🧹 Cleanup: Weekly on Sunday at 2 AM UTC');
  console.log('   🤖 Recommendations: Daily at 3 AM UTC');
  console.log('   ⏰ Expiring subscriptions: Daily at 9 AM UTC');
  console.log('   💱 Exchange rates: Every 6 hours UTC');

  return {
    cryptoPaymentJob,
    analyticsJob,
    cleanupJob,
    recommendationJob,
    expiringSubscriptionsJob,
    exchangeRateJob
  };
}

/**
 * Stop all scheduled jobs
 */
function stopScheduler(jobs) {
  console.log('⏸️  Stopping job scheduler...');
  if (jobs) {
    Object.values(jobs).forEach(job => {
      if (job && job.stop) job.stop();
    });
  }
  console.log('✅ Job scheduler stopped');
}

module.exports = {
  startScheduler,
  stopScheduler
};
