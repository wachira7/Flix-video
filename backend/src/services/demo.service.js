// src/services/demo.service.js
// One-click demo: a private, pre-filled account that's deleted after a day.
// It's a real user (is_demo), so every screen works exactly as it does for
// a signed-up viewer, within the rules in config/demo.js.
const crypto = require('crypto');
const logger = require('../utils/logger');
const { getCollection } = require('../config/database');
const { issueToken } = require('./session.service');
const { DEMO_TTL_HOURS, MAX_ACTIVE_DEMOS, DEMO_EMAIL_DOMAIN } = require('../config/demo');

// TMDB ids, chosen so every row on the demo has something good in it
const WATCHLIST = [
  ['movie', 693134], // Dune: Part Two
  ['movie', 666277], // Past Lives
  ['movie', 674324], // The Banshees of Inisherin
  ['tv_show', 126308], // Shōgun
  ['movie', 872585] // Oppenheimer
];
const FAVORITES = [
  ['movie', 157336], // Interstellar
  ['movie', 129], // Spirited Away
  ['tv_show', 1396] // Breaking Bad
];
const RATINGS = [
  ['movie', 157336, 5],
  ['movie', 129, 4.5],
  ['movie', 329865, 4.5], // Arrival
  ['tv_show', 1396, 5],
  ['movie', 546554, 4] // Knives Out
];
const LISTS = [
  {
    title: 'Sunday sci-fi',
    description: 'Big ideas, small casts, hopeful endings.',
    is_ranked: true,
    items: [['movie', 329865], ['movie', 157336], ['movie', 693134], ['movie', 264660]] // + Ex Machina
  },
  {
    title: 'Feel-good nights',
    description: 'For when the week has been long.',
    is_ranked: false,
    items: [['movie', 346648], ['movie', 120467], ['movie', 212778]] // Paddington 2, Grand Budapest Hotel, Chef
  }
];
const WATCH_HISTORY = [
  { contentType: 'movie', contentId: 693134, progressSeconds: 70, durationSeconds: 150 },
  { contentType: 'tv', contentId: 126308, progressSeconds: 40, durationSeconds: 120 }
];
const AI_CHAT = [
  { role: 'user', content: 'A smart sci-fi film under two hours with a hopeful ending' },
  {
    role: 'assistant',
    content:
      'Here are three that fit a **hopeful, smart sci-fi** night:\n\n' +
      '1. **Arrival** (2016): a first-contact story told through language. Bittersweet, but it lands on hope. 1h 56m.\n' +
      '2. **Gattaca** (1997): sharp ideas about genetic destiny, carried by one man refusing his assigned future. 1h 46m.\n' +
      '3. **Moon** (2009): a quiet one-location mystery with a big idea and a warm final act. 1h 37m.\n\n' +
      'Want something with more action, or a series instead?'
  }
];

const activeDemoCount = async () =>
  (await global.pgPool.query('SELECT COUNT(*)::int AS n FROM users WHERE is_demo AND demo_expires_at > NOW()')).rows[0].n;

/**
 * Create a demo account and sign it in. Returns { token, user, expires_at }.
 */
