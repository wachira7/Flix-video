const { redisClient } = require('../config/cache');

/**
 * Get current exchange rates
 */
async function getExchangeRates() {
  try {
    const cached = await redisClient.get('exchange_rates');
    
    if (!cached) {
      throw new Error('Exchange rates not available. Please wait for next update.');
    }
    
    return JSON.parse(cached);
    
  } catch (error) {
    console.error('Get exchange rates error:', error);
    throw error;
  }
}

/**
 * Convert KES to another currency
 */
async function convertFromKES(amount, toCurrency) {
  try {
    const rates = await getExchangeRates();
    
    if (!rates.rates[toCurrency]) {
      throw new Error(`Exchange rate for ${toCurrency} not available`);
    }
    
    const converted = amount * rates.rates[toCurrency];
    
    return {
      from: 'KES',
      to: toCurrency,
      amount_kes: amount,
      amount_converted: parseFloat(converted.toFixed(8)),
      rate: rates.rates[toCurrency],
      date: rates.date
    };
    
  } catch (error) {
    console.error('Convert from KES error:', error);
    throw error;
  }
}

/**
 * Convert any currency to KES
 */
async function convertToKES(amount, fromCurrency) {
  try {
    const rates = await getExchangeRates();
    
    if (!rates.rates[fromCurrency]) {
      throw new Error(`Exchange rate for ${fromCurrency} not available`);
    }
    
    // Since rates are KES to other currency, we need to invert
    const converted = amount / rates.rates[fromCurrency];
    
    return {
      from: fromCurrency,
      to: 'KES',
      amount_original: amount,
      amount_kes: parseFloat(converted.toFixed(2)),
      rate: 1 / rates.rates[fromCurrency],
      date: rates.date
    };
    
  } catch (error) {
    console.error('Convert to KES error:', error);
    throw error;
  }
}

/**
 * Get all available currencies
 */
async function getAvailableCurrencies() {
  try {
    const rates = await getExchangeRates();
    
    return {
      base: rates.base,
      currencies: Object.keys(rates.rates),
      last_updated: rates.date
    };
    
  } catch (error) {
    console.error('Get available currencies error:', error);
    throw error;
  }
}

module.exports = {
  getExchangeRates,
  convertFromKES,
  convertToKES,
  getAvailableCurrencies
};
