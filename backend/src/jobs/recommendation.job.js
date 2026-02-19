// src/jobs/recommendation.job.js
const { Worker } = require('bullmq');
const aiService = require('../services/ai.service');

const { connection } = require('./queues');

// Worker to refresh AI recommendations for active users
const recommendationWorker = new Worker(
  'recommendations',
  async (job) => {
    console.log('🤖 Refreshing AI recommendations...');

    try {
      // Get active users (logged in within last 7 days)
      const result = await global.pgPool.query(
        `SELECT DISTINCT u.id
         FROM users u
         JOIN user_sessions us ON u.id = us.user_id
         WHERE us.last_activity > NOW() - INTERVAL '7 days'
         LIMIT 100`  // Process in batches
      );

      console.log(`Found ${result.rows.length} active users`);

      let generated = 0;
      let failed = 0;

      for (const user of result.rows) {
        try {
          // Check if recommendations already fresh (less than 24h old)
          const { redisClient } = require('../config/cache');
          const cacheKey = `recommendations:${user.id}`;
          const cached = await redisClient.get(cacheKey);

          if (cached) {
            console.log(`⏭️  Skipping user ${user.id} - recommendations still fresh`);
            continue;
          }

          // Generate new recommendations
          const recommendations = await aiService.generateRecommendations(user.id);

          if (recommendations) {
            // Cache for 24 hours
            await redisClient.setex(cacheKey, 86400, JSON.stringify(recommendations));
            generated++;
            console.log(`✅ Generated recommendations for user ${user.id}`);
          }

        } catch (error) {
          console.error(`Error generating recommendations for user ${user.id}:`, error.message);
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
  { connection }
);

recommendationWorker.on('completed', (job) => {
  console.log(`✅ Recommendations refresh completed:`, job.returnvalue);
});

recommendationWorker.on('failed', (job, err) => {
  console.error(`❌ Recommendations refresh failed:`, err.message);
});

module.exports = recommendationWorker;
