//backend/src/jobs/exchange-rate-updater.job.js
const { Worker } = require('bullmq');
const axios = require('axios');

const { connection } = require('./queues');

// Multiple API sources (fallback strategy)
const API_SOURCES = [
  {
    name: 'exchangerate.host',
    url: 'https://api.exchangerate.host/latest?base=USD',
    parse: (data) => ({ base: 'USD', date: data.date, rates: data.rates })
  },
  {
    name: 'frankfurter.app',
    url: 'https://api.frankfurter.app/latest?from=USD',
    parse: (data) => ({ base: 'USD', date: data.date, rates: data.rates })
  },
  {
    name: 'exchangerate-api.com',
    url: 'https://api.exchangerate-api.com/v4/latest/USD',
    parse: (data) => ({ base: data.base, date: data.date, rates: data.rates })
  }
];

// Currencies we care about
const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF', 'INR', 'ZAR'
];

/**
 * Fetch rates with retry logic
 */
async function fetchRatesWithRetry(maxRetries = 3) {
  for (const source of API_SOURCES) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`💱 Trying ${source.name} (attempt ${attempt}/${maxRetries})...`);
        
        const response = await axios.get(source.url, {
          timeout: 15000, // 15 second timeout
          headers: {
            'User-Agent': 'FlixVideo/1.0'
          }
        });

        const parsed = source.parse(response.data);
        console.log(`✅ Success with ${source.name}!`);
        
        return parsed;
        
      } catch (error) {
        console.error(`⚠️  ${source.name} failed (attempt ${attempt}): ${error.message}`);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`   Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }
  
  throw new Error('All API sources failed after retries');
}

/**
 * Worker to update exchange rates
 */
const exchangeRateWorker = new Worker(
  'exchange-rates',
  async (job) => {
    console.log('💱 Updating exchange rates...');

    try {
      // Fetch latest rates with retry and fallback
      const { base, date, rates } = await fetchRatesWithRetry();

      if (!rates || base !== 'USD') {
        throw new Error(`Invalid exchange rate response. Base: ${base}`);
      }

      // Get KES rate from USD
      const kesRate = rates.KES;
      if (!kesRate) {
        throw new Error('KES rate not available in response');
      }

      console.log(`💱 Date: ${date}`);
      console.log(`💱 1 USD = ${kesRate} KES`);

      // Calculate rates with KES as base
      const kesBasedRates = {};
      
      for (const currency of SUPPORTED_CURRENCIES) {
        if (rates[currency]) {
          // Convert: 1 KES = ? currency
          kesBasedRates[currency] = rates[currency] / kesRate;
        }
      }

      // Always include KES itself
      kesBasedRates.KES = 1;

      // Store in Redis
      const { redisClient } = require('../config/cache');

      const rateData = {
        base: 'KES',
        date: date,
        timestamp: new Date().toISOString(),
        rates: kesBasedRates,
        source_base: base,
        source_kes_rate: kesRate
      };

      // Store in Redis with 7-day expiry (long cache!)
      await redisClient.setex(
        'exchange_rates',
        604800, // 7 days (so timeouts don't break the system)
        JSON.stringify(rateData)
      );

      console.log(`✅ Updated ${Object.keys(kesBasedRates).length} exchange rates`);
      console.log(`💱 Sample: 1 KES = ${kesBasedRates.USD.toFixed(6)} USD`);
      console.log(`💱 Sample: 1 KES = ${kesBasedRates.EUR.toFixed(6)} EUR`);

      // Store historical rates in MongoDB
      if (global.mongoClient) {
        try {
          await global.mongoClient.db().collection('exchange_rates').insertOne({
            ...rateData,
            created_at: new Date()
          });
          console.log('📊 Stored historical rates in MongoDB');
        } catch (mongoError) {
          console.error('⚠️  Failed to store in MongoDB:', mongoError.message);
        }
      }

      return {
        base: rateData.base,
        date: rateData.date,
        currencies: Object.keys(kesBasedRates).length,
        sample_rates: {
          USD: kesBasedRates.USD,
          EUR: kesBasedRates.EUR,
          GBP: kesBasedRates.GBP
        }
      };

    } catch (error) {
      console.error('💱 All exchange rate sources failed:', error.message);
      
      // If API fails, try to keep using cached rates
      const { redisClient } = require('../config/cache');
      const cached = await redisClient.get('exchange_rates');
      
      if (cached) {
        const cachedData = JSON.parse(cached);
        const age = Math.floor((Date.now() - new Date(cachedData.timestamp).getTime()) / 1000 / 3600);
        console.log(`⚠️  Using cached rates (${age} hours old)`);
        
        return {
          status: 'using_cache',
          date: cachedData.date,
          age_hours: age,
          currencies: Object.keys(cachedData.rates).length
        };
      }
      
      // No cache available - this is a real problem
      console.error('❌ No cached rates available! Currency conversion will fail!');
      throw error;
    }
  },
  { connection }
);

exchangeRateWorker.on('completed', (job) => {
  console.log(`✅ Exchange rates updated:`, job.returnvalue);
});

exchangeRateWorker.on('failed', (job, err) => {
  console.error(`❌ Exchange rate update failed:`, err.message);
});

module.exports = exchangeRateWorker;