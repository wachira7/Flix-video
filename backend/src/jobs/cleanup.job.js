const { Worker } = require('bullmq');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

// Worker to cleanup old data
const cleanupWorker = new Worker(
  'cleanup',
  async (job) => {
    console.log('🧹 Running cleanup job...');

    try {
      let totalDeleted = 0;

      // 1. Delete expired sessions (older than 30 days)
      const sessions = await global.pgPool.query(
        `DELETE FROM user_sessions 
         WHERE last_activity < NOW() - INTERVAL '30 days'
         RETURNING id`
      );
      console.log(`🗑️  Deleted ${sessions.rowCount} expired sessions`);
      totalDeleted += sessions.rowCount;

      // 2. Delete old activity logs (older than 90 days)
      const activityLogs = await global.pgPool.query(
        `DELETE FROM admin_activity_logs 
         WHERE created_at < NOW() - INTERVAL '90 days'
         RETURNING id`
      );
      console.log(`🗑️  Deleted ${activityLogs.rowCount} old activity logs`);
      totalDeleted += activityLogs.rowCount;

      // 3. Delete failed payments (older than 30 days)
      const failedPayments = await global.pgPool.query(
        `DELETE FROM payments 
         WHERE status = 'failed' 
         AND created_at < NOW() - INTERVAL '30 days'
         RETURNING id`
      );
      console.log(`🗑️  Deleted ${failedPayments.rowCount} old failed payments`);
      totalDeleted += failedPayments.rowCount;

      // 4. Archive old watch party data (older than 60 days)
      const oldParties = await global.pgPool.query(
        `UPDATE watch_parties 
         SET status = 'archived'
         WHERE created_at < NOW() - INTERVAL '60 days'
         AND status = 'ended'
         RETURNING id`
      );
      console.log(`📦 Archived ${oldParties.rowCount} old watch parties`);

      // 5. Clean Redis expired keys
      const { redisClient } = require('../config/cache');
      const expiredKeys = await redisClient.keys('usage:*:daily');
      
      // Check each key's TTL and delete if expired
      let redisDeleted = 0;
      for (const key of expiredKeys) {
        const ttl = await redisClient.ttl(key);
        if (ttl === -1) { // No expiration set
          await redisClient.del(key);
          redisDeleted++;
        }
      }
      console.log(`🗑️  Cleaned ${redisDeleted} Redis keys`);

      return {
        sessions: sessions.rowCount,
        activity_logs: activityLogs.rowCount,
        failed_payments: failedPayments.rowCount,
        archived_parties: oldParties.rowCount,
        redis_keys: redisDeleted,
        total_deleted: totalDeleted
      };

    } catch (error) {
      console.error('Cleanup job error:', error);
      throw error;
    }
  },
  { connection }
);

cleanupWorker.on('completed', (job) => {
  console.log(`✅ Cleanup completed:`, job.returnvalue);
});

cleanupWorker.on('failed', (job, err) => {
  console.error(`❌ Cleanup failed:`, err.message);
});

module.exports = cleanupWorker;
