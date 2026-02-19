// backend/src/utils/cache-helper.js
const { redisClient } = require('../config/cache');

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

module.exports = {
  getCache,
  setCache,
  deleteCache,
  clearCachePattern
};