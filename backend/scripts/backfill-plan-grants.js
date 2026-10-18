// backend/scripts/backfill-plan-grants.js
// One-off: give a plan to people whose payment succeeded before payments
// granted plans automatically (fixed 2026-10-18). Each plan runs 30 days
// from the original payment date, so only payments from the last 30 days
// qualify. Uses the same grant as live payments (one grant per payment,
// amount must cover the plan).
//
//   node scripts/backfill-plan-grants.js          # dry run: shows what would happen
//   node scripts/backfill-plan-grants.js --apply  # writes the grants
//
// Output is safe for public CI logs: no emails, names or phone numbers.
const { Pool } = require('pg');
require('dotenv').config();

const APPLY = process.argv.includes('--apply');
const PERIOD_DAYS = 30;

global.pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const { getPlan } = require('../src/config/plans');
const { grantPlanForPayment } = require('../src/services/subscription.service');

const shortId = (id) => String(id).slice(0, 8);
const day = (d) => new Date(d).toISOString().slice(0, 10);

async function main() {
  console.log(`Backfill plan grants: ${APPLY ? 'APPLY' : 'DRY RUN (nothing is written)'}\n`);

  // Oldest first, so two payments from one person stack in order
  const { rows } = await global.pgPool.query(
    `SELECT p.id, p.user_id, p.plan_type, p.amount, p.currency, p.payment_method,
            COALESCE(p.paid_at, p.created_at) AS paid_at, u.status AS user_status
     FROM payments p
     JOIN users u ON u.id = p.user_id
     WHERE p.status = 'succeeded'
       AND p.plan_type IN ('basic', 'premium')
       AND COALESCE(p.paid_at, p.created_at) > NOW() - INTERVAL '${PERIOD_DAYS} days'
       AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.payment_id = p.id)
     ORDER BY COALESCE(p.paid_at, p.created_at) ASC`
  );

  const older = await global.pgPool.query(
    `SELECT COUNT(*)::int AS n FROM payments p
     WHERE p.status = 'succeeded' AND p.plan_type IN ('basic', 'premium')
       AND COALESCE(p.paid_at, p.created_at) <= NOW() - INTERVAL '${PERIOD_DAYS} days'
       AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.payment_id = p.id)`
  );

  console.log(`Payments in the last ${PERIOD_DAYS} days without a plan: ${rows.length}`);
  console.log(`Older paid payments (already expired, skipped): ${older.rows[0].n}\n`);

  const tally = {};
  const previewEnds = new Map(); // user -> { plan, end }, mirrors how grants stack
  for (const p of rows) {
    const plan = getPlan(p.plan_type);
    const prev = previewEnds.get(p.user_id);
    const from = prev && prev.plan === p.plan_type && prev.end > new Date() ? prev.end : new Date(p.paid_at);
    const ends = new Date(from.getTime() + PERIOD_DAYS * 864e5);
    const line = `payment ${shortId(p.id)}  user ${shortId(p.user_id)}  ${p.plan_type.padEnd(7)}  ${p.currency} ${p.amount}  via ${p.payment_method}  paid ${day(p.paid_at)}`;

    let outcome;
    if (p.user_status === 'deleted') outcome = 'skip: account deleted';
    else if (parseFloat(p.amount) < plan.price) outcome = `skip: paid less than the ${plan.price} plan price`;
    else if (!APPLY) {
      outcome = ends > new Date() ? `would grant ${p.plan_type} until ${day(ends)}` : 'skip: period_already_ended';
      if (ends > new Date()) previewEnds.set(p.user_id, { plan: p.plan_type, end: ends });
    }
    else {
      const r = await grantPlanForPayment(p.id, { startFrom: p.paid_at });
      outcome = r.granted ? `granted ${r.plan_type} until ${day(r.current_period_end)}` : `skip: ${r.reason}`;
    }
    const key = outcome.split(' ')[0].replace(':', '');
    tally[key] = (tally[key] || 0) + 1;
    console.log(`${line}  ->  ${outcome}`);
  }

  console.log('\nSummary:', Object.keys(tally).length ? tally : 'nothing to do');
  if (!APPLY && rows.length) console.log('\nRun with --apply to write these grants.');
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => global.pgPool.end());
