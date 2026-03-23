// src/jobs/recommendation.job.js
const { Worker } = require('bullmq');
const aiService = require('../services/ai.service');
const logger = require('../utils/logger');

const { connection } = require('./queues');

// Worker to refresh AI recommendations for active users
const recommendationWorker = new Worker(
  'recommendations',
  async (job) => {
    logger.info('🤖 Refreshing AI recommendations...');

    try {
      // Get active users (logged in within last 7 days)
      const result = await global.pgPool.query(
        `SELECT DISTINCT u.id
         FROM users u
         JOIN user_sessions us ON u.id = us.user_id
         WHERE us.last_activity > NOW() - INTERVAL '7 days'
         LIMIT 100`  
      );

      logger.info(`Found ${result.rows.length} active users`);

      let generated = 0;
      let failed = 0;

      for (const user of result.rows) {
        try {
          // Check if recommendations already fresh (less than 24h old)
          const { redisClient } = require('../config/cache');
          const cacheKey = `recommendations:${user.id}`;
          const cached = await redisClient.get(cacheKey);

          if (cached) {
            logger.info(`⏭️  Skipping user ${user.id} - recommendations still fresh`);
            continue;
          }

          // Generate new recommendations
          const recommendations = await aiService.generateRecommendations(user.id);

          if (recommendations) {
            // Cache for 24 hours
            await redisClient.setex(cacheKey, 86400, JSON.stringify(recommendations));
            generated++;
            logger.info(`✅ Generated recommendations for user ${user.id}`);
          }

        } catch (error) {
          logger.error(`Error generating recommendations for user ${user.id}:`, error.message);
          failed++;
        }

        // Rate limiting - wait 1 second between users to avoid API throttling
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return { processed: result.rows.length, generated, failed };

    } catch (error) {
      console.error('Recommendation job error:', error);
      throw error;
    }
  },
  { connection,
    stalledInterval: 300000,  // Check for stalled jobs every 5 min (default is 30s)
    drainDelay: 30,           // Wait 30s when queue empty before polling again
    lockDuration: 60000,      // Set lock duration to 60s to allow for longer processing time, especially if there are many users to process
   }
);

recommendationWorker.on('completed', (job) => {
  logger.info(`✅ Recommendations refresh completed:`, job.returnvalue);
});

recommendationWorker.on('failed', (job, err) => {
  logger.error(`❌ Recommendations refresh failed:`, err.message);
});

module.exports = recommendationWorker;
