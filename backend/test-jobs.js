require('dotenv').config();
const { 
  cryptoPaymentQueue,
  analyticsQueue,
  cleanupQueue 
} = require('./src/jobs/queues');

async function testJobs() {
  console.log('🧪 Testing background jobs...');

  // Test crypto payment checker
  console.log('\n🪙 Testing crypto payment checker...');
  await cryptoPaymentQueue.add('test-check', {});

  // Test analytics
  console.log('\n📊 Testing analytics aggregation...');
  await analyticsQueue.add('test-analytics', {});

  // Test cleanup
  console.log('\n🧹 Testing cleanup job...');
  await cleanupQueue.add('test-cleanup', {});

  console.log('\n✅ Jobs queued! Check server logs for results.');
  
  setTimeout(() => {
    process.exit(0);
  }, 2000);
}

testJobs().catch(console.error);

