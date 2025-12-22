const redis = require('redis');

let redisClient = null;

// Initialize Redis client
const initRedis = async () => {
  if (redisClient) return redisClient;

  try {
    redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Redis initialization failed:', error);
    return null;
  }
};

// Get from cache
const getCache = async (key) => {
  try {
    if (!redisClient) await initRedis();
    if (!redisClient) return null;

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
    if (!redisClient) await initRedis();
    if (!redisClient) return false;

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
    if (!redisClient) await initRedis();
    if (!redisClient) return false;

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
    if (!redisClient) await initRedis();
    if (!redisClient) return false;

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

module.exports = {
  initRedis,
  getCache,
  setCache,
  deleteCache,
  clearCachePattern
};
