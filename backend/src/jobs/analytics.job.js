const { Worker } = require('bullmq');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

// Worker to aggregate daily analytics
const analyticsWorker = new Worker(
  'analytics',
  async (job) => {
    console.log('📊 Running daily analytics aggregation...');

    try {
      const today = new Date().toISOString().split('T')[0];

      // User growth
      const userGrowth = await global.pgPool.query(
        `SELECT COUNT(*) as new_users
         FROM users
         WHERE DATE(created_at) = $1`,
        [today]
      );

      // Active users (logged in today)
      const activeUsers = await global.pgPool.query(
        `SELECT COUNT(DISTINCT user_id) as active_users
         FROM user_sessions
         WHERE DATE(last_activity) = $1`,
        [today]
      );

      // Content stats
      const contentStats = await global.pgPool.query(
        `SELECT 
          (SELECT COUNT(*) FROM reviews WHERE DATE(created_at) = $1) as reviews,
          (SELECT COUNT(*) FROM lists WHERE DATE(created_at) = $1) as lists,
          (SELECT COUNT(*) FROM watch_parties WHERE DATE(created_at) = $1) as parties,
          (SELECT COUNT(*) FROM ratings WHERE DATE(created_at) = $1) as ratings`,
        [today]
      );

      // Payment stats
      const paymentStats = await global.pgPool.query(
        `SELECT 
          COUNT(*) as total_payments,
          SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) as revenue,
          COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
         FROM payments
         WHERE DATE(created_at) = $1`,
        [today]
      );

      const stats = {
        date: today,
        new_users: parseInt(userGrowth.rows[0].new_users),
        active_users: parseInt(activeUsers.rows[0]?.active_users || 0),
        content: contentStats.rows[0],
        payments: paymentStats.rows[0]
      };

      // Store in MongoDB for historical tracking
      if (global.mongoClient) {
        await global.mongoClient.db().collection('daily_analytics').insertOne({
          ...stats,
          created_at: new Date()
        });
      }

      console.log('📊 Analytics aggregated:', stats);
      return stats;

    } catch (error) {
      console.error('Analytics job error:', error);
      throw error;
    }
  },
  { connection }
);

analyticsWorker.on('completed', (job) => {
  console.log(`✅ Analytics aggregation completed`);
});

analyticsWorker.on('failed', (job, err) => {
  console.error(`❌ Analytics aggregation failed:`, err.message);
});

module.exports = analyticsWorker;
