//backend/src/config/cache.js
const redis = require('redis');
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// DEBUG: Log what URL we're using
console.log('🔍 DEBUG: REDIS_URL =', REDIS_URL);
console.log('🔍 DEBUG: Environment =', process.env.NODE_ENV);

// Create Redis client
const redisClient = redis.createClient({
  url: REDIS_URL,
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

// Connect function (called from server.js)
const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('✅ Redis connection established');
  } catch (err) {
    console.error('❌ Redis connection failed:', err.message);
  }
};

// ============ CACHE UTILITY FUNCTIONS ============

// Get from cache
const getCache = async (key) => {
  try {
    if (!redisClient.isReady) {
      console.warn('⚠️ Redis not ready, skipping cache get');
      return null;
    }
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

// Set cache with expiry (default 1 hour)
const setCache = async (key, value, expirySeconds = 3600) => {
  try {
    if (!redisClient.isReady) {
      console.warn('⚠️ Redis not ready, skipping cache set');
      return false;
    }
    await redisClient.setEx(key, expirySeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

// Delete from cache
const deleteCache = async (key) => {
  try {
    if (!redisClient.isReady) {
      console.warn('⚠️ Redis not ready, skipping cache delete');
      return false;
    }
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
};

// Clear all cache with pattern
const clearCachePattern = async (pattern) => {
  try {
    if (!redisClient.isReady) {
      console.warn('⚠️ Redis not ready, skipping cache clear');
      return false;
    }
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Cache clear error:', error);
    return false;
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📴 Closing Redis connection...');
  await redisClient.quit();
});

module.exports = {
  redisClient,
  connectRedis,
  getCache,
  setCache,
  deleteCache,
  clearCachePattern
};