async function createDemoAccount(req) {
  if ((await activeDemoCount()) >= MAX_ACTIVE_DEMOS) {
    const error = new Error('Too many demos are running right now. Please try again in a little while.');
    error.code = 'DEMO_CAPACITY';
    throw error;
  }

  const tag = crypto.randomBytes(4).toString('hex');
  const email = `demo-${tag}@${DEMO_EMAIL_DOMAIN}`;
  const username = `demo_${tag}`;
  const client = await global.pgPool.connect();
  let user;

  try {
    await client.query('BEGIN');

    ({ rows: [user] } = await client.query(
      `INSERT INTO users (email, password_hash, email_verified, is_demo, demo_expires_at)
       VALUES ($1, NULL, TRUE, TRUE, NOW() + INTERVAL '${DEMO_TTL_HOURS} hours')
       RETURNING id, email, role, demo_expires_at`,
      [email]
    ));

    await client.query(
      `INSERT INTO user_profiles (user_id, username, full_name, bio, country, city, is_public)
       VALUES ($1, $2, 'Demo Viewer', 'Exploring FlixVideo for a day.', 'Kenya', 'Nairobi', FALSE)`,
      [user.id, username]
    );

    for (const [type, id] of WATCHLIST) {
      await client.query('INSERT INTO watchlist (user_id, content_type, content_id) VALUES ($1, $2, $3)', [user.id, type, id]);
    }
    for (const [type, id] of FAVORITES) {
      await client.query('INSERT INTO favorites (user_id, content_type, content_id) VALUES ($1, $2, $3)', [user.id, type, id]);
    }
    for (const [type, id, rating] of RATINGS) {
      await client.query('INSERT INTO ratings (user_id, content_type, content_id, rating) VALUES ($1, $2, $3, $4)', [user.id, type, id, rating]);
    }
    for (const list of LISTS) {
      const { rows: [row] } = await client.query(
        `INSERT INTO lists (user_id, title, description, is_public, is_ranked, items_count)
         VALUES ($1, $2, $3, FALSE, $4, $5) RETURNING id`,
        [user.id, list.title, list.description, list.is_ranked, list.items.length]
      );
      for (const [i, [type, id]] of list.items.entries()) {
        await client.query(
          'INSERT INTO list_items (list_id, content_type, content_id, rank_order) VALUES ($1, $2, $3, $4)',
          [row.id, type, id, list.is_ranked ? i + 1 : null]
        );
      }
    }

    // A private watch party waiting to start
    const { rows: [{ code }] } = await client.query('SELECT generate_party_code() AS code');
    const { rows: [party] } = await client.query(
      `INSERT INTO watch_parties (host_user_id, content_type, content_id, title, is_public, max_participants, party_code, status)
       VALUES ($1, 'movie', 329865, 'Arrival', FALSE, 10, $2, 'waiting') RETURNING id`,
      [user.id, code]
    );
    await client.query(
      'INSERT INTO watch_party_participants (party_id, user_id, is_host, is_active) VALUES ($1, $2, TRUE, TRUE)',
      [party.id, user.id]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }

  // Mongo-backed extras: nice to have, so a failure here doesn't stop the demo
  try {
    const now = Date.now();
    await getCollection('watch_history').insertMany(
      WATCH_HISTORY.map((h, i) => ({
        userId: user.id,
        contentType: h.contentType,
        contentId: String(h.contentId),
        progressSeconds: h.progressSeconds,
        durationSeconds: h.durationSeconds,
        completed: false,
        watchCount: 0,
        createdAt: new Date(now - (i + 1) * 3 * 3600e3),
        updatedAt: new Date(now - (i + 1) * 3 * 3600e3)
      }))
    );
    const started = new Date(now - 2 * 3600e3);
    await getCollection('ai_conversations').insertOne({
      userId: user.id,
      sessionId: crypto.randomUUID(),
      provider: 'claude',
      messages: AI_CHAT.map((m, i) => ({ ...m, timestamp: new Date(started.getTime() + i * 8000), tokensUsed: 0 })),
      context: { page: 'ai-chat', demo: true },
      tokensUsed: 0,
      createdAt: started,
      updatedAt: started
    });
  } catch (error) {
    logger.warn('Demo extras (watch history, AI chat) were not seeded', { error: error.message });
  }

  const token = await issueToken(user.id, req);
  logger.info('Demo account created', { userId: user.id, expires: user.demo_expires_at });

  return {
    token,
    expires_at: user.demo_expires_at,
    user: { id: user.id, email: user.email, role: user.role, username, full_name: 'Demo Viewer', avatar_url: null, is_demo: true }
  };
}

const MONGO_COLLECTIONS = ['watch_history', 'ai_conversations', 'watch_party_messages', 'notifications'];

/**
 * Delete demo accounts whose day is up. Postgres rows cascade from users.
 */
async function removeExpiredDemos() {
  const { rows } = await global.pgPool.query(
    'SELECT id FROM users WHERE is_demo AND demo_expires_at <= NOW() LIMIT 500'
  );
  if (rows.length === 0) return 0;
  const ids = rows.map((r) => r.id);

  // Clear Mongo first: if it fails, keep the accounts and retry next hour,
  // so no demo data is ever left behind without its owner
  try {
    for (const name of MONGO_COLLECTIONS) {
      await getCollection(name).deleteMany({ userId: { $in: ids } });
    }
  } catch (error) {
    logger.warn('Could not clear demo data from Mongo; will retry', { error: error.message });
    return 0;
  }
  await global.pgPool.query('DELETE FROM users WHERE id = ANY($1::uuid[]) AND is_demo', [ids]);
  logger.info('Removed expired demo accounts', { count: ids.length });
  return ids.length;
}

module.exports = { createDemoAccount, removeExpiredDemos, activeDemoCount };
