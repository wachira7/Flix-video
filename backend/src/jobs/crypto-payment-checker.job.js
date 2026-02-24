// src/jobs/crypto-payment-checker.job.js
const { Worker } = require('bullmq');
const cryptoService = require('../integrations/crypto/nowpayments');

const { connection } = require('./queues');

// Worker to check pending crypto payments
const cryptoPaymentWorker = new Worker(
  'crypto-payment-checker',
  async (job) => {
    console.log('🪙 Checking pending crypto payments...');

    try {
      // Get all pending crypto payments
      const result = await global.pgPool.query(
        `SELECT p.id, cp.nowpayments_payment_id, cp.payment_status
         FROM payments p
         JOIN crypto_payments cp ON p.id = cp.payment_id
         WHERE p.status IN ('pending', 'processing')
         AND p.payment_method = 'crypto'
         AND p.created_at > NOW() - INTERVAL '7 days'`
      );

      console.log(`Found ${result.rows.length} pending crypto payments`);

      let updated = 0;
      for (const payment of result.rows) {
        try {
          // Check status with NOWPayments
          const status = await cryptoService.getPaymentStatus(
            payment.nowpayments_payment_id
          );

          const newStatus = status.payment.payment_status;

          // Update if status changed
          if (newStatus !== payment.payment_status) {
            // Update crypto_payments
            await global.pgPool.query(
              `UPDATE crypto_payments 
               SET payment_status = $1,
                   actually_paid = $2,
                   outcome_amount = $3,
                   confirmations = $4,
                   confirmed_at = CASE WHEN $1 = 'confirmed' THEN NOW() ELSE confirmed_at END
               WHERE nowpayments_payment_id = $5`,
              [
                newStatus,
                status.payment.actually_paid,
                status.payment.outcome_amount,
                status.payment.confirmations,
                payment.nowpayments_payment_id
              ]
            );

            // Update main payment
            if (newStatus === 'finished') {
              await global.pgPool.query(
                'UPDATE payments SET status = $1, paid_at = NOW() WHERE id = $2',
                ['succeeded', payment.id]
              );
              console.log(`✅ Payment ${payment.id} completed`);
              updated++;
            } else if (['failed', 'expired', 'refunded'].includes(newStatus)) {
              await global.pgPool.query(
                'UPDATE payments SET status = $1, failed_at = NOW() WHERE id = $2',
                ['failed', payment.id]
              );
              console.log(`❌ Payment ${payment.id} failed`);
              updated++;
            }
          }
        } catch (error) {
          console.error(`Error checking payment ${payment.id}:`, error.message);
        }
      }

      return { checked: result.rows.length, updated };

    } catch (error) {
      console.error('Crypto payment checker error:', error);
      throw error;
    }
  },
  { connection,
    stalledInterval: 300000,  // Check for stalled jobs every 5 min (default is 30s)
    drainDelay: 30,           // Wait 30s when queue empty before polling again
    lockDuration: 60000,      // Set lock duration to 60s to allow for longer processing time, especially if there are many payments to check
   }
);

cryptoPaymentWorker.on('completed', (job) => {
  console.log(`✅ Crypto payment check completed: ${JSON.stringify(job.returnvalue)}`);
});

cryptoPaymentWorker.on('failed', (job, err) => {
  console.error(`❌ Crypto payment check failed:`, err.message);
});

module.exports = cryptoPaymentWorker;
