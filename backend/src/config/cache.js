//backend/src/config/cache.js
const redis = require('redis');
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client with retry strategy
const redisClient = redis.createClient({
  url: REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Redis: Too many retries, giving up');
        return new Error('Too many retries');
      }
      const delay = Math.min(retries * 50, 2000);
      console.log(`🔄 Redis: Reconnecting in ${delay}ms...`);
      return delay;
    }
  }
});

// Event handlers
redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('🔗 Redis: Connecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis: Connected and ready!');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis: Reconnecting...');
});

redisClient.on('end', () => {
  console.log('⚠️  Redis: Connection closed');
});

// Connect
redisClient.connect()
  .then(() => console.log('✅ Redis connection established'))
  .catch((err) => {
    console.error('❌ Redis connection failed:', err.message);
    // Don't crash the app if Redis is down
    process.exit(0); // Or handle gracefully
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📴 Closing Redis connection...');
  await redisClient.quit();
});

module.exports = {
  redisClient
};
