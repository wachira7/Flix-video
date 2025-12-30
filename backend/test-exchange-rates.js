require('dotenv').config();
const { exchangeRateQueue } = require('./src/jobs/queues');

async function testExchangeRates() {
  console.log('💱 Testing exchange rate update...');
  
  await exchangeRateQueue.add('manual-update', {});
  
  console.log('✅ Job queued! Check server logs.');
  
  setTimeout(() => process.exit(0), 2000);
}

testExchangeRates();
